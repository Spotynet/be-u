import React from "react";
import {TextInput, TextInputProps, View, Text, StyleSheet} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = ({label, error, style, ...props}: InputProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, {color: colors.foreground}]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            borderColor: colors.input,
            color: colors.foreground,
            backgroundColor: colors.background,
          },
          style,
        ]}
        placeholderTextColor={colors.mutedForeground}
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  error: {
    fontSize: 14,
    marginTop: 4,
  },
});
