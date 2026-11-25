"use client";

import {useCallback, useMemo} from "react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import type {SettingsSectionId} from "./settingsConfig";

/**
 * Single source of truth for Configuración section navigation: `?seccion=<id>`.
 */
export function useSettingsSection(validIds: readonly string[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const raw = searchParams.get("seccion");
  const seccion = useMemo(() => {
    if (raw && validIds.includes(raw)) return raw as SettingsSectionId;
    return null;
  }, [raw, validIds]);

  const setSeccion = useCallback(
    (
      id: string | null,
      opts?: {method?: "push" | "replace"},
    ) => {
      const next = new URLSearchParams(searchParams.toString());
      if (id) next.set("seccion", id);
      else next.delete("seccion");
      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      const method = opts?.method ?? "replace";
      if (method === "push") router.push(url, {scroll: false});
      else router.replace(url, {scroll: false});
    },
    [pathname, router, searchParams],
  );

  return {seccion, setSeccion, raw};
}
