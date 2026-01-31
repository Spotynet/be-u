import {useState, useEffect} from "react";
import {View, Text, StyleSheet, TouchableOpacity} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {AddressSearch} from "@/components/location/AddressSearch";

type LocationPickerProps = {
  initialLocation?: {latitude: number; longitude: number; address?: string};
  onLocationSelect: (location: {latitude: number; longitude: number; address?: string}) => void;
  onCancel?: () => void;
};

export function LocationPicker({initialLocation, onLocationSelect, onCancel}: LocationPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(initialLocation || null);

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation]);

  const handleSelect = (location: {latitude: number; longitude: number; address?: string}) => {
    setSelectedLocation(location);
    // Auto-confirm when a valid address is selected
    onLocationSelect(location);
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.header}>
        <Text style={[styles.title, {color: colors.foreground}]}>Seleccionar Dirección</Text>
        {onCancel && (
          <TouchableOpacity onPress={onCancel}>
            <Text style={[styles.cancelText, {color: colors.primary}]}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>

      <AddressSearch
        placeholder="Buscar dirección..."
        onSelect={handleSelect}
      />

      {selectedLocation && (
        <View style={[styles.selectedAddress, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Text style={[styles.selectedLabel, {color: colors.mutedForeground}]}>Dirección seleccionada:</Text>
          <Text style={[styles.selectedAddressText, {color: colors.foreground}]}>
            {selectedLocation.address || "Dirección no disponible"}
          </Text>
          <Text style={[styles.coordinatesText, {color: colors.mutedForeground}]}>
            {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  selectedAddress: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  selectedLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  selectedAddressText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    fontFamily: "monospace",
  },
});
