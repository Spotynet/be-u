import {View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, Platform} from "react-native";
import {useEffect, useState} from "react";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {getPlaceDetails, searchPlaceAutocomplete} from "@/lib/googleMaps";

type AddressSearchProps = {
  placeholder?: string;
  value?: string;
  onSelect: (location: {latitude: number; longitude: number; address?: string}) => void;
};

export function AddressSearch({placeholder = "Buscar dirección...", value, onSelect}: AddressSearchProps) {
  const {colors} = useThemeVariant();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{place_id: string; description: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Don't set query from value on initial load - only update if user hasn't interacted
  useEffect(() => {
    if (value !== undefined && !hasUserInteracted) {
      // Only set if value changes externally (not from user typing)
      // But don't set on initial load to prevent autocomplete
    }
  }, [value, hasUserInteracted]);

  useEffect(() => {
    // Only trigger autocomplete if user has started typing (query length > 0)
    // This prevents autocomplete from triggering on page load
    if (!hasUserInteracted && query.length === 0) {
      setResults([]);
      return;
    }

    const handle = setTimeout(async () => {
      if (query.trim().length < 3) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const predictions = await searchPlaceAutocomplete(query.trim());
        setResults(predictions);
      } catch (error) {
        console.warn("Address autocomplete failed", error);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [query, hasUserInteracted]);

  const handleSelect = async (placeId: string) => {
    try {
      setLoading(true);
      setResults([]); // Clear results immediately for better UX
      const details = await getPlaceDetails(placeId);
      if (details) {
        console.log("Address selected:", details);
        onSelect(details);
        setQuery(details.address ?? query);
      } else {
        console.warn("No details returned for place_id:", placeId);
      }
    } catch (error) {
      console.error("Place details failed", error);
      // Show error to user
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          {backgroundColor: colors.card, borderColor: colors.border},
        ]}>
        <Ionicons name="location-outline" color={colors.mutedForeground} size={18} />
        <TextInput
          style={[styles.input, {color: colors.foreground}]}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={(text) => {
            setHasUserInteracted(true);
            setQuery(text);
          }}
        />
      </View>
      {loading ? (
        <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>Buscando...</Text>
      ) : null}
      {results.length > 0 && (
        <View style={[styles.resultsList, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.place_id}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[styles.resultItem, {borderBottomColor: colors.border}]}
                onPress={() => {
                  console.log("Selecting place:", item.place_id, item.description);
                  handleSelect(item.place_id);
                }}
                activeOpacity={0.7}>
                <Text style={[styles.resultText, {color: colors.foreground}]}>{item.description}</Text>
              </TouchableOpacity>
            )}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
  },
  loadingText: {
    marginTop: 6,
    fontSize: 12,
  },
  resultsList: {
    marginTop: 8,
    borderRadius: 12,
    maxHeight: 180,
    borderWidth: 1,
    overflow: "hidden",
    zIndex: 1000,
    elevation: 5,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  resultItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultText: {
    fontSize: 14,
  },
});
