import React, {ReactNode} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useNavigation} from "@/hooks/useNavigation";

export interface AppHeaderProps {
  /** Título centrado del header */
  title: string;
  /** Si se muestra el botón de atrás (por defecto true) */
  showBackButton?: boolean;
  /** Ruta a la que volver si no se provee onBackPress (ej. "/(tabs)/perfil") */
  backFallbackRoute?: string;
  /** Callback al pulsar atrás; si no se pasa, se usa goBack(backFallbackRoute) */
  onBackPress?: () => void;
  /** Contenido extra a la izquierda (ej. logo, botones). Se renderiza antes del botón atrás. */
  leftExtra?: ReactNode;
  /** Contenido extra a la derecha (ej. menú, acciones) */
  rightExtra?: ReactNode;
  /** Estilo del contenedor del header */
  style?: ViewStyle;
  /** Fondo del header (por defecto colors.background) */
  backgroundColor?: string;
  /** Borde inferior: si true usa colors.border; si string usa ese color; si false no borde */
  borderBottom?: boolean | string;
  /** Botón atrás circular (por defecto true para consistencia en toda la app) */
  backButtonCircle?: boolean;
}

/** Tamaños fijos para consistencia: usar iconos 24 y área táctil 44x44 en rightExtra/leftExtra */
export const APP_HEADER_ICON_SIZE = 24;
export const APP_HEADER_BUTTON_HIT = 44;
const HEADER_ROW_MIN_HEIGHT = 44;
const HEADER_PADDING_BOTTOM = 12;

export function AppHeader({
  title,
  showBackButton = true,
  backFallbackRoute,
  onBackPress,
  leftExtra,
  rightExtra,
  style,
  backgroundColor,
  borderBottom = true,
  backButtonCircle = true,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const {colors} = useThemeVariant();
  const {goBack} = useNavigation();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      goBack(backFallbackRoute);
    }
  };

  const bg = backgroundColor ?? colors.background;
  const borderColor =
    borderBottom === false ? undefined : typeof borderBottom === "string" ? borderBottom : colors.border;
  const isLightBg = /^#([fF]{2}|[fF][eE]|white)/.test(bg) || bg === "#FFFFFF" || bg.toLowerCase() === "white";
  const titleColor = isLightBg ? "#1f2937" : colors.foreground;
  const backColor = backButtonCircle ? "#374151" : colors.foreground;
  const backIcon = backButtonCircle ? "chevron-back" : "arrow-back";

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: Math.max(insets.top + 12, 16),
          paddingBottom: HEADER_PADDING_BOTTOM,
          backgroundColor: bg,
          borderBottomWidth: borderColor ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: borderColor ?? "transparent",
        },
        style,
      ]}>
      <View style={styles.headerRow}>
        <View style={styles.left}>
          {leftExtra}
          {showBackButton && (
            <TouchableOpacity
              style={backButtonCircle ? styles.backButtonCircle : styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
              hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
              <Ionicons name={backIcon as any} size={APP_HEADER_ICON_SIZE} color={backColor} />
            </TouchableOpacity>
          )}
        </View>
        <Text
          style={[styles.title, {color: titleColor}]}
          numberOfLines={1}
          pointerEvents="none">
          {title}
        </Text>
        <View style={styles.right}>{rightExtra}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: HEADER_ROW_MIN_HEIGHT,
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "flex-start",
    minHeight: HEADER_ROW_MIN_HEIGHT,
  },
  backButton: {
    padding: 8,
    width: APP_HEADER_BUTTON_HIT,
    height: APP_HEADER_BUTTON_HIT,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonCircle: {
    width: APP_HEADER_BUTTON_HIT,
    height: APP_HEADER_BUTTON_HIT,
    borderRadius: APP_HEADER_BUTTON_HIT / 2,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    position: "absolute",
    left: 0,
    right: 0,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    color: "#1f2937",
  },
  right: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: HEADER_ROW_MIN_HEIGHT,
  },
});
