import { useRouter } from 'expo-router';
import { OpenEyeIcon as Eye, CloseEyeIcon as EyeOff } from '../../svg';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, StyleSheet, Text, TextInput, Pressable, View, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { theme } from '../../config/constants/theme';
import { useAuthStore } from '../../store/slices/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, continueAsGuest, isLoading, error } = useAuthStore();

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ name, email, password });
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong. Check your connection.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.container}>
          {/* Logo area */}
          <View style={styles.logoArea}>
            <View style={styles.logoBox}>
              <View style={styles.logoGrid}>
                {[1, 1, 0, 1, 0, 1, 1, 0, 1].map((f, i) => (
                  <View
                    key={i}
                    style={[
                      styles.logoDot,
                      f ? styles.logoDotFilled : styles.logoDotEmpty,
                    ]}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.appName}>DOTIVO</Text>
            <Text style={styles.appTagline}>Your momentum, visualized.</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Form Card */}
            <View style={styles.card}>
              <Text style={styles.title}>{isLogin ? 'Welcome back' : 'Create account'}</Text>
              <Text style={styles.subtitle}>
                {isLogin ? 'Sign in to track your wins today.' : 'Start your consistency grid.'}
              </Text>

              {!isLogin && (
                <TextInput
                  placeholder="Full Name"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              )}

              <TextInput
                placeholder="Email address"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.passwordRow}>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  {showPassword ? (
                    <EyeOff size={20} color={theme.colors.textMuted} />
                  ) : (
                    <Eye size={20} color={theme.colors.textMuted} />
                  )}
                </Pressable>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                style={({ pressed }) => [styles.submitBtn, { opacity: pressed || isLoading ? 0.8 : 1 }]}
                onPress={handleAuth}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
                )}
              </Pressable>
            </View>

            {/* Toggle */}
            <Pressable
              onPress={() => setIsLogin(!isLogin)}
              style={({ pressed }) => [styles.switchBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.switchText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.switchTextBold}>{isLogin ? 'Sign up' : 'Sign in'}</Text>
              </Text>
            </Pressable>

            {/* Skip for now */}
            <Pressable
              onPress={continueAsGuest}
              style={({ pressed }) => [styles.skipBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.skipText}>Continue as Guest</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 32,
  },
  logoArea: { alignItems: 'center', marginBottom: 24 },
  logoBox: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
    marginBottom: 14,
  },
  logoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, width: 68 },
  logoDot: { width: 18, height: 18, borderRadius: 4 },
  logoDotFilled: { backgroundColor: theme.colors.primary },
  logoDotEmpty: { backgroundColor: theme.colors.border },
  appName: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: 6,
  },
  appTagline: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 22,
  },
  input: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.radii.m,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
    fontSize: 16,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.radii.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: theme.colors.text,
    fontSize: 16,
  },
  eyeBtn: { padding: 14 },
  errorText: {
    color: theme.colors.error,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.m,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  switchBtn: { alignItems: 'center' },
  switchText: { color: theme.colors.textMuted, fontSize: 14 },
  switchTextBold: { color: theme.colors.primary, fontWeight: '700' },
  skipBtn: { alignItems: 'center', marginTop: 24, paddingVertical: 10 },
  skipText: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
