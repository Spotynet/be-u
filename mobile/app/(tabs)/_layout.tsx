import {
  NativeTabs,
  Icon,
  Label,
  VectorIcon,
} from "expo-router/unstable-native-tabs";
import React from "react";
import {MaterialCommunityIcons} from "@expo/vector-icons";

import {useThemeVariant} from "@/contexts/ThemeVariantContext";

export default function TabLayout() {
  const {colors} = useThemeVariant();
  const inactiveTint = colors.tabIconDefault ?? colors.mutedForeground;

  return (
    <NativeTabs
      backgroundColor={colors.card}
      iconColor={{
        default: inactiveTint,
        selected: colors.primary,
      }}
      disableTransparentOnScrollEdge>
      <NativeTabs.Trigger name="index">
        <Icon
          src={
            <VectorIcon family={MaterialCommunityIcons} name="home-outline" />
          }
        />
        <Label>Inicio</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore" hidden>
        <Icon
          src={
            <VectorIcon family={MaterialCommunityIcons} name="magnify" />
          }
        />
        <Label>Explorar</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="be-u" hidden>
        <Label />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notificaciones" hidden>
        <Icon
          src={
            <VectorIcon family={MaterialCommunityIcons} name="bell-outline" />
          }
        />
        <Label>Notificaciones</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="calendario">
        <Icon
          src={
            <VectorIcon family={MaterialCommunityIcons} name="calendar-outline" />
          }
        />
        <Label>Calendario</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="perfil">
        <Icon
          src={
            <VectorIcon family={MaterialCommunityIcons} name="account-outline" />
          }
        />
        <Label>Perfil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
