import { PluginExecutionContext } from "@teskooano/ui-plugin";
import { NotificationsPanel } from "../view/notifications.panel";

/**
 * Manages the UI for notifications, creating and attaching the container
 * to the DOM.
 */
export class NotificationUIManager {
  private context: PluginExecutionContext;
  private container: NotificationsPanel | null = null;

  constructor(context: PluginExecutionContext) {
    this.context = context;
  }

  /**
   * Creates the notification container and appends it to a parent element.
   * If a container already exists, this method does nothing.
   * @param parentElement The element to attach the notification container to.
   */
  public createContainer(parentElement: HTMLElement): void {
    if (this.container) {
      return;
    }

    // The 'teskooano-notifications-panel' custom element is registered
    // by this same plugin, so it should be available.
    this.container = document.createElement(
      "teskooano-notifications-panel",
    ) as NotificationsPanel;
    parentElement.appendChild(this.container);
  }

  /**
   * Removes the notification container from the DOM.
   */
  public dispose(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
