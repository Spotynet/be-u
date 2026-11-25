"use client";

import {createContext, useContext, useEffect, useState, ReactNode} from "react";

/** Resolved product theme applied to the DOM */
export type Theme = "light" | "dark";

/** User preference — system follows prefers-color-scheme */
export type ThemePreference = "light" | "dark" | "system";

const PRODUCT_THEMES: Theme[] = ["light", "dark"];
const PREF_KEY = "theme-preference";
const LEGACY_KEY = "theme";

interface ThemeContextType {
  theme: Theme;
  preference: ThemePreference;
  setTheme: (theme: Theme) => void;
  setPreference: (pref: ThemePreference) => void;
  availableThemes: {value: Theme; label: string; description: string}[];
  preferenceOptions: {value: ThemePreference; label: string}[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const availableThemes = [
  {
    value: "light" as Theme,
    label: "Claro",
    description: "Fondo cream nabbi (#FAF8F3)",
  },
  {
    value: "dark" as Theme,
    label: "Oscuro",
    description: "Fondo near-black nabbi (#0C0D0D)",
  },
];

const preferenceOptions: {value: ThemePreference; label: string}[] = [
  {value: "light", label: "Claro"},
  {value: "dark", label: "Oscuro"},
  {value: "system", label: "Sistema"},
];

function systemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function normalizeTheme(value: string | null | undefined, fallback: Theme = "light"): Theme {
  if (value === "light" || value === "dark") return value;
  return fallback;
}

function normalizePreference(
  value: string | null | undefined,
  fallback: ThemePreference = "light"
): ThemePreference {
  if (value === "light" || value === "dark" || value === "system") return value;
  return fallback;
}

function resolve(pref: ThemePreference): Theme {
  return pref === "system" ? systemTheme() : pref;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return {
      theme: "light" as Theme,
      preference: "light" as ThemePreference,
      setTheme: () => {},
      setPreference: () => {},
      availableThemes,
      preferenceOptions,
    };
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export const ThemeProvider = ({children, defaultTheme = "light"}: ThemeProviderProps) => {
  useEffect(() => {
    /* Device presentational prefs (reduce-motion override). */
    void import("@/features/settings/clientPreferences").then((m) => {
      m.applyClientPreferences();
    });
  }, []);

  const [preference, setPreferenceState] = useState<ThemePreference>(defaultTheme);
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedPref = localStorage.getItem(PREF_KEY);
    const legacy = localStorage.getItem(LEGACY_KEY);
    const pref = normalizePreference(savedPref ?? legacy, defaultTheme);
    setPreferenceState(pref);
    setThemeState(resolve(pref));
    setMounted(true);
  }, [defaultTheme]);

  useEffect(() => {
    if (!mounted) return;
    const resolved = resolve(preference);
    /* Brief flag so open popovers skip bg/border transitions (no flash). */
    document.documentElement.setAttribute("data-theme-switching", "true");
    setThemeState(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.style.colorScheme = resolved;
    const meta =
      document.querySelector('meta[name="theme-color"]') ||
      (() => {
        const el = document.createElement("meta");
        el.setAttribute("name", "theme-color");
        document.head.appendChild(el);
        return el;
      })();
    const themeColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--theme-color-meta")
        .trim() || (resolved === "dark" ? "#0C0D0D" : "#1F3328");
    meta.setAttribute("content", themeColor);
    localStorage.setItem(PREF_KEY, preference);
    localStorage.setItem(LEGACY_KEY, resolved);
    const clear = window.setTimeout(() => {
      document.documentElement.removeAttribute("data-theme-switching");
    }, 50);

    if (preference !== "system") {
      return () => window.clearTimeout(clear);
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = systemTheme();
      document.documentElement.setAttribute("data-theme-switching", "true");
      setThemeState(next);
      document.documentElement.setAttribute("data-theme", next);
      document.documentElement.style.colorScheme = next;
      const nextColor =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--theme-color-meta")
          .trim() || (next === "dark" ? "#0C0D0D" : "#1F3328");
      meta.setAttribute("content", nextColor);
      localStorage.setItem(LEGACY_KEY, next);
      window.setTimeout(() => {
        document.documentElement.removeAttribute("data-theme-switching");
      }, 50);
    };
    mq.addEventListener("change", onChange);
    return () => {
      window.clearTimeout(clear);
      mq.removeEventListener("change", onChange);
    };
  }, [preference, mounted]);

  const setTheme = (newTheme: Theme) => {
    if (!PRODUCT_THEMES.includes(newTheme)) return;
    setPreferenceState(newTheme);
  };

  const setPreference = (pref: ThemePreference) => {
    setPreferenceState(pref);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        preference,
        setTheme,
        setPreference,
        availableThemes,
        preferenceOptions,
      }}>
      <div className="theme-transition" data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
