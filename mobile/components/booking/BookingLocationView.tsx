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

  const lat = location.latitude;
  const lng = location.longitude;
  const destination = address?.trim() || `${lat},${lng}`;

  const openGoogleMaps = () => {
    const url =
      address?.trim()
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      const fallback =
        address?.trim()
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`
          : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      Linking.openURL(fallback).catch(console.error);
    });
  };

  const openWaze = () => {
    const url = address?.trim()
      ? `https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`
      : `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    Linking.openURL(url).catch(() => {
      const fallback = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
      Linking.openURL(fallback).catch(console.error);
    });
  };

  const openAppleMaps = () => {
    const dest = encodeURIComponent(destination);
    if (Platform.OS === "ios") {
      const mapsUrl = `maps://?daddr=${dest}`;
      const webUrl = `http://maps.apple.com/?daddr=${dest}`;
      Linking.openURL(mapsUrl).catch(() => Linking.openURL(webUrl).catch(console.error));
    } else {
      Linking.openURL(`http://maps.apple.com/?daddr=${dest}`).catch(console.error);
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
      
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonThird, {backgroundColor: "#4285F4"}]}
          onPress={openGoogleMaps}
          activeOpacity={0.8}>
          <Ionicons name="logo-google" size={18} color="#ffffff" />
          <Text style={styles.buttonText}>Google</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonThird, {backgroundColor: "#33CCFF"}]}
          onPress={openWaze}
          activeOpacity={0.8}>
          <Ionicons name="navigate-outline" size={18} color="#ffffff" />
          <Text style={styles.buttonText}>Waze</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonThird, {backgroundColor: "#000000"}]}
          onPress={openAppleMaps}
          activeOpacity={0.8}>
          <Ionicons name="map-outline" size={18} color="#ffffff" />
          <Text style={styles.buttonText}>Apple</Text>
        </TouchableOpacity>
      </View>
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
  buttonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buttonHalf: {
    flex: 1,
  },
  buttonThird: {
    flex: 1,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
