import React from "react";
import {Image, ImageStyle, StyleProp} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useCategory} from "@/contexts/CategoryContext";
import type {ThemeVariant} from "@/constants/theme";
import type {MainCategory} from "@/contexts/CategoryContext";

const LOGOS = {
  "nabbi-pink": require("@/assets/images/nabbi-pink.png"),
  "nabbi-purple": require("@/assets/images/nabbi-purple.png"),
  "nabbi-white-pink": require("@/assets/images/nabbi-white-pink.png"),
  "nabbi-white-purple": require("@/assets/images/nabbi-white-purple.png"),
} as const;

type LogoKey = keyof typeof LOGOS;

function isPinkVariant(variant: ThemeVariant, mainCategory: MainCategory): boolean {
  if (variant === "belleza" || mainCategory === "belleza") return true;
  return false;
}

function getLogoKey(colorMode: "light" | "dark", usePink: boolean): LogoKey {
  if (colorMode === "dark") return usePink ? "nabbi-white-pink" : "nabbi-white-purple";
  return usePink ? "nabbi-pink" : "nabbi-purple";
}

interface AppLogoProps {
  style?: StyleProp<ImageStyle>;
  resizeMode?: "contain" | "cover" | "stretch" | "repeat" | "center";
}

/**
 * Logo de la app que cambia según tema activo (variant + colorMode) y categoría activa.
 * - Belleza → rosa; resto de categorías → púrpura.
 * - Tema oscuro → variantes blancas (white-pink / white-purple); claro → variantes de color.
 */
export function AppLogo({style, resizeMode = "contain"}: AppLogoProps) {
  const {variant, colorMode} = useThemeVariant();
  const {selectedMainCategory} = useCategory();
  const usePink = isPinkVariant(variant, selectedMainCategory);
  const logoKey = getLogoKey(colorMode, usePink);
  return (
    <Image
      source={LOGOS[logoKey]}
      style={style}
      resizeMode={resizeMode}
      accessibilityLabel="nabbi logo"
    />
  );
}
