"use client";

import {MoonIcon, SunIcon} from "@heroicons/react/24/solid";
import {useTheme, type Theme} from "@/components/ThemeProvider";

/** nabbi light / dark switch */
export function ThemeModeSwitch({className = ""}: {className?: string}) {
  const {theme, setTheme} = useTheme();
  const isDark = theme === "dark";

  const toggle = () => {
    const next: Theme = isDark ? "light" : "dark";
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`lp-focus lp-theme-switch ${className}`}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 44,
        height: 44,
        borderRadius: 999,
        border: "1.5px solid var(--color-border)",
        background: "var(--color-card)",
        color: "var(--color-foreground)",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.15s, border-color 0.15s, color 0.15s",
      }}>
      {isDark ? (
        <SunIcon style={{width: 18, height: 18}} aria-hidden="true" />
      ) : (
        <MoonIcon style={{width: 18, height: 18}} aria-hidden="true" />
      )}
    </button>
  );
}
