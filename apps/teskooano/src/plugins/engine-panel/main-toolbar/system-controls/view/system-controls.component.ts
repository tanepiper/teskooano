import { mount, unmount } from "svelte";
import type { PluginExecutionContext } from "@teskooano/ui-plugin";
import SystemControlsSvelte from "./SystemControls.svelte";

/**
 * `<teskooano-system-controls>` — thin shell that mounts SystemControls.svelte.
 *
 * All reactive logic (state, effects, actions) lives in the Svelte component.
 * The shell only exists to:
 * 1. Register as a custom element (required by the toolbar widget system).
 * 2. Forward the `PluginExecutionContext` via `setContext()`.
 */
export class SystemControls extends HTMLElement {
  private _instance: ReturnType<typeof mount> | undefined;
  private _context: PluginExecutionContext | null = null;

  connectedCallback(): void {
    // Mount immediately if context was set before connection (e.g., on re-connect).
    if (this._context && !this._instance) {
      this._mountSvelte();
    }
  }

  disconnectedCallback(): void {
    if (this._instance) {
      unmount(this._instance);
      this._instance = undefined;
    }
  }

  /**
   * Called by the toolbar widget system to inject the plugin execution context.
   * Mounts the Svelte component once both the context and the DOM are ready.
   */
  public setContext(context: PluginExecutionContext): void {
    this._context = context;
    if (this.isConnected && !this._instance) {
      this._mountSvelte();
    }
  }

  private _mountSvelte(): void {
    if (!this._context) return;
    this._instance = mount(SystemControlsSvelte, {
      target: this,
      props: { context: this._context },
    });
  }
}
