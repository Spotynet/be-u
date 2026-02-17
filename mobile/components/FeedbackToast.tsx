import React, {useEffect, useRef} from "react";
import {View, Text, StyleSheet, Animated, TouchableOpacity} from "react-native";

export type FeedbackToastType = "error" | "warning" | "success";

const TOAST_COLORS: Record<
  FeedbackToastType,
  {bg: string; border: string; text: string}
> = {
  error: {bg: "#fef2f2", border: "#fecaca", text: "#991b1b"},
  warning: {bg: "#fffbeb", border: "#fcd34d", text: "#92400e"},
  success: {bg: "#ecfdf5", border: "#6ee7b7", text: "#065f46"},
};

interface FeedbackToastProps {
  visible: boolean;
  type: FeedbackToastType;
  title: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  autoHideMs?: number;
}

export function FeedbackToast({
  visible,
  type,
  title,
  message,
  onRetry,
  onDismiss,
  autoHideMs = 4000,
}: FeedbackToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (!visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    const t = setTimeout(() => {
      onDismiss?.();
    }, autoHideMs);
    return () => clearTimeout(t);
  }, [visible, autoHideMs, onDismiss, opacity, translateY]);

  if (!visible) return null;

  const colors = TOAST_COLORS[type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
        {
          opacity,
          transform: [{translateY}],
        },
      ]}>
      <View style={styles.content}>
        <Text style={[styles.title, {color: colors.text}]}>{title}</Text>
        <Text style={[styles.message, {color: colors.text}]}>{message}</Text>
        {(onRetry || onDismiss) && (
          <View style={styles.actions}>
            {onRetry && (
              <TouchableOpacity onPress={onRetry} style={styles.actionBtn}>
                <Text style={[styles.actionText, {color: colors.text}]}>
                  Reintentar
                </Text>
              </TouchableOpacity>
            )}
            {onDismiss && (
              <TouchableOpacity onPress={onDismiss} style={styles.actionBtn}>
                <Text style={[styles.actionText, {color: colors.text}]}>
                  Cerrar
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 60,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  content: {
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  message: {
    fontSize: 14,
    opacity: 0.9,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    marginTop: 8,
    gap: 12,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
