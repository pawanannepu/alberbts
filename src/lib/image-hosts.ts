// Hosts product images may be loaded from. Shared by next.config.ts (next/image refuses anything
// else) and by admin validation, so an editor can't save an image that would render broken.
export const IMAGE_HOSTS = ["images.unsplash.com"] as const;

export function isAllowedImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (IMAGE_HOSTS as readonly string[]).includes(url.hostname);
  } catch {
    return false;
  }
}
