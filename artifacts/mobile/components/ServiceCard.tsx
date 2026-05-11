import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { Service } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

interface Props {
  service: Service;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ServiceCard({ service, onEdit, onDelete }: Props) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: colors.accent }]}>
          <Feather name="briefcase" size={20} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {service.name}
          </Text>
          {service.description ? (
            <Text
              style={[styles.desc, { color: colors.mutedForeground }]}
              numberOfLines={2}
            >
              {service.description}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            <View style={styles.meta}>
              <Feather name="clock" size={12} color={colors.secondary} />
              <Text style={[styles.metaText, { color: colors.secondary }]}>
                {service.durationMinutes} min
              </Text>
            </View>
            {service.price != null ? (
              <View style={styles.meta}>
                <Feather name="tag" size={12} color={colors.secondary} />
                <Text style={[styles.metaText, { color: colors.secondary }]}>
                  PKR {Number(service.price).toLocaleString("en-PK")}
                </Text>
              </View>
            ) : null}
          </View>
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
    padding: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: "700" as const,
  },
  desc: {
    fontSize: 13,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 2,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "600" as const,
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
