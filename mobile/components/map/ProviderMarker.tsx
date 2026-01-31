import {View, Text, StyleSheet, Platform} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

// Conditionally import Marker and Callout only on native platforms
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

type ProviderMarkerProps = {
  id: number | string;
  name: string;
  profileType: "PROFESSIONAL" | "PLACE";
  latitude: number;
  longitude: number;
  onPress?: () => void;
};

export function ProviderMarker({id, name, profileType, latitude, longitude, onPress}: ProviderMarkerProps) {
  const {colors} = useThemeVariant();
  const isProfessional = profileType === "PROFESSIONAL";
  const markerColor = isProfessional ? "#FF69B4" : "#8B5CF6";

  // Web fallback - return null
  if (Platform.OS === "web" || !Marker) {
    return null;
  }

  return (
    <Marker
      key={id}
      coordinate={{latitude, longitude}}
      onPress={onPress}
      tracksViewChanges={false}>
      <View style={[styles.marker, {borderColor: markerColor, backgroundColor: "#ffffff"}]}>
        <Ionicons
          name={isProfessional ? "cut-outline" : "business-outline"}
          size={18}
          color={markerColor}
        />
      </View>
      <Callout>
        <View style={styles.callout}>
          <Text style={[styles.calloutTitle, {color: colors.foreground}]}>{name}</Text>
          <Text style={[styles.calloutSubtitle, {color: colors.mutedForeground}]}>
            {isProfessional ? "Profesional" : "Lugar"}
          </Text>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  callout: {
    minWidth: 140,
    paddingVertical: 4,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  calloutSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
});
