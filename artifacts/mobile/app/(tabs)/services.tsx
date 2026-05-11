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
  useListServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from "@workspace/api-client-react";
import type { Service, CreateServiceRequest } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { ServiceCard } from "@/components/ServiceCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";

interface FormData {
  name: string;
  description: string;
  durationMinutes: string;
  price: string;
}

function ServiceFormModal({
  visible,
  editService,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  editService: Service | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const colors = useColors();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const isEdit = editService !== null;

  const [form, setForm] = useState<FormData>({
    name: editService?.name ?? "",
    description: editService?.description ?? "",
    durationMinutes: editService ? String(editService.durationMinutes) : "",
    price: editService?.price != null ? String(editService.price) : "",
  });

  React.useEffect(() => {
    if (visible) {
      setForm({
        name: editService?.name ?? "",
        description: editService?.description ?? "",
        durationMinutes: editService ? String(editService.durationMinutes) : "",
        price: editService?.price != null ? String(editService.price) : "",
      });
    }
  }, [visible, editService]);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.durationMinutes.trim()) {
      Alert.alert("Missing Fields", "Name and duration are required.");
      return;
    }
    const duration = parseInt(form.durationMinutes, 10);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert("Invalid Duration", "Duration must be a positive number.");
      return;
    }
    const price = form.price.trim() ? parseFloat(form.price) : undefined;

    const body: CreateServiceRequest = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      durationMinutes: duration,
      price,
    };

    try {
      if (isEdit && editService) {
        await updateMutation.mutateAsync({ id: editService.id, data: body });
      } else {
        await createMutation.mutateAsync({ data: body });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
      onClose();
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Operation failed.");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.formSheet, { backgroundColor: colors.card }]}>
          <View style={styles.formHeader}>
            <Text style={[styles.formTitle, { color: colors.foreground }]}>
              {isEdit ? "Edit Service" : "New Service"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.formBody}>
              <View style={styles.formField}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  Service Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.foreground,
                      borderColor: colors.border,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                  placeholder="e.g. Therapy Session"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  Description (optional)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textarea,
                    {
                      color: colors.foreground,
                      borderColor: colors.border,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                  placeholder="Brief description of the service…"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.description}
                  onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.formField, styles.flex1]}>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    Duration (minutes)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.foreground,
                        borderColor: colors.border,
                        backgroundColor: colors.inputBackground,
                      },
                    ]}
                    placeholder="60"
                    placeholderTextColor={colors.mutedForeground}
                    value={form.durationMinutes}
                    onChangeText={(v) =>
                      setForm((f) => ({ ...f, durationMinutes: v }))
                    }
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[styles.formField, styles.flex1]}>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    Price PKR (optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.foreground,
                        borderColor: colors.border,
                        backgroundColor: colors.inputBackground,
                      },
                    ]}
                    placeholder="2500"
                    placeholderTextColor={colors.mutedForeground}
                    value={form.price}
                    onChangeText={(v) => setForm((f) => ({ ...f, price: v }))}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: colors.primary },
                  isPending && { opacity: 0.7 },
                ]}
                onPress={handleSubmit}
                disabled={isPending}
              >
                <Text style={styles.submitText}>
                  {isPending
                    ? isEdit
                      ? "Saving…"
                      : "Creating…"
                    : isEdit
                    ? "Save Changes"
                    : "Create Service"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function ServicesScreen() {
  const { user } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);

  if (user?.role !== "admin") return null;

  const { data: services, isLoading, refetch, isRefetching } = useListServices();
  const deleteMutation = useDeleteService();

  const handleDelete = (s: Service) => {
    Alert.alert("Delete Service", `Delete "${s.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync({ id: s.id });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            refetch();
          } catch {
            Alert.alert("Error", "Failed to delete service.");
          }
        },
      },
    ]);
  };

  const webTopPadding = Platform.OS === "web" ? 67 : 0;
  const webBottomPadding = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <LoadingState message="Loading services…" />
      ) : (
        <FlatList
          data={services ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.list,
            {
              paddingTop: webTopPadding + 12,
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
              icon="briefcase"
              title="No services yet"
              subtitle="Tap + to add your first service"
            />
          }
          renderItem={({ item }) => (
            <ServiceCard
              service={item}
              onEdit={() => {
                setEditService(item);
                setModalVisible(true);
              }}
              onDelete={() => handleDelete(item)}
            />
          )}
          scrollEnabled={!!(services && services.length > 0)}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.secondary }]}
        onPress={() => {
          setEditService(null);
          setModalVisible(true);
        }}
      >
        <Feather name="plus" size={26} color="#ffffff" />
      </TouchableOpacity>

      <ServiceFormModal
        visible={modalVisible}
        editService={editService}
        onClose={() => {
          setModalVisible(false);
          setEditService(null);
        }}
        onSuccess={() => refetch()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: {
    paddingHorizontal: 16,
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
  formSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
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
  label: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  rowFields: {
    flexDirection: "row",
    gap: 12,
  },
  flex1: { flex: 1 },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  submitText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700" as const,
  },
});
