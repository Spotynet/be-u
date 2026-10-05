import {View, Text, StyleSheet} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type SafeMapViewProps = {
  region?: Region;
  style?: any;
  onPress?: (event: any) => void;
  onRegionChangeComplete?: (region: any) => void;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  pointerEvents?: "auto" | "none" | "box-none" | "box-only";
  children?: React.ReactNode;
};

export function SafeMapView({style, children}: SafeMapViewProps) {
  const {colors} = useThemeVariant();

  return (
    <View style={[style, styles.webFallback, {backgroundColor: colors.card}]}>
      <Ionicons name="map-outline" size={48} color={colors.mutedForeground} />
      <Text style={[styles.webFallbackSubtext, {color: colors.mutedForeground}]}>
        Mapa no disponible en web
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    padding: 20,
  },
  webFallbackSubtext: {
    fontSize: 12,
    textAlign: "center",
  },
});
