import {View, Text, StyleSheet, TouchableOpacity, Linking, Platform} from "react-native";
import {SafeMapView, SafeMarker, Region} from "@/components/map/SafeMapView";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Location} from "@/types/global";

type BookingLocationViewProps = {
  location?: Location | null;
  address?: string | null;
};

export function BookingLocationView({location, address}: BookingLocationViewProps) {
  const {colors} = useThemeVariant();

  if (!location) return null;

  const region: Region = {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const openDirections = () => {
    const query = address?.trim() || `${location.latitude},${location.longitude}`;
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?daddr=${encodeURIComponent(query)}`
        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <Text style={[styles.title, {color: colors.foreground}]}>Ubicación del servicio</Text>
      <View style={styles.mapWrapper}>
        <SafeMapView style={styles.map} region={region} pointerEvents="none">
          <SafeMarker coordinate={{latitude: location.latitude, longitude: location.longitude}} />
        </SafeMapView>
      </View>
      {address ? (
        <Text style={[styles.address, {color: colors.mutedForeground}]}>{address}</Text>
      ) : null}
      <TouchableOpacity style={[styles.button, {backgroundColor: colors.primary}]} onPress={openDirections}>
        <Ionicons name="navigate-outline" size={18} color="#ffffff" />
        <Text style={styles.buttonText}>Cómo llegar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
  },
  mapWrapper: {
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  address: {
    fontSize: 12,
    fontWeight: "600",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
