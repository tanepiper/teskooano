const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      margin-bottom: var(--space-md, 12px);
      font-family: var(--font-family, sans-serif);
      --slider-track-bg: var(--color-surface-inset, #1a1a2e);
      --slider-track-height: var(--space-xs, 4px);
      --slider-thumb-bg: var(--color-primary, #6c63ff);
      --slider-thumb-size: var(--space-lg, 16px);
      --slider-thumb-border: var(--color-border-light, #8888ff);
      --slider-value-color: var(--color-text-secondary, #aaa);
      --slider-value-width: 40px; /* Fixed width for value display */
      --slider-gap: var(--space-sm, 8px);
    }
    .slider-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-xxs, 2px);
    }
    .control-row {
        display: flex;
        align-items: center;
        gap: var(--slider-gap);
    }
    label {
      font-size: var(--font-size-sm, 0.9em);
      color: var(--color-text-secondary, #aaa);
      font-weight: var(--font-weight-medium, 500);
      margin-bottom: var(--space-xxs, 2px);
    }
    input[type="range"] {
      flex-grow: 1;
      appearance: none;
      -webkit-appearance: none; 
      width: 100%; 
      height: var(--slider-track-height);
      background: var(--slider-track-bg);
      outline: none;
      border-radius: var(--slider-track-height); /* Rounded track */
      cursor: pointer;
      margin: calc(var(--slider-thumb-size) / 2) 0; /* Center thumb vertically */
    }
    /* Thumb styles - WebKit */
    input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      -webkit-appearance: none;
      width: var(--slider-thumb-size);
      height: var(--slider-thumb-size);
      background: var(--slider-thumb-bg);
      border: 2px solid var(--slider-thumb-border);
      border-radius: 50%;
      cursor: pointer;
      margin-top: calc((var(--slider-thumb-size) / -2) + (var(--slider-track-height) / 2)); /* Vertical align */
    }
    /* Thumb styles - Mozilla */
    input[type="range"]::-moz-range-thumb {
      width: calc(var(--slider-thumb-size) - 4px); /* Adjust for border */
      height: calc(var(--slider-thumb-size) - 4px);
      background: var(--slider-thumb-bg);
      border: 2px solid var(--slider-thumb-border);
      border-radius: 50%;
      cursor: pointer;
    }
    /* Focus styles */
    input[type="range"]:focus::-webkit-slider-thumb {
       box-shadow: 0 0 0 3px var(--color-primary-alpha, rgba(108, 99, 255, 0.3)); 
    }
    input[type="range"]:focus::-moz-range-thumb {
       box-shadow: 0 0 0 3px var(--color-primary-alpha, rgba(108, 99, 255, 0.3)); 
    }
    /* Disabled state */
     :host([disabled]) input[type="range"] {
        opacity: 0.6;
        cursor: not-allowed;
    }
     :host([disabled]) input[type="range"]::-webkit-slider-thumb {
        background: var(--color-text-disabled, #777);
        border-color: var(--color-border-disabled, #555);
        cursor: not-allowed;
    }
     :host([disabled]) input[type="range"]::-moz-range-thumb {
        background: var(--color-text-disabled, #777);
        border-color: var(--color-border-disabled, #555);
        cursor: not-allowed;
    }

    .value-display {
      font-size: var(--font-size-sm, 0.9em);
      color: var(--slider-value-color);
      min-width: var(--slider-value-width);
      text-align: right;
      font-family: var(--font-family-monospace, monospace);
    }
     :host([disabled]) .value-display {
         opacity: 0.6;
     }
    /* Help text styles */
    .help-text-row {
        margin-top: var(--space-xxs, 2px);
    }
    .help-text {
        font-size: var(--font-size-xs, 0.8em);
        color: var(--color-text-secondary, #aaa);
        display: block;
    }
  </style>
  <div class="slider-wrapper">
    <label for="slider-input"><slot name="label">Label</slot></label>
    <div class="control-row">
        <input id="slider-input" type="range" part="input" />
        <span id="value-display" class="value-display" part="value" aria-live="polite"></span>
    </div>
    <div class="help-text-row">
        <span id="help-text-display" class="help-text"></span>
    </div>
  </div>
`;

export class TeskooanoSlider extends HTMLElement {
  static observedAttributes = [
    "label",
    "value",
    "min",
    "max",
    "step",
    "disabled",
    "help-text",
  ];

  private sliderElement: HTMLInputElement;
  private labelElement: HTMLLabelElement;
  private labelSlot: HTMLSlotElement;
  private valueDisplayElement: HTMLElement;
  private helpTextElement: HTMLElement;
  private _internalUpdate = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.sliderElement = this.shadowRoot!.querySelector("#slider-input")!;
    this.labelElement = this.shadowRoot!.querySelector("label")!;
    this.labelSlot = this.shadowRoot!.querySelector('slot[name="label"]')!;
    this.valueDisplayElement =
      this.shadowRoot!.querySelector("#value-display")!;
    this.helpTextElement =
      this.shadowRoot!.querySelector("#help-text-display")!;

    // Add event listeners
    this.sliderElement.addEventListener("input", this.handleInput);
    this.sliderElement.addEventListener("change", this.handleChange);
  }

  connectedCallback() {
    // Set default values for range input
    this.sliderElement.min = this.getAttribute("min") ?? "0";
    this.sliderElement.max = this.getAttribute("max") ?? "100";
    this.sliderElement.step = this.getAttribute("step") ?? "1";

    // Apply initial attributes
    this.updateLabelAttribute(this.getAttribute("label"));
    this.updateAttribute("disabled", this.getAttribute("disabled"));
    this.updateHelpTextAttribute(this.getAttribute("help-text"));

    // Apply value last to ensure min/max/step are already set
    this.updateValueAttribute(this.getAttribute("value") ?? "50");

    // Initialize value display
    this.updateValueDisplay();

    // Ensure the slider is accessible
    if (
      !this.sliderElement.hasAttribute("aria-label") &&
      !this.hasAttribute("aria-labelledby")
    ) {
      // Use the label text as ARIA label if no explicit ARIA attributes set
      const labelText =
        this.labelSlot.textContent?.trim() ||
        (this.querySelector('[slot="label"]')?.textContent?.trim() ?? "Slider");
      this.sliderElement.setAttribute("aria-label", labelText);
    }
  }

  disconnectedCallback() {
    // Clean up event listeners
    this.sliderElement.removeEventListener("input", this.handleInput);
    this.sliderElement.removeEventListener("change", this.handleChange);
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ) {
    if (oldValue === newValue) return;

    switch (name) {
      case "label":
        this.updateLabelAttribute(newValue);
        break;
      case "value":
        if (!this._internalUpdate) {
          this.updateValueAttribute(newValue);
        }
        break;
      case "min":
      case "max":
      case "step":
        this.updateRangeAttribute(name, newValue);
        // Revalidate current value after range changes
        this.validateAndClampValue();
        break;
      case "disabled":
        this.updateAttribute(name, newValue);
        break;
      case "help-text":
        this.updateHelpTextAttribute(newValue);
        break;
    }
  }

  private updateLabelAttribute(value: string | null) {
    // Only set label text content if no slotted content exists
    if (value !== null && !this.querySelector('[slot="label"]')) {
      this.labelSlot.textContent = value;
    }
    this.labelElement.setAttribute("for", "slider-input");

    // Update ARIA label when label changes
    const labelText =
      this.labelSlot.textContent?.trim() ||
      (this.querySelector('[slot="label"]')?.textContent?.trim() ?? "Slider");
    this.sliderElement.setAttribute("aria-label", labelText);
  }

  private updateValueAttribute(value: string | null) {
    const numValue = parseFloat(value || "50");
    if (!isNaN(numValue)) {
      // Set the value directly
      this.value = numValue;
    }
  }

  private updateRangeAttribute(name: string, value: string | null) {
    const defaultValue = name === "min" ? "0" : name === "max" ? "100" : "1";
    const attrValue = value !== null ? value : defaultValue;

    this.sliderElement.setAttribute(name, attrValue);
  }

  private updateAttribute(name: string, value: string | null) {
    if (name === "disabled") {
      const isDisabled = value !== null;
      this.sliderElement.disabled = isDisabled;
      this.toggleAttribute("disabled", isDisabled);

      // Add ARIA attributes for better accessibility
      this.sliderElement.setAttribute(
        "aria-disabled",
        isDisabled ? "true" : "false"
      );
    }
  }

  private updateHelpTextAttribute(value: string | null) {
    this.helpTextElement.textContent = value || "";

    // If help text is provided, link it to the input for accessibility
    if (value) {
      const helpTextId = "help-text-" + this.getUniqueId();
      this.helpTextElement.id = helpTextId;
      this.sliderElement.setAttribute("aria-describedby", helpTextId);
    } else {
      this.sliderElement.removeAttribute("aria-describedby");
    }
  }

  private validateAndClampValue() {
    const min = parseFloat(this.sliderElement.min);
    const max = parseFloat(this.sliderElement.max);
    const currentValue = this.value;

    // Clamp value to min/max range
    if (!isNaN(min) && !isNaN(max)) {
      const clampedValue = Math.max(min, Math.min(max, currentValue));
      if (clampedValue !== currentValue) {
        this.value = clampedValue;
      }
    }
  }

  private updateValueDisplay() {
    this.valueDisplayElement.textContent = this.sliderElement.value;
  }

  private handleInput = (e: Event) => {
    this.updateValueDisplay();

    // Update component value via setter and dispatch event
    this._internalUpdate = true;
    this.setAttribute("value", this.sliderElement.value);
    this._internalUpdate = false;

    this.dispatchEvent(
      new CustomEvent("input", {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      })
    );
  };

  private handleChange = () => {
    this.dispatchEvent(
      new CustomEvent("change", {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      })
    );
  };

  // Generate a simple unique ID for ARIA attributes
  private getUniqueId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  // Getter/Setter for value property
  get value(): number {
    const numValue = parseFloat(this.sliderElement.value);
    return isNaN(numValue) ? 0 : numValue;
  }

  set value(newValue: number) {
    const min = parseFloat(this.sliderElement.min);
    const max = parseFloat(this.sliderElement.max);
    let clampedValue = newValue;

    // Clamp value to min/max range
    if (!isNaN(min) && !isNaN(max)) {
      clampedValue = Math.max(min, Math.min(max, newValue));
    }

    // Only update if value actually changes
    if (this.sliderElement.valueAsNumber !== clampedValue) {
      this.sliderElement.valueAsNumber = clampedValue;
      this.updateValueDisplay();

      // Update the attribute to keep them in sync
      this._internalUpdate = true;
      this.setAttribute("value", String(clampedValue));
      this._internalUpdate = false;
    }
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

customElements.define("teskooano-slider", TeskooanoSlider);
