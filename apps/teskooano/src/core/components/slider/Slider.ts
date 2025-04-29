import { CustomEvents } from "@teskooano/data-types";

import { template } from "./Slider.template";

import { atom } from "nanostores";

// Define the slider state interface
interface SliderState {
  value: number;
  min: number;
  max: number;
  step: number;
  isDisabled: boolean;
  isInvalid: boolean;
  isEditable: boolean;
  isEditing: boolean;
  draftValue: string;
}

// Simple debounce utility function
function debounce(func: Function, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return function (this: any, ...args: any[]) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
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

  private sliderElement: HTMLInputElement;
  private labelElement: HTMLLabelElement;
  private labelSlot: HTMLSlotElement;
  private valueDisplayElement: HTMLElement;
  private helpTextElement: HTMLElement;
  private valueInputElement: HTMLInputElement;
  private _debouncedHandleValueInput: (...args: any[]) => void;

  // Store for internal state
  private state = atom<SliderState>({
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    isDisabled: false,
    isInvalid: false,
    isEditable: false,
    isEditing: false,
    draftValue: "50",
  });

  // Unsubscribe function
  private unsubscribe: (() => void) | null = null;

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
    this.valueInputElement = this.shadowRoot!.querySelector("#value-input")!;

    // Create debounced handler for actual value updates
    this._debouncedHandleValueInput = debounce(
      this.handleValueUpdate.bind(this),
      300,
    ); // Renamed for clarity
  }

  connectedCallback() {
    // Set default values based on attributes
    const min = parseFloat(this.getAttribute("min") ?? "0");
    const max = parseFloat(this.getAttribute("max") ?? "100");
    const step = parseFloat(this.getAttribute("step") ?? "1");
    const value = parseFloat(this.getAttribute("value") ?? "50");
    const isDisabled = this.hasAttribute("disabled");
    const isEditable = this.hasAttribute("editable-value");

    // Initialize state
    this.state.set({
      value: isNaN(value) ? 50 : value,
      min: isNaN(min) ? 0 : min,
      max: isNaN(max) ? 100 : max,
      step: isNaN(step) ? 1 : step,
      isDisabled,
      isInvalid: false,
      isEditable,
      isEditing: false,
      draftValue: "50",
    });

    // Apply initial attributes
    this.updateLabelAttribute(this.getAttribute("label"));
    this.updateHelpTextAttribute(this.getAttribute("help-text"));

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

    // Add event listeners now that the element is in the DOM
    this.sliderElement.addEventListener("input", this.handleInput);
    this.valueInputElement.addEventListener(
      "input",
      this._debouncedHandleValueInput,
    );
    // Add separate listener for immediate visual validation
    this.valueInputElement.addEventListener(
      "input",
      this.handleVisualValidation,
    );
    // Add blur handler to reset when focus is lost
    this.valueInputElement.addEventListener("blur", this.handleInputBlur);

    // Subscribe to state changes
    this.unsubscribe = this.state.subscribe(this.updateUI);

    // Initial UI update
    this.updateUI(this.state.get());
  }

  disconnectedCallback() {
    // Clean up event listeners
    this.sliderElement.removeEventListener("input", this.handleInput);
    this.valueInputElement.removeEventListener(
      "input",
      this._debouncedHandleValueInput,
    );
    this.valueInputElement.removeEventListener(
      "input",
      this.handleVisualValidation,
    );
    this.valueInputElement.removeEventListener("blur", this.handleInputBlur);

    // Unsubscribe from store
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;

    const currentState = this.state.get();
    switch (name) {
      case "label":
        this.updateLabelAttribute(newValue);
        break;
      case "value":
        const numValue = parseFloat(newValue || "50");
        if (!isNaN(numValue) && numValue !== currentState.value) {
          this.state.set({ ...currentState, value: numValue });
        }
        break;
      case "min":
        const minValue = parseFloat(newValue || "0");
        if (!isNaN(minValue) && minValue !== currentState.min) {
          this.state.set({ ...currentState, min: minValue });
        }
        break;
      case "max":
        const maxValue = parseFloat(newValue || "100");
        if (!isNaN(maxValue) && maxValue !== currentState.max) {
          this.state.set({ ...currentState, max: maxValue });
        }
        break;
      case "step":
        const stepValue = parseFloat(newValue || "1");
        if (!isNaN(stepValue) && stepValue !== currentState.step) {
          this.state.set({ ...currentState, step: stepValue });
        }
        break;
      case "disabled":
        const isDisabled = newValue !== null;
        if (isDisabled !== currentState.isDisabled) {
          this.state.set({ ...currentState, isDisabled });
        }
        break;
      case "help-text":
        this.updateHelpTextAttribute(newValue);
        break;
      case "editable-value":
        const isEditable = newValue !== null;
        if (isEditable !== currentState.isEditable) {
          this.state.set({ ...currentState, isEditable });
        }
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

  // Central method to update UI from state
  private updateUI = (state: SliderState) => {
    // Update range input
    this.sliderElement.min = state.min.toString();
    this.sliderElement.max = state.max.toString();
    this.sliderElement.step = state.step.toString();
    this.sliderElement.valueAsNumber = state.value;
    this.sliderElement.disabled = state.isDisabled;

    // Update value display
    this.valueDisplayElement.textContent = state.value.toString();

    // Update number input - only if not currently being edited
    if (!state.isEditing) {
      this.valueInputElement.min = state.min.toString();
      this.valueInputElement.max = state.max.toString();
      this.valueInputElement.step = state.step.toString();
      this.valueInputElement.value = state.value.toString();
    } else {
      // When editing, keep the draft value in the input
      this.valueInputElement.value = state.draftValue;
    }
    this.valueInputElement.disabled = state.isDisabled;

    // Toggle invalid class
    if (state.isInvalid) {
      this.valueInputElement.classList.add("invalid");
    } else {
      this.valueInputElement.classList.remove("invalid");
    }

    // Set component attributes to match state
    this.toggleAttribute("disabled", state.isDisabled);
    this.toggleAttribute("editable-value", state.isEditable);

    // Set ARIA states
    this.sliderElement.setAttribute(
      "aria-disabled",
      state.isDisabled ? "true" : "false",
    );

    // Update the value attribute without triggering attributeChangedCallback
    if (this.getAttribute("value") !== state.value.toString()) {
      this._silentAttributeUpdate("value", state.value.toString());
    }
  };

  // Update attribute without triggering attributeChangedCallback
  private _silentAttributeUpdate(name: string, value: string) {
    // Save current observer
    const observer = (this.constructor as any).observedAttributes;
    // Temporarily remove attribute from observed list
    (this.constructor as any).observedAttributes = [];
    // Update attribute
    this.setAttribute(name, value);
    // Restore observer
    (this.constructor as any).observedAttributes = observer;
  }

  private handleInput = (e: Event) => {
    // Update the store with the new value from the slider
    const value = this.sliderElement.valueAsNumber;
    const currentState = this.state.get();

    if (!isNaN(value) && value !== currentState.value) {
      this.state.set({
        ...currentState,
        value,
        isInvalid: false,
      });

      // Dispatch change event
      this.dispatchEvent(
        new CustomEvent(CustomEvents.SLIDER_CHANGE, {
          bubbles: true,
          composed: true,
          detail: { value },
        }),
      );
    }
  };

  // Handles immediate visual validation on the number input
  private handleVisualValidation = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = target.value;
    const numValue = parseFloat(value);
    const currentState = this.state.get();
    const { min, max } = currentState;

    // Update state in one go: set editing, draft, and validity
    this.state.set({
      ...currentState,
      isEditing: true,
      draftValue: value,
      isInvalid:
        value !== "" && (isNaN(numValue) || numValue < min || numValue > max),
    });
  };

  // Renamed: Handles the debounced update after input
  private handleValueUpdate = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = target.value;
    const numValue = parseFloat(value);
    const currentState = this.state.get();
    const { min, max } = currentState;

    // Validate: Check if it's a number and within range
    if (value === "" || isNaN(numValue) || numValue < min || numValue > max) {
      // Just prevent update if invalid - visual feedback already handled
      return;
    } else {
      // Value is valid - update state and dispatch event
      this.state.set({
        ...currentState,
        value: numValue,
        isInvalid: false,
        isEditing: false, // No longer editing since we've accepted the value
      });

      // Dispatch change event
      this.dispatchEvent(
        new CustomEvent(CustomEvents.SLIDER_CHANGE, {
          bubbles: true,
          composed: true,
          detail: { value: numValue },
        }),
      );
    }
  };

  // Handle when the input loses focus - always reset to valid state
  private handleInputBlur = (e: Event) => {
    const currentState = this.state.get();
    const { draftValue, min, max } = currentState;
    const numValue = parseFloat(draftValue);

    // Check if the draft value is valid
    const isValid =
      draftValue !== "" &&
      !isNaN(numValue) &&
      numValue >= min &&
      numValue <= max;

    if (isValid) {
      // If valid on blur, commit the value immediately
      this.state.set({
        ...currentState,
        value: numValue,
        isInvalid: false,
        isEditing: false,
      });
      // Dispatch change event if value changed
      if (numValue !== currentState.value) {
        this.dispatchEvent(
          new CustomEvent(CustomEvents.SLIDER_CHANGE, {
            bubbles: true,
            composed: true,
            detail: { value: numValue },
          }),
        );
      }
    } else {
      // If invalid on blur, just stop editing and revert to last valid value
      this.state.set({
        ...currentState,
        isEditing: false,
        // isInvalid might already be true, keep it or reset? Resetting seems safer.
        isInvalid: false,
      });
    }
  };

  // Generate a simple unique ID for ARIA attributes
  private getUniqueId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  // Getter/Setter for value property
  get value(): number {
    return this.state.get().value;
  }

  set value(newValue: number) {
    const currentState = this.state.get();
    const { min, max } = currentState;

    // Clamp value to min/max range
    const clampedValue = Math.max(min, Math.min(max, newValue));

    // Only update if the value actually changes
    if (clampedValue !== currentState.value) {
      this.state.set({
        ...currentState,
        value: clampedValue,
        isInvalid: false,
      });

      // Dispatch change event
      this.dispatchEvent(
        new CustomEvent(CustomEvents.SLIDER_CHANGE, {
          bubbles: true,
          composed: true,
          detail: { value: clampedValue },
        }),
      );
    }
  }

  // Getter/Setter for disabled property
  get disabled(): boolean {
    return this.state.get().isDisabled;
  }

  set disabled(isDisabled: boolean) {
    this.state.set({ ...this.state.get(), isDisabled });
  }
}
