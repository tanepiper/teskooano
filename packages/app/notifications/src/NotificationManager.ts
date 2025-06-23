import { BehaviorSubject } from "rxjs";
import type { Notification } from "./types";

type NotificationOptions = Omit<Notification, "id" | "timestamp" | "isRead">;

/**
 * Manages the state of in-engine notifications.
 * Provides a centralized API for creating, managing, and observing notifications.
 */
export class NotificationManager {
  /** The reactive stream of all active notifications. */
  public readonly notifications$ = new BehaviorSubject<Notification[]>([]);

  /** A map to keep track of timeouts for auto-dismissing notifications. */
  private timeouts = new Map<string, ReturnType<typeof setTimeout>>();

  /**
   * Adds a new notification to the manager.
   * @param options The details of the notification to add.
   * @returns The newly created notification object.
   */
  public addNotification(options: NotificationOptions): Notification {
    const newNotification: Notification = {
      ...options,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      isRead: false,
    };

    const currentNotifications = this.notifications$.getValue();
    this.notifications$.next([...currentNotifications, newNotification]);

    if (newNotification.duration && newNotification.duration > 0) {
      const timeoutId = setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, newNotification.duration);
      this.timeouts.set(newNotification.id, timeoutId);
    }

    return newNotification;
  }

  /**
   * Updates an existing notification with new data.
   * @param notificationId The ID of the notification to update.
   * @param updates An object containing the properties to update.
   */
  public updateNotification(
    notificationId: string,
    updates: Partial<NotificationOptions>,
  ): void {
    const currentNotifications = this.notifications$.getValue().map((n) => {
      if (n.id === notificationId) {
        return { ...n, ...updates, timestamp: Date.now() }; // Update timestamp on each update
      }
      return n;
    });
    this.notifications$.next(currentNotifications);
  }

  /**
   * Removes a notification by its ID.
   * @param notificationId The ID of the notification to remove.
   */
  public removeNotification(notificationId: string): void {
    const currentNotifications = this.notifications$
      .getValue()
      .filter((n) => n.id !== notificationId);
    this.notifications$.next(currentNotifications);

    // Clear any pending timeout for this notification
    if (this.timeouts.has(notificationId)) {
      clearTimeout(this.timeouts.get(notificationId));
      this.timeouts.delete(notificationId);
    }
  }

  /**
   * Marks a specific notification as read.
   * @param notificationId The ID of the notification to mark as read.
   */
  public markAsRead(notificationId: string): void {
    const currentNotifications = this.notifications$.getValue().map((n) => {
      if (n.id === notificationId) {
        return { ...n, isRead: true };
      }
      return n;
    });
    this.notifications$.next(currentNotifications);
  }

  /**
   * Marks all current notifications as read.
   */
  public markAllAsRead(): void {
    const currentNotifications = this.notifications$
      .getValue()
      .map((n) => ({ ...n, isRead: true }));
    this.notifications$.next(currentNotifications);
  }

  /**
   * Clears all notifications from the manager.
   */
  public clearAll(): void {
    this.notifications$.next([]);
    this.timeouts.forEach(clearTimeout);
    this.timeouts.clear();
  }

  /**
   * Cleans up all resources, primarily pending timeouts.
   */
  public dispose(): void {
    this.clearAll();
    this.notifications$.complete();
  }
}
