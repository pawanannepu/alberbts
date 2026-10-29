// Auth constants and helpers that are safe in both server and client code.

export const MIN_PASSWORD_LENGTH = 8;

export const DEFAULT_AFTER_SIGN_IN = "/account";

// Only allow same-site paths so `?next=` can't be used as an open redirect.
export function safeNext(value: string | string[] | null | undefined): string {
  if (typeof value !== "string") return DEFAULT_AFTER_SIGN_IN;
  // Browsers drop tabs/newlines from URLs and read "\" as "/", so "/<TAB>/evil.com" and "/\evil.com"
  // would both turn into "//evil.com". Refuse control characters, spaces and backslashes outright.
  if (/[\u0000- \u007f\\]/.test(value)) return DEFAULT_AFTER_SIGN_IN;
  if (!value.startsWith("/") || value.startsWith("//")) return DEFAULT_AFTER_SIGN_IN;
  // Final guard: it must still resolve to our own origin.
  try {
    if (new URL(value, "http://same-origin.invalid").origin !== "http://same-origin.invalid") {
      return DEFAULT_AFTER_SIGN_IN;
    }
  } catch {
    return DEFAULT_AFTER_SIGN_IN;
  }
  return value;
}
