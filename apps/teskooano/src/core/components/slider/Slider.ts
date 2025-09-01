import { CustomEvents, SliderValueChangePayload } from "@teskooano/data-types";
import { template } from "./Slider.template";

export class TeskooanoSlider extends HTMLElement {
  static observedAttributes = [
    "label",
    "value",
    "min",
    "max",
    "step",
    "disabled",
    "help-text",
    "editable-value",
  ];

  private sliderElement!: HTMLInputElement;
  private labelSlot!: HTMLSlotElement;
  private valueDisplayElement!: HTMLElement;
  private helpTextElement!: HTMLElement;
  private valueInputElement!: HTMLInputElement;

  // Simple properties
  private _value = 50;
  private _min = 0;
  private _max = 100;
  private _step = 1;
  private _disabled = false;
  private _editable = false;
  private _label = "Slider";
  private _helpText = "";

  private debounceTimeout: number | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.initializeElements();
    this.setupEventListeners();
    this.updateUI();
  }

  private initializeElements(): void {
    this.sliderElement = this.shadowRoot!.querySelector("#slider-input")!;
    this.labelSlot = this.shadowRoot!.querySelector('slot[name="label"]')!;
    this.valueDisplayElement =
      this.shadowRoot!.querySelector("#value-display")!;
    this.helpTextElement =
      this.shadowRoot!.querySelector("#help-text-display")!;
    this.valueInputElement = this.shadowRoot!.querySelector("#value-input")!;
  }

  disconnectedCallback() {
    this.removeEventListeners();
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;

    switch (name) {
      case "label":
        this._label = newValue || "Slider";
        break;
      case "value":
        this._value = this.parseNumber(newValue, this._value);
        break;
      case "min":
        this._min = this.parseNumber(newValue, 0);
        break;
      case "max":
        this._max = this.parseNumber(newValue, 100);
        break;
      case "step":
        this._step = this.parseNumber(newValue, 1);
        break;
      case "disabled":
        this._disabled = newValue !== null;
        break;
      case "help-text":
        this._helpText = newValue || "";
        break;
      case "editable-value":
        this._editable = newValue !== null;
        break;
    }

    this.updateUI();
  }

  private parseNumber(value: string | null, defaultValue: number): number {
    const num = parseFloat(value ?? "");
    return isNaN(num) ? defaultValue : num;
  }

  private setupEventListeners(): void {
    this.sliderElement.addEventListener("input", this.handleSliderChange);
    this.valueInputElement.addEventListener("input", this.handleInputChange);
    this.valueInputElement.addEventListener("blur", this.handleInputBlur);
  }

  private removeEventListeners(): void {
    this.sliderElement.removeEventListener("input", this.handleSliderChange);
    this.valueInputElement.removeEventListener("input", this.handleInputChange);
    this.valueInputElement.removeEventListener("blur", this.handleInputBlur);
  }

  private handleSliderChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = parseFloat(target.value);

    if (!isNaN(newValue) && !this._disabled) {
      this._value = newValue;
      this.updateValueDisplay();
      this.updateNumberInput();
      this.emitChangeEvent();
    }
  };

  private handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const rawValue = target.value;
    const numValue = parseFloat(rawValue);

    if (isNaN(numValue) || numValue < this._min || numValue > this._max) {
      this.valueInputElement.classList.add("invalid");
      return;
    }

    this.valueInputElement.classList.remove("invalid");

    // Apply step and clamp
    const steppedValue =
      Math.round((numValue - this._min) / this._step) * this._step + this._min;
    const clampedValue = Math.max(this._min, Math.min(steppedValue, this._max));

    // Debounce the update
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.debounceTimeout = window.setTimeout(() => {
      this._value = clampedValue;
      this.updateSlider();
      this.updateValueDisplay();
      this.emitChangeEvent();
    }, 400);
  };

  private handleInputBlur = () => {
    this.valueInputElement.classList.remove("invalid");
    this.updateNumberInput();
  };

  private updateUI(): void {
    if (!this.sliderElement || !this.valueInputElement) return;

    // Update slider
    this.sliderElement.min = this._min.toString();
    this.sliderElement.max = this._max.toString();
    this.sliderElement.step = this._step.toString();
    this.sliderElement.value = this._value.toString();
    this.sliderElement.disabled = this._disabled;

    // Update number input
    this.valueInputElement.min = this._min.toString();
    this.valueInputElement.max = this._max.toString();
    this.valueInputElement.step = this._step.toString();
    this.valueInputElement.value = this._value.toString();
    this.valueInputElement.disabled = this._disabled;

    // Update value display
    this.updateValueDisplay();

    // Update label
    this.updateLabel();

    // Update help text
    this.updateHelpText();

    // Update disabled attribute on host
    if (this._disabled) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }

    // Update editable attribute on host
    if (this._editable) {
      this.setAttribute("editable-value", "");
    } else {
      this.removeAttribute("editable-value");
    }
  }

  private updateSlider(): void {
    this.sliderElement.value = this._value.toString();
  }

  private updateNumberInput(): void {
    this.valueInputElement.value = this._value.toString();
  }

  private updateValueDisplay(): void {
    const precision = this.calculatePrecision(this._step);
    this.valueDisplayElement.textContent = this._value.toFixed(precision);
  }

  private updateLabel(): void {
    if (!this.querySelector('[slot="label"]')) {
      this.labelSlot.textContent = this._label;
    }
  }

  private updateHelpText(): void {
    // Only update slot content if there's no slotted help-text content
    if (!this.querySelector('[slot="help-text"]')) {
      const helpTextSlot = this.helpTextElement.querySelector(
        'slot[name="help-text"]',
      ) as HTMLSlotElement;
      if (helpTextSlot) {
        helpTextSlot.textContent = this._helpText;
      }
    }
  }

  private emitChangeEvent(): void {
    this.dispatchEvent(
      new CustomEvent<SliderValueChangePayload>(CustomEvents.SLIDER_CHANGE, {
        detail: { value: this._value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private calculatePrecision(step: number): number {
    const stepString = step.toString();
    if (stepString.includes(".")) {
      return stepString.split(".")[1].length;
    }
    return 0;
  }

  // Public API
  get value(): number {
    return this._value;
  }

  set value(newValue: number) {
    const steppedValue =
      Math.round((newValue - this._min) / this._step) * this._step + this._min;
    const clampedValue = Math.max(this._min, Math.min(steppedValue, this._max));

    if (!isNaN(clampedValue) && clampedValue !== this._value) {
      this._value = clampedValue;
      this.updateUI();
      this.emitChangeEvent();
    }
  }

  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(isDisabled: boolean) {
    if (isDisabled !== this._disabled) {
      this._disabled = isDisabled;
      this.updateUI();
    }
  }
}

declare global {
  interface HTMLElementEventMap {
    [CustomEvents.SLIDER_CHANGE]: CustomEvent<SliderValueChangePayload>;
  }
}
