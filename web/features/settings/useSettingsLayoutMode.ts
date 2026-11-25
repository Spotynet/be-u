"use client";

import {useEffect, useState, type RefObject} from "react";

export type SettingsLayoutMode = "mobile" | "mid" | "desktop";

/** Container breakpoints: &lt;640 mobile · 640–1023 mid · ≥1024 desktop. */
export function useSettingsLayoutMode(
  rootRef: RefObject<HTMLElement | null>,
): SettingsLayoutMode {
  const [mode, setMode] = useState<SettingsLayoutMode>("desktop");

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const update = (w: number) => {
      if (w < 640) setMode("mobile");
      else if (w < 1024) setMode("mid");
      else setMode("desktop");
    };
    update(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      update(entries[0]?.contentRect.width ?? el.clientWidth);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [rootRef]);

  return mode;
}
