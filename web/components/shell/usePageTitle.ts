"use client";

import {useEffect} from "react";

/**
 * Client-side document title helper when a route cannot export `metadata`
 * (client page components). Prefer `export const metadata` / layout metadata
 * with the root template `"%s | nabbi"`.
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    if (!title) return;
    const prev = document.title;
    document.title = title.includes("|") ? title : `${title} | nabbi`;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
