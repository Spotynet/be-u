import React, {useState, useEffect} from "react";
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useRouter} from "expo-router";

export default function DebugScreen() {
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // Collect debug information
    const info = {
      // Environment variables
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
      NODE_ENV: process.env.NODE_ENV,
      EXPO_PUBLIC_DEBUG: process.env.EXPO_PUBLIC_DEBUG,
      EXPO_PUBLIC_EAS_BUILD: process.env.EXPO_PUBLIC_EAS_BUILD,

      // App info
      timestamp: new Date().toISOString(),
      platform: "mobile",

      // API test
      apiTest: "Testing...",
    };

    setDebugInfo(info);

    // Test API connection
    testApiConnection();
  }, []);

  const testApiConnection = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api"}/health/`
      );
      setDebugInfo((prev) => ({
        ...prev,
        apiTest: response.ok ? "Connected ✅" : `Error: ${response.status}`,
      }));
    } catch (error) {
      setDebugInfo((prev) => ({
        ...prev,
        apiTest: `Failed: ${error.message}`,
      }));
    }
  };

  const copyDebugInfo = () => {
    const infoString = JSON.stringify(debugInfo, null, 2);
    Alert.alert("Debug Info", infoString);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Debug Information</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environment Variables</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>API URL:</Text>
            <Text style={styles.value}>{debugInfo.EXPO_PUBLIC_API_URL || "Not set"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Node ENV:</Text>
            <Text style={styles.value}>{debugInfo.NODE_ENV || "Not set"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Debug Mode:</Text>
            <Text style={styles.value}>{debugInfo.EXPO_PUBLIC_DEBUG || "Not set"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>EAS Build:</Text>
            <Text style={styles.value}>{debugInfo.EXPO_PUBLIC_EAS_BUILD || "Not set"}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Connection</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Status:</Text>
            <Text
              style={[
                styles.value,
                debugInfo.apiTest?.includes("✅") ? styles.success : styles.error,
              ]}>
              {debugInfo.apiTest || "Testing..."}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Timestamp:</Text>
            <Text style={styles.value}>{debugInfo.timestamp}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Platform:</Text>
            <Text style={styles.value}>{debugInfo.platform}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.copyButton} onPress={copyDebugInfo}>
          <Text style={styles.copyButtonText}>Copy Debug Info</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: "#6b7280",
    flex: 2,
    textAlign: "right",
  },
  success: {
    color: "#10b981",
  },
  error: {
    color: "#ef4444",
  },
  copyButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  copyButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
