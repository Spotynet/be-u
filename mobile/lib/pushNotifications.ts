import {Platform} from "react-native";
import Constants from "expo-constants";

export const getExpoPushToken = async (): Promise<string | null> => {
  if (Platform.OS === "web") return null;
  try {
    const Notifications = await import("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    // Nested expo-modules-core types don't always resolve under dynamic import.
    const existingPermissions = (await Notifications.getPermissionsAsync()) as {
      status: string;
      granted?: boolean;
    };
    let finalStatus = existingPermissions.granted || existingPermissions.status === "granted"
      ? "granted"
      : existingPermissions.status;
    if (finalStatus !== "granted") {
      const requested = (await Notifications.requestPermissionsAsync()) as {
        status: string;
        granted?: boolean;
      };
      finalStatus = requested.granted || requested.status === "granted" ? "granted" : requested.status;
    }
    if (finalStatus !== "granted") {
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn("No EAS projectId found — cannot get Expo push token");
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({projectId});
    return token.data;
  } catch (err) {
    console.warn("Failed to get Expo push token:", err);
    return null;
  }
};

export const getPlatformLabel = (): "ios" | "android" | "web" | "unknown" => {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  if (Platform.OS === "web") return "web";
  return "unknown";
};
