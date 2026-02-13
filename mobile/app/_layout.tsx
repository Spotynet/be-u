import {Stack} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {AuthProvider} from "@/features/auth";
import {ThemeProvider} from "@/contexts/ThemeContext";
import {ThemeVariantProvider} from "@/contexts/ThemeVariantContext";
import {CategoryProvider} from "@/contexts/CategoryContext";
import {ProviderTourProvider} from "@/features/onboarding/ProviderTourProvider";
import {CoachMarksOverlay} from "@/components/onboarding/CoachMarksOverlay";
import {useEffect} from "react";
import {AppState, Text, TextInput} from "react-native";
import {tokenRefreshScheduler} from "@/lib/api";
import {ErrorBoundary} from "@/components/ErrorBoundary";
import * as SplashScreen from "expo-splash-screen";
import {useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold} from "@expo-google-fonts/poppins";
import {Ionicons, MaterialCommunityIcons} from "@expo/vector-icons";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
  });

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

  useEffect(() => {
    if (!fontsLoaded) return;

    // Set global defaults so most <Text/> / <TextInput/> render in Poppins without per-component changes.
    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.style = [{fontFamily: "Poppins_400Regular"}, Text.defaultProps.style];

    TextInput.defaultProps = TextInput.defaultProps || {};
    TextInput.defaultProps.style = [{fontFamily: "Poppins_400Regular"}, TextInput.defaultProps.style];

    SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemeVariantProvider>
            <CategoryProvider>
              <AuthProvider>
                <ProviderTourProvider>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                    }}
                  />
                  <CoachMarksOverlay />
                </ProviderTourProvider>
              </AuthProvider>
            </CategoryProvider>
          </ThemeVariantProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
