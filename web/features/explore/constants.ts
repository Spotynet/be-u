/** List serializer omits `sub_categories` — never ship a no-op subcategory control. */
export const EXPLORE_SUBCATEGORY_FILTER = false;

/** Client-side rating filter — off (no dedicated list field contract). */
export const EXPLORE_RATING_FILTER = false;

export const EXPLORE_PAGE_SIZE = 24;

export const EXPLORE_RADIUS_POPOVER: Array<1 | 5 | 10 | 25> = [1, 5, 10, 25];

export type ExploreProfileType = "" | "PROFESSIONAL" | "PLACE";
export type ExploreSortKey = "relevance" | "distance" | "rating";
export type ExploreView = "lista" | "mapa";
