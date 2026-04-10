import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import "react-native-reanimated";
import { theme } from "../config/constants/theme";
import { useAuthStore } from "../store/slices/authStore";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppNavigator } from "../navigation";

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.background,
    card: theme.colors.card,
    text: theme.colors.text,
    border: theme.colors.border,
    primary: theme.colors.primary,
  },
};

export default function RootLayout() {
  const { isAuthenticated, isInitialized, checkToken } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkToken();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = (segments as any)[0] === "auth";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/auth" as any);
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)" as any);
    }
  }, [isAuthenticated, isInitialized, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={CustomDarkTheme}>
        <AppNavigator />
        <StatusBar style="light" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
