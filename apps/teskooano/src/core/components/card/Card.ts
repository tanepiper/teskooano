import { mount, unmount } from "svelte";
import CardSvelte from "./Card.svelte";

/**
 * `<teskooano-card>` custom element — thin Svelte wrapper.
 */
export class TeskooanoCard extends HTMLElement {
  private _instance: ReturnType<typeof mount> | undefined;

  static get observedAttributes() {
    return ["variant"];
  }

  connectedCallback() {
    this._instance = mount(CardSvelte, {
      target: this,
      props: { variant: (this.getAttribute("variant") ?? "fixed") as any },
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
    newVal: string | null,
  ) {
    if (this._instance) {
      const props = { variant: (newVal ?? "fixed") as any };
      if (typeof (this._instance as any)?.$set === "function") {
        (this._instance as any).$set(props);
      }
    }
  }

  get variant(): string | null {
    return this.getAttribute("variant");
  }
  set variant(v: string | null) {
    v ? this.setAttribute("variant", v) : this.removeAttribute("variant");
  }
}
