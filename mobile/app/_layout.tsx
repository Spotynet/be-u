import {Stack} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {AuthProvider} from "@/features/auth";
import {ThemeProvider} from "@/contexts/ThemeContext";
import {ThemeVariantProvider} from "@/contexts/ThemeVariantContext";
import {CategoryProvider} from "@/contexts/CategoryContext";
import {useEffect} from "react";
import {AppState} from "react-native";
import {tokenRefreshScheduler} from "@/lib/api";
import {ErrorBoundary} from "@/components/ErrorBoundary";

export default function RootLayout() {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // App came to foreground, ensure token refresh is running
        tokenRefreshScheduler.start();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemeVariantProvider>
            <CategoryProvider>
              <AuthProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                  }}
                />
              </AuthProvider>
            </CategoryProvider>
          </ThemeVariantProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
