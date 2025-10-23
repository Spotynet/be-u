import React from "react";
import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from "react-native";
import {Ionicons} from "@expo/vector-icons";

interface FallbackErrorScreenProps {
  error?: Error;
  onRetry?: () => void;
}

export function FallbackErrorScreen({error, onRetry}: FallbackErrorScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={64} color="#ef4444" />
        <Text style={styles.title}>App Error</Text>
        <Text style={styles.message}>
          The app encountered an error. This is likely due to a configuration issue with environment
          variables or API connection.
        </Text>

        {error && (
          <ScrollView style={styles.errorDetails}>
            <Text style={styles.errorTitle}>Error Details:</Text>
            <Text style={styles.errorText}>{error.toString()}</Text>

            <Text style={styles.errorTitle}>Environment Info:</Text>
            <Text style={styles.errorText}>
              API URL: {process.env.EXPO_PUBLIC_API_URL || "Not set"}
            </Text>
            <Text style={styles.errorText}>Node ENV: {process.env.NODE_ENV || "Not set"}</Text>
            <Text style={styles.errorText}>
              EAS Build: {process.env.EXPO_PUBLIC_EAS_BUILD || "Not set"}
            </Text>
            <Text style={styles.errorText}>
              Debug Mode: {process.env.EXPO_PUBLIC_DEBUG || "Not set"}
            </Text>
          </ScrollView>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => {
              // Navigate to debug screen if possible
              console.log("Navigate to debug screen");
            }}>
            <Text style={styles.debugButtonText}>Debug Info</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorContainer: {
    alignItems: "center",
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  errorDetails: {
    maxHeight: 300,
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: "100%",
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#dc2626",
    marginTop: 8,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#dc2626",
    fontFamily: "monospace",
    lineHeight: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  debugButton: {
    backgroundColor: "#6b7280",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  debugButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
