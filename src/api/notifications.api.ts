import { api } from "./client";
import type { NotificationItem } from "@/types/notification";

export const notificationsApi = {
  getNotifications: async (params?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<NotificationItem[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.unreadOnly) queryParams.set("unreadOnly", "true");
      if (params?.limit) queryParams.set("limit", String(params.limit));
      if (params?.offset) queryParams.set("offset", String(params.offset));

      const queryStr = queryParams.toString();
      const endpoint = queryStr ? `/notifications?${queryStr}` : "/notifications";
      const res = await api.get<NotificationItem[]>(endpoint);
      return Array.isArray(res) ? res : [];
    } catch {
      // Graceful fallback when endpoint is pending
      return [];
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const res = await api.get<{ unreadCount: number }>(
        "/notifications/unread-count",
      );
      return typeof res?.unreadCount === "number" ? res.unreadCount : 0;
    } catch {
      return 0;
    }
  },

  markAsRead: async (id: string): Promise<void> => {
    try {
      await api.patch(`/notifications/${encodeURIComponent(id)}/read`, {});
    } catch {
      // Graceful fallback
    }
  },

  markAllAsRead: async (): Promise<void> => {
    try {
      await api.patch("/notifications/read-all", {});
    } catch {
      // Graceful fallback
    }
  },
};
