import {useState, useEffect} from "react";
import {View, Text, TouchableOpacity, StyleSheet, ScrollView} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useCategory} from "@/contexts/CategoryContext";
import {profileCustomizationApi} from "@/lib/api";

type Props = {
  selectedSubcategory: string | null;
  onSelect: (subcategoryId: string | null) => void;
  required?: boolean;
};

export function SubcategorySelector({
  selectedSubcategory,
  onSelect,
  required = false,
}: Props) {
  const {colors} = useThemeVariant();
  const {subcategoriesByMainCategory} = useCategory();
  const [profileSubIds, setProfileSubIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    profileCustomizationApi
      .getProfileImages()
      .then((res) => {
        if (cancelled) return;
        const sub = res.data?.sub_categories;
        const list = Array.isArray(sub) ? sub : sub ? [sub] : [];
        setProfileSubIds(list.map((s: any) => String(s).trim().toLowerCase()).filter(Boolean));
      })
      .catch(() => {
        if (!cancelled) setProfileSubIds([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || profileSubIds.length === 0) return null;

  // Build list of subcategories: only those in the profile, with display names from CategoryContext
  const allSubs: {id: string; name: string}[] = [];
  for (const catId of ["belleza", "bienestar", "mascotas"] as const) {
    const subs = subcategoriesByMainCategory[catId] || [];
    for (const s of subs) {
      if (s.id !== "todos" && profileSubIds.includes(String(s.id).toLowerCase())) {
        allSubs.push({id: s.id, name: s.name});
      }
    }
  }

  if (allSubs.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, {color: colors.foreground}]}>
        SUBCATEGORÍA {required ? "(requerida)" : ""}
      </Text>
      <Text style={[styles.hint, {color: colors.mutedForeground}]}>
        Selecciona una subcategoría para esta publicación
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        <TouchableOpacity
          style={[
            styles.chip,
            {
              backgroundColor: selectedSubcategory === null ? colors.primary : colors.card,
              borderColor: selectedSubcategory === null ? colors.primary : colors.border,
            },
          ]}
          onPress={() => onSelect(null)}
          activeOpacity={0.8}>
          <Text
            style={[
              styles.chipText,
              {color: selectedSubcategory === null ? "#ffffff" : colors.foreground},
            ]}>
            Ninguna
          </Text>
        </TouchableOpacity>
        {allSubs.map((s) => {
          const isSelected = selectedSubcategory?.toLowerCase() === s.id.toLowerCase();
          return (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => onSelect(s.id)}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.chipText,
                  {color: isSelected ? "#ffffff" : colors.foreground},
                ]}>
                {s.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {marginBottom: 16},
  label: {fontSize: 12, fontWeight: "700", marginBottom: 4, letterSpacing: 0.5},
  hint: {fontSize: 12, marginBottom: 8},
  chips: {flexDirection: "row", gap: 8, paddingVertical: 4},
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {fontSize: 14, fontWeight: "600"},
});
