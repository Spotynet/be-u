import {useRouter} from "expo-router";
import {useCallback} from "react";

/**
 * Hook to handle navigation with smart back button behavior
 * If there's history, goes back; otherwise navigates to a fallback route
 */
export function useNavigation() {
  const router = useRouter();

  const goBack = useCallback(
    (fallbackRoute?: string) => {
      try {
        // Try to go back if possible
        if (router.canGoBack && router.canGoBack()) {
          router.back();
        } else if (fallbackRoute) {
          // If no history, navigate to fallback route
          router.push(fallbackRoute as any);
        } else {
          // Default fallback to profile tab
          router.push("/(tabs)/perfil" as any);
        }
      } catch (error) {
        // If back fails, try fallback
        console.log("Navigation error, using fallback:", error);
        if (fallbackRoute) {
          router.push(fallbackRoute as any);
        } else {
          router.push("/(tabs)/perfil" as any);
        }
      }
    },
    [router]
  );

  return {goBack, router};
}

