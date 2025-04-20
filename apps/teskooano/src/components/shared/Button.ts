const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      /* Inherit display from context, default to inline-block behavior */
      display: inline-block; 
      box-sizing: border-box;
      /* Component will use global font */
      /* Define base styling using global tokens */
      --icon-size: var(--font-size-base); /* Link icon size to base font size */
      /* Default gap size (Medium) */
      --icon-gap: var(--space-2); /* Use space-2 (8px) for default gap */
    }

    :host([fullwidth]) {
        display: block; /* Use block for full width */
        width: 100%;
    }
    :host([fullwidth]) button {
        width: 100%; /* Ensure button fills host */
    }

    button {
      /* Apply base button styles from global tokens */
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      width: 100%; /* Fill the host container by default */
      /* Calculate min-height based on padding and line-height */
      min-height: calc(var(--space-2) * 2 + var(--line-height-base) * 1em);
      padding: var(--space-2) var(--space-4); /* Base (Medium) padding */
      border: var(--border-width-thin) solid var(--color-border-subtle); /* Default border */
      border-radius: var(--radius-md); /* Default radius */
      background-color: var(--color-surface-2); /* Default background */
      color: var(--color-text-primary); /* Default text color */
      font-family: var(--font-family-base); /* Use global font */
      font-size: var(--font-size-base); /* Default font size */
      font-weight: var(--font-weight-medium); /* Default weight */
      line-height: var(--line-height-base); /* Default line height */
      gap: var(--icon-gap); /* Use gap for spacing between slots */
      cursor: pointer;
      text-align: center;
      white-space: nowrap;
      transition: background-color var(--transition-duration-fast) var(--transition-timing-base),
                  border-color var(--transition-duration-fast) var(--transition-timing-base),
                  color var(--transition-duration-fast) var(--transition-timing-base),
                  box-shadow var(--transition-duration-fast) var(--transition-timing-base);
    }

    button:hover:not([disabled]) {
      border-color: var(--color-border-strong);
      background-color: var(--color-surface-3);
      color: var(--color-text-primary); /* Ensure text stays primary on hover */
    }

    button:active:not([disabled]) {
      background-color: var(--color-surface-1); /* Slightly darker active state */
      border-color: var(--color-border-strong);
      box-shadow: var(--shadow-inner); /* Add subtle inner shadow */
    }

    button:focus {
      outline: none; /* Remove default */
    }
    button:focus:not(:focus-visible) { 
       outline: none; 
    } 
    button:focus-visible { 
       /* Use global focus style */
       outline: var(--border-width-medium) solid var(--color-border-focus); 
       outline-offset: 1px; 
       border-color: var(--color-border-focus); /* Also highlight border */
    }

    button[disabled] {
      opacity: 0.6; /* Use standard opacity */
      cursor: not-allowed;
      background-color: var(--color-surface-1); /* Use a muted surface */
      border-color: var(--color-border-subtle);
      color: var(--color-text-disabled);
    }

    /* --- Variants using host attributes (Example) --- */
    /* You might need JS to add these classes/attributes based on a 'variant' prop */
    :host([variant="primary"]) button {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        color: var(--color-text-on-primary);
    }
    :host([variant="primary"]) button:hover:not([disabled]) {
        background-color: var(--color-primary-hover);
        border-color: var(--color-primary-hover);
    }
     :host([variant="primary"]) button:active:not([disabled]) {
        background-color: var(--color-primary-active);
        border-color: var(--color-primary-active);
    }
    :host([variant="primary"]) button:focus-visible {
       box-shadow: 0 0 0 2px var(--color-background), 0 0 0 4px var(--color-primary);
       outline: none; /* Use box-shadow for primary focus */
    }
    
    :host([variant="ghost"]) button {
        background-color: transparent;
        border-color: transparent;
        color: var(--color-text-secondary);
    }
     :host([variant="ghost"]) button:hover:not([disabled]) {
        background-color: var(--color-surface-2);
        border-color: var(--color-border-subtle);
        color: var(--color-text-primary);
    }
    :host([variant="ghost"]) button:active:not([disabled]) {
        background-color: var(--color-surface-1);
    }
     :host([variant="ghost"]) button:focus-visible {
       border-color: var(--color-border-focus); /* Show border on focus */
    }


    /* --- Sizes using host attributes (Example) --- */
    :host([size="sm"]) button {
        min-height: calc(var(--space-1) * 2 + var(--line-height-base) * 1em);
        padding: var(--space-1) var(--space-2);
        font-size: var(--font-size-small);
        border-radius: var(--radius-sm);
        gap: var(--icon-gap); /* Use scaled gap */
    }
    :host([size="sm"]) {
         --icon-size: var(--font-size-small);
         --icon-gap: var(--space-1); /* Smaller gap for small buttons */
    }

    :host([size="lg"]) button {
        min-height: calc(var(--space-3) * 2 + var(--line-height-base) * 1em);
        padding: var(--space-3) var(--space-5);
        font-size: var(--font-size-large);
        border-radius: var(--radius-lg);
        gap: var(--icon-gap); /* Use scaled gap */
    }
     :host([size="lg"]) {
         --icon-size: var(--font-size-large);
         --icon-gap: var(--space-3); /* Larger gap for large buttons */
    }


    /* --- Icon Styling --- */
    ::slotted([slot="icon"]) {
      display: inline-flex; /* Ensure icon aligns */
      align-items: center;
      justify-content: center;
      width: var(--icon-size);
      height: var(--icon-size);
      /* Dynamic margin based on presence of text */
      /* No margin needed, gap property handles spacing */
      flex-shrink: 0; /* Prevent icon shrinking */
    }
    
    /* Add gap only if icon is followed by default slot content */
    ::slotted([slot="icon"] + slot:not(:empty)) {
        margin-right: var(--icon-gap);
    }
    /* Alternative: Add gap if icon exists and host isn't in mobile state */
    /* Requires JS check or different structure */
    /* :host(:not([mobile])) ::slotted([slot="icon"]) {
        margin-right: var(--icon-gap);
    } */

    /* Hide default slot (text) when mobile attribute is present */
    :host([mobile]) slot:not([name='icon']) {
      display: none;
    }
    /* No need to adjust icon margin specifically for mobile */

  </style>
  <button part="button">
    <slot name="icon"></slot>
    <slot></slot> <!-- Default slot for text -->
  </button>
