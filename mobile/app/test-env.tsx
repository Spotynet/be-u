import React, {useEffect} from "react";
import {View, Text, StyleSheet} from "react-native";

export default function TestEnvScreen() {
  useEffect(() => {
    console.log("🔧 Testing Environment Variables:");
    console.log("EXPO_PUBLIC_API_URL:", process.env.EXPO_PUBLIC_API_URL);
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("EXPO_PUBLIC_DEBUG:", process.env.EXPO_PUBLIC_DEBUG);
    console.log("EXPO_PUBLIC_EAS_BUILD:", process.env.EXPO_PUBLIC_EAS_BUILD);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Environment Test</Text>
      <Text style={styles.info}>Check console for environment variables</Text>
      <Text style={styles.value}>API URL: https://stg.be-u.ai/api (HARDCODED)</Text>
      <Text style={styles.value}>Node ENV: {process.env.NODE_ENV || "Not set"}</Text>
      <Text style={styles.value}>Debug: {process.env.EXPO_PUBLIC_DEBUG || "Not set"}</Text>
      <Text style={styles.value}>EAS Build: {process.env.EXPO_PUBLIC_EAS_BUILD || "Not set"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1f2937",
  },
  info: {
    fontSize: 16,
    marginBottom: 20,
    color: "#6b7280",
    textAlign: "center",
  },
  value: {
    fontSize: 14,
    marginBottom: 8,
    color: "#374151",
    fontFamily: "monospace",
  },
});
