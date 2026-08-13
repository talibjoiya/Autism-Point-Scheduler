import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  getListTimeslotCommentsQueryKey,
  useCreateTimeslotComment,
  useListTimeslotComments,
} from "@workspace/api-client-react";
import type { Timeslot } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { StatusBadge } from "./StatusBadge";

const TZ = "Asia/Karachi";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

interface Props {
  slot: Timeslot;
  onPress?: () => void;
  onStatusChange?: (status: "scheduled" | "done" | "cancelled") => void;
  onDelete?: () => void;
  role?: string;
}

export function TimeslotCard({ slot, onPress, onStatusChange, onDelete, role }: Props) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="calendar" size={14} color={colors.secondary} />
          <Text style={[styles.dateText, { color: colors.secondary }]}>
            {formatDateTime(slot.startTime)}
          </Text>
          <Text style={[styles.timeRange, { color: colors.mutedForeground }]}>
            — {formatTime(slot.endTime)}
          </Text>
        </View>
        <StatusBadge status={slot.status} size="sm" />
      </View>

      <Text style={[styles.service, { color: colors.foreground }]}>
        {slot.serviceName}
      </Text>

      <View style={styles.people}>
        <View style={styles.personRow}>
          <Feather name="user-check" size={13} color={colors.mutedForeground} />
          <Text style={[styles.personText, { color: colors.mutedForeground }]}>
            {slot.professionalName}
          </Text>
        </View>
        <View style={styles.personRow}>
          <Feather name="user" size={13} color={colors.mutedForeground} />
          <Text style={[styles.personText, { color: colors.mutedForeground }]}>
            {slot.clientName}
          </Text>
        </View>
      </View>

      {slot.notes ? (
        <Text
          style={[styles.notes, { color: colors.mutedForeground }]}
          numberOfLines={2}
        >
          {slot.notes}
        </Text>
      ) : null}

      <AppointmentComments slot={slot} role={role} />

      {(role === "professional" || role === "admin") &&
        slot.status === "scheduled" && (
          <View style={styles.actions}>
            {onStatusChange && (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#dcfce7", borderColor: "#bbf7d0" }]}
                  onPress={() => onStatusChange("done")}
                >
                  <Feather name="check-circle" size={14} color="#15803d" />
                  <Text style={[styles.actionText, { color: "#15803d" }]}>Done</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#fee2e2", borderColor: "#fecaca" }]}
                  onPress={() => onStatusChange("cancelled")}
                >
                  <Feather name="x-circle" size={14} color="#dc2626" />
                  <Text style={[styles.actionText, { color: "#dc2626" }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
            {role === "admin" && onDelete && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#f0f4f8", borderColor: colors.border }]}
                onPress={onDelete}
              >
                <Feather name="trash-2" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        )}

      {role === "admin" && slot.status !== "scheduled" && onDelete && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#f0f4f8", borderColor: colors.border }]}
            onPress={onDelete}
          >
            <Feather name="trash-2" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

function AppointmentComments({ slot, role }: { slot: Timeslot; role?: string }) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const commentsQuery = useListTimeslotComments(slot.id, {
    query: {
      enabled: slot.status === "done",
      queryKey: getListTimeslotCommentsQueryKey(slot.id),
    },
  });
  const createCommentMutation = useCreateTimeslotComment();

  if (slot.status !== "done") return null;

  const comments = commentsQuery.data ?? [];

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    try {
      await createCommentMutation.mutateAsync({
        id: slot.id,
        data: { content: trimmed },
      });
      setContent("");
      await queryClient.invalidateQueries({
        queryKey: getListTimeslotCommentsQueryKey(slot.id),
      });
    } catch (error: unknown) {
      Alert.alert(
        "Unable to post comment",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  return (
    <View style={[styles.comments, { borderTopColor: colors.border }]}>
      <View style={styles.commentsHeading}>
        <View style={styles.commentsTitleRow}>
          <Feather name="message-circle" size={14} color={colors.secondary} />
          <Text style={[styles.commentsTitle, { color: colors.foreground }]}>
            Comments
          </Text>
        </View>
        <Text style={[styles.commentCount, { color: colors.mutedForeground }]}>
          {comments.length}
        </Text>
      </View>

      {commentsQuery.isLoading ? (
        <Text style={[styles.commentMeta, { color: colors.mutedForeground }]}>
          Loading comments…
        </Text>
      ) : comments.length === 0 ? (
        <Text style={[styles.commentMeta, { color: colors.mutedForeground }]}>
          No comments yet.
        </Text>
      ) : (
        <View style={styles.commentList}>
          {comments.map((comment) => (
            <View
              key={comment.id}
              style={[styles.commentBubble, { backgroundColor: colors.muted }]}
            >
              <Text style={[styles.commentAuthor, { color: colors.foreground }]}>
                {comment.professionalName}
              </Text>
              <Text style={[styles.commentText, { color: colors.foreground }]}>
                {comment.content}
              </Text>
              <Text style={[styles.commentMeta, { color: colors.mutedForeground }]}>
                {new Date(comment.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {role === "professional" && (
        <View style={styles.commentComposer}>
          <TextInput
            style={[
              styles.commentInput,
              {
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.inputBackground,
              },
            ]}
            value={content}
            onChangeText={setContent}
            placeholder="Add a follow-up comment…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[
              styles.commentSend,
              {
                backgroundColor: content.trim() ? colors.primary : colors.muted,
              },
            ]}
            onPress={handleSubmit}
            disabled={!content.trim() || createCommentMutation.isPending}
            accessibilityLabel="Post comment"
          >
            <Feather
              name="send"
              size={15}
              color={content.trim() ? colors.primaryForeground : colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  dateText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  timeRange: {
    fontSize: 12,
  },
  service: {
    fontSize: 16,
    fontWeight: "700" as const,
    marginBottom: 6,
  },
  people: {
    gap: 3,
    marginBottom: 4,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  personText: {
    fontSize: 13,
  },
  notes: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  comments: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 10,
  },
  commentsHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  commentsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  commentsTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
  },
  commentCount: {
    fontSize: 12,
  },
  commentList: {
    gap: 6,
  },
  commentBubble: {
    borderRadius: 8,
    padding: 9,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: "700" as const,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  commentMeta: {
    fontSize: 11,
    marginTop: 3,
  },
  commentComposer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 88,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    textAlignVertical: "top",
  },
  commentSend: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
});
