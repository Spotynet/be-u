import React from "react";
import {View, Text, StyleSheet, Pressable, Linking} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

/** URL de términos y condiciones - cambiar cuando tengas el link definitivo */
const TERMS_URL = "https://example.com/terminos-y-condiciones";

type Props = {
  checked: boolean;
  onToggle: (checked: boolean) => void;
  disabled?: boolean;
};

export function TermsAndConditionsCheckbox({checked, onToggle, disabled}: Props) {
  const {colors} = useThemeVariant();

  const openTerms = () => {
    Linking.openURL(TERMS_URL);
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => !disabled && onToggle(!checked)}
        style={[
          styles.checkbox,
          {borderColor: checked ? colors.primary : colors.border},
          checked && {backgroundColor: colors.primary},
          disabled && styles.checkboxDisabled,
        ]}
        hitSlop={8}>
        {checked ? <Ionicons name="checkmark" size={16} color={colors.primaryForeground ?? "#fff"} /> : null}
      </Pressable>
      <Text style={[styles.label, {color: colors.foreground}]}>
        Acepto los{" "}
        <Text style={[styles.link, {color: colors.primary}]} onPress={openTerms}>
          términos y condiciones de uso
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 8},
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDisabled: {opacity: 0.5},
  label: {flex: 1, fontSize: 14, lineHeight: 20},
  link: {fontWeight: "600", textDecorationLine: "underline"},
});
