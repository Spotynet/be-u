import React, {useEffect, useMemo, useState} from "react";
import {View, TextInput, FlatList, TouchableOpacity, Text} from "react-native";
import {searchPlaceText} from "../../lib/awsLocation";

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  onSelected: (payload: {
    address: string;
    city?: string;
    country?: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  placeholder?: string;
};

export default function AddressAutocomplete({value, onChangeText, onSelected, placeholder}: Props) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!query || query.length < 3) {
        setResults([]);
        return;
      }
      const items = await searchPlaceText(query);
      if (!cancelled) setResults(items);
    };
    const t = setTimeout(run, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const handleSelect = (item: any) => {
    setQuery(item.label);
    setResults([]);
    onSelected({
      address: item.label,
      city: item.city,
      country: item.country,
      postal_code: item.postal_code,
      latitude: item.position?.latitude,
      longitude: item.position?.longitude,
    });
  };

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={(t) => {
          setQuery(t);
          onChangeText(t);
        }}
        placeholder={placeholder || "Buscar dirección"}
        style={{borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 8}}
        autoCapitalize="none"
      />
      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item, idx) => `${item.label}-${idx}`}
          renderItem={({item}) => (
            <TouchableOpacity onPress={() => handleSelect(item)} style={{paddingVertical: 10}}>
              <Text>{item.label}</Text>
            </TouchableOpacity>
          )}
          style={{
            backgroundColor: "white",
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 8,
            marginTop: 6,
            maxHeight: 220,
          }}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}
