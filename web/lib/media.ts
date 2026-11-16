/** Resolve the best display image URL from a public-profile-like object. */
export function profileImageUrl(p: {
  user_image?: string | null;
  profile_photo?: string | null;
  photo_url?: string | null;
  cover_photo?: string | null;
  images?: Array<string | null | undefined> | null;
} | null | undefined): string | null {
  if (!p) return null;
  const gallery = Array.isArray(p.images)
    ? p.images.find((url): url is string => typeof url === "string" && url.length > 0)
    : null;
  return (
    p.user_image ||
    p.cover_photo ||
    p.photo_url ||
    p.profile_photo ||
    gallery ||
    null
  );
}
