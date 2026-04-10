import { useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, Pressable, View } from "react-native";
import { ScreenWrapper } from "../../components/common/ScreenWrapper";
import { theme } from "../../config/constants/theme";
import { useAuthStore } from "../../store/slices/authStore";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, isLoading, error } = useAuthStore();
  const router = useRouter();

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ name, email, password });
      }
      // router.replace('/(tabs)'); // Root layout will handle navigation if we react to isAuthenticated
    } catch (err: any) {
      Alert.alert("Auth Error", err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>{isLogin ? "Welcome Back" : "Join Dotivo"}</Text>
        <Text style={styles.subtitle}>
          {isLogin ? "Sign in to track your wins today" : "Create an account to start your grid"}
        </Text>

        {!isLogin && (
          <TextInput
            placeholder="Full Name"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            value={name}
            onChangeText={setName}
            onChange={(e) => setName(e.nativeEvent.text)}
            autoCapitalize="words"
          />
        )}

        <TextInput
          placeholder="Email address"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          onChange={(e) => setEmail(e.nativeEvent.text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            onChange={(e) => setPassword(e.nativeEvent.text)}
            secureTextEntry={!showPassword}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            {showPassword ? (
              <EyeOff size={20} color={theme.colors.textMuted} />
            ) : (
              <Eye size={20} color={theme.colors.textMuted} />
            )}
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [styles.button, { opacity: pressed ? 0.7 : 1 }]}
          onPress={handleAuth}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isLogin ? "Login" : "Create Account"}</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => setIsLogin(!isLogin)}
          style={({ pressed }) => [styles.switchButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </Text>
        </Pressable>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing.l,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textMuted,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: theme.spacing.m,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.m,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.m,
  },
  passwordInput: {
    flex: 1,
    padding: theme.spacing.m,
    color: theme.colors.text,
  },
  eyeIcon: {
    padding: theme.spacing.m,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.m,
    padding: theme.spacing.m,
    alignItems: "center",
    marginTop: theme.spacing.m,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  switchButton: {
    marginTop: theme.spacing.l,
    alignItems: "center",
  },
  switchText: {
    color: theme.colors.primary,
    fontSize: 14,
  },
});
