import { CustomEvents } from "@teskooano/data-types";

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

export class TeskooanoSelect extends HTMLElement {
  static observedAttributes = ["label", "value", "disabled", "help-text"];

  private selectElement: HTMLSelectElement;
  private labelElement: HTMLLabelElement;
  private labelSlot: HTMLSlotElement;
  private helpTextElement: HTMLElement;
  private mutationObserver: MutationObserver;
  private _internalUpdate = false;

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
    this.updateLabelAttribute(this.getAttribute("label"));
    this.updateAttribute("disabled", this.getAttribute("disabled"));
    this.updateHelpTextAttribute(this.getAttribute("help-text"));

    this.mutationObserver.observe(this, {
      childList: true,
      subtree: false,
      characterData: false,
      attributes: false,
    });

    this.syncOptions();

    requestAnimationFrame(() => {
      this.updateValueAttribute(this.getAttribute("value"));
    });

    this.selectElement.addEventListener("change", this.handleChange);
    this.addEventListener("click", this.handleClick);

    if (
      !this.selectElement.hasAttribute("aria-label") &&
      !this.hasAttribute("aria-labelledby")
    ) {
      const labelText =
        this.labelSlot.textContent?.trim() ||
        (this.querySelector('[slot="label"]')?.textContent?.trim() ?? "Select");
      this.selectElement.setAttribute("aria-label", labelText);
    }
  }

  disconnectedCallback() {
    this.mutationObserver.disconnect();
    this.selectElement.removeEventListener("change", this.handleChange);
    this.removeEventListener("click", this.handleClick);
  }

  private handleOptionChanges = (mutations: MutationRecord[]) => {
    this.syncOptions();
  };

  private syncOptions() {
    while (this.selectElement.firstChild) {
      this.selectElement.removeChild(this.selectElement.firstChild);
    }

    const lightDomOptions = Array.from(this.children).filter(
      (child) => child.tagName === "OPTION",
    );

    lightDomOptions.forEach((option) => {
      const newOption = document.createElement("option");
      const originalOption = option as HTMLOptionElement;

      if (originalOption.value) {
        newOption.value = originalOption.value;
      }
      if (originalOption.disabled) {
        newOption.disabled = true;
      }
      if (originalOption.selected) {
        newOption.selected = true;
      }

      newOption.textContent = originalOption.textContent;

      this.selectElement.appendChild(newOption);
    });

    const currentValue = this.getAttribute("value");
    if (currentValue !== null) {
      this.updateValueAttribute(currentValue);
    } else if (this.selectElement.options.length > 0) {
      this.selectElement.selectedIndex = 0;
      this._internalUpdate = true;
      this.setAttribute("value", this.selectElement.value);
      this._internalUpdate = false;
    }
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;

    if (name === "value" && newValue === this.selectElement.value) {
      return;
    }

    switch (name) {
      case "label":
        this.updateLabelAttribute(newValue);
        break;
      case "value":
        if (!this._internalUpdate) {
          this.updateValueAttribute(newValue);
        }
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
    if (value !== null && !this.querySelector('[slot="label"]')) {
      this.labelSlot.textContent = value;
    } else if (
      value === null &&
      this.labelSlot.hasChildNodes() &&
      this.labelSlot.childNodes[0].nodeType === Node.TEXT_NODE
    ) {
      this.labelSlot.textContent = "";
    }
    this.labelElement.setAttribute("for", "select-input");

    const labelText =
      this.labelSlot.textContent?.trim() ||
      (this.querySelector('[slot="label"]')?.textContent?.trim() ?? "Select");
    this.selectElement.setAttribute("aria-label", labelText);
  }

  private updateValueAttribute(value: string | null) {
    if (this.selectElement.options.length > 0) {
      if (value !== null) {
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

          if (this.selectElement.value !== value) {
            this._internalUpdate = true;
            this.setAttribute("value", this.selectElement.value);
            this._internalUpdate = false;
          }
        }
      } else {
        this.selectElement.selectedIndex = 0;
        this._internalUpdate = true;
        this.setAttribute("value", this.selectElement.value);
        this._internalUpdate = false;
      }
    }
  }

  private updateAttribute(name: string, value: string | null) {
    if (name === "disabled") {
      const isDisabled = value !== null;
      this.selectElement.disabled = isDisabled;
      this.toggleAttribute("disabled", isDisabled);

      this.selectElement.setAttribute(
        "aria-disabled",
        isDisabled ? "true" : "false",
      );
    }
  }

  private updateHelpTextAttribute(value: string | null) {
    this.helpTextElement.textContent = value || "";

    if (value) {
      const helpTextId = "help-text-" + this.getUniqueId();
      this.helpTextElement.id = helpTextId;
      this.selectElement.setAttribute("aria-describedby", helpTextId);
    } else {
      this.selectElement.removeAttribute("aria-describedby");
    }
  }

  private getUniqueId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private handleChange = (e: Event) => {
    e.stopPropagation();

    this._internalUpdate = true;
    this.setAttribute("value", this.selectElement.value);
    this._internalUpdate = false;

    this.dispatchEvent(
      new CustomEvent(CustomEvents.SELECT_CHANGE, {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  };

  private handleClick = (e: MouseEvent) => {
    if (this.disabled) {
      e.stopPropagation();
      return;
    }

    if (e.target !== this.selectElement) {
      this.selectElement.click();

      this.selectElement.focus();
    }
  };

  get value(): string {
    return this.selectElement.value;
  }

  set value(newValue: string) {
    this._internalUpdate = true;
    this.setAttribute("value", newValue);
    this._internalUpdate = false;
  }

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
