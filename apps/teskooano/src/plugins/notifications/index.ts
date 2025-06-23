import type {
  FunctionConfig,
  PluginExecutionContext,
  TeskooanoPlugin,
} from "@teskooano/ui-plugin";
import { NotificationCardComponent } from "./components/notification-card/notification-card.component";
import { NotificationUIManager } from "./manager/notifications-ui.manager";
import { NotificationsPanel } from "./view/notifications.panel";

const initializeNotifications: FunctionConfig = {
  id: "notifications:initialize",
  execute: (context: PluginExecutionContext): NotificationUIManager => {
    return new NotificationUIManager(context);
  },
};

export const plugin: TeskooanoPlugin = {
  id: "notifications",
  name: "Notifications UI",
  version: "0.0.1",
  description: "Provides a non-panel UI for displaying system notifications.",
  components: [
    {
      tagName: "teskooano-notification-card",
      componentClass: NotificationCardComponent,
    },
    {
      tagName: "teskooano-notifications-panel",
      componentClass: NotificationsPanel,
    },
  ],
  functions: [initializeNotifications],
};
