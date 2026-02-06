import React, {useEffect, useRef} from "react";
import {View, ViewProps} from "react-native";
import {useProviderTour} from "@/features/onboarding/ProviderTourProvider";

interface TourTargetProps extends ViewProps {
  targetId: string;
  children: React.ReactNode;
}

/**
 * TourTarget wraps a UI element and registers its position for the tour overlay.
 * When the tour step matches this targetId, the overlay will highlight this element.
 */
export const TourTarget = ({targetId, children, ...viewProps}: TourTargetProps) => {
  const viewRef = useRef<View>(null);
  const {registerTarget, unregisterTarget} = useProviderTour();

  useEffect(() => {
    const measureAndRegister = () => {
      if (viewRef.current) {
        viewRef.current.measureInWindow((x, y, width, height) => {
          registerTarget(targetId, {x, y, width, height});
        });
      }
    };

    // Register immediately
    measureAndRegister();

    // Re-measure on layout changes (in case the UI shifts)
    const timeoutId = setTimeout(measureAndRegister, 100);

    return () => {
      clearTimeout(timeoutId);
      unregisterTarget(targetId);
    };
  }, [targetId, registerTarget, unregisterTarget]);

  return (
    <View ref={viewRef} {...viewProps} collapsable={false}>
      {children}
    </View>
  );
};
