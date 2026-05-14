import React from "react";
import {Image, ImageStyle, StyleProp} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useCategory} from "@/contexts/CategoryContext";
import type {ThemeVariant} from "@/constants/theme";
import type {MainCategory} from "@/contexts/CategoryContext";

const LOGO_SOURCE = require("@/assets/images/nabbi_logo_t.png");
import {View} from "react-native";

interface AppLogoProps {
  style?: StyleProp<ImageStyle>;
  resizeMode?: "contain" | "cover" | "stretch" | "repeat" | "center";
  tintColor?: string;
  showBackground?: boolean;
}

export function AppLogo({style, resizeMode = "contain", tintColor, showBackground = false}: AppLogoProps) {
  const logo = (
    <Image
      source={LOGO_SOURCE}
      style={[style, tintColor ? {tintColor} : undefined]}
      resizeMode={resizeMode}
      accessibilityLabel="nabbi logo"
    />
  );

  if (showBackground) {
    return (
      <View style={{
        backgroundColor: "#1F3328",
        padding: 8,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center"
      }}>
        {logo}
      </View>
    );
  }

  return logo;
}
