import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useGetClientProgress } from "@workspace/api-client-react";
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
  onProgress?: () => void;
}

function ClientProgressSummary({ user, onPress }: { user: User; onPress?: () => void }) {
  const colors = useColors();
  const { data, isLoading } = useGetClientProgress(user.id);
  const score = data?.overallProgress ?? 0;
  const scoreColor = score >= 75 ? colors.success : score >= 45 ? colors.warning : colors.secondary;

  return (
    <View style={[styles.progressSection, { borderTopColor: colors.border }]}>
      <View style={styles.progressHeader}>
        <View style={styles.progressLabel}>
          <Feather name="activity" size={13} color={colors.secondary} />
          <Text style={[styles.progressTitle, { color: colors.foreground }]}>Overall progress</Text>
        </View>
        <Text style={[styles.progressScore, { color: scoreColor }]}>
          {isLoading ? "…" : `${score}%`}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${isLoading ? 0 : score}%`, backgroundColor: scoreColor }]} />
      </View>
      <View style={styles.progressFooter}>
        <Text style={[styles.progressMeta, { color: colors.mutedForeground }]}>
          {data?.items.length ?? 0} tracked {data?.items.length === 1 ? "area" : "areas"}
        </Text>
        {onPress ? (
          <TouchableOpacity onPress={onPress} style={styles.progressButton} accessibilityLabel={`View ${user.name}'s progress`}>
            <Text style={[styles.progressButtonText, { color: colors.primary }]}>View details</Text>
            <Feather name="chevron-right" size={14} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export function UserCard({ user, onEdit, onDelete, onProgress }: Props) {
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
          {user.role === "client" ? <ClientProgressSummary user={user} onPress={onProgress} /> : null}
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
  progressSection: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 8,
    gap: 6,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  progressScore: {
    fontSize: 13,
    fontWeight: "700" as const,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e5edf2",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressMeta: {
    fontSize: 11,
  },
  progressButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 2,
  },
  progressButtonText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
