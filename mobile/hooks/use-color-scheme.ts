import {useColorScheme as useRNColorScheme} from "react-native";

/** Normalize RN's ColorSchemeName (incl. `unspecified`) to light/dark. */
export function useColorScheme(): "light" | "dark" {
  return useRNColorScheme() === "dark" ? "dark" : "light";
}
