import React, {createContext, useContext, useState, ReactNode} from "react";
import {Colors, ThemeVariants, ThemeVariant} from "@/constants/theme";

type ColorMode = "light" | "dark";

interface ThemeVariantContextType {
  variant: ThemeVariant;
  setVariant: (variant: ThemeVariant) => void;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  colors: typeof Colors.light & typeof ThemeVariants.belleza;
}

const ThemeVariantContext = createContext<ThemeVariantContextType | undefined>(undefined);

export const ThemeVariantProvider = ({children}: {children: ReactNode}) => {
  const [variant, setVariant] = useState<ThemeVariant>("belleza");
  const [colorMode, setColorMode] = useState<ColorMode>("light");

  const colors = {
    ...Colors.light,
    ...ThemeVariants[variant],
    ...ThemeVariants[variant][colorMode],
  };

  return (
    <ThemeVariantContext.Provider value={{variant, setVariant, colorMode, setColorMode, colors}}>
      {children}
    </ThemeVariantContext.Provider>
  );
};

export const useThemeVariant = () => {
  const context = useContext(ThemeVariantContext);
  if (!context) throw new Error("useThemeVariant must be used within ThemeVariantProvider");
  return context;
};
