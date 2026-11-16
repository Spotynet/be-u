/** Build a login URL that returns the user to `next` after auth. */
export function loginHref(next?: string): string {
  if (!next) return "/login";
  return `/login?next=${encodeURIComponent(next)}`;
}
