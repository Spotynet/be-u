import React, {useMemo} from "react";
import {View, Text, TouchableOpacity, ScrollView, StyleSheet} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

export interface SubCategory {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface SubCategoryBarProps {
  categories: SubCategory[];
  selectedCategoryId?: string;
  onCategorySelect?: (categoryId: string) => void;
  showLabels?: boolean;
  className?: string;
  style?: any;
}

export const SubCategoryBar = ({
  categories,
  selectedCategoryId,
  onCategorySelect,
  showLabels = true,
  className = "",
  style,
}: SubCategoryBarProps) => {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();

  const handleCategoryPress = (categoryId: string) => {
    onCategorySelect?.(categoryId);
  };

  const renderCategoryItem = useMemo(() => {
    return (category: SubCategory) => {
      const isSelected = selectedCategoryId === category.id;

      return (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryItem,
            isSelected && [styles.categoryItemSelected, {borderBottomColor: colors.primary}],
          ]}
          onPress={() => handleCategoryPress(category.id)}
          activeOpacity={0.7}>
          <View style={styles.categoryContent}>
            <Ionicons
              name={category.icon as any}
              size={20}
              color={isSelected ? colors.primary : colors.mutedForeground}
            />
            {showLabels && (
              <Text
                style={[
                  styles.categoryLabel,
                  {
                    color: isSelected ? colors.primary : colors.mutedForeground,
                  },
                ]}
                numberOfLines={1}>
                {category.name}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );
    };
  }, [selectedCategoryId, showLabels, colors, handleCategoryPress]);

  return (
    <View style={[styles.container, style]} className={className}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}>
        {categories.map(renderCategoryItem)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 24,
  },
  categoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    minWidth: 60,
    alignItems: "center",
  },
  categoryItemSelected: {
    borderBottomWidth: 2,
  },
  categoryContent: {
    alignItems: "center",
    gap: 4,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    maxWidth: 80,
  },
});
