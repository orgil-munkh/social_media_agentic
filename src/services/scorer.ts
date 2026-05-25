import type {
  EngagementMetrics,
  ScoreClassification,
  ViralScoreResult,
} from "../db/types.js";

export function computeViralScore(metrics: EngagementMetrics): number {
  return (
    metrics.shares * 4 +
    metrics.comments * 3 +
    metrics.saves * 2 +
    metrics.likes * 1
  );
}

export function classifyScore(score: number): ScoreClassification {
  if (score >= 80) return "viral";
  if (score >= 50) return "good";
  return "weak";
}

export function scoreEngagement(
  metrics: EngagementMetrics
): ViralScoreResult {
  const score = computeViralScore(metrics);
  return { score, classification: classifyScore(score) };
}

export function aggregateMetrics(
  platformMetrics: EngagementMetrics[]
): EngagementMetrics {
  return platformMetrics.reduce(
    (acc, m) => ({
      likes: acc.likes + m.likes,
      comments: acc.comments + m.comments,
      shares: acc.shares + m.shares,
      saves: acc.saves + m.saves,
    }),
    { likes: 0, comments: 0, shares: 0, saves: 0 }
  );
}
