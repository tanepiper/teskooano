import { CustomEvents, SliderValueChangePayload } from "@teskooano/data-types";
import { template } from "./Slider.template";
import {
  ReactiveState,
  EventBus,
  Events,
  createComponentState,
} from "@teskooano/ui-plugin/patterns";

interface SliderState {
  value: number;
  min: number;
  max: number;
  step: number;
  isDisabled: boolean;
  isEditable: boolean;
  isInvalid: boolean;
  inputValue: string;
  label: string;
  helpText: string;
}

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
  private labelElement!: HTMLLabelElement;
  private labelSlot!: HTMLSlotElement;
  private valueDisplayElement!: HTMLElement;
  private helpTextElement!: HTMLElement;
  private valueInputElement!: HTMLInputElement;

  // Use the new reactive state pattern
  private state = createComponentState(
    {
      value: 50,
      min: 0,
      max: 100,
      step: 1,
      isDisabled: false,
      isEditable: false,
      isInvalid: false,
      inputValue: "50",
      label: "Slider",
      helpText: "",
    } as SliderState,
    {
      componentName: "teskooano-slider",
    },
  );

  private debounceTimeout: number | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.initializeElements();
  }

  private initializeElements(): void {
    this.sliderElement = this.shadowRoot!.querySelector("#slider-input")!;
    this.labelElement = this.shadowRoot!.querySelector("label")!;
    this.labelSlot = this.shadowRoot!.querySelector('slot[name="label"]')!;
    this.valueDisplayElement =
      this.shadowRoot!.querySelector("#value-display")!;
    this.helpTextElement =
      this.shadowRoot!.querySelector("#help-text-display")!;
    this.valueInputElement = this.shadowRoot!.querySelector("#value-input")!;
  }

  connectedCallback() {
    this.updateStateFromAttributes();
    this.setupEventListeners();
    this.setupStateWatchers();
  }

  disconnectedCallback() {
    this.removeEventListeners();
    this.state.cleanup(); // Automatic cleanup of all subscriptions
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
        this.state.set("label", newValue || "Slider");
        break;
      case "value":
        const numValue = this.parseAttributeSafe(newValue, 50);
        this.state.set("value", numValue);
        this.state.set("inputValue", numValue.toString());
        break;
      case "min":
        const minValue = this.parseAttributeSafe(newValue, 0);
        this.state.set("min", minValue);
        break;
      case "max":
        const maxValue = this.parseAttributeSafe(newValue, 100);
        this.state.set("max", maxValue);
        break;
      case "step":
        const stepValue = this.parseAttributeSafe(newValue, 1, true);
        this.state.set("step", stepValue);
        break;
      case "disabled":
        const isDisabled = newValue !== null;
        this.state.set("isDisabled", isDisabled);
        break;
      case "help-text":
        this.state.set("helpText", newValue || "");
        break;
      case "editable-value":
        const isEditable = newValue !== null;
        this.state.set("isEditable", isEditable);
        break;
    }
  }

  private parseAttributeSafe(
    value: string | null,
    defaultValue: number,
    mustBePositive: boolean = false,
  ): number {
    const num = parseFloat(value ?? "");
    if (isNaN(num)) {
      return defaultValue;
    }
    if (mustBePositive && num <= 0) {
      return defaultValue;
    }
    return num;
  }

  private updateStateFromAttributes(): void {
    this.state.set("min", this.parseAttributeSafe(this.getAttribute("min"), 0));
    this.state.set(
      "max",
      this.parseAttributeSafe(this.getAttribute("max"), 100),
    );
    this.state.set(
      "step",
      this.parseAttributeSafe(this.getAttribute("step"), 1, true),
    );
    this.state.set(
      "value",
      this.parseAttributeSafe(this.getAttribute("value"), 50),
    );
    this.state.set("isDisabled", this.hasAttribute("disabled"));
    this.state.set("isEditable", this.hasAttribute("editable-value"));
    this.state.set("label", this.getAttribute("label") || "Slider");
    this.state.set("helpText", this.getAttribute("help-text") || "");
    this.state.set("inputValue", this.state.get("value").toString());
  }

  private setupEventListeners(): void {
    this.sliderElement.addEventListener("input", this.handleSliderInput);
    this.valueInputElement.addEventListener("input", this.handleTextInput);
    this.valueInputElement.addEventListener("blur", this.handleInputBlur);
  }

  private removeEventListeners(): void {
    this.sliderElement.removeEventListener("input", this.handleSliderInput);
    this.valueInputElement.removeEventListener("input", this.handleTextInput);
    this.valueInputElement.removeEventListener("blur", this.handleInputBlur);
  }

  private setupStateWatchers(): void {
    // Watch for value changes to update UI
    this.state.watch("value", (newValue: number) => {
      this.updateSliderValue(newValue);
      this.updateValueDisplay(newValue);
      this.emitChangeEvent(newValue);
    });

    // Watch for min/max/step changes to update slider attributes
    this.state.watch("min", (newValue: number) => {
      this.sliderElement.min = newValue.toString();
      this.valueInputElement.min = newValue.toString();
    });

    this.state.watch("max", (newValue: number) => {
      this.sliderElement.max = newValue.toString();
      this.valueInputElement.max = newValue.toString();
    });

    this.state.watch("step", (newValue: number) => {
      this.sliderElement.step = newValue.toString();
      this.valueInputElement.step = newValue.toString();
    });

    // Watch for disabled state changes
    this.state.watch("isDisabled", (isDisabled: boolean) => {
      this.sliderElement.disabled = isDisabled;
      this.valueInputElement.disabled = isDisabled;

      if (isDisabled) {
        this.setAttribute("disabled", "");
      } else {
        this.removeAttribute("disabled");
      }
    });

    // Watch for editable state changes
    this.state.watch("isEditable", (isEditable: boolean) => {
      if (isEditable) {
        this.setAttribute("editable-value", "");
      } else {
        this.removeAttribute("editable-value");
      }
    });

    // Watch for invalid state changes
    this.state.watch("isInvalid", (isInvalid: boolean) => {
      if (isInvalid) {
        this.valueInputElement.classList.add("invalid");
      } else {
        this.valueInputElement.classList.remove("invalid");
      }
    });

    // Watch for input value changes
    this.state.watch("inputValue", (newValue: string) => {
      if (this.valueInputElement.value !== newValue) {
        this.valueInputElement.value = newValue;
      }
    });

    // Watch for label changes
    this.state.watch("label", (newLabel: string) => {
      this.updateLabel(newLabel);
    });

    // Watch for help text changes
    this.state.watch("helpText", (newHelpText: string) => {
      this.updateHelpText(newHelpText);
    });
  }

  private handleSliderInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = parseFloat(target.value);

    if (!isNaN(newValue) && !this.state.get("isDisabled")) {
      this.state.set("value", newValue);
      this.state.set("inputValue", newValue.toString());
      this.state.set("isInvalid", false);
    }
  };

  private handleTextInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const rawValue = target.value;
    this.state.set("inputValue", rawValue);

    const numValue = parseFloat(rawValue);
    const min = this.state.get("min");
    const max = this.state.get("max");

    if (isNaN(numValue) || numValue < min || numValue > max) {
      this.state.set("isInvalid", true);
    } else {
      this.state.set("isInvalid", false);

      const step = this.state.get("step");
      const steppedValue = Math.round((numValue - min) / step) * step + min;
      const clampedValue = Math.max(min, Math.min(steppedValue, max));

      // Debounce the update to avoid too many events
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }
      this.debounceTimeout = window.setTimeout(() => {
        this.state.set("value", clampedValue);
      }, 400);
    }
  };

  private handleInputBlur = () => {
    if (this.state.get("isInvalid")) {
      const lastValidValue = this.state.get("value");
      this.state.set("inputValue", lastValidValue.toString());
      this.state.set("isInvalid", false);
    }
  };

  private updateSliderValue(value: number): void {
    if (parseFloat(this.sliderElement.value) !== value) {
      this.sliderElement.value = value.toString();
    }
  }

  private updateValueDisplay(value: number): void {
    const precision = this.calculatePrecision(this.state.get("step"));
    this.valueDisplayElement.textContent = value.toFixed(precision);
  }

  private updateLabel(label: string): void {
    if (!this.querySelector('[slot="label"]')) {
      this.labelSlot.textContent = label;
    }
    this.labelElement.setAttribute("for", "slider-input");
    const labelText =
      this.labelSlot.textContent?.trim() ||
      this.querySelector('[slot="label"]')?.textContent?.trim() ||
      label;
    this.sliderElement.setAttribute("aria-label", labelText);
  }

  private updateHelpText(helpText: string): void {
    this.helpTextElement.textContent = helpText;
    if (helpText) {
      const helpTextId = "help-text-" + this.getUniqueId();
      this.helpTextElement.id = helpTextId;
      this.sliderElement.setAttribute("aria-describedby", helpTextId);
    } else {
      this.sliderElement.removeAttribute("aria-describedby");
    }
  }

  private emitChangeEvent(value: number): void {
    this.dispatchEvent(
      new CustomEvent<SliderValueChangePayload>(CustomEvents.SLIDER_CHANGE, {
        detail: { value },
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

  private getUniqueId(): string {
    return performance.now().toString(36).substring(2, 9);
  }

  // Public API
  get value(): number {
    return this.state.get("value");
  }

  set value(newValue: number) {
    const min = this.state.get("min");
    const max = this.state.get("max");
    const step = this.state.get("step");
    const steppedValue = Math.round((newValue - min) / step) * step + min;
    const clampedValue = Math.max(min, Math.min(steppedValue, max));

    if (!isNaN(clampedValue) && clampedValue !== this.state.get("value")) {
      this.state.set("value", clampedValue);
    }
  }

  get disabled(): boolean {
    return this.state.get("isDisabled");
  }

  set disabled(isDisabled: boolean) {
    if (isDisabled !== this.state.get("isDisabled")) {
      this.state.set("isDisabled", isDisabled);
    }
  }
}

declare global {
  interface HTMLElementEventMap {
    [CustomEvents.SLIDER_CHANGE]: CustomEvent<SliderValueChangePayload>;
  }
}
