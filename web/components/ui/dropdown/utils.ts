import type {DropdownOption} from "./types";

export const DEFAULT_PAGE_SIZE = 30;

export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export function matchesQuery(
  opt: DropdownOption<string | number>,
  q: string
): boolean {
  if (!q) return true;
  const f = fold(q);
  if (fold(opt.label).includes(f)) return true;
  return (opt.keywords ?? []).some((k) => fold(k).includes(f));
}

export function isCoarseOrNarrowViewport(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 639px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

export function shouldShowSearch(
  searchable: boolean | "auto",
  isAsync: boolean,
  optionCount: number
): boolean {
  if (searchable === true || isAsync) return true;
  if (searchable === false) return false;
  return optionCount > 8;
}
