import { mount, unmount } from "svelte";
import SimulationControlsSvelte from "./SimulationControls.svelte";

/**
 * `<teskooano-simulation-controls>` — thin shell that mounts SimulationControls.svelte.
 *
 * All reactive logic lives in the Svelte component; this class merely
 * integrates the element into the custom-element registry so the toolbar
 * plugin system can mount it by tag name.
 */
export class SimulationControls extends HTMLElement {
  private _instance: ReturnType<typeof mount> | undefined;

  connectedCallback(): void {
    this._instance = mount(SimulationControlsSvelte, {
      target: this,
      props: {},
    });
  }

  disconnectedCallback(): void {
    if (this._instance) {
      unmount(this._instance);
      this._instance = undefined;
    }
  }

  // --- Public API used by external callers ---
  public resetStartDate(): void {
    this.dispatchEvent(
      new CustomEvent("simulation-reset-date", { bubbles: false }),
    );
  }

  public setStartDate(startDate: Date): void {
    this.dispatchEvent(
      new CustomEvent("simulation-set-date", {
        detail: { startDate },
        bubbles: false,
      }),
    );
  }
}
