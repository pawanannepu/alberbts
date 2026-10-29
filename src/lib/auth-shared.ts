// Auth constants and helpers that are safe in both server and client code.

export const MIN_PASSWORD_LENGTH = 8;

export const DEFAULT_AFTER_SIGN_IN = "/account";

// Only allow same-site paths so `?next=` can't be used as an open redirect.
export function safeNext(value: string | string[] | null | undefined): string {
  if (typeof value !== "string") return DEFAULT_AFTER_SIGN_IN;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return DEFAULT_AFTER_SIGN_IN;
  }
  return value;
}
