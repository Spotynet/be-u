import React, {createContext, useContext, useState, useEffect, useCallback, useMemo, useRef} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useRouter} from "expo-router";

const TOUR_PENDING_KEY = "@provider_tour_pending_v1";
const TOUR_COMPLETED_KEY = "@provider_tour_completed_v1";
const TOUR_PROGRESS_KEY = "@provider_tour_progress_v1";

export type TourStep =
  | "settings_images"
  | "settings_services"
  | "settings_schedule"
  | "settings_group_sessions"
  | "settings_reviews"
  | "settings_team" // PLACE only
  | "settings_notifications"
  | "create_post";

interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TourContextType {
  // State
  isActive: boolean;
  currentStep: TourStep | null;
  stepIndex: number;
  totalSteps: number;
  targetRects: Map<string, TargetRect>;

  // Actions
  startTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  registerTarget: (targetId: string, rect: TargetRect) => void;
  unregisterTarget: (targetId: string) => void;
  getCurrentTargetRect: () => TargetRect | null;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

interface ProviderTourProviderProps {
  children: React.ReactNode;
}

// Step definitions matching the current settings menu
const TOUR_STEPS: Array<{id: TourStep; requiresPlace?: boolean}> = [
  {id: "settings_images"},
  {id: "settings_services"},
  {id: "settings_schedule"},
  {id: "settings_group_sessions"},
  {id: "settings_reviews"},
  {id: "settings_team", requiresPlace: true},
  {id: "settings_notifications"},
  {id: "create_post"},
];

export const ProviderTourProvider = ({children}: ProviderTourProviderProps) => {
  const {user, isAuthenticated} = useAuth();
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<TourStep | null>(null);
  const [targetRects, setTargetRects] = useState<Map<string, TargetRect>>(new Map());
  const hasInitializedRef = useRef(false);

  const isProvider = user?.role === "PROFESSIONAL" || user?.role === "PLACE";
  const isPlace = user?.role === "PLACE";

  // Filter steps based on role
  const availableSteps = useMemo(
    () => TOUR_STEPS.filter((step) => !step.requiresPlace || isPlace),
    [isPlace]
  );
  const totalSteps = useMemo(() => availableSteps.length, [availableSteps]);

  // Check if tour should start on mount (first-time after registration)
  useEffect(() => {
    const checkTourStatus = async () => {
      if (!isAuthenticated || !isProvider) return;
      if (hasInitializedRef.current || isActive || currentStep) return;

      try {
        const pending = await AsyncStorage.getItem(TOUR_PENDING_KEY);
        const completed = await AsyncStorage.getItem(TOUR_COMPLETED_KEY);

        if (pending === "1" && !completed) {
          // Always start from step 1 on perfil tab to ensure TourTargets are available
          setTimeout(() => {
            if (availableSteps.length > 0) {
              hasInitializedRef.current = true;
              setIsActive(true);
              setCurrentStep(availableSteps[0].id);
              AsyncStorage.setItem(TOUR_PROGRESS_KEY, availableSteps[0].id).catch(() => {});
              router.push("/(tabs)/perfil");
            }
          }, 500);
        }
      } catch (error) {
        console.error("Error checking tour status:", error);
      }
    };

    checkTourStatus();
  }, [isAuthenticated, isProvider, availableSteps, router, isActive, currentStep]);

  const startTour = useCallback(() => {
    if (availableSteps.length === 0) return;

    hasInitializedRef.current = true;
    setIsActive(true);
    setCurrentStep(availableSteps[0].id);
    AsyncStorage.multiSet([
      [TOUR_PENDING_KEY, "1"],
      [TOUR_PROGRESS_KEY, availableSteps[0].id],
    ])
      .then(() => AsyncStorage.removeItem(TOUR_COMPLETED_KEY))
      .catch(() => {});
    // Navigate to perfil tab to start the tour
    router.push("/(tabs)/perfil");
  }, [availableSteps, router]);

  const getCurrentStepIndex = useCallback((): number => {
    if (!currentStep) return -1;
    return availableSteps.findIndex((step) => step.id === currentStep);
  }, [currentStep, availableSteps]);

  const completeTour = useCallback(async () => {
    hasInitializedRef.current = true;
    setIsActive(false);
    setCurrentStep(null);
    setTargetRects(new Map());
    
    try {
      await AsyncStorage.setItem(TOUR_COMPLETED_KEY, "1");
      await AsyncStorage.removeItem(TOUR_PENDING_KEY);
      await AsyncStorage.removeItem(TOUR_PROGRESS_KEY);
    } catch (error) {
      console.error("Error completing tour:", error);
    }
    
    setTimeout(() => {
      router.push("/(tabs)/perfil");
    }, 400);
  }, [router]);

  const nextStep = useCallback(() => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < availableSteps.length - 1) {
      const nextStepId = availableSteps[currentIndex + 1].id;
      setCurrentStep(nextStepId);
      AsyncStorage.setItem(TOUR_PROGRESS_KEY, nextStepId).catch(() => {});

      // Navigate to appropriate screen for the step
      if (nextStepId === "create_post") {
        router.push("/(tabs)");
      } else {
        // Settings steps stay on perfil (settings content is shown during tour)
        router.push("/(tabs)/perfil");
      }
    }
  }, [getCurrentStepIndex, availableSteps, router]);

  const previousStep = useCallback(() => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      const previousStepId = availableSteps[currentIndex - 1].id;
      setCurrentStep(previousStepId);
      AsyncStorage.setItem(TOUR_PROGRESS_KEY, previousStepId).catch(() => {});

      // Navigate to appropriate screen
      if (previousStepId === "create_post") {
        router.push("/(tabs)");
      } else {
        router.push("/(tabs)/perfil");
      }
    }
  }, [getCurrentStepIndex, availableSteps, router]);

  const skipTour = useCallback(async () => {
    hasInitializedRef.current = true;
    setIsActive(false);
    setCurrentStep(null);
    setTargetRects(new Map());
    
    try {
      await AsyncStorage.setItem(TOUR_COMPLETED_KEY, "1");
      await AsyncStorage.removeItem(TOUR_PENDING_KEY);
      await AsyncStorage.removeItem(TOUR_PROGRESS_KEY);
    } catch (error) {
      console.error("Error skipping tour:", error);
    }
    
    setTimeout(() => {
      router.push("/(tabs)/perfil");
    }, 400);
  }, [router]);

  const registerTarget = useCallback((targetId: string, rect: TargetRect) => {
    setTargetRects((prev) => {
      const newMap = new Map(prev);
      newMap.set(targetId, rect);
      return newMap;
    });
  }, []);

  const unregisterTarget = useCallback((targetId: string) => {
    setTargetRects((prev) => {
      const newMap = new Map(prev);
      newMap.delete(targetId);
      return newMap;
    });
  }, []);

  const getCurrentTargetRect = useCallback((): TargetRect | null => {
    if (!currentStep) return null;
    return targetRects.get(currentStep) || null;
  }, [currentStep, targetRects]);

  const stepIndex = getCurrentStepIndex() + 1; // 1-based for display

  const value: TourContextType = {
    isActive,
    currentStep,
    stepIndex,
    totalSteps,
    targetRects,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    registerTarget,
    unregisterTarget,
    getCurrentTargetRect,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

export const useProviderTour = (): TourContextType => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error("useProviderTour must be used within a ProviderTourProvider");
  }
  return context;
};

// Helper to set tour as pending (called after registration)
export const setTourPending = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOUR_PENDING_KEY, "1");
  } catch (error) {
    console.error("Error setting tour pending:", error);
  }
};
