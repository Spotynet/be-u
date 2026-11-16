/** Helpers for Django PostSerializer payloads (keep in sync with web/lib/posts.ts). */

export function postMediaUrl(media: any): string | null {
  if (!media) return null;
  if (typeof media === "string") return media;
  return media.media_url || media.media_file || media.url || media.image || media.file || null;
}

export function postMediaUrls(post: any): string[] {
  const media = post?.media || post?.images || post?.media_files || [];
  if (Array.isArray(media) && media.length) {
    return media.map(postMediaUrl).filter(Boolean) as string[];
  }
  if (post?.image) return [post.image];
  if (post?.image_url) return [post.image_url];
  if (post?.cover_image) return [post.cover_image];
  if (post?.before || post?.after) {
    return [post.before, post.after].filter(Boolean);
  }
  return [];
}

export function postAuthorUserId(post: any): number | null {
  const raw =
    (post?.author && typeof post.author === "object" ? post.author.id : post?.author) ??
    post?.author_id ??
    post?.user_id ??
    (post?.user && typeof post.user === "object" ? post.user.id : post?.user);
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function postAuthorName(post: any): string {
  const fromFields =
    post?.author_display_name ||
    post?.author_name ||
    post?.user_name ||
    post?.author?.public_profile?.display_name ||
    null;
  if (fromFields) return String(fromFields);

  const author = post?.author;
  if (author && typeof author === "object") {
    const full = [author.first_name, author.last_name].filter(Boolean).join(" ").trim();
    if (full) return full;
    if (author.username) return String(author.username);
    if (author.name) return String(author.name);
    if (author.email) return String(author.email);
  }

  return "Usuario";
}

export function postAuthorAvatar(post: any): string | null {
  return (
    post?.author_photo ||
    post?.author_avatar ||
    post?.author_image ||
    post?.author?.avatar ||
    post?.author?.photo ||
    null
  );
}

export function postAuthorProfileId(post: any): number | null {
  const raw =
    post?.author_public_profile_id ||
    post?.author_profile_id ||
    post?.public_profile_id;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function postMatchesCategory(
  post: any,
  category: string,
  subcategory: string = "todos"
): boolean {
  const categoryToken = String(category || "").trim().toLowerCase();
  if (!categoryToken) return true;

  const authorCategory = post?.author_category;
  // Posts without category still appear (API may already have filtered).
  if (authorCategory == null) return true;

  let categoryMatches = false;
  if (Array.isArray(authorCategory)) {
    categoryMatches = authorCategory.some(
      (cat: string) => cat && String(cat).toLowerCase() === categoryToken
    );
  } else if (typeof authorCategory === "string") {
    categoryMatches = authorCategory.toLowerCase() === categoryToken;
  }

  if (!categoryMatches) return false;

  const subToken = String(subcategory || "todos").trim().toLowerCase();
  if (!subToken || subToken === "todos") return true;

  const authorSubCategories = post?.author_sub_categories || [];
  if (!Array.isArray(authorSubCategories) || authorSubCategories.length === 0) {
    return true;
  }
  return authorSubCategories.some(
    (sub: string) => sub && String(sub).toLowerCase() === subToken
  );
}
