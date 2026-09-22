import React, {useEffect, useRef, useCallback} from "react";
import {View, ViewProps, InteractionManager} from "react-native";
import {useProviderTour} from "@/features/onboarding/ProviderTourProvider";

interface TourTargetProps extends ViewProps {
  targetId: string;
  children: React.ReactNode;
}

/**
 * TourTarget wraps a UI element and registers its position for the tour overlay.
 * Re-measures periodically while the tour is active to handle layout shifts.
 */
export const TourTarget = ({targetId, children, ...viewProps}: TourTargetProps) => {
  const viewRef = useRef<View>(null);
  const {registerTarget, unregisterTarget, isActive} = useProviderTour();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const measureAndRegister = useCallback(() => {
    if (viewRef.current) {
      viewRef.current.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          registerTarget(targetId, {x, y, width, height});
        }
      });
    }
  }, [targetId, registerTarget]);

  useEffect(() => {
    // Register immediately
    measureAndRegister();

    // Re-measure after interactions settle
    const task = InteractionManager.runAfterInteractions(() => {
      measureAndRegister();
    });

    // Also re-measure after a longer delay for slow renders
    const timeoutId = setTimeout(measureAndRegister, 200);

    return () => {
      task.cancel();
      clearTimeout(timeoutId);
      unregisterTarget(targetId);
    };
  }, [targetId, measureAndRegister, unregisterTarget]);

  // While tour is active, re-measure periodically to catch layout changes
  useEffect(() => {
    if (isActive) {
      measureAndRegister();
      intervalRef.current = setInterval(measureAndRegister, 600);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, measureAndRegister]);

  return (
    <View ref={viewRef} {...viewProps} collapsable={false}>
      {children}
    </View>
  );
};
