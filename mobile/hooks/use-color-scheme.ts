import {useColorScheme as useRNColorScheme} from "react-native";

// Default to light theme for now, with functionality prepared for theme switching
export function useColorScheme() {
  const systemColorScheme = useRNColorScheme();

  // For now, always return 'light' as the default theme
  // This can be easily changed later to support theme switching
  return "light";

  // Future implementation for theme switching:
  // return systemColorScheme ?? 'light';
}
