import { NotificationManager } from "./NotificationManager";

export * from "./types";

/**
 * A singleton instance of the NotificationManager.
 * Use this instance throughout the application to interact with the notification system.
 */
export const notificationManager = new NotificationManager();
