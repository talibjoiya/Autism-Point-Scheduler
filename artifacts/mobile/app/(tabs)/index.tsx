import React from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { Redirect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useGetStatsOverview,
  useListTimeslots,
} from "@workspace/api-client-react";
import type { Timeslot } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { TimeslotCard } from "@/components/TimeslotCard";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";

interface StatCardProps {
  label: string;
  value: number;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  bg: string;
}

function StatCard({ label, value, icon, color, bg }: StatCardProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  if (!user) return null;
  if (user.role !== "admin") return <Redirect href="/(tabs)/timeslots" />;

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useGetStatsOverview();

  const {
    data: slots,
    isLoading: slotsLoading,
    refetch: refetchSlots,
  } = useListTimeslots({ status: "scheduled" });

  const isLoading = statsLoading || slotsLoading;
  const isRefreshing = false;

  const onRefresh = () => {
    refetchStats();
    refetchSlots();
  };

  const topSlots = slots?.slice(0, 5) ?? [];

  const webTopPadding = Platform.OS === "web" ? 67 : 0;
  const webBottomPadding = Platform.OS === "web" ? 34 : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: webTopPadding + 16,
          paddingBottom: insets.bottom + webBottomPadding + 24,
        },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.secondary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Overview
      </Text>

      {statsLoading ? (
        <View style={styles.statsGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.statCard,
                styles.skeleton,
                { backgroundColor: colors.muted },
              ]}
            />
          ))}
        </View>
      ) : stats ? (
        <View style={styles.statsGrid}>
          <StatCard
            label="Scheduled"
            value={stats.totalScheduled}
            icon="calendar"
            color="#1d4ed8"
            bg="#dbeafe"
          />
          <StatCard
            label="Done"
            value={stats.totalDone}
            icon="check-circle"
            color="#15803d"
            bg="#dcfce7"
          />
          <StatCard
            label="Cancelled"
            value={stats.totalCancelled}
            icon="x-circle"
            color="#dc2626"
            bg="#fee2e2"
          />
          <StatCard
            label="Today"
            value={stats.upcomingToday}
            icon="clock"
            color="#b45309"
            bg="#fef3c7"
          />
        </View>
      ) : null}

      <View style={styles.summaryRow}>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="users" size={16} color={colors.secondary} />
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>
            {stats?.totalClients ?? "—"}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
            Clients
          </Text>
        </View>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="user-check" size={16} color={colors.secondary} />
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>
            {stats?.totalProfessionals ?? "—"}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
            Professionals
          </Text>
        </View>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="briefcase" size={16} color={colors.secondary} />
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>
            {stats?.totalServices ?? "—"}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
            Services
          </Text>
        </View>
      </View>

      <Text
        style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}
      >
        Upcoming Appointments
      </Text>

      {slotsLoading ? (
        <LoadingState />
      ) : topSlots.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No upcoming appointments"
          subtitle="All clear for today"
        />
      ) : (
        topSlots.map((slot) => (
          <TimeslotCard key={slot.id} slot={slot} role="admin" />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  skeleton: {
    height: 100,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800" as const,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "500" as const,
  },
});
