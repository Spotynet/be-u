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

  const openDirections = async () => {
    if (!location) return;
    
    const lat = location.latitude;
    const lng = location.longitude;
    
    // Use address if available, otherwise use coordinates
    const destination = address?.trim() || `${lat},${lng}`;
    
    if (Platform.OS === "ios") {
      // On iOS, use http://maps.apple.com/ which may trigger app selector
      // If user has multiple map apps, iOS might show a selector
      // Fallback to maps:// for direct Apple Maps access
      const appleMapsWebUrl = `http://maps.apple.com/?daddr=${encodeURIComponent(destination)}`;
      const appleMapsUrl = `maps://?daddr=${encodeURIComponent(destination)}`;
      
      // Try web URL first (may trigger selector), fallback to direct URL
      Linking.openURL(appleMapsWebUrl).catch(() => {
        Linking.openURL(appleMapsUrl).catch(console.error);
      });
    } else {
      // On Android, use geo: scheme which triggers the native app selector
      // This will show Google Maps, Waze, and other installed map apps
      // Use address query if available, otherwise use coordinates
      const geoUrl = address?.trim() 
        ? `geo:0,0?q=${encodeURIComponent(destination)}`
        : `geo:${lat},${lng}`;
      
      Linking.openURL(geoUrl).catch(() => {
        // Fallback to Google Maps web URL
        const fallbackUrl = address?.trim()
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`
          : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        Linking.openURL(fallbackUrl).catch(console.error);
      });
    }
  };

  // Always show address prominently if available
  const displayAddress = address?.trim();

  return (
    <View style={[styles.container, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <Text style={[styles.title, {color: colors.foreground}]}>Ubicación del servicio</Text>
      
      <View style={styles.mapWrapper}>
        <SafeMapView style={styles.map} region={region} pointerEvents="none">
          <SafeMarker coordinate={{latitude: location.latitude, longitude: location.longitude}} />
        </SafeMapView>
      </View>
      
      {displayAddress && (
        <Text style={[styles.address, {color: colors.foreground}]}>{displayAddress}</Text>
      )}
      
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
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  coordinateHint: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
    fontStyle: "italic",
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
