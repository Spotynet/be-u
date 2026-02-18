import React, {useEffect, useState} from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import Svg, {Rect, Defs, Mask} from "react-native-svg";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useProviderTour} from "@/features/onboarding/ProviderTourProvider";

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get("window");

const TOUR_STEPS: Record<string, string> = {
  mipagina_tab: "Este es tu panel principal para completar perfil, servicios y horarios.",
  mipagina_viewPublicProfile:
    "Ver perfil público te muestra cómo te ven los clientes. Úsalo para revisar tu perfil antes de publicarlo.",
  mipagina_images:
    "Agrega imágenes de tu trabajo para atraer más clientes. Puedes subir hasta 10 fotos.",
  mipagina_services:
    "Empieza por crear servicios claros (nombre, precio, duración y categoría).",
  mipagina_calendar:
    "Configura horarios y disponibilidad para que los clientes puedan reservar.",
  mipagina_team:
    "Gestiona tu equipo de profesionales. Invita y vincula profesionales a tu lugar.",
  posts_create:
    "Publica en el feed para mostrar resultados y atraer nuevas reservas.",
};

export const CoachMarksOverlay = () => {
  const {colors} = useThemeVariant();
  const {
    isActive,
    currentStep,
    stepIndex,
    totalSteps,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    getCurrentTargetRect,
  } = useProviderTour();

  const [targetRect, setTargetRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [targetRetries, setTargetRetries] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const MAX_TARGET_RETRIES = 6;
  const TARGET_RETRY_DELAY_MS = 350;

  // Update target rect when step changes
  useEffect(() => {
    if (isActive && currentStep) {
      const rect = getCurrentTargetRect();
      if (rect) {
        setTargetRect(rect);
        setTargetRetries(0);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        return;
      }

      setTargetRect(null);
      if (targetRetries >= MAX_TARGET_RETRIES) {
        // Safe fallback: avoid blocking UI if a target never renders.
        skipTour();
        return;
      }

      const timeoutId = setTimeout(() => {
        setTargetRetries((prev) => prev + 1);
      }, TARGET_RETRY_DELAY_MS);
      return () => clearTimeout(timeoutId);
    } else {
      setTargetRect(null);
      setTargetRetries(0);
      fadeAnim.setValue(0);
    }
  }, [isActive, currentStep, targetRetries, getCurrentTargetRect, skipTour, fadeAnim]);

  if (!isActive || !currentStep) {
    return null;
  }

  const message = TOUR_STEPS[currentStep] || "";
  const hasTarget = targetRect !== null;
  const canGoBack = stepIndex > 1;
  const canGoNext = stepIndex < totalSteps;

  // Calculate spotlight position and size
  const spotlightPadding = 8;
  const spotlightX = targetRect ? targetRect.x - spotlightPadding : SCREEN_WIDTH / 2;
  const spotlightY = targetRect ? targetRect.y - spotlightPadding : SCREEN_HEIGHT / 2;
  const spotlightWidth = targetRect ? targetRect.width + spotlightPadding * 2 : 0;
  const spotlightHeight = targetRect ? targetRect.height + spotlightPadding * 2 : 0;
  const spotlightRadius = hasTarget
    ? Math.max(12, Math.min(24, Math.min(spotlightWidth, spotlightHeight) / 2))
    : 16;

  // Calculate card position (below or above spotlight, centered if no target)
  const cardY = hasTarget
    ? Math.min(spotlightY + spotlightHeight + 20, SCREEN_HEIGHT - 200)
    : SCREEN_HEIGHT / 2 - 100;

  return (
    <Modal visible={isActive} transparent animationType="none">
      <Animated.View style={[styles.overlay, {opacity: fadeAnim}]}>
        {/* SVG Mask for spotlight effect */}
        {hasTarget && (
          <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
            <Defs>
              <Mask id="spotlightMask">
                {/* Full screen visible */}
                <Rect width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="white" />
                {/* Cutout (transparent) */}
                <Rect
                  x={spotlightX}
                  y={spotlightY}
                  width={spotlightWidth}
                  height={spotlightHeight}
                  fill="black"
                  rx={spotlightRadius}
                />
              </Mask>
            </Defs>
            {/* Dark overlay with mask */}
            <Rect
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT}
              fill="rgba(0, 0, 0, 0.62)"
              mask="url(#spotlightMask)"
            />

            {/* Glow + border around highlighted target */}
            <Rect
              x={spotlightX}
              y={spotlightY}
              width={spotlightWidth}
              height={spotlightHeight}
              rx={spotlightRadius}
              fill="transparent"
              stroke={colors.primary}
              strokeWidth={2}
              opacity={0.95}
            />
            <Rect
              x={spotlightX}
              y={spotlightY}
              width={spotlightWidth}
              height={spotlightHeight}
              rx={spotlightRadius}
              fill="transparent"
              stroke={colors.primary}
              strokeWidth={10}
              opacity={0.12}
            />
          </Svg>
        )}

        {/* Fallback dark overlay if no target */}
        {!hasTarget && (
          <View style={[StyleSheet.absoluteFill, {backgroundColor: "rgba(0, 0, 0, 0.75)"}]} />
        )}

        {/* Explanation Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              top: cardY,
            },
          ]}>
          <Text style={[styles.stepIndicator, {color: colors.mutedForeground}]}>
            {stepIndex} de {totalSteps}
          </Text>
          <Text style={[styles.message, {color: colors.foreground}]}>{message}</Text>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.button, styles.skipButton, {borderColor: colors.border}]}
              onPress={skipTour}
              activeOpacity={0.7}>
              <Text style={[styles.buttonText, {color: colors.foreground}]}>Omitir</Text>
            </TouchableOpacity>

            <View style={styles.navigationButtons}>
              {canGoBack && (
                <TouchableOpacity
                  style={[styles.button, styles.navButton, {borderColor: colors.border}]}
                  onPress={previousStep}
                  activeOpacity={0.7}>
                  <Ionicons name="chevron-back" size={20} color={colors.foreground} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, styles.nextButton, {backgroundColor: colors.primary}]}
                onPress={canGoNext ? nextStep : completeTour}
                activeOpacity={0.8}>
                <Text style={[styles.buttonText, styles.nextButtonText, {color: "#ffffff"}]}>
                  {canGoNext ? "Siguiente" : "Finalizar"}
                </Text>
                {canGoNext && <Ionicons name="chevron-forward" size={20} color="#ffffff" />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  card: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: "500",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  navigationButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  skipButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  navButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
    width: 44,
    paddingHorizontal: 0,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    maxWidth: 150,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  nextButtonText: {
    color: "#ffffff",
  },
});
