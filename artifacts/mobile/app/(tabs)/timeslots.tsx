import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useListTimeslots,
  useCreateTimeslot,
  useUpdateTimeslotStatus,
  useDeleteTimeslot,
  useListUsers,
  useListServices,
} from "@workspace/api-client-react";
import type {
  Timeslot,
  ListTimeslotsParams,
  User,
  Service,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { TimeslotCard } from "@/components/TimeslotCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";

type StatusFilter = "all" | "scheduled" | "done" | "cancelled";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "scheduled", label: "Scheduled" },
  { key: "done", label: "Done" },
  { key: "cancelled", label: "Cancelled" },
];

function PickerModal<T extends { id: number; label: string }>({
  visible,
  title,
  items,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  items: T[];
  onSelect: (item: T) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View
          style={[styles.pickerSheet, { backgroundColor: colors.card }]}
        >
          <View style={styles.pickerHeader}>
            <Text style={[styles.pickerTitle, { color: colors.foreground }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  { borderBottomColor: colors.border },
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={[styles.pickerItemText, { color: colors.foreground }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

function CreateTimeslotModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const colors = useColors();
  const createMutation = useCreateTimeslot();

  const { data: professionals } = useListUsers({ role: "professional" });
  const { data: clients } = useListUsers({ role: "client" });
  const { data: services } = useListServices();

  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedService, setSelectedService] = useState<{
    id: number;
    label: string;
  } | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<{
    id: number;
    label: string;
  } | null>(null);
  const [selectedClient, setSelectedClient] = useState<{
    id: number;
    label: string;
  } | null>(null);
  const [notes, setNotes] = useState("");
  const [activePicker, setActivePicker] = useState<
    "service" | "professional" | "client" | null
  >(null);

  const parseDateTime = (date: string, time: string): string => {
    const [year, month, day] = date.split("-").map((s) => s.trim());
    const [hour, minute] = time.split(":").map((s) => s.trim());
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    ).toISOString();
  };

  const handleCreate = async () => {
    if (
      !startDate ||
      !startTime ||
      !endTime ||
      !selectedService ||
      !selectedProfessional ||
      !selectedClient
    ) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    try {
      const startISO = parseDateTime(startDate, startTime);
      const endISO = parseDateTime(startDate, endTime);
      await createMutation.mutateAsync({
        startTime: startISO,
        endTime: endISO,
        serviceId: selectedService.id,
        professionalId: selectedProfessional.id,
        clientId: selectedClient.id,
        notes: notes || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
      onClose();
      setStartDate("");
      setStartTime("");
      setEndTime("");
      setSelectedService(null);
      setSelectedProfessional(null);
      setSelectedClient(null);
      setNotes("");
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to create appointment.");
    }
  };

  const serviceItems =
    services?.map((s) => ({
      id: s.id,
      label: `${s.name} (${s.durationMinutes} min)`,
    })) ?? [];
  const proItems =
    professionals?.map((u) => ({ id: u.id, label: u.name })) ?? [];
  const clientItems = clients?.map((u) => ({ id: u.id, label: u.name })) ?? [];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View
          style={[styles.formSheet, { backgroundColor: colors.card }]}
        >
          <View style={styles.formHeader}>
            <Text style={[styles.formTitle, { color: colors.foreground }]}>
              New Appointment
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.formBody}>
              <FormField label="Date (YYYY-MM-DD)">
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: colors.foreground,
                      borderColor: colors.border,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                  placeholder="2026-01-15"
                  placeholderTextColor={colors.mutedForeground}
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </FormField>

              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <FormField label="Start Time">
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          color: colors.foreground,
                          borderColor: colors.border,
                          backgroundColor: colors.inputBackground,
                        },
                      ]}
                      placeholder="09:00"
                      placeholderTextColor={colors.mutedForeground}
                      value={startTime}
                      onChangeText={setStartTime}
                    />
                  </FormField>
                </View>
                <View style={styles.timeField}>
                  <FormField label="End Time">
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          color: colors.foreground,
                          borderColor: colors.border,
                          backgroundColor: colors.inputBackground,
                        },
                      ]}
                      placeholder="10:00"
                      placeholderTextColor={colors.mutedForeground}
                      value={endTime}
                      onChangeText={setEndTime}
                    />
                  </FormField>
                </View>
              </View>

              <FormField label="Service">
                <TouchableOpacity
                  style={[
                    styles.pickerBtn,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                  onPress={() => setActivePicker("service")}
                >
                  <Text
                    style={{
                      color: selectedService
                        ? colors.foreground
                        : colors.mutedForeground,
                      fontSize: 15,
                    }}
                  >
                    {selectedService?.label ?? "Select service…"}
                  </Text>
                  <Feather
                    name="chevron-down"
                    size={16}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </FormField>

              <FormField label="Professional">
                <TouchableOpacity
                  style={[
                    styles.pickerBtn,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                  onPress={() => setActivePicker("professional")}
                >
                  <Text
                    style={{
                      color: selectedProfessional
                        ? colors.foreground
                        : colors.mutedForeground,
                      fontSize: 15,
                    }}
                  >
                    {selectedProfessional?.label ?? "Select professional…"}
                  </Text>
                  <Feather
                    name="chevron-down"
                    size={16}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </FormField>

              <FormField label="Client">
                <TouchableOpacity
                  style={[
                    styles.pickerBtn,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                  onPress={() => setActivePicker("client")}
                >
                  <Text
                    style={{
                      color: selectedClient
                        ? colors.foreground
                        : colors.mutedForeground,
                      fontSize: 15,
                    }}
                  >
                    {selectedClient?.label ?? "Select client…"}
                  </Text>
                  <Feather
                    name="chevron-down"
                    size={16}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </FormField>

              <FormField label="Notes (optional)">
                <TextInput
                  style={[
                    styles.textInput,
                    styles.notesInput,
                    {
                      color: colors.foreground,
                      borderColor: colors.border,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                  placeholder="Add any notes…"
                  placeholderTextColor={colors.mutedForeground}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                />
              </FormField>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreate}
                disabled={createMutation.isPending}
              >
                <Text style={styles.submitText}>
                  {createMutation.isPending ? "Creating…" : "Create Appointment"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      <PickerModal
        visible={activePicker === "service"}
        title="Select Service"
        items={serviceItems}
        onSelect={setSelectedService}
        onClose={() => setActivePicker(null)}
      />
      <PickerModal
        visible={activePicker === "professional"}
        title="Select Professional"
        items={proItems}
        onSelect={setSelectedProfessional}
        onClose={() => setActivePicker(null)}
      />
      <PickerModal
        visible={activePicker === "client"}
        title="Select Client"
        items={clientItems}
        onSelect={setSelectedClient}
        onClose={() => setActivePicker(null)}
      />
    </Modal>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.formField}>
      <Text style={[styles.formLabel, { color: colors.foreground }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

export default function TimeslotsScreen() {
  const { user } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const queryParams: ListTimeslotsParams = {};
  if (statusFilter !== "all")
    queryParams.status = statusFilter as "scheduled" | "done" | "cancelled";

  const { data: slots, isLoading, refetch, isRefetching } = useListTimeslots(queryParams);

  const updateStatusMutation = useUpdateTimeslotStatus();
  const deleteMutation = useDeleteTimeslot();

  const handleStatusChange = async (
    id: number,
    status: "scheduled" | "done" | "cancelled"
  ) => {
    try {
      await updateStatusMutation.mutateAsync({ id, data: { status } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
    } catch (e: unknown) {
      Alert.alert("Error", "Failed to update status.");
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Appointment",
      "Are you sure you want to delete this appointment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync({ id });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              refetch();
            } catch {
              Alert.alert("Error", "Failed to delete appointment.");
            }
          },
        },
      ]
    );
  };

  const webTopPadding = Platform.OS === "web" ? 67 : 0;
  const webBottomPadding = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.filterBar,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: webTopPadding,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                statusFilter === f.key && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
                statusFilter !== f.key && {
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setStatusFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      statusFilter === f.key
                        ? "#ffffff"
                        : colors.mutedForeground,
                  },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <LoadingState message="Loading appointments…" />
      ) : (
        <FlatList
          data={slots ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.list,
            {
              paddingBottom: insets.bottom + webBottomPadding + 80,
            },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.secondary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="calendar"
              title="No appointments found"
              subtitle="Try a different status filter"
            />
          }
          renderItem={({ item }) => (
            <TimeslotCard
              slot={item}
              role={user?.role}
              onStatusChange={
                user?.role === "professional" || user?.role === "admin"
                  ? (status) => handleStatusChange(item.id, status)
                  : undefined
              }
              onDelete={
                user?.role === "admin"
                  ? () => handleDelete(item.id)
                  : undefined
              }
            />
          )}
          scrollEnabled={!!(slots && slots.length > 0)}
        />
      )}

      {user?.role === "admin" && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => setCreateModalVisible(true)}
        >
          <Feather name="plus" size={26} color="#ffffff" />
        </TouchableOpacity>
      )}

      <CreateTimeslotModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={() => refetch()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  filterBar: {
    borderBottomWidth: 1,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    paddingBottom: 32,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#dce6f0",
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
  },
  pickerItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  pickerItemText: {
    fontSize: 15,
  },
  formSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#dce6f0",
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  formBody: {
    padding: 20,
    gap: 14,
  },
  formField: {
    gap: 6,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  textInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeField: {
    flex: 1,
  },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700" as const,
  },
});
