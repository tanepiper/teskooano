import {
  type Notification,
  notificationManager,
} from "@teskooano/notifications";
import { styles, template } from "./notification-card.template";

const templateElement = document.createElement("template");
templateElement.innerHTML = `<style>${styles}</style>${template}`;

export class NotificationCardComponent extends HTMLElement {
  private notification: Notification | null = null;
  private titleElement: HTMLElement | null = null;
  private messageElement: HTMLElement | null = null;
  private closeButton: HTMLElement | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    if (this.shadowRoot && !this.shadowRoot.firstChild) {
      this.shadowRoot.appendChild(templateElement.content.cloneNode(true));
      this.titleElement = this.shadowRoot.querySelector(".title");
      this.messageElement = this.shadowRoot.querySelector(".message");
      this.closeButton = this.shadowRoot.querySelector(".close-button");
    }

    this.closeButton?.addEventListener("click", this.handleClose);
    this.render();
  }

  disconnectedCallback() {
    this.closeButton?.removeEventListener("click", this.handleClose);
  }

  private handleClose = () => {
    if (this.notification) {
      notificationManager.removeNotification(this.notification.id);
    }
  };

  public setNotification(notification: Notification): void {
    this.notification = notification;
    this.render();
  }

  private render(): void {
    if (!this.notification || !this.titleElement || !this.messageElement) {
      return;
    }

    this.titleElement.textContent = this.notification.title;
    this.messageElement.innerHTML = this.notification.message;
    this.className = this.notification.level;
  }
}
