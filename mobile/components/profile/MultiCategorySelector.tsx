import React, {useState, useEffect, useMemo} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useCategory} from "@/contexts/CategoryContext";
import {MAIN_CATEGORIES, getSubCategoryById} from "@/constants/categories";

interface MultiCategorySelectorProps {
  selectedCategories: string[];
  selectedSubCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  onSubCategoriesChange: (subCategories: string[]) => void;
}

export const MultiCategorySelector: React.FC<MultiCategorySelectorProps> = ({
  selectedCategories,
  selectedSubCategories,
  onCategoriesChange,
  onSubCategoriesChange,
}) => {
  const {colors} = useThemeVariant();
  const {subcategoriesByMainCategory} = useCategory();

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      // Remove category and all its subcategories
      const newCategories = selectedCategories.filter((c) => c !== categoryId);
      const categorySubs = subcategoriesByMainCategory[categoryId] || [];
      const subIds = categorySubs.map((sub) => sub.id);
      const newSubCategories = selectedSubCategories.filter(
        (sub) => !subIds.includes(sub)
      );
      onCategoriesChange(newCategories);
      onSubCategoriesChange(newSubCategories);
    } else {
      // Add category
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  // Toggle subcategory selection
  const toggleSubCategory = (categoryId: string, subCategoryId: string) => {
    // Ensure the parent category is selected
    if (!selectedCategories.includes(categoryId)) {
      onCategoriesChange([...selectedCategories, categoryId]);
    }

    if (selectedSubCategories.includes(subCategoryId)) {
      onSubCategoriesChange(
        selectedSubCategories.filter((sub) => sub !== subCategoryId)
      );
    } else {
      onSubCategoriesChange([...selectedSubCategories, subCategoryId]);
    }
  };

  // Get all subcategories for selected categories
  const availableSubCategories = useMemo(() => {
    const subs: {[key: string]: any[]} = {};
    selectedCategories.forEach((catId) => {
      subs[catId] =
        subcategoriesByMainCategory[catId]?.filter((s) => s.id !== "todos") ||
        [];
    });
    return subs;
  }, [selectedCategories, subcategoriesByMainCategory]);

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
        Categorías Principales
      </Text>
      <Text style={[styles.sectionDescription, {color: colors.mutedForeground}]}>
        Selecciona una o más categorías principales
      </Text>

      {/* Main Categories */}
      <View style={styles.categoriesContainer}>
        {MAIN_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isSelected
                    ? colors.primary + "20"
                    : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => toggleCategory(category.id)}
              activeOpacity={0.7}>
              {isSelected && (
                <Ionicons
                  name="checkmark-circle"
                  color={colors.primary}
                  size={20}
                  style={styles.checkIcon}
                />
              )}
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: isSelected ? colors.primary : colors.foreground,
                    fontWeight: isSelected ? "600" : "400",
                  },
                ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Subcategories for each selected category */}
      {selectedCategories.length > 0 && (
        <View style={styles.subCategoriesSection}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
            Subcategorías
          </Text>
          <Text
            style={[styles.sectionDescription, {color: colors.mutedForeground}]}>
            Selecciona las subcategorías para cada categoría principal
          </Text>

          {selectedCategories.map((categoryId) => {
            const category = MAIN_CATEGORIES.find((c) => c.id === categoryId);
            const subCategories = availableSubCategories[categoryId] || [];

            if (subCategories.length === 0) return null;

            return (
              <View key={categoryId} style={styles.categoryGroup}>
                <Text
                  style={[styles.categoryGroupTitle, {color: colors.foreground}]}>
                  {category?.name}
                </Text>
                <View style={styles.subCategoriesContainer}>
                  {subCategories.map((subCategory) => {
                    const isSelected = selectedSubCategories.includes(
                      subCategory.id
                    );
                    return (
                      <TouchableOpacity
                        key={subCategory.id}
                        style={[
                          styles.subCategoryChip,
                          {
                            backgroundColor: isSelected
                              ? colors.primary + "15"
                              : colors.background,
                            borderColor: isSelected
                              ? colors.primary
                              : colors.border,
                          },
                        ]}
                        onPress={() => toggleSubCategory(categoryId, subCategory.id)}
                        activeOpacity={0.7}>
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            color={colors.primary}
                            size={16}
                            style={styles.subCheckIcon}
                          />
                        )}
                        <Text
                          style={[
                            styles.subCategoryText,
                            {
                              color: isSelected
                                ? colors.primary
                                : colors.foreground,
                              fontWeight: isSelected ? "600" : "400",
                            },
                          ]}>
                          {subCategory.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 100,
  },
  checkIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: "500",
  },
  subCategoriesSection: {
    marginTop: 8,
  },
  categoryGroup: {
    marginBottom: 20,
  },
  categoryGroupTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  subCategoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  subCategoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  subCheckIcon: {
    marginRight: 6,
  },
  subCategoryText: {
    fontSize: 13,
    fontWeight: "500",
  },
});


























