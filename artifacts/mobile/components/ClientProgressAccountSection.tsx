import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useGetClientProgress } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { LoadingState } from "./LoadingState";

function scoreColor(score: number, colors: ReturnType<typeof useColors>) {
  if (score >= 75) return colors.success;
  if (score >= 45) return colors.warning;
  return colors.secondary;
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  );
}

export function ClientProgressAccountSection({ client }: { client: User }) {
  const colors = useColors();
  const { data, isLoading } = useGetClientProgress(client.id);
  const overall = data?.overallProgress ?? 0;
  const overallColor = scoreColor(overall, colors);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <View style={[styles.headingIcon, { backgroundColor: colors.accent }]}>
          <Feather name="activity" size={16} color={colors.primary} />
        </View>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My progress</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
            Your current progress across tracked areas
          </Text>
        </View>
      </View>

      <View style={[styles.overallCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.overallTop}>
          <View>
            <Text style={[styles.overallLabel, { color: colors.mutedForeground }]}>OVERALL PROGRESS</Text>
            <Text style={[styles.overallHint, { color: colors.mutedForeground }]}>
              Average of {data?.items.length ?? 0} tracked {data?.items.length === 1 ? "area" : "areas"}
            </Text>
          </View>
          <Text style={[styles.overallScore, { color: overallColor }]}>{overall}<Text style={styles.scoreSuffix}>/100</Text></Text>
        </View>
        <ProgressBar value={overall} color={overallColor} />
      </View>

      {isLoading ? (
        <View style={styles.loading}><LoadingState message="Loading progress…" /></View>
      ) : data?.items.length ? (
        <View style={styles.items}>
          {data.items.map((item) => {
            const color = scoreColor(item.progress, colors);
            return (
              <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.itemTop}>
                  <Text style={[styles.itemName, { color: colors.foreground }]}>{item.itemName}</Text>
                  <Text style={[styles.itemScore, { color }]}>{item.progress}%</Text>
                </View>
                <ProgressBar value={item.progress} color={color} />
                {item.notes ? <Text style={[styles.notes, { color: colors.mutedForeground }]}>{item.notes}</Text> : null}
              </View>
            );
          })}
        </View>
      ) : (
        <View style={[styles.empty, { borderColor: colors.border }]}>
          <Feather name="target" size={20} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No progress areas yet.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 10 },
  headingIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "700" as const },
  sectionSubtitle: { fontSize: 12, marginTop: 2 },
  overallCard: { borderWidth: 1, borderRadius: 16, padding: 15, gap: 10 },
  overallTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  overallLabel: { fontSize: 11, letterSpacing: 0.8, fontWeight: "700" as const },
  overallHint: { fontSize: 12, marginTop: 3 },
  overallScore: { fontSize: 26, fontWeight: "700" as const },
  scoreSuffix: { fontSize: 13, fontWeight: "500" as const },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: "#e5edf2", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  items: { gap: 9 },
  itemCard: { borderWidth: 1, borderRadius: 13, padding: 13, gap: 9 },
  itemTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  itemName: { flex: 1, fontSize: 15, fontWeight: "600" as const },
  itemScore: { fontSize: 14, fontWeight: "700" as const },
  notes: { fontSize: 12, lineHeight: 17 },
  empty: { minHeight: 78, borderWidth: 1, borderStyle: "dashed", borderRadius: 13, alignItems: "center", justifyContent: "center", gap: 7 },
  emptyText: { fontSize: 13 },
  loading: { height: 110 },
});