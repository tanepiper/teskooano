import { CustomEvents } from "@teskooano/data-types";
import { createComponentState } from "@teskooano/ui-plugin/patterns";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      margin-bottom: var(--space-md, 12px);
      font-family: var(--font-family, sans-serif);
      --select-bg: var(--color-surface-inset, #1a1a2e);
      --select-border: var(--color-border, #50506a);
      --select-text: var(--color-text, #e0e0fc);
      --select-arrow-color: var(--color-text-secondary, #aaa);
      --select-padding: var(--space-sm, 8px) var(--space-md, 12px);
      --select-border-radius: var(--border-radius-md, 5px);
      --select-disabled-opacity: 0.6;
    }
    .select-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-xxs, 2px);
    }
    label {
      font-size: var(--font-size-sm, 0.9em);
      color: var(--color-text-secondary, #aaa);
      font-weight: var(--font-weight-medium, 500);
      margin-bottom: var(--space-xxs, 2px);
    }
    select {
      display: block;
      width: 100%;
      padding: var(--select-padding);
      font-size: var(--font-size-md, 1em);
      font-family: inherit;
      color: var(--select-text);
      background-color: var(--select-bg);
      border: 1px solid var(--select-border);
      border-radius: var(--select-border-radius);
      cursor: pointer;
    }
    select:focus {
      outline: none;
      border-color: var(--color-primary, #6c63ff);
      box-shadow: 0 0 0 2px var(--color-primary-alpha, rgba(108, 99, 255, 0.3));
    }
    /* Disabled state */
    :host([disabled]) select {
        opacity: var(--select-disabled-opacity);
        cursor: not-allowed;
        background-color: var(--color-surface-disabled, #333);
    }
    :host([disabled]) label {
        opacity: var(--select-disabled-opacity);
    }
    /* Help text styles */
    .help-text {
        font-size: var(--font-size-xs, 0.8em);
        color: var(--color-text-secondary, #aaa);
        display: block;
        margin-top: var(--space-xxs, 2px);
    }
    :host([disabled]) .help-text {
        opacity: var(--select-disabled-opacity);
    }
  </style>
  <div class="select-wrapper">
    <label for="select-input"><slot name="label">Label</slot></label>
    <select id="select-input" part="select"></select>
    <span id="help-text" class="help-text"></span>
  </div>
`;

interface SelectState {
  value: string;
  isDisabled: boolean;
  label: string;
  helpText: string;
  options: Array<{
    value: string;
    text: string;
    disabled: boolean;
    selected: boolean;
  }>;
}

export class TeskooanoSelect extends HTMLElement {
  static observedAttributes = ["label", "value", "disabled", "help-text"];

  private selectElement: HTMLSelectElement;
  private labelElement: HTMLLabelElement;
  private labelSlot: HTMLSlotElement;
  private helpTextElement: HTMLElement;
  private mutationObserver: MutationObserver;

  // Use the new reactive state pattern
  private state = createComponentState(
    {
      value: "",
      isDisabled: false,
      label: "Select",
      helpText: "",
      options: [],
    } as SelectState,
    {
      componentName: "teskooano-select",
    },
  );

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.selectElement = this.shadowRoot!.querySelector("#select-input")!;
    this.labelElement = this.shadowRoot!.querySelector("label")!;
    this.labelSlot = this.shadowRoot!.querySelector('slot[name="label"]')!;
    this.helpTextElement = this.shadowRoot!.querySelector("#help-text")!;

    this.mutationObserver = new MutationObserver(this.handleOptionChanges);
  }

  connectedCallback() {
    this.updateStateFromAttributes();
    this.setupEventListeners();
    this.setupStateWatchers();
    this.setupMutationObserver();
    this.syncOptions();
  }

  disconnectedCallback() {
    this.removeEventListeners();
    this.mutationObserver.disconnect();
    this.state.cleanup(); // Automatic cleanup of all subscriptions
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;

    switch (name) {
      case "label":
        this.state.set("label", newValue || "Select");
        break;
      case "value":
        this.state.set("value", newValue || "");
        break;
      case "disabled":
        const isDisabled = newValue !== null;
        this.state.set("isDisabled", isDisabled);
        break;
      case "help-text":
        this.state.set("helpText", newValue || "");
        break;
    }
  }

  private updateStateFromAttributes(): void {
    this.state.set("label", this.getAttribute("label") || "Select");
    this.state.set("value", this.getAttribute("value") || "");
    this.state.set("isDisabled", this.hasAttribute("disabled"));
    this.state.set("helpText", this.getAttribute("help-text") || "");
  }

  private setupEventListeners(): void {
    this.selectElement.addEventListener("change", this.handleChange);
    this.addEventListener("click", this.handleClick);
  }

  private removeEventListeners(): void {
    this.selectElement.removeEventListener("change", this.handleChange);
    this.removeEventListener("click", this.handleClick);
  }

  private setupStateWatchers(): void {
    // Watch for value changes to update select element
    this.state.watch("value", (newValue: string) => {
      this.updateSelectValue(newValue);
    });

    // Watch for disabled state changes
    this.state.watch("isDisabled", (isDisabled: boolean) => {
      this.selectElement.disabled = isDisabled;
      this.selectElement.setAttribute(
        "aria-disabled",
        isDisabled ? "true" : "false",
      );

      if (isDisabled) {
        this.setAttribute("disabled", "");
      } else {
        this.removeAttribute("disabled");
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

    // Watch for options changes
    this.state.watch("options", (newOptions: SelectState["options"]) => {
      this.updateSelectOptions(newOptions);
    });
  }

  private setupMutationObserver(): void {
    this.mutationObserver.observe(this, {
      childList: true,
      subtree: false,
      characterData: false,
      attributes: false,
    });
  }

  private handleOptionChanges = () => {
    this.syncOptions();
  };

  private syncOptions() {
    const lightDomOptions = Array.from(this.children).filter(
      (child) => child.tagName === "OPTION",
    );

    const options = lightDomOptions.map((option) => {
      const originalOption = option as HTMLOptionElement;
      return {
        value: originalOption.value || "",
        text: originalOption.textContent || "",
        disabled: originalOption.disabled,
        selected: originalOption.selected,
      };
    });

    this.state.set("options", options);
  }

  private updateSelectValue(value: string): void {
    if (this.selectElement.options.length > 0) {
      if (value) {
        const optionExists = Array.from(this.selectElement.options).some(
          (opt) => opt.value === value,
        );

        if (optionExists) {
          this.selectElement.value = value;
        } else {
          console.warn(
            `<teskooano-select>: Value "${value}" does not match any available options. Selecting first option.`,
          );
          this.selectElement.selectedIndex = 0;
          this.state.set("value", this.selectElement.value);
        }
      } else {
        this.selectElement.selectedIndex = 0;
        this.state.set("value", this.selectElement.value);
      }
    }
  }

  private updateSelectOptions(options: SelectState["options"]): void {
    // Clear existing options
    while (this.selectElement.firstChild) {
      this.selectElement.removeChild(this.selectElement.firstChild);
    }

    // Add new options
    options.forEach((option) => {
      const newOption = document.createElement("option");
      newOption.value = option.value;
      newOption.textContent = option.text;
      newOption.disabled = option.disabled;
      newOption.selected = option.selected;
      this.selectElement.appendChild(newOption);
    });

    // Update value after options are set
    const currentValue = this.state.get("value");
    if (currentValue) {
      this.updateSelectValue(currentValue);
    } else if (this.selectElement.options.length > 0) {
      this.selectElement.selectedIndex = 0;
      this.state.set("value", this.selectElement.value);
    }
  }

  private updateLabel(label: string): void {
    if (!this.querySelector('[slot="label"]')) {
      this.labelSlot.textContent = label;
    }
    this.labelElement.setAttribute("for", "select-input");

    const labelText =
      this.labelSlot.textContent?.trim() ||
      (this.querySelector('[slot="label"]')?.textContent?.trim() ?? label);
    this.selectElement.setAttribute("aria-label", labelText);
  }

  private updateHelpText(helpText: string): void {
    this.helpTextElement.textContent = helpText;

    if (helpText) {
      const helpTextId = "help-text-" + this.getUniqueId();
      this.helpTextElement.id = helpTextId;
      this.selectElement.setAttribute("aria-describedby", helpTextId);
    } else {
      this.selectElement.removeAttribute("aria-describedby");
    }
  }

  private getUniqueId(): string {
    return performance.now().toString(36).substring(2, 9);
  }

  private handleChange = (e: Event) => {
    e.stopPropagation();

    const newValue = this.selectElement.value;
    this.state.set("value", newValue);

    this.dispatchEvent(
      new CustomEvent(CustomEvents.SELECT_CHANGE, {
        bubbles: true,
        composed: true,
        detail: { value: newValue },
      }),
    );
  };

  private handleClick = (e: MouseEvent) => {
    if (this.state.get("isDisabled")) {
      e.stopPropagation();
      return;
    }

    if (e.target !== this.selectElement) {
      this.selectElement.click();
      this.selectElement.focus();
    }
  };

  // Public API
  get value(): string {
    return this.state.get("value");
  }

  set value(newValue: string) {
    this.state.set("value", newValue);
  }

  get disabled(): boolean {
    return this.state.get("isDisabled");
  }

  set disabled(isDisabled: boolean) {
    this.state.set("isDisabled", isDisabled);
  }
}
