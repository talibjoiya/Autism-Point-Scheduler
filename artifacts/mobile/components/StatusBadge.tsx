import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Status = "scheduled" | "done" | "cancelled";

interface Props {
  status: Status;
  size?: "sm" | "md";
}

const config: Record<Status, { bg: string; text: string; label: string }> = {
  scheduled: { bg: "#dbeafe", text: "#1d4ed8", label: "Scheduled" },
  done: { bg: "#dcfce7", text: "#15803d", label: "Done" },
  cancelled: { bg: "#fee2e2", text: "#dc2626", label: "Cancelled" },
};

export function StatusBadge({ status, size = "md" }: Props) {
  const c = config[status] ?? config.scheduled;
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.bg },
        size === "sm" && styles.small,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: c.text },
          size === "sm" && styles.smallText,
        ]}
      >
        {c.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  smallText: {
    fontSize: 11,
  },
});
