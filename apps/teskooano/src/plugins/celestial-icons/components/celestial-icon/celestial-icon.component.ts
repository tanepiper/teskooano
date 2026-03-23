import { mount, unmount } from "svelte";
import type { CelestialIconConfig } from "../../types.js";
import CelestialIconSvelte from "./CelestialIcon.svelte";

/** Minimal interface for the Svelte 4 compatibility shim exposed by `mount()`. */
interface SvelteInstanceWithSet {
  $set(props: Record<string, unknown>): void;
}

/**
 * `<celestial-icon>` custom element.
 *
 * Thin wrapper that mounts the Svelte `CelestialIcon` component. Kept as a
 * custom element so it can be used via:
 *  - Svelte templates: `<celestial-icon {config} />`
 *  - innerHTML strings:  `<celestial-icon config='...'></celestial-icon>`
 *
 * Accepts either:
 *  - a `config` HTML attribute (JSON string), parsed automatically, or
 *  - the `setConfig(config)` method for programmatic usage.
 */
export class CelestialIconComponent extends HTMLElement {
  private _config: CelestialIconConfig | null = null;
  private _instance: ReturnType<typeof mount> | undefined;

  static get observedAttributes(): string[] {
    return ["config"];
  }

  connectedCallback(): void {
    this._instance = mount(CelestialIconSvelte, {
      target: this,
      props: { config: this._config },
    });
  }

  disconnectedCallback(): void {
    if (this._instance) {
      unmount(this._instance);
      this._instance = undefined;
    }
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    newValue: string | null,
  ): void {
    if (name === "config" && newValue) {
      try {
        this.setConfig(JSON.parse(newValue));
      } catch (e) {
        console.error("[CelestialIconComponent] Failed to parse config:", e);
      }
    }
  }

  public setConfig(config: CelestialIconConfig): void {
    this._config = config;
    if (this._instance) {
      // Svelte 5 mount() exposes a Svelte 4 compatibility `$set` shim for
      // updating props on an already-mounted component.
      const inst = this._instance as unknown as SvelteInstanceWithSet;
      if (typeof inst.$set === "function") {
        inst.$set({ config });
      } else {
        // Fallback: remount with fresh props (e.g., if $set is unavailable).
        unmount(this._instance);
        this._instance = mount(CelestialIconSvelte, {
          target: this,
          props: { config },
        });
      }
    }
  }
}
