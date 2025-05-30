import { template } from "./Toggle.template";

/**
 * TeskooanoToggle component (`teskooano-toggle`).
 *
 * A custom toggle switch component that conforms to the Teskooano design system.
 *
 * @element teskooano-toggle
 *
 * @attr {string} label - The label text for the toggle switch.
 * @attr {boolean} [checked=false] - Reflects the checked state of the toggle.
 * @attr {boolean} [disabled=false] - Reflects the disabled state of the toggle.
 *
 * @csspart label - The label element.
 * @csspart input - The hidden checkbox input element.
 * @csspart switch - The visual switch element (label for the input).
 * @csspart slider - The slider (track and knob container) of the switch.
 *
 * @fires change - Dispatched when the toggle's checked state changes due to user interaction.
 */
export class TeskooanoToggle extends HTMLElement {
  static get observedAttributes() {
    return ["label", "checked", "disabled"];
  }

  private _shadowRoot: ShadowRoot;
  private _checkbox: HTMLInputElement | null = null;
  private _labelTextElement: HTMLSpanElement | null = null;
  private _labelSlot: HTMLSlotElement | null = null;

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: "open" });
    this._shadowRoot.appendChild(template.content.cloneNode(true));

    this._checkbox = this._shadowRoot.getElementById(
      "checkbox-input",
    ) as HTMLInputElement;
    this._labelTextElement = this._shadowRoot.getElementById(
      "label-text",
    ) as HTMLSpanElement;
    this._labelSlot = this._shadowRoot.querySelector(
      "slot[name='label']",
    ) as HTMLSlotElement;
  }

  connectedCallback() {
    this._upgradeProperty("label");
    this._upgradeProperty("checked");
    this._upgradeProperty("disabled");

    // Ensure the initial state of the aria-checked attribute is set.
    if (this._checkbox) {
      this.setAttribute("aria-checked", String(this._checkbox.checked));
    }

    this.addEventListener("click", this._onClick);
    // The actual change event comes from the hidden checkbox
    this._checkbox?.addEventListener("change", this._onCheckboxChange);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this._onClick);
    this._checkbox?.removeEventListener("change", this._onCheckboxChange);
  }

  private _upgradeProperty(prop: string) {
    if (this.hasOwnProperty(prop)) {
      const value = (this as any)[prop];
      delete (this as any)[prop];
      (this as any)[prop] = value;
    }
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    const hasValue = newValue !== null;
    switch (name) {
      case "label":
        if (this._labelTextElement) {
          this._labelTextElement.textContent = newValue;
        }
        break;
      case "checked":
        if (this._checkbox) {
          this._checkbox.checked = hasValue;
          this.setAttribute("aria-checked", String(hasValue));
        }
        break;
      case "disabled":
        if (this._checkbox) {
          this._checkbox.disabled = hasValue;
        }
        break;
    }
  }

  get label(): string {
    return this.getAttribute("label") || "";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get checked(): boolean {
    return this.hasAttribute("checked");
  }

  set checked(value: boolean) {
    if (value) {
      this.setAttribute("checked", "");
    } else {
      this.removeAttribute("checked");
    }
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    if (value) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }

  private _onClick = (event: MouseEvent) => {
    // Don't toggle if the click is on a link within the label slot, or if disabled
    if (this.disabled || (event.target as HTMLElement).closest("a[href]")) {
      return;
    }
    // We only want to toggle if the click is on the host or the label part,
    // not on the switch itself (which has its own label for the input).
    const path = event.composedPath();
    const isSwitchClick = path.some((el) =>
      (el as HTMLElement).classList?.contains("switch"),
    );

    if (!isSwitchClick) {
      this.checked = !this.checked;
      // Manually dispatch change event as the internal checkbox might not trigger it if we set it programmatically.
      this.dispatchEvent(
        new Event("change", { bubbles: true, composed: false }),
      );
    }
  };

  private _onCheckboxChange = () => {
    // Sync the host attribute with the checkbox's state and dispatch event
    this.checked = this._checkbox?.checked ?? false;
    this.dispatchEvent(new Event("change", { bubbles: true, composed: false }));
  };

  /**
   * Programmatically focuses the toggle switch.
   */
  focus() {
    this._checkbox?.focus();
  }

  /**
   * Programmatically blurs the toggle switch.
   */
  blur() {
    this._checkbox?.blur();
  }
}

// Define the custom element
// Do not define if already defined by plugin system
// customElements.define("teskooano-toggle", TeskooanoToggle);
