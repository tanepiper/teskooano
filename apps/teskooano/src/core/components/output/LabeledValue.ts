import { createComponentState } from "@teskooano/ui-plugin/patterns";

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

interface LabeledValueState {
  label: string;
  value: string;
  hasLabelSlot: boolean;
  hasValueSlot: boolean;
}

export class TeskooanoLabeledValue extends HTMLElement {
  static observedAttributes = ["label", "value"];

  private labelSlot: HTMLSlotElement;
  private valueSlot: HTMLSlotElement;
  private labelSpan: HTMLSpanElement;
  private valueSpan: HTMLSpanElement;

  // Use the new reactive state pattern
  private state = createComponentState(
    {
      label: "",
      value: "",
      hasLabelSlot: false,
      hasValueSlot: false,
    } as LabeledValueState,
    {
      componentName: "teskooano-labeled-value",
    },
  );

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.labelSlot = this.shadowRoot!.querySelector('slot[name="label"]')!;
    this.valueSlot = this.shadowRoot!.querySelector("slot:not([name])")!;
    this.labelSpan = this.shadowRoot!.querySelector(".label")!;
    this.valueSpan = this.shadowRoot!.querySelector(".value")!;
  }

  connectedCallback() {
    this.updateStateFromAttributes();
    this.setupStateWatchers();
    this.setupSlotListeners();
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;

    switch (name) {
      case "label":
        this.state.set("label", newValue || "");
        break;
      case "value":
        this.state.set("value", newValue || "");
        break;
    }
  }

  private updateStateFromAttributes(): void {
    this.state.set("label", this.getAttribute("label") || "");
    this.state.set("value", this.getAttribute("value") || "");
  }

  private setupStateWatchers(): void {
    // Watch for label changes
    this.state.watch("label", (label: string) => {
      this.updateLabelDisplay(label);
    });

    // Watch for value changes
    this.state.watch("value", (value: string) => {
      this.updateValueDisplay(value);
    });

    // Watch for slot availability changes
    this.state.watch("hasLabelSlot", () => {
      this.updateLabelDisplay(this.state.get("label"));
    });

    this.state.watch("hasValueSlot", () => {
      this.updateValueDisplay(this.state.get("value"));
    });
  }

  private setupSlotListeners(): void {
    this.labelSlot.addEventListener("slotchange", () => {
      this.state.set("hasLabelSlot", this.labelSlot.assignedNodes().length > 0);
    });

    this.valueSlot.addEventListener("slotchange", () => {
      this.state.set("hasValueSlot", this.valueSlot.assignedNodes().length > 0);
    });
  }

  private updateLabelDisplay(label: string): void {
    const hasLabelSlot = this.state.get("hasLabelSlot");

    if (label && !hasLabelSlot) {
      this.labelSpan.textContent = label;
    } else if (!label && !hasLabelSlot) {
      this.labelSpan.textContent = "";
    } else if (hasLabelSlot) {
      this.labelSpan.textContent = "";
    }
  }

  private updateValueDisplay(value: string): void {
    const hasValueSlot = this.state.get("hasValueSlot");

    if (value && !hasValueSlot) {
      this.valueSpan.textContent = value;
    } else if (!value && !hasValueSlot) {
      this.valueSpan.textContent = "";
    } else if (hasValueSlot) {
      this.valueSpan.textContent = "";
    }
  }

  /**
   * Cleanup when component is disconnected
   */
  disconnectedCallback() {
    this.state.cleanup(); // Automatic cleanup of all subscriptions
  }
}
