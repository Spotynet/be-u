import {Tabs} from "expo-router";
import React from "react";
import {View, StyleSheet, Image, Platform} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";

import {HapticTab} from "@/components/haptic-tab";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

const TAB_ICON_SIZE = 24;

function TabIcon({
  name,
  color,
  focused,
  colors,
}: {
  name: string;
  color: string;
  focused: boolean;
  colors: Record<string, string>;
}) {
  return (
    <View style={[styles.tabIconWrap, focused && {backgroundColor: colors.primary + "22"}]}>
      <Ionicons name={name as any} color={color} size={TAB_ICON_SIZE} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 48,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  centerButtonIcon: {
    width: 32,
    height: 32,
  },
});

export default function TabLayout() {
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();

  const tabBarHeight = 72 + (Platform.OS === "ios" ? insets.bottom : 12);
  const paddingBottom = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: tabBarHeight,
          paddingBottom,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          paddingTop: 6,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({color, focused}) => (
            <TabIcon name="home-outline" color={color} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
          title: "Explorar",
          tabBarIcon: ({color, focused}) => (
            <TabIcon name="search-outline" color={color} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="be-u"
        options={{
          href: null,
          title: "",
          tabBarIcon: () => (
            <View
              style={[
                styles.centerButton,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                },
              ]}>
              <Image
                source={require("@/assets/images/BE-U-white.png")}
                style={styles.centerButtonIcon}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notificaciones"
        options={{
          href: null,
          title: "Notificaciones",
          tabBarIcon: ({color, focused}) => (
            <TabIcon name="notifications-outline" color={color} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          title: "Calendario",
          tabBarIcon: ({color, focused}) => (
            <TabIcon name="calendar-outline" color={color} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({color, focused}) => (
            <TabIcon name="person-outline" color={color} focused={focused} colors={colors} />
          ),
        }}
      />
    </Tabs>
  );
}
