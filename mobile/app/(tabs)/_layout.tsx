import {Tabs} from "expo-router";
import React from "react";
import {View, Text, StyleSheet, Image} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";

import {HapticTab} from "@/components/haptic-tab";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

const TAB_ICON_SIZE = 22;

function TabIconWithLabel({
  name,
  label,
  color,
  focused,
  activeBg,
}: {
  name: string;
  label: string;
  color: string;
  focused: boolean;
  activeBg?: string;
}) {
  return (
    <View
      style={[
        styles.tabIconWrap,
        focused && [styles.tabIconWrapActive, activeBg ? {backgroundColor: activeBg} : {}],
      ]}>
      <Ionicons name={name as any} color={color} size={TAB_ICON_SIZE} />
      <Text style={[styles.tabLabel, {color}]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    minHeight: 40,
  },
  tabIconWrapActive: {},
  tabLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
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
  const activeBg = colors.primary + "25";
  const activeTint = colors.primary;
  const inactiveTint = colors.tabIconDefault ?? colors.mutedForeground;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 75,
          paddingTop: 12,
          paddingBottom: 12,
        },
        tabBarItemStyle: {
          paddingTop: 0,
          paddingBottom: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({color, focused}) => (
            <TabIconWithLabel
              name="home-outline"
              label="Inicio"
              color={color}
              focused={focused}
              activeBg={activeBg}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
          title: "Explorar",
          tabBarIcon: ({color, focused}) => (
            <TabIconWithLabel
              name="search-outline"
              label="Explorar"
              color={color}
              focused={focused}
              activeBg={activeBg}
            />
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
            <TabIconWithLabel
              name="notifications-outline"
              label="Notificaciones"
              color={color}
              focused={focused}
              activeBg={activeBg}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          title: "Calendario",
          tabBarIcon: ({color, focused}) => (
            <TabIconWithLabel
              name="calendar-outline"
              label="Calendario"
              color={color}
              focused={focused}
              activeBg={activeBg}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({color, focused}) => (
            <TabIconWithLabel
              name="person-outline"
              label="Perfil"
              color={color}
              focused={focused}
              activeBg={activeBg}
            />
          ),
        }}
      />
    </Tabs>
  );
}
