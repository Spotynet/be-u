import React from "react";
import {TextInput, TextInputProps, View, Text, StyleSheet} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = ({label, error, style, onFocus, onBlur, ...props}: InputProps) => {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, {color: colors.foreground}]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            borderColor: isFocused ? colors.secondary : colors.border,
            color: colors.foreground,
            backgroundColor: colors.card,
          },
          style,
        ]}
        placeholderTextColor={colors.mutedForeground}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {error && <Text style={[styles.error, {color: colors.destructive}]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  error: {
    fontSize: 14,
    marginTop: 4,
  },
});
