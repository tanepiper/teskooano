import { mount, unmount } from "svelte";
import ExternalLinksWidgetSvelte from "./ExternalLinksWidget.svelte";

/**
 * @element teskooano-external-links-component
 * @summary Displays a set of icon buttons linking to external project resources.
 *
 * Thin custom-element shell that mounts the Svelte `ExternalLinksWidget`
 * component. The element must remain a custom element so the toolbar system
 * can create it via `document.createElement()`.
 */
export class ExternalLinksComponent extends HTMLElement {
  private _instance: ReturnType<typeof mount> | undefined;

  connectedCallback() {
    this._instance = mount(ExternalLinksWidgetSvelte, { target: this });
  }

  disconnectedCallback() {
    if (this._instance) {
      unmount(this._instance);
      this._instance = undefined;
    }
  }
}
