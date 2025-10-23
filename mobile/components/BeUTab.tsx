import React from "react";
import {TouchableOpacity, StyleSheet, Platform, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

interface BeUTabProps {
  onPress: () => void;
  focused: boolean;
}

const BeUTab = ({onPress, focused}: BeUTabProps) => {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();

  const handlePress = () => {
    // Add haptic feedback for iOS
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: focused ? "#00ff88" : colors.primary, // Bright green when active
          shadowColor: focused ? "#00ff88" : colors.primary,
          transform: [{scale: focused ? 1.0 : 1}], // Same size
          borderWidth: focused ? 6 : 0,
          borderColor: focused ? "#ff0000" : "transparent", // Red border when active
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}>
      <Ionicons
        name={focused ? "sparkles" : "sparkles-outline"}
        color={focused ? "#000000" : colors.primaryForeground} // Black icon when active
        size={28} // Same size always
      />
      {focused && (
        <View style={styles.activeIndicatorContainer}>
          <View
            style={[
              styles.activeIndicator,
              {
                backgroundColor: "#ff0000", // Red indicator
              },
            ]}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -30, // Elevate above the tab bar
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, // Android shadow
  },
  activeIndicatorContainer: {
    position: "absolute",
    bottom: -8,
    alignItems: "center",
  },
  activeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default BeUTab;
