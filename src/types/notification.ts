export type NotificationType =
  | 'automation'
  | 'batch'
  | 'sensor'
  | 'system'
  | 'machine';

export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface NotificationItem {
  id: string;
  barangayId: string;
  machineId?: string | null;
  batchId?: string | null;
  userId?: string | null;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationSection {
  title: 'Today' | 'Last 7 days' | 'Earlier';
  data: NotificationItem[];
}
