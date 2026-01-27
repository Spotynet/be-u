import {View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet} from "react-native";
import {useEffect, useState} from "react";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {getPlaceDetails, searchPlaceAutocomplete} from "@/lib/googleMaps";

type AddressSearchProps = {
  placeholder?: string;
  onSelect: (location: {latitude: number; longitude: number; address?: string}) => void;
};

export function AddressSearch({placeholder = "Buscar dirección...", onSelect}: AddressSearchProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{place_id: string; description: string}[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
  }, [query]);

  const handleSelect = async (placeId: string) => {
    try {
      const details = await getPlaceDetails(placeId);
      if (details) {
        onSelect(details);
        setQuery(details.address ?? query);
        setResults([]);
      }
    } catch (error) {
      console.warn("Place details failed", error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, {backgroundColor: colors.card, color: colors.foreground}]}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        value={query}
        onChangeText={setQuery}
      />
      {loading ? (
        <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>Buscando...</Text>
      ) : null}
      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.place_id}
          renderItem={({item}) => (
            <TouchableOpacity
              style={[styles.resultItem, {borderBottomColor: colors.border}]}
              onPress={() => handleSelect(item.place_id)}>
              <Text style={[styles.resultText, {color: colors.foreground}]}>{item.description}</Text>
            </TouchableOpacity>
          )}
          style={[styles.resultsList, {backgroundColor: colors.card}]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  loadingText: {
    marginTop: 6,
    fontSize: 12,
  },
  resultsList: {
    marginTop: 8,
    borderRadius: 12,
    maxHeight: 180,
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
