import React, {useMemo, useCallback} from "react";
import {View, Text, Pressable, ScrollView, StyleSheet} from "react-native";
import {Ionicons, MaterialCommunityIcons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

export type IconFamily = "Ionicons" | "MaterialCommunityIcons";

export interface SubCategory {
  id: string;
  name: string;
  icon: string;
  description?: string;
  color?: string;
  iconFamily?: IconFamily;
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

  const handleCategoryPress = useCallback(
    (categoryId: string) => {
      onCategorySelect?.(categoryId);
    },
    [onCategorySelect]
  );

  const renderCategoryItem = useMemo(() => {
    return (category: SubCategory) => {
      const isSelected = selectedCategoryId === category.id;
      const highlightColor = category.color || colors.primary;
      const {iconName, family} = (() => {
        if (!category.icon) {
          return {
            iconName: undefined as string | undefined,
            family: "Ionicons" as IconFamily,
          };
        }

        if (category.icon.includes(":")) {
          const [familyRaw, parsedIconName] = category.icon.split(":", 2);
          const family = (familyRaw?.trim().toLowerCase() === "materialcommunityicons"
            ? "MaterialCommunityIcons"
            : "Ionicons") as IconFamily;
          return {iconName: parsedIconName, family};
        }

        return {
          iconName: category.icon,
          family: category.iconFamily || ("Ionicons" as IconFamily),
        };
      })();
      const IconComponent = family === "MaterialCommunityIcons" ? MaterialCommunityIcons : Ionicons;

      return (
        <Pressable
          key={category.id}
          style={[
            styles.categoryItem,
            isSelected && [styles.categoryItemSelected, {borderBottomColor: highlightColor}],
          ]}
          onPress={() => handleCategoryPress(category.id)}
          delayPressIn={0}>
          <View style={styles.categoryContent}>
            {iconName ? (
              <View style={styles.iconContainer}>
                <IconComponent
                  name={iconName as any}
                  size={20}
                  color={isSelected ? (highlightColor ?? "#8b5cf6") : (colors.mutedForeground ?? "#6b7280")}
                />
              </View>
            ) : null}
            {showLabels && (
              <Text
                style={[
                  styles.categoryLabel,
                  {
                    color: isSelected ? highlightColor : colors.mutedForeground,
                  },
                ]}
                numberOfLines={1}>
                {category.name}
              </Text>
            )}
          </View>
        </Pressable>
      );
    };
  }, [selectedCategoryId, showLabels, colors, handleCategoryPress]);

  return (
    <View style={[styles.container, style]} className={className}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: 20,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    maxWidth: 80,
    lineHeight: 12,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});
