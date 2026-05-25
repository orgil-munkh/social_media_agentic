const CYRILLIC_REGEX = /[\u0400-\u04FF\u0500-\u052F]/g;
const LATIN_WORD_REGEX = /\b[a-zA-Z]{2,}\b/g;
const ALLOWED_LATIN = new Set(["discipline.mn", "discipline", "mn"]);

export class MongolianValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MongolianValidationError";
  }
}

function stripAllowedLatin(text: string): string {
  let result = text;
  for (const allowed of ALLOWED_LATIN) {
    result = result.replace(new RegExp(allowed, "gi"), "");
  }
  return result;
}

export function validateMongolianText(text: string, fieldName: string): void {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new MongolianValidationError(`${fieldName}: хоосон текст`);
  }

  const latinMatches = stripAllowedLatin(trimmed).match(LATIN_WORD_REGEX);
  if (latinMatches && latinMatches.length > 0) {
    throw new MongolianValidationError(
      `${fieldName}: англи үг илэрлээ (${latinMatches.join(", ")})`
    );
  }

  const cyrillicCount = (trimmed.match(CYRILLIC_REGEX) ?? []).length;
  const letterCount = (trimmed.match(/\p{L}/gu) ?? []).length;

  if (letterCount === 0 || cyrillicCount / letterCount < 0.5) {
    throw new MongolianValidationError(
      `${fieldName}: монгол кирилл үсэг давамгай байх ёстой`
    );
  }
}

export function validateContentOutput(content: {
  theme: string;
  hook: string;
  caption: string;
}): void {
  validateMongolianText(content.theme, "theme");
  validateMongolianText(content.hook, "hook");
  validateMongolianText(content.caption, "caption");
}

export function validateTextOverlay(text: string | undefined): void {
  if (text) {
    validateMongolianText(text, "textOverlay");
  }
}
