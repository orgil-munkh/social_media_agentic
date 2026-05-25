export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxAttempts = 2
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        console.warn(`[retry] ${label} failed (attempt ${attempt}), retrying...`, error);
        await sleep(1000 * attempt);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`[retry] ${label} failed after ${maxAttempts} attempts`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
