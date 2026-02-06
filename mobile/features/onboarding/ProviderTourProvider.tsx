import React, {createContext, useContext, useState, useEffect, useCallback, useMemo, useRef} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useRouter} from "expo-router";

const TOUR_PENDING_KEY = "@provider_tour_pending_v1";
const TOUR_COMPLETED_KEY = "@provider_tour_completed_v1";

export type TourStep =
  | "mipagina_tab"
  | "mipagina_viewPublicProfile"
  | "mipagina_images"
  | "mipagina_services"
  | "mipagina_calendar"
  | "mipagina_team" // PLACE only
  | "posts_create";

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

// Step definitions with messages
const TOUR_STEPS: Array<{id: TourStep; message: string; requiresPlace?: boolean}> = [
  {
    id: "mipagina_tab",
    message: "Aquí editas tu página pública (lo que ve el cliente).",
  },
  {
    id: "mipagina_viewPublicProfile",
    message: "Ver perfil público te muestra cómo te ven los clientes. Úsalo para revisar tu perfil antes de publicarlo.",
  },
  {
    id: "mipagina_images",
    message: "Agrega imágenes de tu trabajo para atraer más clientes. Puedes subir hasta 10 fotos.",
  },
  {
    id: "mipagina_services",
    message: "Crea y gestiona tus servicios aquí. Define precios, duración y descripciones.",
  },
  {
    id: "mipagina_calendar",
    message: "Configura tu disponibilidad para que los clientes puedan reservar citas contigo.",
  },
  {
    id: "mipagina_team",
    message: "Gestiona tu equipo de profesionales. Invita y vincula profesionales a tu lugar.",
    requiresPlace: true,
  },
  {
    id: "posts_create",
    message: "Crea posts para atraer clientes. Aparecen en el feed y ayudan a mostrar tu trabajo.",
  },
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

  // Check if tour should start on mount
  useEffect(() => {
    const checkTourStatus = async () => {
      if (!isAuthenticated || !isProvider) return;
      if (hasInitializedRef.current || isActive || currentStep) return;

      try {
        const pending = await AsyncStorage.getItem(TOUR_PENDING_KEY);
        const completed = await AsyncStorage.getItem(TOUR_COMPLETED_KEY);

        if (pending === "1" && !completed) {
          // Small delay to ensure UI is rendered
          setTimeout(() => {
            if (availableSteps.length > 0) {
              // Prevent re-initialization while the tour is running
              hasInitializedRef.current = true;
              setIsActive(true);
              setCurrentStep(availableSteps[0].id);
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
    // Navigate to perfil tab to start the tour
    router.push("/(tabs)/perfil");
  }, [availableSteps, router]);

  const getCurrentStepIndex = useCallback((): number => {
    if (!currentStep) return -1;
    return availableSteps.findIndex((step) => step.id === currentStep);
  }, [currentStep, availableSteps]);

  const completeTour = useCallback(async () => {
    console.log("🎯 completeTour called - navigating to perfil");
    
    // Clear state immediately to close the modal
    hasInitializedRef.current = true;
    setIsActive(false);
    setCurrentStep(null);
    setTargetRects(new Map());
    
    // Save completion status
    try {
      await AsyncStorage.setItem(TOUR_COMPLETED_KEY, "1");
      await AsyncStorage.removeItem(TOUR_PENDING_KEY);
    } catch (error) {
      console.error("Error completing tour:", error);
    }
    
    // Navigate to perfil after a small delay to ensure modal is closed
    setTimeout(() => {
      console.log("🎯 Navigating to /(tabs)/perfil");
      try {
        router.replace("/(tabs)/perfil");
      } catch (error) {
        console.error("Error navigating to perfil:", error);
        // Fallback
        router.push("/(tabs)/perfil");
      }
    }, 300);
  }, [router]);

  const nextStep = useCallback(() => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < availableSteps.length - 1) {
      const nextStepId = availableSteps[currentIndex + 1].id;
      setCurrentStep(nextStepId);

      // Navigate to appropriate screen for the step
      if (nextStepId === "posts_create") {
        router.push("/(tabs)/index");
      } else if (nextStepId.startsWith("mipagina_")) {
        router.push("/(tabs)/perfil");
      }
    }
    // Note: Don't call completeTour here - let the button handle it
  }, [getCurrentStepIndex, availableSteps, router]);

  const previousStep = useCallback(() => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      const previousStepId = availableSteps[currentIndex - 1].id;
      setCurrentStep(previousStepId);

      // Navigate to appropriate screen
      if (previousStepId === "posts_create") {
        router.push("/(tabs)/index");
      } else if (previousStepId.startsWith("mipagina_")) {
        router.push("/(tabs)/perfil");
      }
    }
  }, [getCurrentStepIndex, availableSteps, router]);

  const skipTour = useCallback(async () => {
    // Clear state immediately to close the modal
    hasInitializedRef.current = true;
    setIsActive(false);
    setCurrentStep(null);
    setTargetRects(new Map());
    
    // Save skip status
    try {
      await AsyncStorage.setItem(TOUR_COMPLETED_KEY, "1");
      await AsyncStorage.removeItem(TOUR_PENDING_KEY);
    } catch (error) {
      console.error("Error skipping tour:", error);
    }
    
    // Navigate to perfil after a small delay to ensure modal is closed
    setTimeout(() => {
      console.log("🎯 Skipping tour - navigating to /(tabs)/perfil");
      try {
        router.replace("/(tabs)/perfil");
      } catch (error) {
        console.error("Error navigating to perfil:", error);
        router.push("/(tabs)/perfil");
      }
    }, 300);
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
