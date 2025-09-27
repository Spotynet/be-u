"use client";

import {createContext, useContext, useEffect, useState, ReactNode} from "react";

// Available themes
export type Theme = "light" | "dark" | "blue" | "green" | "purple";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  availableThemes: {value: Theme; label: string; description: string}[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return default values instead of throwing error during SSR
    return {
      theme: "light" as Theme,
      setTheme: () => {},
      availableThemes: [
        { value: "light" as Theme, label: "Light", description: "Clean and bright theme" },
        { value: "dark" as Theme, label: "Dark", description: "Easy on the eyes" },
        { value: "blue" as Theme, label: "Blue", description: "Professional blue theme" },
        { value: "green" as Theme, label: "Green", description: "Natural green theme" },
        { value: "purple" as Theme, label: "Purple", description: "Creative purple theme" },
      ],
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

  // Available themes configuration
  const availableThemes = [
    {
      value: "light" as Theme,
      label: "Light",
      description: "Clean and bright theme",
    },
    {
      value: "dark" as Theme,
      label: "Dark",
      description: "Easy on the eyes",
    },
    {
      value: "blue" as Theme,
      label: "Blue",
      description: "Professional blue theme",
    },
    {
      value: "green" as Theme,
      label: "Green",
      description: "Natural green theme",
    },
    {
      value: "purple" as Theme,
      label: "Purple",
      description: "Creative purple theme",
    },
  ];

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme && availableThemes.some((t) => t.value === savedTheme)) {
      setThemeState(savedTheme);
    }
    setMounted(true);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (mounted) {
      // Remove all theme classes
      document.documentElement.removeAttribute("data-theme");

      // Add current theme class
      if (theme !== "light") {
        document.documentElement.setAttribute("data-theme", theme);
      }

      // Save to localStorage
      localStorage.setItem("theme", theme);
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    availableThemes,
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className="theme-transition" data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
