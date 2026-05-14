import {ThemeVariantProvider, useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Stack} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {AuthProvider} from "@/features/auth";
import {CategoryProvider} from "@/contexts/CategoryContext";
import {ProviderTourProvider} from "@/features/onboarding/ProviderTourProvider";
import {CoachMarksOverlay} from "@/components/onboarding/CoachMarksOverlay";
import {useEffect} from "react";
import {AppState, Text, TextInput, useColorScheme} from "react-native";
import {tokenRefreshScheduler} from "@/lib/api";
import {ErrorBoundary} from "@/components/ErrorBoundary";
import * as SplashScreen from "expo-splash-screen";
import {useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold} from "@expo-google-fonts/poppins";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {StatusBar} from "expo-status-bar";
import {useAppTheme} from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const ThemeAppContent = () => {
  const {colors, colorMode} = useThemeVariant();
  
  return (
    <>
      <StatusBar 
        style={colorMode === 'dark' ? 'light' : 'dark'} 
        backgroundColor={colors.navBarBg} 
      />
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
        <ThemeVariantProvider>
          <ThemeAppContent />
        </ThemeVariantProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
