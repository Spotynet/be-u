import {Platform} from "react-native";
import {View, Text, StyleSheet} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

// Conditionally import Marker only on native platforms
let Marker: any = null;
let Callout: any = null;

if (Platform.OS !== "web") {
  try {
    const maps = require("react-native-maps");
    Marker = maps.Marker;
    Callout = maps.Callout;
  } catch (error) {
    console.warn("react-native-maps not available:", error);
  }
}

type SafeMarkerProps = {
  coordinate: {latitude: number; longitude: number};
  draggable?: boolean;
  onDragEnd?: (event: any) => void;
  onPress?: () => void;
  children?: React.ReactNode;
  tracksViewChanges?: boolean;
};

export function SafeMarker({
  coordinate,
  draggable,
  onDragEnd,
  onPress,
  children,
  tracksViewChanges,
}: SafeMarkerProps) {
  // Web fallback - return null or a placeholder
  if (Platform.OS === "web" || !Marker) {
    return null;
  }

  return (
    <Marker
      coordinate={coordinate}
      draggable={draggable}
      onDragEnd={onDragEnd}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}>
      {children}
    </Marker>
  );
}

export {Callout};
