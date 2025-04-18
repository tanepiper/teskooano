const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block; /* Or inline-block, depending on desired layout */
      margin-bottom: var(--space-md, 12px);
      font-family: var(--font-family, sans-serif);
    }
    .input-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-xxs, 2px);
    }
    label {
      font-size: var(--font-size-sm, 0.9em);
      color: var(--color-text-secondary, #aaa);
      font-weight: var(--font-weight-medium, 500);
    }
    input {
      box-sizing: border-box;
      width: 100%;
      padding: var(--space-xs, 4px) var(--space-sm, 8px);
      border: 1px solid var(--color-border, #50506a);
      border-radius: var(--border-radius-sm, 3px);
      background-color: var(--color-surface-inset, #1a1a2e);
      color: var(--color-text, #e0e0fc);
      font-size: var(--font-size-md, 1em);
      line-height: 1.5;
    }
    input:focus {
      outline: 2px solid var(--color-primary-light, #9fa8da);
      outline-offset: 1px;
      border-color: var(--color-primary-light, #9fa8da);
    }
    input[type="number"] {
      text-align: right;
    }
    input[disabled] {
      opacity: 0.6;
      cursor: not-allowed;
      background-color: var(--color-surface-disabled, #303040);
    }
    /* Hide number spinners */
    input[type=number]::-webkit-inner-spin-button, 
    input[type=number]::-webkit-outer-spin-button { 
      -webkit-appearance: none; 
      margin: 0; 
    }
    input[type=number] {
      -moz-appearance: textfield; /* Firefox */
    }
  </style>
  <div class="input-wrapper">
    <label for="input-field"><slot name="label">Label</slot></label>
    <input id="input-field" type="text" part="input"/>
  </div>
`;

export class TeskooanoInputField extends HTMLElement {
  static observedAttributes = [
    "label",
    "type",
    "value",
    "placeholder",
    "disabled",
    "min",
    "max",
    "step",
  ];

  private inputElement: HTMLInputElement;
  private labelElement: HTMLLabelElement;
  private labelSlot: HTMLSlotElement;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.inputElement = this.shadowRoot!.querySelector("#input-field")!;
    this.labelElement = this.shadowRoot!.querySelector("label")!;
    this.labelSlot = this.shadowRoot!.querySelector('slot[name="label"]')!;

    // Forward input/change events
    this.inputElement.addEventListener("input", (e) => {
      this.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          composed: true,
          data: this.inputElement.value,
        }),
      );
    });
    this.inputElement.addEventListener("change", (e) => {
      this.dispatchEvent(
        new Event("change", { bubbles: true, composed: true }),
      );
    });
  }

  connectedCallback() {
    this.updateAttribute("label", this.getAttribute("label"));
    this.updateAttribute("type", this.getAttribute("type") || "text");
    this.updateAttribute("value", this.getAttribute("value"));
    this.updateAttribute("placeholder", this.getAttribute("placeholder"));
    this.updateAttribute("disabled", this.getAttribute("disabled"));
    this.updateAttribute("min", this.getAttribute("min"));
    this.updateAttribute("max", this.getAttribute("max"));
    this.updateAttribute("step", this.getAttribute("step"));
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    this.updateAttribute(name, newValue);
  }

  private updateAttribute(name: string, value: string | null) {
    switch (name) {
      case "label":
        // Update slot content if label attribute is set, otherwise default slot is used
        if (value !== null && !this.querySelector('[slot="label"]')) {
          this.labelSlot.textContent = value;
        }
        // Ensure label's 'for' matches input ID
        this.labelElement.setAttribute("for", "input-field");
        break;
      case "type":
        this.inputElement.type = value || "text";
        break;
      case "value":
        // Only update if value is different to prevent cursor jumping
        if (this.inputElement.value !== value) {
          this.inputElement.value = value || "";
        }
        break;
      case "placeholder":
        if (value !== null) this.inputElement.placeholder = value;
        else this.inputElement.removeAttribute("placeholder");
        break;
      case "disabled":
        if (value !== null) {
          this.inputElement.setAttribute("disabled", "");
          this.inputElement.setAttribute("aria-disabled", "true");
        } else {
          this.inputElement.removeAttribute("disabled");
          this.inputElement.removeAttribute("aria-disabled");
        }
        break;
      case "min":
      case "max":
      case "step":
        if (value !== null) this.inputElement.setAttribute(name, value);
        else this.inputElement.removeAttribute(name);
        break;
    }
  }

  // Getter/Setter for value property
  get value(): string | number {
    if (this.inputElement.type === "number") {
      return this.inputElement.valueAsNumber;
    }
    return this.inputElement.value;
  }

  set value(newValue: string | number) {
    if (this.inputElement.type === "number") {
      this.inputElement.valueAsNumber =
        typeof newValue === "string" ? parseFloat(newValue) : newValue;
    } else {
      this.inputElement.value = String(newValue);
    }
    // Reflect change back to attribute if needed (optional)
    // this.setAttribute('value', String(newValue));
  }

  // Getter/Setter for disabled property
  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(isDisabled: boolean) {
    if (isDisabled) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }
}

customElements.define("teskooano-input-field", TeskooanoInputField);
