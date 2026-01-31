import {Platform} from "react-native";
import {View, Text, StyleSheet} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

// Conditionally import MapView only on native platforms
let MapView: any = null;
let Marker: any = null;

// Region is a type, not a value, so we can import it directly
import type {Region} from "react-native-maps";

if (Platform.OS !== "web") {
  try {
    const maps = require("react-native-maps");
    MapView = maps.default;
    Marker = maps.Marker;
  } catch (error) {
    console.warn("react-native-maps not available:", error);
  }
}

type SafeMapViewProps = {
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  style?: any;
  onPress?: (event: any) => void;
  onRegionChangeComplete?: (region: any) => void;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  pointerEvents?: "auto" | "none" | "box-none" | "box-only";
  children?: React.ReactNode;
};

export function SafeMapView({
  region,
  style,
  onPress,
  onRegionChangeComplete,
  showsUserLocation,
  showsMyLocationButton,
  pointerEvents,
  children,
}: SafeMapViewProps) {
  const {colors} = useThemeVariant();

  // Web fallback
  if (Platform.OS === "web" || !MapView) {
    return (
      <View style={[style, styles.webFallback, {backgroundColor: colors.card}]}>
        <Text style={[styles.webFallbackText, {color: colors.mutedForeground}]}>
          {region
            ? `Mapa: ${region.latitude.toFixed(4)}, ${region.longitude.toFixed(4)}`
            : "Mapa no disponible en web"}
        </Text>
        <Text style={[styles.webFallbackSubtext, {color: colors.mutedForeground}]}>
          Usa la aplicación móvil para ver el mapa interactivo
        </Text>
      </View>
    );
  }

  return (
    <MapView
      style={style}
      region={region}
      onPress={onPress}
      onRegionChangeComplete={onRegionChangeComplete}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={showsMyLocationButton}
      pointerEvents={pointerEvents}>
      {children}
    </MapView>
  );
}

export {Marker};
export type {Region};

const styles = StyleSheet.create({
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    padding: 20,
  },
  webFallbackText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  webFallbackSubtext: {
    fontSize: 12,
    textAlign: "center",
  },
});
