import { mount, unmount } from "svelte";
import SliderSvelte from "./Slider.svelte";

/**
 * `<teskooano-slider>` custom element — thin Svelte wrapper.
 * Kept for backward compat with controllers that bind to this element.
 */
export class TeskooanoSlider extends HTMLElement {
  private _instance: ReturnType<typeof mount> | undefined;

  static get observedAttributes() {
    return ["value", "min", "max", "step", "disabled", "editable-value"];
  }

  private _getProps() {
    return {
      value: parseFloat(this.getAttribute("value") ?? "50"),
      min: parseFloat(this.getAttribute("min") ?? "0"),
      max: parseFloat(this.getAttribute("max") ?? "100"),
      step: parseFloat(this.getAttribute("step") ?? "1"),
      disabled: this.hasAttribute("disabled"),
      editableValue: this.hasAttribute("editable-value"),
    };
  }

  connectedCallback() {
    this._instance = mount(SliderSvelte, {
      target: this,
      props: this._getProps(),
    });
  }

  disconnectedCallback() {
    if (this._instance) {
      unmount(this._instance);
      this._instance = undefined;
    }
  }

  attributeChangedCallback() {
    if (this._instance) {
      const props = this._getProps();
      if (typeof (this._instance as any)?.$set === "function") {
        (this._instance as any).$set(props);
      }
    }
  }

  get value(): number {
    return parseFloat(this.getAttribute("value") ?? "50");
  }
  set value(v: number) {
    this.setAttribute("value", String(v));
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }
  set disabled(v: boolean) {
    v ? this.setAttribute("disabled", "") : this.removeAttribute("disabled");
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "teskooano-slider": TeskooanoSlider;
  }
}
