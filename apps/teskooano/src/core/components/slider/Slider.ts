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

interface SliderUIState {
  value: number;
  min: number;
  max: number;
  step: number;
  isDisabled: boolean;
  isEditable: boolean;
  isInvalid: boolean;
  inputValue: string;
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

  private valueSubject = new BehaviorSubject<number>(50);
  private minSubject = new BehaviorSubject<number>(0);
  private maxSubject = new BehaviorSubject<number>(100);
  private stepSubject = new BehaviorSubject<number>(1);
  private isDisabledSubject = new BehaviorSubject<boolean>(false);
  private isEditableSubject = new BehaviorSubject<boolean>(false);
  private isInvalidSubject = new BehaviorSubject<boolean>(false);

  private inputValueSubject = new BehaviorSubject<string>("");

  private debouncedUpdateSubject = new Subject<number>();

  private subscriptions = new Subscription();

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
    this.updateSubjectsFromAttributes();

    this.setupEventListeners();

    this.setupRxJSPipelines();
  }

  disconnectedCallback() {
    this.removeEventListeners();

    this.subscriptions.unsubscribe();

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
        const stepValue = this.parseAttributeSafe(newValue, 1, true);
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
    const coreState$ = combineLatest([
      this.valueSubject.pipe(distinctUntilChanged()),
      this.minSubject.pipe(distinctUntilChanged()),
      this.maxSubject.pipe(distinctUntilChanged()),
      this.stepSubject.pipe(distinctUntilChanged()),
      this.isDisabledSubject.pipe(distinctUntilChanged()),
      this.isEditableSubject.pipe(distinctUntilChanged()),
      this.isInvalidSubject.pipe(distinctUntilChanged()),
      this.inputValueSubject.pipe(distinctUntilChanged()),
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

    this.subscriptions.add(
      coreState$.subscribe((state) => this.updateUI(state)),
    );

    this.subscriptions.add(
      this.debouncedUpdateSubject
        .pipe(
          debounceTime(400),
          distinctUntilChanged(),
          filter((value) => !this.isInvalidSubject.getValue()),
          tap((finalValue) => {
            this.valueSubject.next(finalValue);

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
        .subscribe(),
    );
  }

  private handleSliderInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = parseFloat(target.value);

    if (!isNaN(newValue) && !this.isDisabledSubject.getValue()) {
      this.valueSubject.next(newValue);

      this.inputValueSubject.next(newValue.toString());

      this.isInvalidSubject.next(false);

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
    this.inputValueSubject.next(rawValue);

    const numValue = parseFloat(rawValue);
    const min = this.minSubject.getValue();
    const max = this.maxSubject.getValue();

    if (isNaN(numValue) || numValue < min || numValue > max) {
      this.isInvalidSubject.next(true);
    } else {
      this.isInvalidSubject.next(false);

      const step = this.stepSubject.getValue();
      const steppedValue = Math.round((numValue - min) / step) * step + min;
      const clampedValue = Math.max(min, Math.min(steppedValue, max));
      this.debouncedUpdateSubject.next(clampedValue);
    }
  };

  private handleInputBlur = () => {
    if (this.isInvalidSubject.getValue()) {
      const lastValidValue = this.valueSubject.getValue();
      this.inputValueSubject.next(lastValidValue.toString());
      this.isInvalidSubject.next(false);
    }
  };

  private updateUI = (state: SliderUIState) => {
    this._silentAttributeUpdate("value", state.value.toString());
    this._silentAttributeUpdate("min", state.min.toString());
    this._silentAttributeUpdate("max", state.max.toString());
    this._silentAttributeUpdate("step", state.step.toString());
    this.sliderElement.disabled = state.isDisabled;
    this.valueInputElement.disabled = state.isDisabled;

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

    this.valueDisplayElement.textContent = state.value.toFixed(
      this.calculatePrecision(state.step),
    );

    if (this.valueInputElement.value !== state.inputValue) {
      this.valueInputElement.value = state.inputValue;
    }

    if (state.isInvalid) {
      this.valueInputElement.classList.add("invalid");
    } else {
      this.valueInputElement.classList.remove("invalid");
    }

    if (parseFloat(this.sliderElement.value) !== state.value) {
      this.sliderElement.value = state.value.toString();
    }
  };

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

  get value(): number {
    return this.valueSubject.getValue();
  }

  set value(newValue: number) {
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

declare global {
  interface HTMLElementEventMap {
    [CustomEvents.SLIDER_CHANGE]: CustomEvent<SliderValueChangePayload>;
  }
}
