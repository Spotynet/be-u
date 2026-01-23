import * as Notifications from "expo-notifications";
import {Platform} from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const getExpoPushToken = async (): Promise<string | null> => {
  try {
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
