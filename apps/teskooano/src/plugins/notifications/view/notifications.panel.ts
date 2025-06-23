import { NotificationsController } from "../controller/notifications.controller";
import { type Notification } from "@teskooano/notifications";
import { NotificationCardComponent } from "../components/notification-card/notification-card.component";

const styles = `
  :host {
    position: absolute;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000; /* Ensure it's on top of other UI */
  }
  #container {
    position: relative; /* Changed from absolute */
    padding: 1rem; /* Use padding on container instead of host */
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
`;

const template = `
  <div id="container"></div>
`;

export class NotificationsPanel extends HTMLElement {
  private controller?: NotificationsController;
  private container?: HTMLElement;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    const styleEl = document.createElement("style");
    styleEl.textContent = styles;
    this.shadowRoot!.appendChild(styleEl);
    const templateEl = document.createElement("template");
    templateEl.innerHTML = template;
    this.shadowRoot!.appendChild(templateEl.content.cloneNode(true));
  }

  connectedCallback() {
    if (!this.controller) {
      this.container = this.shadowRoot!.querySelector("#container")!;
      this.controller = new NotificationsController(
        this.container,
        (notification: Notification) => {
          const card = document.createElement(
            "teskooano-notification-card",
          ) as NotificationCardComponent;
          card.setNotification(notification);
          return card;
        },
      );
    }
  }

  disconnectedCallback() {
    this.controller?.dispose();
    this.controller = undefined;
  }
}
