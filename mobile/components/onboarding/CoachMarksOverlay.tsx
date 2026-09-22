import React, {useEffect, useState, useRef} from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, {Rect, Defs, Mask} from "react-native-svg";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useProviderTour} from "@/features/onboarding/ProviderTourProvider";

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get("window");

const TOUR_STEPS: Record<string, {title: string; message: string; icon: string}> = {
  settings_images: {
    title: "Galería de imágenes",
    message: "Sube fotos de tu trabajo para atraer más clientes. Puedes agregar hasta 10 imágenes a tu perfil.",
    icon: "images-outline",
  },
  settings_services: {
    title: "Tus servicios",
    message: "Crea servicios claros con nombre, precio, duración y categoría. Los clientes los verán al reservar.",
    icon: "briefcase-outline",
  },
  settings_schedule: {
    title: "Horarios y disponibilidad",
    message: "Configura tu agenda semanal para que los clientes puedan reservar en tus horarios libres.",
    icon: "calendar-outline",
  },
  settings_group_sessions: {
    title: "Sesiones grupales",
    message: "Crea sesiones grupales con cupos limitados. Ideal para talleres, clases y eventos.",
    icon: "people-circle-outline",
  },
  settings_reviews: {
    title: "Reseñas de clientes",
    message: "Revisa las opiniones de tus clientes. Las buenas reseñas atraen más reservas.",
    icon: "star-outline",
  },
  settings_team: {
    title: "Gestiona tu equipo",
    message: "Invita y vincula profesionales a tu lugar. Configura sus horarios de atención.",
    icon: "people-outline",
  },
  settings_notifications: {
    title: "Notificaciones",
    message: "Personaliza qué alertas recibir. Mantente al día con reservas, reseñas y actividad.",
    icon: "notifications-outline",
  },
  create_post: {
    title: "Publica contenido",
    message: "Comparte fotos y resultados en el feed para mostrar tu trabajo y atraer nuevas reservas.",
    icon: "megaphone-outline",
  },
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
    targetRects,
  } = useProviderTour();

  const [targetRect, setTargetRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [targetRetries, setTargetRetries] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardSlideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const MAX_TARGET_RETRIES = 8;
  const TARGET_RETRY_DELAY_MS = 400;

  // Pulse animation for spotlight border
  useEffect(() => {
    if (isActive && targetRect) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isActive, !!targetRect]);

  // Update target rect when step changes — always clear first, wait for fresh measurement
  useEffect(() => {
    if (isActive && currentStep) {
      // Fade in overlay + slide up card immediately
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(cardSlideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();

      // Always clear stale target and wait for fresh measurement
      setTargetRect(null);
      setTargetRetries(0);
    } else {
      setTargetRect(null);
      setTargetRetries(0);
      fadeAnim.setValue(0);
      cardSlideAnim.setValue(30);
    }
  }, [isActive, currentStep]);

  // Watch for target rect updates (from TourTarget re-measurements)
  useEffect(() => {
    if (!isActive || !currentStep) return;

    const rect = getCurrentTargetRect();
    if (rect && (rect.width > 0 && rect.height > 0)) {
      setTargetRect(rect);
      setTargetRetries(0);
      return;
    }

    // No valid rect yet — retry
    if (targetRetries >= MAX_TARGET_RETRIES) {
      skipTour();
      return;
    }

    const timeoutId = setTimeout(() => {
      setTargetRetries((prev) => prev + 1);
    }, TARGET_RETRY_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, [isActive, currentStep, targetRetries, targetRects]);

  if (!isActive || !currentStep) {
    return null;
  }

  const stepData = TOUR_STEPS[currentStep] || {title: "", message: "", icon: "help-outline"};
  const hasTarget = targetRect !== null;
  const canGoBack = stepIndex > 1;
  const canGoNext = stepIndex < totalSteps;
  const isLastStep = stepIndex === totalSteps;

  // Spotlight
  const spotlightPadding = 10;
  const spotlightX = targetRect ? targetRect.x - spotlightPadding : SCREEN_WIDTH / 2;
  const spotlightY = targetRect ? targetRect.y - spotlightPadding : SCREEN_HEIGHT / 2;
  const spotlightWidth = targetRect ? targetRect.width + spotlightPadding * 2 : 0;
  const spotlightHeight = targetRect ? targetRect.height + spotlightPadding * 2 : 0;
  const spotlightRadius = hasTarget
    ? Math.max(14, Math.min(28, Math.min(spotlightWidth, spotlightHeight) / 2))
    : 20;

  // Card position — place below target, or above if not enough space below
  const cardHeight = 200;
  const spaceBelow = SCREEN_HEIGHT - (spotlightY + spotlightHeight);
  const cardBelowY = spotlightY + spotlightHeight + 24;
  const cardAboveY = spotlightY - cardHeight - 24;

  const cardY = hasTarget
    ? spaceBelow > cardHeight + 40
      ? cardBelowY
      : Math.max(16, cardAboveY)
    : SCREEN_HEIGHT / 2 - 120;

  // Progress
  const progress = stepIndex / totalSteps;

  return (
    <Modal visible={isActive} transparent animationType="none">
      <Animated.View style={[styles.overlay, {opacity: fadeAnim}]}>
        {/* SVG Mask for spotlight effect */}
        {hasTarget && (
          <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
            <Defs>
              <Mask id="spotlightMask">
                <Rect width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="white" />
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
            {/* Dark overlay */}
            <Rect
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT}
              fill="rgba(0, 0, 0, 0.65)"
              mask="url(#spotlightMask)"
            />
            {/* Glow around highlighted target */}
            <Rect
              x={spotlightX}
              y={spotlightY}
              width={spotlightWidth}
              height={spotlightHeight}
              rx={spotlightRadius}
              fill="transparent"
              stroke={colors.primary}
              strokeWidth={2.5}
              opacity={0.9}
            />
            <Rect
              x={spotlightX - 4}
              y={spotlightY - 4}
              width={spotlightWidth + 8}
              height={spotlightHeight + 8}
              rx={spotlightRadius + 4}
              fill="transparent"
              stroke={colors.primary}
              strokeWidth={6}
              opacity={0.1}
            />
          </Svg>
        )}

        {/* Fallback dark overlay if no target */}
        {!hasTarget && (
          <View style={[StyleSheet.absoluteFill, {backgroundColor: "rgba(0, 0, 0, 0.78)"}]} />
        )}

        {/* Explanation Card */}
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              top: cardY,
              transform: [{translateY: cardSlideAnim}],
            },
          ]}>
          {/* Progress bar */}
          <View style={[styles.progressTrack, {backgroundColor: colors.muted}]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${progress * 100}%`,
                },
              ]}
            />
          </View>

          {/* Header with icon + step counter */}
          <View style={styles.cardHeader}>
            <View style={[styles.stepIconWrap, {backgroundColor: colors.primary + "15"}]}>
              <Ionicons name={stepData.icon as any} size={18} color={colors.primary} />
            </View>
            <View style={styles.stepHeaderRight}>
              <Text style={[styles.cardTitle, {color: colors.foreground}]}>{stepData.title}</Text>
              <Text style={[styles.stepCounter, {color: colors.mutedForeground}]}>
                {stepIndex} / {totalSteps}
              </Text>
            </View>
          </View>

          {/* Message */}
          <Text style={[styles.message, {color: colors.mutedForeground}]}>{stepData.message}</Text>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.button, styles.skipButton, {borderColor: colors.border}]}
              onPress={skipTour}
              activeOpacity={0.7}>
              <Text style={[styles.skipButtonText, {color: colors.mutedForeground}]}>Omitir</Text>
            </TouchableOpacity>

            <View style={styles.navigationButtons}>
              {canGoBack && (
                <TouchableOpacity
                  style={[styles.button, styles.backButton, {borderColor: colors.border}]}
                  onPress={previousStep}
                  activeOpacity={0.7}>
                  <Ionicons name="chevron-back" size={18} color={colors.foreground} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.nextButton,
                  {backgroundColor: isLastStep ? colors.accent : colors.primary},
                ]}
                onPress={canGoNext ? nextStep : completeTour}
                activeOpacity={0.8}>
                <Text style={[styles.nextButtonText, {color: isLastStep ? "#12211A" : "#ffffff"}]}>
                  {canGoNext ? "Siguiente" : "Finalizar"}
                </Text>
                {canGoNext && (
                  <Ionicons name="chevron-forward" size={18} color="#ffffff" />
                )}
                {isLastStep && (
                  <Ionicons name="checkmark-circle" size={18} color="#12211A" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
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
    borderRadius: 20,
    paddingTop: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {elevation: 12},
    }),
    overflow: "hidden",
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    marginBottom: 16,
    marginTop: 0,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  stepHeaderRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  stepCounter: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
    fontWeight: "400",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  navigationButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
  button: {
    paddingVertical: 11,
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
  skipButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  backButton: {
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
    maxWidth: 160,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
