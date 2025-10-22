import React from "react";
import {TouchableOpacity, Text, TouchableOpacityProps, StyleSheet} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

interface ButtonProps extends TouchableOpacityProps {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button = ({
  variant = "primary",
  size = "md",
  children,
  style,
  ...props
}: ButtonProps) => {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();

  const getButtonStyle = () => {
    const baseStyle = [styles.base];

    // Variant styles
    switch (variant) {
      case "primary":
        baseStyle.push({backgroundColor: colors.primary});
        break;
      case "secondary":
        baseStyle.push({backgroundColor: colors.secondary});
        break;
      case "outline":
        baseStyle.push({
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.border,
        });
        break;
    }

    // Size styles
    switch (size) {
      case "sm":
        baseStyle.push(styles.sm);
        break;
      case "md":
        baseStyle.push(styles.md);
        break;
      case "lg":
        baseStyle.push(styles.lg);
        break;
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const textStyle = [styles.text];

    switch (variant) {
      case "primary":
        textStyle.push({color: colors.primaryForeground});
        break;
      case "secondary":
        textStyle.push({color: colors.secondaryForeground});
        break;
      case "outline":
        textStyle.push({color: colors.foreground});
        break;
    }

    return textStyle;
  };

  return (
    <TouchableOpacity style={[...getButtonStyle(), style]} {...props}>
      <Text style={getTextStyle()}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  md: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lg: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  text: {
    fontWeight: "500",
  },
});