`;

export class TeskooanoButton extends HTMLElement {
  static observedAttributes = ["disabled", "type", "title", "fullwidth"];

  private buttonElement: HTMLButtonElement;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.buttonElement = this.shadowRoot!.querySelector("button")!;

    // Forward clicks from the custom element to the internal button
    this.addEventListener("click", (e) => {
      if (this.disabled) {
        e.stopPropagation();
        return;
      }
      // We don't need to explicitly call button.click()
      // The event will naturally propagate if the button itself is clicked.
      // This listener mainly handles the disabled state propagation.
    });
  }

  connectedCallback() {
    // Sync initial attribute states
    this.updateDisabledState();
    this.updateAttribute("type", this.getAttribute("type") || "button"); // Default to type="button"
    this.updateAttribute("title", this.getAttribute("title"));
    // No need to handle fullwidth here, CSS does it
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (name === "disabled") {
      this.updateDisabledState();
    } else if (name === "fullwidth") {
      // Attribute presence handled by CSS selector :host([fullwidth])
    } else {
      this.updateAttribute(name, newValue);
    }
  }

  // Helper to update attributes on the internal button
  private updateAttribute(name: string, value: string | null) {
    if (value !== null) {
      this.buttonElement.setAttribute(name, value);
    } else {
      this.buttonElement.removeAttribute(name);
    }
  }

  // Getter/setter for disabled state
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

  private updateDisabledState() {
    if (this.disabled) {
      this.buttonElement.setAttribute("disabled", "");
      // Optionally add ARIA disabled state
      this.buttonElement.setAttribute("aria-disabled", "true");
    } else {
      this.buttonElement.removeAttribute("disabled");
      this.buttonElement.removeAttribute("aria-disabled");
    }
  }

  // Expose the form association methods (optional but good practice)
  // static formAssociated = true;
  // private internals: ElementInternals;

  // If you need the button to participate in forms (e.g., submit)
  // uncomment this constructor part and the relevant methods
  // constructor() {
  //   super();
  //   // ... existing constructor ...
  //   this.internals = this.attachInternals();
  // }

  // Add form-related methods if needed (e.g., for submit buttons)
  // formAssociatedCallback(form) { ... }
  // formDisabledCallback(disabled) { this.disabled = disabled; }
  // formResetCallback() { ... }
  // formStateRestoreCallback(state, mode) { ... }
}

customElements.define("teskooano-button", TeskooanoButton);
