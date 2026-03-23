import type {
  FunctionConfig,
  PluginExecutionContext,
  TeskooanoPlugin,
} from "@teskooano/ui-plugin";
import { NotificationUIManager } from "./manager/notifications-ui.manager";

const initializeNotifications: FunctionConfig = {
  id: "notifications:initialize",
  execute: (context: PluginExecutionContext): NotificationUIManager => {
    return new NotificationUIManager(context);
  },
};

/**
 * Plugin definition for the Notifications UI system.
 * Uses Svelte for rendering — no custom elements are registered.
 */
export const plugin: TeskooanoPlugin = {
  id: "notifications",
  name: "Notifications UI",
  version: "0.0.1",
  description: "Provides a non-panel UI for displaying system notifications.",
  components: [],
  functions: [initializeNotifications],
  panels: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
  managerClasses: [],
};
