"use client";

import {createContext, useContext, useEffect, useState, ReactNode} from "react";

/** nabbi product themes only */
export type Theme = "light" | "dark";

const PRODUCT_THEMES: Theme[] = ["light", "dark"];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  availableThemes: {value: Theme; label: string; description: string}[];
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
    description: "Fondo forest nabbi (#0F1A14)",
  },
];

function normalizeTheme(value: string | null | undefined, fallback: Theme = "light"): Theme {
  if (value === "light" || value === "dark") return value;
  // Migrate removed legacy themes (blue / green / purple) → light
  return fallback;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return {
      theme: "light" as Theme,
      setTheme: () => {},
      availableThemes,
    };
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export const ThemeProvider = ({children, defaultTheme = "light"}: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = normalizeTheme(localStorage.getItem("theme"), defaultTheme);
    setThemeState(saved);
    setMounted(true);
  }, [defaultTheme]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    if (!PRODUCT_THEMES.includes(newTheme)) return;
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{theme, setTheme, availableThemes}}>
      <div className="theme-transition" data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
