import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const roleBadge: Record<string, { bg: string; text: string }> = {
  admin: { bg: "#ede9fe", text: "#6d28d9" },
  professional: { bg: "#dbeafe", text: "#1d4ed8" },
  client: { bg: "#dcfce7", text: "#15803d" },
};

interface InfoRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.infoRow,
        { borderBottomColor: colors.border, backgroundColor: colors.card },
      ]}
    >
      <View style={[styles.infoIcon, { backgroundColor: colors.accent }]}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
        <Text style={[styles.infoValue, { color: colors.foreground }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  if (!user) return null;

  const badge = roleBadge[user.role] ?? { bg: "#f0f4f8", text: "#697586" };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
        },
      },
    ]);
  };

  const joinDate = new Date(user.createdAt).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Karachi",
  });

  const webTopPadding = Platform.OS === "web" ? 67 : 0;
  const webBottomPadding = Platform.OS === "web" ? 34 : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: webTopPadding + 24,
          paddingBottom: insets.bottom + webBottomPadding + 32,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.heroName}>{user.name}</Text>
        <View style={[styles.rolePill, { backgroundColor: badge.bg }]}>
          <Text style={[styles.rolePillText, { color: badge.text }]}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Text>
        </View>
      </LinearGradient>

      <View
        style={[
          styles.infoSection,
          {
            borderColor: colors.border,
            borderRadius: colors.radius,
            overflow: "hidden",
          },
        ]}
      >
        <InfoRow icon="mail" label="Email" value={user.email} />
        <InfoRow
          icon="phone"
          label="Phone"
          value={user.phone ?? "Not provided"}
        />
        <InfoRow icon="calendar" label="Member since" value={joinDate} />
        <InfoRow icon="hash" label="User ID" value={`#${user.id}`} />
      </View>

      <TouchableOpacity
        style={[styles.logoutBtn, { backgroundColor: "#fee2e2" }]}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Feather name="log-out" size={18} color="#dc2626" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
        Autism Point v1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  heroCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    marginBottom: 4,
  },
  avatarLargeText: {
    fontSize: 34,
    fontWeight: "700" as const,
    color: "#ffffff",
  },
  heroName: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#ffffff",
  },
  rolePill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  rolePillText: {
    fontSize: 13,
    fontWeight: "700" as const,
  },
  infoSection: {
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500" as const,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#dc2626",
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
  },
});
