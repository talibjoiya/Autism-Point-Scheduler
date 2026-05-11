import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await login(email.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg =
        e instanceof Error ? e.message : "Invalid credentials. Please try again.";
      setError(msg.includes("401") || msg.includes("Invalid") ? "Invalid email or password." : msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <View style={styles.logoCircle}>
              <Feather name="calendar" size={32} color="#ffffff" />
            </View>
            <Text style={styles.appName}>Autism Point</Text>
            <Text style={styles.tagline}>Appointment Scheduler</Text>
          </View>

          <View style={styles.card}>
            <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
              Welcome back
            </Text>
            <Text style={[styles.welcomeSub, { color: colors.mutedForeground }]}>
              Sign in to your account
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color="#dc2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Email
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.inputBackground,
                  },
                ]}
              >
                <Feather
                  name="mail"
                  size={16}
                  color={colors.mutedForeground}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Password
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.inputBackground,
                  },
                ]}
              >
                <Feather
                  name="lock"
                  size={16}
                  color={colors.mutedForeground}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={16}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.loginBtn,
                isLoading && styles.loginBtnDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtnGradient}
              >
                {isLoading ? (
                  <Text style={styles.loginBtnText}>Signing in…</Text>
                ) : (
                  <View style={styles.loginBtnInner}>
                    <Text style={styles.loginBtnText}>Sign In</Text>
                    <Feather name="arrow-right" size={18} color="#ffffff" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            Autism Point — Scheduling Management System
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    alignItems: "center",
    marginBottom: 32,
    gap: 8,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    marginBottom: 4,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    gap: 16,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
  },
  welcomeSub: {
    fontSize: 14,
    marginTop: -8,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    fontSize: 13,
    color: "#dc2626",
    flex: 1,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  eyeBtn: {
    padding: 4,
  },
  loginBtn: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnGradient: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  loginBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loginBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  footer: {
    marginTop: 28,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
});
