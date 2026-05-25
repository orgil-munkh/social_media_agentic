import { getSupabase } from "../db/supabase.js";
import { analyzeVirality } from "../analytics/viralityAnalyzer.js";
import type { HookVariant, VisualVariant } from "../db/types.js";
import { logEvent } from "../utils/logger.js";

export async function storeAbVariants(
  postId: string,
  hookVariants: HookVariant[],
  visualVariants: VisualVariant[]
): Promise<void> {
  const supabase = getSupabase();

  for (const variant of hookVariants) {
    await supabase.from("ab_tests").insert({
      post_id: postId,
      variant_type: "hook",
      variant_key: variant.variantKey,
      variant_data: variant,
      is_primary: variant.variantKey === "primary",
    });
  }

  for (const variant of visualVariants) {
    await supabase.from("ab_tests").insert({
      post_id: postId,
      variant_type: "visual",
      variant_key: variant.variantKey,
      variant_data: variant,
      is_primary: variant.variantKey === "primary",
    });
  }
}

export async function evaluateAbWinners(): Promise<void> {
  logEvent("abTest.evaluate.start");

  const { all: ranked } = await analyzeVirality();
  if (ranked.length < 2) return;

  const supabase = getSupabase();

  const { data: abTests } = await supabase
    .from("ab_tests")
    .select("id, post_id, variant_type, variant_key, is_winner")
    .is("is_winner", null)
    .eq("is_primary", false);

  if (!abTests || abTests.length === 0) return;

  const scoreByPost = new Map(ranked.map((r) => [r.postId, r.score]));

  const grouped = new Map<string, typeof abTests>();
  for (const test of abTests) {
    const key = `${test.post_id}:${test.variant_type}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(test);
  }

  for (const [, tests] of grouped) {
    const postId = tests[0].post_id;
    const postScore = scoreByPost.get(postId) ?? 0;

    if (postScore >= 50) {
      const winner = tests[0];
      await supabase
        .from("ab_tests")
        .update({ is_winner: true })
        .eq("id", winner.id);
    }
  }

  logEvent("abTest.evaluate.done");
}
