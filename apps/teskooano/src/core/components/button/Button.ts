import { mount, unmount } from "svelte";
import ButtonSvelte from "./Button.svelte";

/**
 * `<teskooano-button>` custom element — thin Svelte wrapper.
 * Kept for backward compatibility with controllers and templates that create
 * buttons via `document.createElement("teskooano-button")`.
 */
export class TeskooanoButton extends HTMLElement {
  private _instance: ReturnType<typeof mount> | undefined;
  private _props: Record<string, unknown> = {};

  static get observedAttributes() {
    return [
      "disabled",
      "type",
      "title",
      "fullwidth",
      "size",
      "tooltip-text",
      "tooltip-title",
      "tooltip-icon-svg",
      "tooltip-horizontal-align",
      "active",
      "variant",
      "appearance",
      "aria-label",
    ];
  }

  connectedCallback() {
    this._syncPropsFromAttributes();
    this._instance = mount(ButtonSvelte, {
      target: this,
      props: this._props,
    });
  }

  disconnectedCallback() {
    if (this._instance) {
      unmount(this._instance);
      this._instance = undefined;
    }
  }

  attributeChangedCallback(
    _name: string,
    _old: string | null,
    _newVal: string | null,
  ) {
    this._syncPropsFromAttributes();
    if (this._instance) {
      this._updateProps();
    }
  }

  private _syncPropsFromAttributes() {
    this._props = {
      disabled: this.hasAttribute("disabled"),
      type: this.getAttribute("type") ?? "button",
      title: this.getAttribute("title") ?? undefined,
      fullwidth: this.hasAttribute("fullwidth"),
      size: this.getAttribute("size") ?? "md",
      variant: this.getAttribute("variant") ?? null,
      appearance: this.getAttribute("appearance") ?? null,
      active: this.hasAttribute("active"),
      tooltipText: this.getAttribute("tooltip-text") ?? null,
      tooltipTitle: this.getAttribute("tooltip-title") ?? null,
      tooltipIconSvg: this.getAttribute("tooltip-icon-svg") ?? null,
      tooltipHorizontalAlign:
        this.getAttribute("tooltip-horizontal-align") ?? "center",
      "aria-label": this.getAttribute("aria-label") ?? undefined,
    };
  }

  private _updateProps() {
    if (typeof (this._instance as any)?.$set === "function") {
      (this._instance as any).$set(this._props);
    } else {
      unmount(this._instance!);
      this._instance = mount(ButtonSvelte, { target: this, props: this._props });
    }
  }

  // --- Public property API (used by controllers) ---
  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }
  set disabled(v: boolean) {
    v ? this.setAttribute("disabled", "") : this.removeAttribute("disabled");
  }

  get active(): boolean {
    return this.hasAttribute("active");
  }
  set active(v: boolean) {
    v ? this.setAttribute("active", "") : this.removeAttribute("active");
  }

  get size(): string {
    return this.getAttribute("size") ?? "md";
  }
  set size(v: string | null) {
    v ? this.setAttribute("size", v) : this.removeAttribute("size");
  }

  get variant(): string | null {
    return this.getAttribute("variant");
  }

  public refreshTooltipContent() {
    this._syncPropsFromAttributes();
    this._updateProps();
  }
}
