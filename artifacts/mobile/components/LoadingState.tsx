import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  message?: string;
}

export function LoadingState({ message }: Props) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.secondary} />
      {message ? (
        <Text style={[styles.text, { color: colors.mutedForeground }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  text: {
    fontSize: 14,
  },
});
