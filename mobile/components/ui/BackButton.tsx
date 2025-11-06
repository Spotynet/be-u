import React from "react";
import {TouchableOpacity, StyleSheet} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useNavigation} from "@/hooks/useNavigation";

interface BackButtonProps {
  fallbackRoute?: string;
  onPress?: () => void;
  style?: any;
  color?: string;
  size?: number;
}

export function BackButton({fallbackRoute, onPress, style, color, size = 24}: BackButtonProps) {
  const {colors} = useThemeVariant();
  const {goBack} = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      goBack(fallbackRoute);
    }
  };

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={handlePress} activeOpacity={0.7}>
      <Ionicons name="arrow-back" color={color || colors.foreground} size={size} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
});


