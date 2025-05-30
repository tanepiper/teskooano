const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: flex;
      justify-content: space-between; /* Align label and value */
      align-items: baseline; /* Align text baselines */
      gap: var(--space-3); /* Was var(--space-md, 12px) -> var(--space-3) is 12px */
      font-family: var(--font-family-base);
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      padding: var(--space-1) 0; /* Add some vertical padding */
      border-bottom: var(--border-width-thin) solid var(--color-border-subtle); /* Optional separator */
    }
    :host(:last-child) {
        border-bottom: none; /* Remove border for the last item in a group */
    }

    .label {
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
      white-space: nowrap; /* Prevent label wrapping */
      margin-right: auto; /* Push value to the right */
    }

    .value {
      font-weight: var(--font-weight-normal); /* Was var(--font-weight-regular, 400) */
      color: var(--color-text-primary);
      text-align: right;
      word-break: break-word; /* Allow long values to wrap */
    }
  </style>
  <span class="label" part="label"><slot name="label">Label</slot></span>
  <span class="value" part="value"><slot>Value</slot></span>
`;

export class TeskooanoLabeledValue extends HTMLElement {
  static observedAttributes = ["label", "value"];

  private labelSlot: HTMLSlotElement;
  private valueSlot: HTMLSlotElement;
  private labelSpan: HTMLSpanElement;
  private valueSpan: HTMLSpanElement;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.labelSlot = this.shadowRoot!.querySelector('slot[name="label"]')!;
    this.valueSlot = this.shadowRoot!.querySelector("slot:not([name])")!;
    this.labelSpan = this.shadowRoot!.querySelector(".label")!;
    this.valueSpan = this.shadowRoot!.querySelector(".value")!;

    this.labelSlot.addEventListener("slotchange", () =>
      this.updateAttribute("label", this.getAttribute("label")),
    );
    this.valueSlot.addEventListener("slotchange", () =>
      this.updateAttribute("value", this.getAttribute("value")),
    );
  }

  connectedCallback() {
    this.updateAttribute("label", this.getAttribute("label"));
    this.updateAttribute("value", this.getAttribute("value"));
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
        if (value !== null && this.labelSlot.assignedNodes().length === 0) {
          this.labelSpan.textContent = value;
        } else if (
          value === null &&
          this.labelSlot.assignedNodes().length === 0
        ) {
          this.labelSpan.textContent = "";
        } else if (this.labelSlot.assignedNodes().length > 0) {
          this.labelSpan.textContent = "";
        }
        break;
      case "value":
        if (value !== null && this.valueSlot.assignedNodes().length === 0) {
          this.valueSpan.textContent = value;
        } else if (
          value === null &&
          this.valueSlot.assignedNodes().length === 0
        ) {
          this.valueSpan.textContent = "";
        } else if (this.valueSlot.assignedNodes().length > 0) {
          this.valueSpan.textContent = "";
        }
        break;
    }
  }
}
