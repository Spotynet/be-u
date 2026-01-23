import React from "react";
import {View, StyleSheet, Text, AccessibilityProps} from "react-native";
import QRCode from "react-native-qrcode-svg";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

interface ReservationQRCodeProps extends AccessibilityProps {
  code: string;
  size?: number;
  backgroundColor?: string;
  foregroundColor?: string;
  showCodeText?: boolean;
}

export default function ReservationQRCode({
  code,
  size = 80,
  backgroundColor,
  foregroundColor,
  showCodeText = false,
  accessibilityLabel,
  ...accessibilityProps
}: ReservationQRCodeProps) {
  const {colors} = useThemeVariant();
  const finalBg = backgroundColor || "#ffffff";
  const finalFg = foregroundColor || "#000000";

  if (!code) {
    return (
      <View style={[styles.fallback, {backgroundColor: colors.muted}]}>
        <Text style={[styles.fallbackText, {color: colors.mutedForeground}]}>Sin código</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, {backgroundColor: finalBg}]}
      accessibilityLabel={accessibilityLabel || "Código QR de la reserva"}
      {...accessibilityProps}>
      <QRCode value={code} size={size} color={finalFg} backgroundColor={finalBg} />
      {showCodeText && (
        <Text style={[styles.codeText, {color: colors.mutedForeground}]}>{code}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  codeText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 6,
  },
  fallback: {
    padding: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 72,
    minHeight: 72,
  },
  fallbackText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
