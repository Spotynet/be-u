import React, {createContext, useContext, useState, ReactNode, useEffect} from "react";
import {LightTheme, DarkTheme} from "@/constants/theme";
import {useColorScheme} from "react-native";

type ColorMode = "light" | "dark";

interface ThemeVariantContextType {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  colors: typeof LightTheme;
}

const ThemeVariantContext = createContext<ThemeVariantContextType | undefined>(undefined);

export const ThemeVariantProvider = ({children}: {children: ReactNode}) => {
  const systemColorScheme = useColorScheme();
  const [colorMode, setColorMode] = useState<ColorMode>(systemColorScheme === "dark" ? "dark" : "light");
  const [isManualOverride, setIsManualOverride] = useState(false);

  // Sync with system scheme only when it changes and user hasn't overridden it manually
  useEffect(() => {
    if (systemColorScheme && !isManualOverride) {
      setColorMode(systemColorScheme);
    }
  }, [systemColorScheme]);

  const handleSetColorMode = (mode: ColorMode) => {
    setIsManualOverride(true);
    setColorMode(mode);
  };

  const colors = colorMode === "dark" ? DarkTheme : LightTheme;

  return (
    <ThemeVariantContext.Provider value={{colorMode, setColorMode: handleSetColorMode, colors}}>
      {children}
    </ThemeVariantContext.Provider>
  );
};

export const useThemeVariant = () => {
  const context = useContext(ThemeVariantContext);
  if (!context) throw new Error("useThemeVariant must be used within ThemeVariantProvider");
  return context;
};
