import {
  NativeTabs,
  Icon,
  Label,
  VectorIcon,
} from "expo-router/unstable-native-tabs";
import React from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

export default function TabLayout() {
  const {colors} = useThemeVariant();

  return (
    <NativeTabs
      backgroundColor={colors.navBarBg}
      iconColor={{
        default: "rgba(255, 255, 255, 0.6)",
        selected: colors.navBarText,
      }}
      disableTransparentOnScrollEdge>
      <NativeTabs.Trigger name="index">
        <Icon
          src={
            <VectorIcon family={MaterialCommunityIcons} name="home-outline" color={colors.navBarText} />
          }
        />
        <Label style={{color: colors.navBarText}}>Inicio</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore" hidden>
        <Icon
          src={
            <VectorIcon family={MaterialCommunityIcons} name="magnify" color={colors.navBarText} />
          }
        />
        <Label style={{color: colors.navBarText}}>Explorar</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="be-u" hidden>
        <Label />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notificaciones" hidden>
        <Icon
          src={
            <VectorIcon family={MaterialCommunityIcons} name="bell-outline" color={colors.navBarText} />
          }
        />
        <Label style={{color: colors.navBarText}}>Notificaciones</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="calendario">
        <Icon
          src={
            <VectorIcon family={MaterialCommunityIcons} name="calendar-outline" color={colors.navBarText} />
          }
        />
        <Label style={{color: colors.navBarText}}>Calendario</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="perfil">
        <Icon
          src={
            <VectorIcon family={MaterialCommunityIcons} name="account-outline" color={colors.navBarText} />
          }
        />
        <Label style={{color: colors.navBarText}}>Perfil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
