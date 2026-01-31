import {View, Text, StyleSheet, TouchableOpacity, ActivityIndicator} from "react-native";
import {SafeMapView, Region} from "@/components/map/SafeMapView";
import {Ionicons} from "@expo/vector-icons";
import {useEffect, useMemo, useState} from "react";
import {useRouter} from "expo-router";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {getCurrentLocation} from "@/lib/googleMaps";
import {providerApi} from "@/lib/api";
import {PublicProfile} from "@/types/global";
import {ProviderMarker} from "@/components/map/ProviderMarker";
import {AddressSearch} from "@/components/location/AddressSearch";

const DEFAULT_REGION: Region = {
  latitude: 19.4326,
  longitude: -99.1332,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function MapScreen() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [providers, setProviders] = useState<PublicProfile[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapCountLabel = useMemo(() => providers.filter((p) => p.latitude && p.longitude).length, [providers]);

  const fetchProviders = async (coords?: {latitude: number; longitude: number}) => {
    try {
      setIsLoading(true);
      setError(null);

      const fetchAllPages = async (page = 1, acc: PublicProfile[] = []): Promise<PublicProfile[]> => {
        const response = await providerApi.getPublicProfiles({
          ...(coords ? {latitude: coords.latitude, longitude: coords.longitude, radius: 10} : {}),
          page,
          page_size: 50,
        } as any);
        const results = (response.data.results || []) as PublicProfile[];
        const next = response.data.next;
        const merged = [...acc, ...results];
        if (next && page < 10) {
          return fetchAllPages(page + 1, merged);
        }
        return merged;
      };

      const allProviders = await fetchAllPages();
      setProviders(allProviders);
    } catch (err: any) {
      setError("No se pudieron cargar los proveedores");
    } finally {
      setIsLoading(false);
    }
  };

  const centerOnCurrentLocation = async () => {
    const current = await getCurrentLocation();
    if (current) {
      setUserLocation({latitude: current.latitude, longitude: current.longitude});
      const nextRegion = {
        latitude: current.latitude,
        longitude: current.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setRegion(nextRegion);
      fetchProviders({latitude: current.latitude, longitude: current.longitude});
    } else {
      fetchProviders();
    }
  };

  useEffect(() => {
    centerOnCurrentLocation();
  }, []);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" color={colors.foreground} size={28} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Mapa</Text>
          <Text style={[styles.headerSubtitle, {color: colors.mutedForeground}]}>
            {mapCountLabel} lugares
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.locationButton, {backgroundColor: colors.primary}]}
          onPress={centerOnCurrentLocation}>
          <Ionicons name="navigate" color="#ffffff" size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <AddressSearch
          placeholder="Buscar ubicación..."
          onSelect={(location) => {
            const nextRegion = {
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            };
            setRegion(nextRegion);
            setUserLocation({latitude: location.latitude, longitude: location.longitude});
            fetchProviders({latitude: location.latitude, longitude: location.longitude});
          }}
        />
      </View>

      <View style={styles.mapContainer}>
        <SafeMapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={!!userLocation}
          showsMyLocationButton={false}>
          {providers
            .filter((p) => typeof p.latitude === "number" && typeof p.longitude === "number")
            .map((provider) => (
              <ProviderMarker
                key={provider.id}
                id={provider.id}
                name={provider.display_name || provider.name}
                profileType={provider.profile_type}
                latitude={Number(provider.latitude)}
                longitude={Number(provider.longitude)}
                onPress={() => setSelectedProvider(provider)}
              />
            ))}
        </SafeMapView>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>Cargando mapa...</Text>
          </View>
        )}

        {error && !isLoading && (
          <View style={styles.errorOverlay}>
            <Ionicons name="alert-circle" color="#ef4444" size={32} />
            <Text style={[styles.errorText, {color: colors.mutedForeground}]}>{error}</Text>
          </View>
        )}
      </View>

      {selectedProvider && (
        <View style={[styles.bottomSheet, {backgroundColor: colors.background}]}>
          <View style={styles.sheetHandle} />
          <View style={[styles.providerCard, {backgroundColor: colors.card}]}>
            <Text style={[styles.providerName, {color: colors.foreground}]}>
              {selectedProvider.display_name || selectedProvider.name}
            </Text>
            <Text style={[styles.providerMeta, {color: colors.mutedForeground}]}>
              {selectedProvider.profile_type === "PROFESSIONAL" ? "Profesional" : "Lugar"}
              {typeof selectedProvider.distance === "number"
                ? ` · ${selectedProvider.distance.toFixed(1)} km`
                : ""}
            </Text>
            <TouchableOpacity
              style={[styles.detailsButton, {backgroundColor: colors.primary}]}
              onPress={() => router.push(`/profile/${selectedProvider.id}`)}>
              <Text style={styles.detailsButtonText}>Ver Perfil</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedProvider(null)}>
            <Ionicons name="close" color={colors.mutedForeground} size={22} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  locationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
    zIndex: 2,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: "600",
  },
  errorOverlay: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.12)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  providerCard: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  providerName: {
    fontSize: 18,
    fontWeight: "800",
  },
  providerMeta: {
    fontSize: 13,
    fontWeight: "600",
  },
  detailsButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  detailsButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
});
