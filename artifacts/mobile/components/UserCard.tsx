import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { User } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

const roleBadge: Record<string, { bg: string; text: string }> = {
  admin: { bg: "#ede9fe", text: "#6d28d9" },
  professional: { bg: "#dbeafe", text: "#1d4ed8" },
  client: { bg: "#dcfce7", text: "#15803d" },
};

interface Props {
  user: User;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function UserCard({ user, onEdit, onDelete }: Props) {
  const colors = useColors();
  const badge = roleBadge[user.role] ?? { bg: "#f0f4f8", text: "#697586" };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.foreground }]}>
              {user.name}
            </Text>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.text }]}>
                {user.role}
              </Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Feather name="mail" size={12} color={colors.mutedForeground} />
            <Text style={[styles.detail, { color: colors.mutedForeground }]}>
              {user.email}
            </Text>
          </View>
          {user.phone ? (
            <View style={styles.detailRow}>
              <Feather name="phone" size={12} color={colors.mutedForeground} />
              <Text style={[styles.detail, { color: colors.mutedForeground }]}>
                {user.phone}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              style={[styles.iconBtn, { backgroundColor: colors.muted }]}
            >
              <Feather name="edit-2" size={15} color={colors.primary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              style={[styles.iconBtn, { backgroundColor: "#fee2e2" }]}
            >
              <Feather name="trash-2" size={15} color="#dc2626" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  name: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detail: {
    fontSize: 12,
  },
  actions: {
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
