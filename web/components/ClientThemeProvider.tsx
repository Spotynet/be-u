"use client";

import {ThemeProvider} from "./ThemeProvider";

interface ClientThemeProviderProps {
  children: React.ReactNode;
}

export function ClientThemeProvider({children}: ClientThemeProviderProps) {
  return <ThemeProvider defaultTheme="light">{children}</ThemeProvider>;
}

