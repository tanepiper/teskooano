import { PluginExecutionContext } from "@teskooano/ui-plugin";
import { mount, unmount } from "svelte";
import NotificationsPanelSvelte from "../view/NotificationsPanel.svelte";

/**
 * Manages the UI for notifications, creating and attaching the Svelte-based
 * overlay component to the DOM.
 */
export class NotificationUIManager {
  private context: PluginExecutionContext;
  private _mountTarget: HTMLDivElement | null = null;
  private _instance: Record<string, any> | undefined;

  constructor(context: PluginExecutionContext) {
    this.context = context;
  }

  /**
   * Mounts the notifications panel Svelte component into the given parent element.
   * If already mounted, this method does nothing.
   */
  public createContainer(parentElement: HTMLElement): void {
    if (this._instance) {
      return;
    }

    this._mountTarget = document.createElement("div");
    this._mountTarget.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:0;z-index:10000;pointer-events:none;";
    parentElement.appendChild(this._mountTarget);

    this._instance = mount(NotificationsPanelSvelte, {
      target: this._mountTarget,
    });
  }

  /**
   * Unmounts the Svelte component and removes the container from the DOM.
   */
  public dispose(): void {
    if (this._instance) {
      unmount(this._instance);
      this._instance = undefined;
    }
    if (this._mountTarget) {
      this._mountTarget.remove();
      this._mountTarget = null;
    }
  }
}
