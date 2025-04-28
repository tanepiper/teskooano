const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: flex;
      justify-content: space-between; /* Align label and value */
      align-items: baseline; /* Align text baselines */
      gap: var(--space-md, 12px);
      font-family: var(--font-family, sans-serif);
      font-size: var(--font-size-md, 1em);
      color: var(--color-text, #e0e0fc);
      padding: var(--space-xs, 4px) 0; /* Add some vertical padding */
      border-bottom: 1px solid var(--color-border-subtle, #30304a); /* Optional separator */
    }
    :host(:last-child) {
        border-bottom: none; /* Remove border for the last item in a group */
    }

    .label {
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-secondary, #aaa);
      white-space: nowrap; /* Prevent label wrapping */
      margin-right: auto; /* Push value to the right */
    }

    .value {
      font-weight: var(--font-weight-regular, 400);
      color: var(--color-text, #e0e0fc);
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

    // Listen for changes in slotted content
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
        // Update the text span only if the named slot is empty
        if (value !== null && this.labelSlot.assignedNodes().length === 0) {
          this.labelSpan.textContent = value;
        } else if (
          value === null &&
          this.labelSlot.assignedNodes().length === 0
        ) {
          // Clear the span if attribute removed and slot empty
          this.labelSpan.textContent = "";
        } else if (this.labelSlot.assignedNodes().length > 0) {
          // If slot has content, ensure the span is empty so slot takes over
          this.labelSpan.textContent = "";
        }
        break;
      case "value":
        // Update the text span only if the default slot is empty
        if (value !== null && this.valueSlot.assignedNodes().length === 0) {
          this.valueSpan.textContent = value;
        } else if (
          value === null &&
          this.valueSlot.assignedNodes().length === 0
        ) {
          // Clear the span if attribute removed and slot empty
          this.valueSpan.textContent = "";
        } else if (this.valueSlot.assignedNodes().length > 0) {
          // If slot has content, ensure the span is empty so slot takes over
          this.valueSpan.textContent = "";
        }
        break;
    }
  }
}
