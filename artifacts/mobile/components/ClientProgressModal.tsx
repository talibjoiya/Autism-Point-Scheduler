import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  getGetClientProgressQueryKey,
  useCreateClientProgress,
  useCreateClientProgressForAll,
  useDeleteClientProgress,
  useGetClientProgress,
  useUpdateClientProgress,
} from "@workspace/api-client-react";
import type { ClientProgress, User } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

function errorMessage(error: unknown) {
  const candidate = error as { data?: { error?: string }; message?: string } | null;
  return candidate?.data?.error ?? candidate?.message ?? "Please try again.";
}

export function ClientProgressModal({
  client,
  visible,
  onClose,
}: {
  client: User | null;
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const clientId = client?.id ?? 0;
  const { data, isLoading } = useGetClientProgress(clientId, {
    query: {
      queryKey: getGetClientProgressQueryKey(clientId),
      enabled: visible && clientId > 0,
    },
  });
  const createMutation = useCreateClientProgress();
  const bulkCreateMutation = useCreateClientProgressForAll();
  const updateMutation = useUpdateClientProgress();
  const deleteMutation = useDeleteClientProgress();
  const [itemName, setItemName] = useState("");
  const [progress, setProgress] = useState("0");
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState<ClientProgress | null>(null);

  if (!client) return null;

  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetClientProgressQueryKey(clientId) });

  const addItem = async () => {
    const score = Number(progress);
    if (!itemName.trim() || !Number.isInteger(score) || score < 0 || score > 100) {
      Alert.alert("Check the item", "Add a name and a whole-number score from 0 to 100.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        id: clientId,
        data: { itemName: itemName.trim(), progress: score, notes: notes.trim() || undefined },
      });
      await refresh();
      setItemName("");
      setProgress("0");
      setNotes("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Could not add progress", errorMessage(error));
    }
  };

  const addItemForAllClients = async () => {
    const score = Number(progress);
    if (!itemName.trim() || !Number.isInteger(score) || score < 0 || score > 100) {
      Alert.alert("Check the item", "Add a name and a whole-number score from 0 to 100.");
      return;
    }
    try {
      const result = await bulkCreateMutation.mutateAsync({
        data: { itemName: itemName.trim(), progress: score, notes: notes.trim() || undefined },
      });
      await refresh();
      setItemName("");
      setProgress("0");
      setNotes("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Added for all clients",
        `${result.created} client${result.created === 1 ? "" : "s"} updated${result.skipped ? `; ${result.skipped} already had this area` : ""}.`,
      );
    } catch (error) {
      Alert.alert("Could not add for all clients", errorMessage(error));
    }
  };

  const saveItem = async () => {
    if (!editing) return;
    const score = Number(progress);
    if (!itemName.trim() || !Number.isInteger(score) || score < 0 || score > 100) {
      Alert.alert("Check the item", "Add a name and a whole-number score from 0 to 100.");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: clientId,
        progressId: editing.id,
        data: { itemName: itemName.trim(), progress: score, notes: notes.trim() || null },
      });
      await refresh();
      setEditing(null);
      setItemName("");
      setProgress("0");
      setNotes("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Could not update progress", errorMessage(error));
    }
  };

  const startEditing = (item: ClientProgress) => {
    setEditing(item);
    setItemName(item.itemName);
    setProgress(String(item.progress));
    setNotes(item.notes ?? "");
  };

  const removeItem = async (item: ClientProgress) => {
    const shouldRemove = Platform.OS === "web"
      ? window.confirm(`Remove ${item.itemName} from ${client.name}'s progress?`)
      : true;
    if (!shouldRemove) return;
    try {
      await deleteMutation.mutateAsync({ id: clientId, progressId: item.id });
      await refresh();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Could not remove progress", errorMessage(error));
    }
  };

  const overall = data?.overallProgress ?? 0;
  const formTitle = editing ? "Edit progress area" : "Add progress area";
  const isSaving = createMutation.isPending || updateMutation.isPending || bulkCreateMutation.isPending;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 12 }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitle}>
              <View style={[styles.headerIcon, { backgroundColor: colors.accent }]}>
                <Feather name="activity" size={18} color={colors.secondary} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.foreground }]}>Client progress</Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{client.name}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close progress">
              <Feather name="x" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.overallCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View>
                <Text style={[styles.overallLabel, { color: colors.mutedForeground }]}>OVERALL PROGRESS</Text>
                <Text style={[styles.overallHint, { color: colors.mutedForeground }]}>
                  Average of {data?.items.length ?? 0} tracked areas
                </Text>
              </View>
              <Text style={[styles.overallScore, { color: scoreColor(overall, colors) }]}>{overall}<Text style={styles.scoreSuffix}>/100</Text></Text>
              <ProgressBar value={overall} color={scoreColor(overall, colors)} />
            </View>

            {isLoading ? (
              <View style={styles.loading}><LoadingState message="Loading progress…" /></View>
            ) : (
              <View style={styles.items}>
                {(data?.items ?? []).map((item) => {
                  const color = scoreColor(item.progress, colors);
                  return (
                    <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.itemTop}>
                        <Text style={[styles.itemName, { color: colors.foreground }]}>{item.itemName}</Text>
                        <View style={styles.itemActions}>
                          <Text style={[styles.itemScore, { color }]}>{item.progress}%</Text>
                          <TouchableOpacity onPress={() => startEditing(item)} accessibilityLabel={`Edit ${item.itemName}`}>
                            <Feather name="edit-2" size={16} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => removeItem(item)} disabled={deleteMutation.isPending} accessibilityLabel={`Remove ${item.itemName}`}>
                            <Feather name="trash-2" size={16} color={colors.destructive} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <ProgressBar value={item.progress} color={color} />
                      {item.notes ? <Text style={[styles.notes, { color: colors.mutedForeground }]}>{item.notes}</Text> : null}
                    </View>
                  );
                })}
                {!data?.items.length ? (
                  <View style={[styles.empty, { borderColor: colors.border }]}>
                    <Feather name="target" size={22} color={colors.mutedForeground} />
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No progress areas yet.</Text>
                  </View>
                ) : null}
              </View>
            )}

            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.formTitleRow}>
                <Text style={[styles.formTitle, { color: colors.foreground }]}>{formTitle}</Text>
                {editing ? (
                  <TouchableOpacity onPress={() => { setEditing(null); setItemName(""); setProgress("0"); setNotes(""); }}>
                    <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={[styles.label, { color: colors.foreground }]}>Area name</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                placeholder="e.g. Command following"
                placeholderTextColor={colors.mutedForeground}
                value={itemName}
                onChangeText={setItemName}
                maxLength={80}
              />
              <View style={styles.scoreInputRow}>
                <View style={styles.scoreInputCopy}>
                  <Text style={[styles.label, { color: colors.foreground }]}>Score</Text>
                  <Text style={[styles.scoreHelp, { color: colors.mutedForeground }]}>0 to 100</Text>
                </View>
                <TextInput
                  style={[styles.scoreInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                  keyboardType="number-pad"
                  value={progress}
                  onChangeText={setProgress}
                  maxLength={3}
                />
              </View>
              <Text style={[styles.label, { color: colors.foreground }]}>Notes <Text style={{ color: colors.mutedForeground, fontWeight: "400" }}>optional</Text></Text>
              <TextInput
                style={[styles.input, styles.notesInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                placeholder="Add an observation"
                placeholderTextColor={colors.mutedForeground}
                value={notes}
                onChangeText={setNotes}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }, isSaving && styles.disabled]}
                onPress={editing ? saveItem : addItem}
                disabled={isSaving}
              >
                <Feather name={editing ? "save" : "plus"} size={17} color={colors.primaryForeground} />
                <Text style={[styles.saveButtonText, { color: colors.primaryForeground }]}>{isSaving ? "Saving…" : editing ? "Save changes" : "Add area"}</Text>
              </TouchableOpacity>
              {!editing ? (
                <TouchableOpacity
                  style={[styles.bulkButton, { borderColor: colors.primary }, isSaving && styles.disabled]}
                  onPress={addItemForAllClients}
                  disabled={isSaving}
                >
                  <Feather name="users" size={16} color={colors.primary} />
                  <Text style={[styles.bulkButtonText, { color: colors.primary }]}>
                    {bulkCreateMutation.isPending ? "Adding for all clients…" : "Add this area for all clients"}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(15,29,56,0.42)", justifyContent: "flex-end" },
  sheet: { maxHeight: "94%", borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  headerTitle: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700" as const },
  subtitle: { fontSize: 13, marginTop: 2 },
  content: { padding: 16, gap: 14 },
  overallCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  overallLabel: { fontSize: 11, letterSpacing: 0.8, fontWeight: "700" as const },
  overallHint: { fontSize: 12, marginTop: 3 },
  overallScore: { position: "absolute", right: 16, top: 14, fontSize: 28, fontWeight: "700" as const },
  scoreSuffix: { fontSize: 13, fontWeight: "500" as const },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: "#e5edf2", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  items: { gap: 9 },
  itemCard: { borderWidth: 1, borderRadius: 13, padding: 13, gap: 9 },
  itemTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  itemName: { flex: 1, fontSize: 15, fontWeight: "600" as const },
  itemActions: { flexDirection: "row", alignItems: "center", gap: 13 },
  itemScore: { fontSize: 14, fontWeight: "700" as const },
  notes: { fontSize: 12, lineHeight: 17 },
  empty: { minHeight: 78, borderWidth: 1, borderStyle: "dashed", borderRadius: 13, alignItems: "center", justifyContent: "center", gap: 7 },
  emptyText: { fontSize: 13 },
  loading: { height: 130 },
  formCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 9 },
  formTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  formTitle: { fontSize: 15, fontWeight: "700" as const },
  cancelText: { fontSize: 13, fontWeight: "600" as const },
  label: { fontSize: 12, fontWeight: "600" as const, marginTop: 3 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 },
  scoreInputRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  scoreInputCopy: { flexDirection: "row", alignItems: "baseline", gap: 7 },
  scoreHelp: { fontSize: 11 },
  scoreInput: { width: 78, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, textAlign: "center", fontSize: 16, fontWeight: "700" as const },
  notesInput: { minHeight: 58, textAlignVertical: "top" },
  saveButton: { minHeight: 46, borderRadius: 11, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 4 },
  saveButtonText: { fontSize: 14, fontWeight: "700" as const },
  bulkButton: { minHeight: 44, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  bulkButtonText: { fontSize: 13, fontWeight: "700" as const },
  disabled: { opacity: 0.65 },
});