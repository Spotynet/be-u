import React from "react";
import {View, ViewProps, StyleSheet} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export const Card = ({children, style, ...props}: CardProps) => {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
      {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
});
