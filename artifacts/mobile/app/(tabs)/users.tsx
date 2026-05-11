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
  useListUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "@workspace/api-client-react";
import type { User, CreateUserRequest, UpdateUserRequest } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { UserCard } from "@/components/UserCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";

type RoleFilter = "all" | "admin" | "professional" | "client";

const ROLE_FILTERS: { key: RoleFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "admin", label: "Admins" },
  { key: "professional", label: "Professionals" },
  { key: "client", label: "Clients" },
];

const ROLES = ["admin", "professional", "client"] as const;

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
}

function UserFormModal({
  visible,
  editUser,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  editUser: User | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const colors = useColors();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const isEdit = editUser !== null;

  const [form, setForm] = useState<UserFormData>({
    name: editUser?.name ?? "",
    email: editUser?.email ?? "",
    password: "",
    role: editUser?.role ?? "client",
    phone: editUser?.phone ?? "",
  });

  React.useEffect(() => {
    if (visible) {
      setForm({
        name: editUser?.name ?? "",
        email: editUser?.email ?? "",
        password: "",
        role: editUser?.role ?? "client",
        phone: editUser?.phone ?? "",
      });
    }
  }, [visible, editUser]);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      Alert.alert("Missing Fields", "Name and email are required.");
      return;
    }
    if (!isEdit && !form.password.trim()) {
      Alert.alert("Missing Fields", "Password is required for new users.");
      return;
    }
    try {
      if (isEdit && editUser) {
        const body: UpdateUserRequest = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role as "admin" | "professional" | "client",
          phone: form.phone.trim() || undefined,
        };
        await updateMutation.mutateAsync({ id: editUser.id, data: body });
      } else {
        const body: CreateUserRequest = {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password.trim(),
          role: form.role as "admin" | "professional" | "client",
          phone: form.phone.trim() || undefined,
        };
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
              {isEdit ? "Edit User" : "New User"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.formBody}>
              {(["name", "email", "phone"] as const).map((field) => (
                <View key={field} style={styles.formField}>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                    {field === "phone" ? " (optional)" : ""}
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
                    placeholder={
                      field === "email"
                        ? "user@example.com"
                        : field === "phone"
                        ? "+92 300 000 0000"
                        : "Full name"
                    }
                    placeholderTextColor={colors.mutedForeground}
                    value={form[field]}
                    onChangeText={(v) => setForm((f) => ({ ...f, [field]: v }))}
                    keyboardType={field === "email" ? "email-address" : "default"}
                    autoCapitalize={field === "email" ? "none" : "words"}
                    autoCorrect={false}
                  />
                </View>
              ))}

              {!isEdit && (
                <View style={styles.formField}>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    Password
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
                    placeholder="••••••••"
                    placeholderTextColor={colors.mutedForeground}
                    value={form.password}
                    onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
                    secureTextEntry
                  />
                </View>
              )}

              <View style={styles.formField}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  Role
                </Text>
                <View style={styles.roleRow}>
                  {ROLES.map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.roleChip,
                        {
                          backgroundColor:
                            form.role === r ? colors.primary : colors.muted,
                          borderColor:
                            form.role === r ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setForm((f) => ({ ...f, role: r }))}
                    >
                      <Text
                        style={{
                          color: form.role === r ? "#ffffff" : colors.foreground,
                          fontSize: 13,
                          fontWeight: "600" as const,
                        }}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
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
                    : "Create User"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function UsersScreen() {
  const { user: currentUser } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  if (currentUser?.role !== "admin") return null;

  const params =
    roleFilter !== "all"
      ? { role: roleFilter as "admin" | "professional" | "client" }
      : {};
  const { data: users, isLoading, refetch, isRefetching } = useListUsers(params);
  const deleteMutation = useDeleteUser();

  const handleDelete = (u: User) => {
    Alert.alert(
      "Delete User",
      `Delete ${u.name}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync({ id: u.id });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              refetch();
            } catch {
              Alert.alert("Error", "Failed to delete user.");
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
          {ROLE_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                roleFilter === f.key
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
              onPress={() => setRoleFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      roleFilter === f.key ? "#ffffff" : colors.mutedForeground,
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
        <LoadingState message="Loading users…" />
      ) : (
        <FlatList
          data={users ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + webBottomPadding + 80 },
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
              icon="users"
              title="No users found"
              subtitle="Try a different role filter"
            />
          }
          renderItem={({ item }) => (
            <UserCard
              user={item}
              onEdit={() => {
                setEditUser(item);
                setModalVisible(true);
              }}
              onDelete={() => handleDelete(item)}
            />
          )}
          scrollEnabled={!!(users && users.length > 0)}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          setEditUser(null);
          setModalVisible(true);
        }}
      >
        <Feather name="user-plus" size={22} color="#ffffff" />
      </TouchableOpacity>

      <UserFormModal
        visible={modalVisible}
        editUser={editUser}
        onClose={() => {
          setModalVisible(false);
          setEditUser(null);
        }}
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
  roleRow: {
    flexDirection: "row",
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
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
