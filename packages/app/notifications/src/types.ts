export type NotificationLevel = "info" | "success" | "warning" | "error";

export interface Notification {
  /** A unique identifier for the notification. */
  id: string;
  /** The main title or heading of the notification. */
  title: string;
  /** The detailed message content. */
  message: string;
  /** The severity level of the notification. */
  level: NotificationLevel;
  /** The Unix timestamp (in milliseconds) when the notification was created. */
  timestamp: number;
  /** Optional duration in milliseconds before the notification auto-dismisses. If 0 or undefined, it's permanent. */
  duration?: number;
  /** A flag indicating if the user has dismissed or acknowledged the notification. */
  isRead: boolean;
  /** The source module or system that generated the notification. */
  source: string;
}
