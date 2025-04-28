import { CustomEvents } from "@teskooano/data-types";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block; /* Takes up block space */
    }
    form {
        display: flex;
        flex-direction: column;
        gap: var(--space-md, 12px); /* Spacing between form elements */
    }
    /* Add specific styling for elements within the form if needed */
    /* e.g., ::slotted(teskooano-button) { margin-top: var(--space-lg, 15px); } */
  </style>
  <form part="form">
    <slot></slot> <!-- Default slot for form content -->
  </form>
`;

// Define helper types for elements with specific properties/methods
interface ElementWithValue extends Element {
  value: any;
}

interface ElementWithReset extends Element {
  reset: () => void;
}

interface ElementWithValidate extends Element {
  validate: () => boolean;
}

export class TeskooanoForm extends HTMLElement {
  private formElement: HTMLFormElement;
  private mutationObserver: MutationObserver;
  private formElements: HTMLElement[] = [];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.formElement = this.shadowRoot!.querySelector("form")!;

    // Prevent default browser form submission, handle via events if needed
    this.formElement.addEventListener("submit", (e) => {
      e.preventDefault();
      // Dispatch a custom submit event from the host element
      this.dispatchEvent(
        new CustomEvent(CustomEvents.SUBMIT_CUSTOM, {
          bubbles: true,
          composed: true,
          detail: this.getFormData(),
        }),
      );
    });

    // Create MutationObserver to track form elements
    this.mutationObserver = new MutationObserver(this.handleFormElementChanges);
  }

  connectedCallback() {
    // Set up mutation observer
    this.mutationObserver.observe(this, {
      childList: true,
      subtree: false,
      characterData: false,
      attributes: false,
    });

    // Initialize form elements tracking
    this.syncFormElements();

    // Handle slot changes to track slotted elements
    const slot = this.shadowRoot!.querySelector("slot");
    if (slot) {
      slot.addEventListener("slotchange", this.handleSlotChange);
    }
  }

  disconnectedCallback() {
    // Clean up observers and listeners
    this.mutationObserver.disconnect();

    const slot = this.shadowRoot!.querySelector("slot");
    if (slot) {
      slot.removeEventListener("slotchange", this.handleSlotChange);
    }
  }

  // Handle changes to form element children
  private handleFormElementChanges = (mutations: MutationRecord[]) => {
    this.syncFormElements();
  };

  // Handle slot changes
  private handleSlotChange = () => {
    this.syncFormElements();
  };

  // Sync tracked form elements
  private syncFormElements() {
    // Find all form control components
    this.formElements = Array.from(this.children).filter((child) =>
      this.isFormControl(child),
    ) as HTMLElement[];
  }

  // Determine if an element is a form control
  private isFormControl(element: Element): boolean {
    // Check for custom elements with common form control properties
    const customElementTags = [
      "teskooano-select",
      "teskooano-checkbox",
      "teskooano-slider",
    ];

    // Check for standard form elements
    const standardFormTags = ["INPUT", "SELECT", "TEXTAREA", "BUTTON"];

    return (
      customElementTags.some((tag) => element.tagName.toLowerCase() === tag) ||
      standardFormTags.includes(element.tagName)
    );
  }

  // Get form data from tracked elements
  getFormData(): Record<string, any> {
    const data: Record<string, any> = {};

    this.formElements.forEach((element) => {
      // Skip elements without names
      const name = element.getAttribute("name");
      if (!name) return;

      // Handle different types of elements
      if ("value" in element) {
        if (
          element.tagName === "INPUT" &&
          (element as HTMLInputElement).type === "checkbox"
        ) {
          data[name] = (element as HTMLInputElement).checked;
        } else {
          // Cast to ElementWithValue after checking 'value' in element
          data[name] = (element as ElementWithValue).value;
        }
      } else if (customElements.get(element.tagName.toLowerCase())) {
        // For custom elements, try to get the value property
        if ("value" in element) {
          // Cast to ElementWithValue after checking 'value' in element
          data[name] = (element as ElementWithValue).value;
        }
      }
    });

    return data;
  }

  // Expose form methods
  public submit() {
    // Validate form first
    if (this.validate()) {
      this.formElement.requestSubmit();
    }
  }

  public reset() {
    this.formElement.reset();

    // Also reset custom elements
    this.formElements.forEach((element) => {
      if ("reset" in element && typeof element.reset === "function") {
        // Cast to ElementWithReset after checking 'reset' in element
        (element as ElementWithReset).reset();
      }
    });

    // Dispatch a custom reset event
    this.dispatchEvent(
      new CustomEvent(CustomEvents.RESET_CUSTOM, {
        bubbles: true,
        composed: true,
      }),
    );
  }

  // Basic validation method
  public validate(): boolean {
    let isValid = true;

    this.formElements.forEach((element) => {
      // Check for required attribute
      if (element.hasAttribute("required")) {
        const value =
          element.tagName === "INPUT" &&
          (element as HTMLInputElement).type === "checkbox"
            ? (element as HTMLInputElement).checked
            : "value" in element
              ? (element as ElementWithValue).value
              : null; // Use ElementWithValue

        if (!value) {
          isValid = false;
          // Optionally dispatch invalid event or add visual indicators
          element.dispatchEvent(new Event("invalid", { bubbles: true }));
        }
      }

      // Check for custom validation methods on elements
      if ("validate" in element && typeof element.validate === "function") {
        // Cast to ElementWithValidate after checking 'validate' in element
        if (!(element as ElementWithValidate).validate()) {
          isValid = false;
        }
      }
    });

    return isValid;
  }
}
