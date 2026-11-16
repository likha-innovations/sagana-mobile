import { api } from "./client";
import type { NotificationItem } from "@/types/notification";

export const notificationsApi = {
  getNotifications: async (params?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<NotificationItem[]> => {
    const queryParams = new URLSearchParams();
    if (params?.unreadOnly) queryParams.set("unreadOnly", "true");
    if (params?.limit) queryParams.set("limit", String(params.limit));
    if (params?.offset) queryParams.set("offset", String(params.offset));

    const queryStr = queryParams.toString();
    const endpoint = queryStr ? `/notifications?${queryStr}` : "/notifications";
    const res = await api.get<NotificationItem[]>(endpoint);
    return Array.isArray(res) ? res : [];
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get<{ unreadCount: number }>(
      "/notifications/unread-count",
    );
    return typeof res?.unreadCount === "number" ? res.unreadCount : 0;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${encodeURIComponent(id)}/read`, {});
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch("/notifications/read-all", {});
  },
};
