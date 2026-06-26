import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState, useRef } from "react";
import "react-native-reanimated";
import { AppState, Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
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
  const { isAuthenticated, isInitialized, isGuest, checkToken } = useAuthStore();
  const { hasOnboarded, hasHydrated, syncWithBackend } = useGoalStore();
  const segments = useSegments();
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    checkToken();
  }, []);

  // --- Sync Engine Triggers ---
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;

    // Trigger sync on initial mount/auth
    syncWithBackend();

    // Trigger sync when app comes to foreground
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        syncWithBackend();
      }
      appState.current = nextAppState;
    });

    // Trigger sync when network is restored
    const netInfoSub = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable !== false) {
        syncWithBackend();
      }
    });

    return () => {
      subscription.remove();
      netInfoSub();
    };
  }, [hasHydrated, isAuthenticated]);

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
    const hasAccess = isAuthenticated || isGuest;

    if (!hasAccess && !inAuthGroup) {
      router.replace("/auth" as any);
    } else if (hasAccess && inAuthGroup) {
      router.replace("/(tabs)" as any);
    }
  }, [isAuthenticated, isGuest, isInitialized, segments, showOnboarding, onboardingChecked]);

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

  // Wait until auth state and onboarding state are checked
  if (!isInitialized || !onboardingChecked) {
    return null;
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
