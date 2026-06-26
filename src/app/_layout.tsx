import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import "react-native-reanimated";
import { theme } from "../config/constants/theme";
import { useAuthStore } from "../store/slices/authStore";
import { useGoalStore } from "../store/slices/goalStore";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppNavigator } from "../navigation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OnboardingScreen, { ONBOARDING_KEY } from "../screens/Onboarding/OnboardingScreen";

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
  const { hasOnboarded } = useGoalStore();
  const segments = useSegments();
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    checkToken();
  }, []);

  // Check onboarding flag after auth initialized
  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      setOnboardingChecked(true);
      return;
    }
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      if (!val && !hasOnboarded) {
        setShowOnboarding(true);
      }
      setOnboardingChecked(true);
    });
  }, [isInitialized, isAuthenticated, hasOnboarded]);

  useEffect(() => {
    if (!isInitialized || !onboardingChecked) return;
    if (showOnboarding) return; // Don't redirect during onboarding

    const inAuthGroup = (segments as any)[0] === "auth";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/auth" as any);
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)" as any);
    }
  }, [isAuthenticated, isInitialized, segments, showOnboarding, onboardingChecked]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Show onboarding overlay for new authenticated users
  if (isAuthenticated && showOnboarding && isInitialized) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
        <StatusBar style="light" />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={CustomDarkTheme}>
        <AppNavigator />
        <StatusBar style="light" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
