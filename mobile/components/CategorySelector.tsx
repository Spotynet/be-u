import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  FlatList,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeVariant } from "@/contexts/ThemeVariantContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategoryOption {
  id: string;
  name: string;
  icon: string;
  iconFamily?: "ionicons" | "material-community";
  description?: string;
}

interface CategorySelectorProps {
  categories: CategoryOption[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  placeholder?: string;
  title?: string;
}

// ─── Icon renderer ────────────────────────────────────────────────────────────

function CategoryIcon({
  icon,
  iconFamily = "material-community",
  size,
  color,
}: {
  icon: string;
  iconFamily?: "ionicons" | "material-community";
  size: number;
  color: string;
}) {
  if (iconFamily === "ionicons") {
    return <Ionicons name={icon as any} size={size} color={color} />;
  }
  return <MaterialCommunityIcons name={icon as any} size={size} color={color} />;
}

// ─── CategoryOptionRow ────────────────────────────────────────────────────────

interface CategoryOptionRowProps {
  item: CategoryOption;
  isSelected: boolean;
  onPress: () => void;
}

function CategoryOptionRow({ item, isSelected, onPress }: CategoryOptionRowProps) {
  const { colors } = useThemeVariant();
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.optionRow,
        {
          backgroundColor: pressed
            ? "rgba(246,197,49,0.06)"
            : isSelected
            ? "rgba(246,197,49,0.09)"
            : "transparent",
          borderBottomColor: colors.divider,
        },
      ]}>
      {/* Icon container */}
      <View
        style={[
          styles.optionIconWrap,
          {
            backgroundColor: isSelected
              ? "rgba(246,197,49,0.15)"
              : colors.muted,
          },
        ]}>
        <CategoryIcon
          icon={item.icon}
          iconFamily={item.iconFamily}
          size={20}
          color={isSelected ? "#F6C531" : colors.mutedForeground}
        />
      </View>

      {/* Label + description */}
      <View style={styles.optionTextWrap}>
        <Text
          style={[
            styles.optionLabel,
            { color: isSelected ? colors.foreground : colors.textSecondary },
          ]}>
          {item.name}
        </Text>
        {item.description ? (
          <Text
            style={[styles.optionDescription, { color: colors.textTertiary }]}
            numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
      </View>

      {/* Checkmark */}
      {isSelected ? (
        <Ionicons name="checkmark" size={18} color="#F6C531" />
      ) : (
        <View style={{ width: 18 }} />
      )}
    </Pressable>
  );
}

// ─── CategorySelectorSheet ────────────────────────────────────────────────────

interface CategorySelectorSheetProps {
  visible: boolean;
  categories: CategoryOption[];
  selectedCategory: string;
  title: string;
  onSelect: (categoryId: string) => void;
  onClose: () => void;
}

function CategorySelectorSheet({
  visible,
  categories,
  selectedCategory,
  title,
  onSelect,
  onClose,
}: CategorySelectorSheetProps) {
  const { colors } = useThemeVariant();

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
      onClose();
    },
    [onSelect, onClose]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      {/* Scrim */}
      <Pressable style={styles.scrim} onPress={onClose}>
        {/* Sheet — stop propagation so taps inside don't close it */}
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
          {/* Handle bar */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} hitSlop={12}>
              <Ionicons name="close" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CategoryOptionRow
                item={item}
                isSelected={selectedCategory === item.id}
                onPress={() => handleSelect(item.id)}
              />
            )}
            scrollEnabled={categories.length > 6}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.optionList}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── CategorySelectorTrigger ──────────────────────────────────────────────────

function CategorySelectorTrigger({
  selected,
  onPress,
}: {
  selected: CategoryOption | undefined;
  onPress: () => void;
}) {
  const { colors } = useThemeVariant();
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.trigger,
        {
          backgroundColor: pressed ? colors.surfaceElevated : colors.input,
          borderColor: pressed ? "rgba(246,197,49,0.45)" : colors.inputBorder,
        },
      ]}>
      {selected ? (
        <View style={styles.triggerIconWrap}>
          <CategoryIcon
            icon={selected.icon}
            iconFamily={selected.iconFamily}
            size={18}
            color={colors.foreground}
          />
        </View>
      ) : null}

      <Text style={[styles.triggerLabel, { color: colors.foreground }]} numberOfLines={1}>
        {selected?.name ?? "Seleccionar"}
      </Text>

      <Ionicons name="chevron-down" size={15} color={colors.mutedForeground} />
    </Pressable>
  );
}

// ─── CategorySelector (public API) ───────────────────────────────────────────

export function CategorySelector({
  categories,
  selectedCategory,
  onSelectCategory,
  placeholder = "Seleccionar categoría",
  title = "Categoría",
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false);

  const selected = categories.find((c) => c.id === selectedCategory);

  return (
    <>
      <CategorySelectorTrigger selected={selected} onPress={() => setOpen(true)} />

      <CategorySelectorSheet
        visible={open}
        categories={categories}
        selectedCategory={selectedCategory}
        title={title}
        onSelect={onSelectCategory}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Trigger
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: "flex-start",
    minWidth: 140,
  },
  triggerIconWrap: {
    width: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  triggerLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.1,
  },

  // Sheet / Modal
  scrim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    // Elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // Option list
  optionList: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTextWrap: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  optionDescription: {
    fontSize: 12,
    fontWeight: "400",
  },
});

// ─── Sample data ──────────────────────────────────────────────────────────────

export const SAMPLE_CATEGORIES: CategoryOption[] = [
  {
    id: "belleza",
    name: "Belleza",
    icon: "spa-outline",
    iconFamily: "material-community",
    description: "Cabello, maquillaje, uñas y más",
  },
  {
    id: "bienestar",
    name: "Bienestar",
    icon: "meditation",
    iconFamily: "material-community",
    description: "Yoga, masajes, nutrición y salud",
  },
  {
    id: "mascotas",
    name: "Mascotas",
    icon: "paw",
    iconFamily: "material-community",
    description: "Estética, cuidadores y paseos",
  },
];
