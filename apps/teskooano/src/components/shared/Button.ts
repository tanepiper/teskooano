const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-flex; /* Default to fitting content */
      box-sizing: border-box;
      font-family: var(--font-family, sans-serif);
      /* Define base cosmic theme variables */
      --button-bg: var(--teskooano-button-bg, #2a2a3e); /* Dark blue-grey */
      --button-text: var(--teskooano-button-text, #e0e0fc); /* Light lavender */
      --button-border: var(--teskooano-button-border, #50506a); /* Muted border */
      --button-hover-bg: var(--teskooano-button-hover-bg, #3a3a5e);
      --button-hover-border: var(--teskooano-button-hover-border, #8888ff); /* Brighter blue/purple */
      --button-active-bg: var(--teskooano-button-active-bg, #1a1a2e);
      --button-active-border: var(--teskooano-button-active-border, #aaaaff);
      --button-focus-outline: var(--teskooano-button-focus-outline, #aaaaff);
      --button-disabled-bg: var(--teskooano-button-disabled-bg, #303040);
      --button-disabled-border: var(--teskooano-button-disabled-border, #404050);
      --button-disabled-opacity: 0.6;
      --button-border-radius: var(--border-radius-xs, 3px); /* Sharper corners */
      --button-padding-y: var(--space-xs, 4px);
      --button-padding-x: var(--space-sm, 8px);
      --icon-size: var(--font-size-md, 1em);
      --icon-gap: var(--space-xs, 4px);
    }

    :host([fullwidth]) {
        display: flex; /* Allow stretching */
        width: 100%;
    }
    :host([fullwidth]) button {
        flex-grow: 1;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      width: 100%; /* Fill the host container */
      padding: var(--button-padding-y) var(--button-padding-x);
      border: 1px solid var(--button-border);
      border-radius: var(--button-border-radius);
      background-color: var(--button-bg);
      color: var(--button-text);
      font-size: var(--font-size-sm, 0.9em);
      font-weight: var(--font-weight-medium, 500);
      line-height: 1.4;
      cursor: pointer;
      text-align: center;
      white-space: nowrap;
      transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }

    button:hover:not([disabled]) {
      border-color: var(--button-hover-border);
      background-color: var(--button-hover-bg);
      /* Optional subtle glow */
      /* box-shadow: 0 0 3px 0 var(--button-hover-border); */
    }

    button:active:not([disabled]) {
      background-color: var(--button-active-bg);
      border-color: var(--button-active-border);
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);
    }

    button:focus {
      outline: none; /* Remove default */
    }
    /* Hide default focus styles if using custom */
    button:focus:not(:focus-visible) { 
       outline: none; 
    } 
    button:focus-visible { 
       outline: 2px solid var(--button-focus-outline); 
       outline-offset: 1px; 
    }

    button[disabled] {
      opacity: var(--button-disabled-opacity);
      cursor: not-allowed;
      background-color: var(--button-disabled-bg);
      border-color: var(--button-disabled-border);
    }

    ::slotted([slot="icon"]) {
      display: inline-flex; /* Ensure icon aligns */
      align-items: center;
      justify-content: center;
      width: var(--icon-size);
      height: var(--icon-size);
      margin-right: var(--icon-gap);
      flex-shrink: 0; /* Prevent icon shrinking */
    }
    
    /* Hide margin if text slot is empty */
    ::slotted([slot="icon"]:only-child) {
        margin-right: 0;
    }
    
  </style>
  <button part="button">
    <slot name="icon"></slot>
    <slot></slot> <!-- Default slot for text -->
  </button>
`;

export class TeskooanoButton extends HTMLElement {
  static observedAttributes = ['disabled', 'type', 'title', 'fullwidth'];

  private buttonElement: HTMLButtonElement;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.buttonElement = this.shadowRoot!.querySelector('button')!;

    // Forward clicks from the custom element to the internal button
    this.addEventListener('click', (e) => {
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
    this.updateAttribute('type', this.getAttribute('type') || 'button'); // Default to type="button"
    this.updateAttribute('title', this.getAttribute('title'));
    // No need to handle fullwidth here, CSS does it
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (name === 'disabled') {
      this.updateDisabledState();
    } else if (name === 'fullwidth') {
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
    return this.hasAttribute('disabled');
  }

  set disabled(isDisabled: boolean) {
    if (isDisabled) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  private updateDisabledState() {
    if (this.disabled) {
      this.buttonElement.setAttribute('disabled', '');
      // Optionally add ARIA disabled state
      this.buttonElement.setAttribute('aria-disabled', 'true');
    } else {
      this.buttonElement.removeAttribute('disabled');
      this.buttonElement.removeAttribute('aria-disabled');
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

customElements.define('teskooano-button', TeskooanoButton);
