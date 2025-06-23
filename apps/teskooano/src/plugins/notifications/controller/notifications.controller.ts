import {
  type Notification,
  notificationManager,
} from "@teskooano/notifications";
import { Subscription } from "rxjs";

export class NotificationsController {
  private subscription: Subscription;
  private cardFactory: (notification: Notification) => HTMLElement;
  private container: HTMLElement;
  private notificationElements = new Map<string, HTMLElement>();

  constructor(
    container: HTMLElement,
    cardFactory: (notification: Notification) => HTMLElement,
  ) {
    this.container = container;
    this.cardFactory = cardFactory;
    this.subscription = notificationManager.notifications$.subscribe(
      this.handleNotificationsChange,
    );
  }

  private handleNotificationsChange = (notifications: Notification[]) => {
    const currentIds = new Set(notifications.map((n) => n.id));

    // Remove old notifications
    this.notificationElements.forEach((element, id) => {
      if (!currentIds.has(id)) {
        element.remove();
        this.notificationElements.delete(id);
      }
    });

    // Add new or update existing notifications
    notifications.forEach((notification) => {
      if (!this.notificationElements.has(notification.id)) {
        const cardElement = this.cardFactory(notification);
        this.notificationElements.set(notification.id, cardElement);
        this.container.appendChild(cardElement);
      } else {
        // If the element already exists, update it
        const cardElement = this.notificationElements.get(notification.id);
        if (cardElement && "setNotification" in cardElement) {
          (cardElement as any).setNotification(notification);
        }
      }
    });
  };

  public dispose() {
    this.subscription.unsubscribe();
  }
}
