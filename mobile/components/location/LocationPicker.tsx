import {useEffect, useState} from "react";
import {View, Text, StyleSheet, TouchableOpacity} from "react-native";
import MapView, {Marker, Region} from "react-native-maps";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {AddressSearch} from "@/components/location/AddressSearch";
import {getCurrentLocation, reverseGeocode} from "@/lib/googleMaps";

type LocationPickerProps = {
  initialLocation?: {latitude: number; longitude: number; address?: string};
  onLocationSelect: (location: {latitude: number; longitude: number; address?: string}) => void;
  onCancel?: () => void;
};

export function LocationPicker({initialLocation, onLocationSelect, onCancel}: LocationPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [region, setRegion] = useState<Region | null>(null);
  const [address, setAddress] = useState<string | undefined>(initialLocation?.address);

  useEffect(() => {
    const loadLocation = async () => {
      if (initialLocation) {
        setRegion({
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        return;
      }
      const current = await getCurrentLocation();
      if (current) {
        setRegion({
          latitude: current.latitude,
          longitude: current.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    };
    loadLocation();
  }, [initialLocation]);

  const updateLocation = async (latitude: number, longitude: number, nextAddress?: string) => {
    setRegion((prev) =>
      prev
        ? {...prev, latitude, longitude}
        : {latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01}
    );
    if (nextAddress) {
      setAddress(nextAddress);
      return;
    }
    const resolvedAddress = await reverseGeocode(latitude, longitude);
    setAddress(resolvedAddress ?? undefined);
  };

  const handleConfirm = () => {
    if (!region) return;
    onLocationSelect({
      latitude: region.latitude,
      longitude: region.longitude,
      address,
    });
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <AddressSearch
        onSelect={(location) =>
          updateLocation(location.latitude, location.longitude, location.address)
        }
      />
      <View style={styles.mapWrapper}>
        {region ? (
          <MapView
            style={styles.map}
            region={region}
            onPress={(event) => {
              const {latitude, longitude} = event.nativeEvent.coordinate;
              updateLocation(latitude, longitude);
            }}>
            <Marker
              coordinate={{latitude: region.latitude, longitude: region.longitude}}
              draggable
              onDragEnd={(event) => {
                const {latitude, longitude} = event.nativeEvent.coordinate;
                updateLocation(latitude, longitude);
              }}
            />
          </MapView>
        ) : (
          <View style={[styles.mapLoading, {backgroundColor: colors.card}]}>
            <Text style={{color: colors.mutedForeground}}>Cargando mapa...</Text>
          </View>
        )}
      </View>
      <View style={styles.addressRow}>
        <Text style={[styles.addressLabel, {color: colors.mutedForeground}]}>Dirección</Text>
        <Text style={[styles.addressValue, {color: colors.foreground}]}>
          {address || "Selecciona una ubicación"}
        </Text>
      </View>
      <View style={styles.actions}>
        {onCancel && (
          <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onCancel}>
            <Text style={[styles.actionText, {color: colors.foreground}]}>Cancelar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: colors.primary}]}
          onPress={handleConfirm}
          disabled={!region}>
          <Text style={[styles.actionText, {color: "#ffffff"}]}>Confirmar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 16,
  },
  mapWrapper: {
    height: 280,
    borderRadius: 16,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addressRow: {
    gap: 4,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  addressValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  actionButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#cccccc",
    backgroundColor: "transparent",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
