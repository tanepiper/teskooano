import { CustomEvents, SliderValueChangePayload } from "@teskooano/data-types";
import { template } from "./Slider.template";
import {
  BehaviorSubject,
  Subject,
  Subscription,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  tap,
} from "rxjs";

// Define the slider state interface - simplified as subjects manage state
interface SliderUIState {
  value: number;
  min: number;
  max: number;
  step: number;
  isDisabled: boolean;
  isEditable: boolean;
  isInvalid: boolean;
  inputValue: string; // Represents the current text in the input field
}

// Simple utility (can be kept or replaced if RxJS provides better)
// function debounce(func: Function, delay: number) { ... } // Removed, using RxJS debounceTime

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

  // --- DOM Elements ---
  private sliderElement!: HTMLInputElement;
  private labelElement!: HTMLLabelElement;
  private labelSlot!: HTMLSlotElement;
  private valueDisplayElement!: HTMLElement;
  private helpTextElement!: HTMLElement;
  private valueInputElement!: HTMLInputElement;

  // --- RxJS State Subjects ---
  private valueSubject = new BehaviorSubject<number>(50);
  private minSubject = new BehaviorSubject<number>(0);
  private maxSubject = new BehaviorSubject<number>(100);
  private stepSubject = new BehaviorSubject<number>(1);
  private isDisabledSubject = new BehaviorSubject<boolean>(false);
  private isEditableSubject = new BehaviorSubject<boolean>(false);
  private isInvalidSubject = new BehaviorSubject<boolean>(false);
  // Subject specifically for the raw value typed into the input field
  private inputValueSubject = new BehaviorSubject<string>("");
  // Internal subject to trigger final value update after debounce
  private debouncedUpdateSubject = new Subject<number>();

  // --- RxJS Subscriptions ---
  private subscriptions = new Subscription();

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.initializeElements(); // Moved element selection to a method
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
    // Initialize subjects from attributes
    this.updateSubjectsFromAttributes();

    // Setup listeners
    this.setupEventListeners();

    // Setup RxJS pipelines
    this.setupRxJSPipelines();

    // Initial UI update (driven by combineLatest)
  }

  disconnectedCallback() {
    // Clean up event listeners (Optional if shadow DOM handles it, but good practice)
    this.removeEventListeners();
    // Clean up RxJS subscriptions
    this.subscriptions.unsubscribe();
    // Reset subscriptions container for potential re-connection
    this.subscriptions = new Subscription();
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;

    switch (name) {
      case "label":
        this.updateLabelAttribute(newValue);
        break;
      case "value":
        const numValue = this.parseAttributeSafe(newValue, 50);
        if (numValue !== this.valueSubject.getValue()) {
          this.valueSubject.next(numValue);
        }
        break;
      case "min":
        const minValue = this.parseAttributeSafe(newValue, 0);
        if (minValue !== this.minSubject.getValue()) {
          this.minSubject.next(minValue);
        }
        break;
      case "max":
        const maxValue = this.parseAttributeSafe(newValue, 100);
        if (maxValue !== this.maxSubject.getValue()) {
          this.maxSubject.next(maxValue);
        }
        break;
      case "step":
        const stepValue = this.parseAttributeSafe(newValue, 1, true); // step > 0
        if (stepValue !== this.stepSubject.getValue()) {
          this.stepSubject.next(stepValue);
        }
        break;
      case "disabled":
        const isDisabled = newValue !== null;
        if (isDisabled !== this.isDisabledSubject.getValue()) {
          this.isDisabledSubject.next(isDisabled);
        }
        break;
      case "help-text":
        this.updateHelpTextAttribute(newValue);
        break;
      case "editable-value":
        const isEditable = newValue !== null;
        if (isEditable !== this.isEditableSubject.getValue()) {
          this.isEditableSubject.next(isEditable);
        }
        break;
    }
  }

  // --- Helper Methods ---
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
      return defaultValue; // Or maybe 1 if it's a step? Context matters.
    }
    return num;
  }

  private updateSubjectsFromAttributes(): void {
    this.minSubject.next(this.parseAttributeSafe(this.getAttribute("min"), 0));
    this.maxSubject.next(
      this.parseAttributeSafe(this.getAttribute("max"), 100),
    );
    this.stepSubject.next(
      this.parseAttributeSafe(this.getAttribute("step"), 1, true),
    );
    this.valueSubject.next(
      this.parseAttributeSafe(this.getAttribute("value"), 50),
    );
    this.isDisabledSubject.next(this.hasAttribute("disabled"));
    this.isEditableSubject.next(this.hasAttribute("editable-value"));

    // Initialize input value based on current value subject
    this.inputValueSubject.next(this.valueSubject.getValue().toString());

    this.updateLabelAttribute(this.getAttribute("label"));
    this.updateHelpTextAttribute(this.getAttribute("help-text"));
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

  private setupRxJSPipelines(): void {
    // Combine core subjects to update UI elements reactively
    const coreState$ = combineLatest([
      this.valueSubject.pipe(distinctUntilChanged()),
      this.minSubject.pipe(distinctUntilChanged()),
      this.maxSubject.pipe(distinctUntilChanged()),
      this.stepSubject.pipe(distinctUntilChanged()),
      this.isDisabledSubject.pipe(distinctUntilChanged()),
      this.isEditableSubject.pipe(distinctUntilChanged()),
      this.isInvalidSubject.pipe(distinctUntilChanged()),
      this.inputValueSubject.pipe(distinctUntilChanged()), // Include input value for direct binding
    ]).pipe(
      map(
        ([
          value,
          min,
          max,
          step,
          isDisabled,
          isEditable,
          isInvalid,
          inputValue,
        ]): SliderUIState => ({
          value,
          min,
          max,
          step,
          isDisabled,
          isEditable,
          isInvalid,
          inputValue,
        }),
      ),
    );

    // Subscription to update the actual DOM based on combined state
    this.subscriptions.add(
      coreState$.subscribe((state) => this.updateUI(state)),
    );

    // --- Input Value Handling ---
    // Debounced pipeline for updating the main valueSubject and dispatching event
    this.subscriptions.add(
      this.debouncedUpdateSubject
        .pipe(
          debounceTime(400), // Debounce time for text input changes
          distinctUntilChanged(), // Only proceed if the debounced value changes
          filter((value) => !this.isInvalidSubject.getValue()), // Only update if valid
          tap((finalValue) => {
            // Update the main value subject *after* debounce and validation
            this.valueSubject.next(finalValue);
            // Dispatch the custom event with the final, validated value
            this.dispatchEvent(
              new CustomEvent<SliderValueChangePayload>(
                CustomEvents.SLIDER_CHANGE,
                {
                  detail: { value: finalValue },
                  bubbles: true,
                  composed: true,
                },
              ),
            );
          }),
        )
        .subscribe(), // No action needed in subscribe, tap handles side effects
    );
  }

  // --- Event Handlers ---
  private handleSliderInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = parseFloat(target.value);

    if (!isNaN(newValue) && !this.isDisabledSubject.getValue()) {
      // Update the main value subject immediately
      this.valueSubject.next(newValue);
      // Update the input field text to match
      this.inputValueSubject.next(newValue.toString());
      // Reset invalid state if slider is moved
      this.isInvalidSubject.next(false);

      // Dispatch event immediately for slider changes
      this.dispatchEvent(
        new CustomEvent<SliderValueChangePayload>(CustomEvents.SLIDER_CHANGE, {
          detail: { value: newValue },
          bubbles: true,
          composed: true,
        }),
      );
    }
  };

  private handleTextInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const rawValue = target.value;
    this.inputValueSubject.next(rawValue); // Update visual input state immediately

    const numValue = parseFloat(rawValue);
    const min = this.minSubject.getValue();
    const max = this.maxSubject.getValue();

    if (isNaN(numValue) || numValue < min || numValue > max) {
      this.isInvalidSubject.next(true);
    } else {
      this.isInvalidSubject.next(false);
      // Push the potentially valid number to the debounced update stream
      const step = this.stepSubject.getValue();
      const steppedValue = Math.round((numValue - min) / step) * step + min;
      const clampedValue = Math.max(min, Math.min(steppedValue, max));
      this.debouncedUpdateSubject.next(clampedValue);
    }
  };

  private handleInputBlur = () => {
    // If the input is invalid when blurred, reset it to the last valid value
    if (this.isInvalidSubject.getValue()) {
      const lastValidValue = this.valueSubject.getValue();
      this.inputValueSubject.next(lastValidValue.toString());
      this.isInvalidSubject.next(false); // Reset invalid state on blur reset
    }
    // Optionally: if valid but different from slider, could snap here too,
    // but debouncedUpdateSubject should handle the final valid update.
  };

  // --- UI Update Logic ---
  private updateUI = (state: SliderUIState) => {
    // Update slider attributes
    this._silentAttributeUpdate("value", state.value.toString());
    this._silentAttributeUpdate("min", state.min.toString());
    this._silentAttributeUpdate("max", state.max.toString());
    this._silentAttributeUpdate("step", state.step.toString());
    this.sliderElement.disabled = state.isDisabled;
    this.valueInputElement.disabled = state.isDisabled;

    // Update host attributes for styling
    if (state.isDisabled) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
    if (state.isEditable) {
      this.setAttribute("editable-value", "");
    } else {
      this.removeAttribute("editable-value");
    }

    // Update value display/input
    this.valueDisplayElement.textContent = state.value.toFixed(
      this.calculatePrecision(state.step),
    );
    // Directly bind input value to inputValue state
    if (this.valueInputElement.value !== state.inputValue) {
      this.valueInputElement.value = state.inputValue;
    }

    // Update validity styling
    if (state.isInvalid) {
      this.valueInputElement.classList.add("invalid");
    } else {
      this.valueInputElement.classList.remove("invalid");
    }

    // Ensure slider reflects the *committed* value, not necessarily the draft input value
    // This handles cases where the input is invalid or being debounced.
    if (parseFloat(this.sliderElement.value) !== state.value) {
      this.sliderElement.value = state.value.toString();
    }
  };

  // Prevent infinite loops when setting element attributes from state
  private _silentAttributeUpdate(name: string, value: string) {
    const currentAttr = this.sliderElement.getAttribute(name);
    if (currentAttr !== value) {
      this.sliderElement.setAttribute(name, value);
    }
  }

  private updateLabelAttribute(value: string | null) {
    if (value !== null && !this.querySelector('[slot="label"]')) {
      this.labelSlot.textContent = value;
    }
    this.labelElement.setAttribute("for", "slider-input");
    const labelText =
      this.labelSlot.textContent?.trim() ||
      this.querySelector('[slot="label"]')?.textContent?.trim() ||
      "Slider";
    this.sliderElement.setAttribute("aria-label", labelText);
  }

  private updateHelpTextAttribute(value: string | null) {
    this.helpTextElement.textContent = value || "";
    if (value) {
      const helpTextId = "help-text-" + this.getUniqueId();
      this.helpTextElement.id = helpTextId;
      this.sliderElement.setAttribute("aria-describedby", helpTextId);
    } else {
      this.sliderElement.removeAttribute("aria-describedby");
    }
  }

  private calculatePrecision(step: number): number {
    const stepString = step.toString();
    if (stepString.includes(".")) {
      return stepString.split(".")[1].length;
    }
    return 0;
  }

  private getUniqueId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  // --- Public Accessors ---
  get value(): number {
    return this.valueSubject.getValue();
  }

  set value(newValue: number) {
    // Consider clamping/stepping newValue based on min/max/step before updating
    const min = this.minSubject.getValue();
    const max = this.maxSubject.getValue();
    const step = this.stepSubject.getValue();
    const steppedValue = Math.round((newValue - min) / step) * step + min;
    const clampedValue = Math.max(min, Math.min(steppedValue, max));

    if (!isNaN(clampedValue) && clampedValue !== this.valueSubject.getValue()) {
      this.valueSubject.next(clampedValue);
    }
  }

  get disabled(): boolean {
    return this.isDisabledSubject.getValue();
  }

  set disabled(isDisabled: boolean) {
    if (isDisabled !== this.isDisabledSubject.getValue()) {
      this.isDisabledSubject.next(isDisabled);
    }
  }
}

// Define the custom event type for better type checking
declare global {
  interface HTMLElementEventMap {
    [CustomEvents.SLIDER_CHANGE]: CustomEvent<SliderValueChangePayload>;
  }
}
