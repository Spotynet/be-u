import {Tabs} from "expo-router";
import React from "react";
import {View, StyleSheet, Image} from "react-native";
import {Ionicons} from "@expo/vector-icons";

import {HapticTab} from "@/components/haptic-tab";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

export default function TabLayout() {
  const {colors} = useThemeVariant();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 80, // Increased height to accommodate elevated button
          paddingBottom: 20,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({color, focused}) => (
            <Ionicons name={focused ? "home" : "home-outline"} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          // Hidden for now: remove from navbar + disable linking
          href: null,
          title: "Explorar",
          tabBarIcon: ({color, focused}) => (
            <Ionicons name={focused ? "search" : "search-outline"} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="be-u"
        options={{
          // Hidden for now: remove from navbar + disable linking
          href: null,
          title: "",
          tabBarIcon: ({color, focused}) => (
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
          title: "Notificaciones",
          tabBarIcon: ({color, focused}) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({color, focused}) => (
            <Ionicons name={focused ? "person" : "person-outline"} color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30, // Elevates the button above other icons
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
