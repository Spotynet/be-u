import {ThemeVariantProvider, useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Stack} from "expo-router/stack";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {AuthProvider} from "@/features/auth";
import {CategoryProvider} from "@/contexts/CategoryContext";
import {ProviderTourProvider} from "@/features/onboarding/ProviderTourProvider";
import {CoachMarksOverlay} from "@/components/onboarding/CoachMarksOverlay";
import {useEffect} from "react";
import {AppState, StyleSheet, Text, TextInput} from "react-native";
import {tokenRefreshScheduler} from "@/lib/api";
import {ErrorBoundary} from "@/components/ErrorBoundary";
import * as SplashScreen from "expo-splash-screen";
import {useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold} from "@expo-google-fonts/poppins";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {StatusBar} from "expo-status-bar";

// RN 0.88 removed StyleSheet.absoluteFillObject; keep an alias for deps like react-native-calendars.
const styleSheetCompat = StyleSheet as typeof StyleSheet & {
  absoluteFillObject?: typeof StyleSheet.absoluteFill;
};
if (styleSheetCompat.absoluteFillObject == null) {
  styleSheetCompat.absoluteFillObject = StyleSheet.absoluteFill;
}

SplashScreen.preventAutoHideAsync();

const ThemeAppContent = () => {
  const {colors, colorMode} = useThemeVariant();
  
  return (
    <>
      <StatusBar style={colorMode === 'dark' ? 'light' : 'dark'} />
      <CategoryProvider>
        <AuthProvider>
          <ProviderTourProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg }
              }}
            />
            <CoachMarksOverlay />
          </ProviderTourProvider>
        </AuthProvider>
      </CategoryProvider>
    </>
  );
};

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
        tokenRefreshScheduler.start();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;
    // React 19 removed typed defaultProps; keep runtime defaults for global Poppins font.
    const TextComponent = Text as typeof Text & {defaultProps?: {style?: unknown}};
    const TextInputComponent = TextInput as typeof TextInput & {defaultProps?: {style?: unknown}};
    TextComponent.defaultProps = TextComponent.defaultProps || {};
    TextComponent.defaultProps.style = [{fontFamily: "Poppins_400Regular"}, TextComponent.defaultProps.style];
    TextInputComponent.defaultProps = TextInputComponent.defaultProps || {};
    TextInputComponent.defaultProps.style = [
      {fontFamily: "Poppins_400Regular"},
      TextInputComponent.defaultProps.style,
    ];
    SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeVariantProvider>
          <ThemeAppContent />
        </ThemeVariantProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
