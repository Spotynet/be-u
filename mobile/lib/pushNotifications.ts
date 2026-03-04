import {Platform} from "react-native";

export const getExpoPushToken = async (): Promise<string | null> => {
  if (Platform.OS === "web") return null;
  try {
    const Notifications = await import("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    const {status: existingStatus} = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const {status} = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync();
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
