import {Stack} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {AuthProvider} from "@/features/auth";
import {ThemeProvider} from "@/contexts/ThemeContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
