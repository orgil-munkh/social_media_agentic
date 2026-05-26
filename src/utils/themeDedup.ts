export class ThemeDuplicateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ThemeDuplicateError";
  }
}

export function normalizeTheme(theme: string): string {
  return theme.trim().toLowerCase();
}

export function isDuplicateTheme(
  theme: string,
  usedThemes: string[]
): boolean {
  const normalized = normalizeTheme(theme);
  return usedThemes.some((used) => normalizeTheme(used) === normalized);
}

export function dedupeThemes(themes: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const theme of themes) {
    const normalized = normalizeTheme(theme);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(theme);
    }
  }
  return result;
}
