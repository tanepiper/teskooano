const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-flex; /* Align with text */
      align-items: center;
      gap: var(--space-sm, 8px);
      font-family: var(--font-family, sans-serif);
      font-size: var(--font-size-md, 1em);
      color: var(--color-text, #e0e0fc);
      cursor: pointer;
      user-select: none; /* Prevent text selection on click */
      margin-bottom: var(--space-xs, 4px); /* Add some spacing below */

      --checkbox-size: 1.1em;
      --checkbox-bg: var(--color-surface-inset, #1a1a2e);
      --checkbox-border: var(--color-border, #50506a);
      --checkbox-checked-bg: var(--color-primary, #6c63ff);
      --checkbox-checked-border: var(--color-primary, #6c63ff);
      --checkbox-checkmark-color: white;
      --checkbox-border-radius: var(--border-radius-xs, 3px);
      --checkbox-disabled-opacity: 0.6;
    }
    :host([disabled]) {
        cursor: not-allowed;
        opacity: var(--checkbox-disabled-opacity);
    }

    /* Visually hide the actual checkbox but keep it accessible */
    input[type="checkbox"] {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    /* Custom checkbox appearance */
    .checkmark {
      display: inline-block;
      box-sizing: border-box;
      width: var(--checkbox-size);
      height: var(--checkbox-size);
      background-color: var(--checkbox-bg);
      border: 1px solid var(--checkbox-border);
      border-radius: var(--checkbox-border-radius);
      transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
      position: relative; /* For checkmark positioning */
    }

    /* Style changes when checked */
    input[type="checkbox"]:checked + .checkmark {
      background-color: var(--checkbox-checked-bg);
      border-color: var(--checkbox-checked-border);
    }

    /* Checkmark symbol (using ::after pseudo-element) */
    .checkmark::after {
      content: "";
      position: absolute;
      display: none; /* Hidden by default */
      left: calc(var(--checkbox-size) * 0.3);
      top: calc(var(--checkbox-size) * 0.1);
      width: calc(var(--checkbox-size) * 0.25);
      height: calc(var(--checkbox-size) * 0.5);
      border: solid var(--checkbox-checkmark-color);
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    /* Show checkmark when checked */
    input[type="checkbox"]:checked + .checkmark::after {
      display: block;
    }
    
    /* Focus styles */
    input[type="checkbox"]:focus-visible + .checkmark {
        outline: 2px solid var(--color-primary-light, #9fa8da);
        outline-offset: 1px;
    }

  </style>
  <label class="checkbox-wrapper">
    <input type="checkbox" part="input">
    <span class="checkmark" part="checkmark"></span>
    <span class="label" part="label"><slot>Checkbox Label</slot></span>
  </label>
`;

export class TeskooanoCheckbox extends HTMLElement {
  static observedAttributes = ['checked', 'disabled', 'label'];

  private checkboxElement: HTMLInputElement;
  private labelSpan: HTMLElement;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.checkboxElement = this.shadowRoot!.querySelector('input[type="checkbox"]')!;
    this.labelSpan = this.shadowRoot!.querySelector('.label')!;

    // Handle clicks on the host element to toggle the checkbox
    this.addEventListener('click', (e) => {
      if (this.disabled) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // Don't toggle if the click was directly on the hidden input
      if (e.target !== this.checkboxElement) {
          this.checked = !this.checked;
          // Dispatch change event manually since input click is prevented
          this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      }
    });
    
    // Prevent clicks on label from double-toggling
    this.labelSpan.addEventListener('click', (e) => e.stopPropagation());

    // Handle spacebar press for accessibility
    this.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            if (!this.disabled) {
                e.preventDefault();
                this.click(); // Simulate a click
            }
        }
    });
    
    // Ensure component is focusable
    if (!this.hasAttribute('tabindex')) {
        this.tabIndex = 0;
    }
  }

  connectedCallback() {
    this.updateAttribute('checked', this.getAttribute('checked'));
    this.updateAttribute('disabled', this.getAttribute('disabled'));
    this.updateAttribute('label', this.getAttribute('label'));
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    this.updateAttribute(name, newValue);
  }

  private updateAttribute(name: string, value: string | null) {
    switch (name) {
      case 'label':
        // Check if a label attribute is provided AND if the default slot is empty
        const hasSlottedLabel = this.childNodes.length > 0 && Array.from(this.childNodes).some(node => !node.hasOwnProperty('slot'));
        if (value !== null && !hasSlottedLabel) {
            // If label attribute exists and no slotted content, set the span text
            this.labelSpan.textContent = value;
        } else if (value === null && !hasSlottedLabel) {
             // If label attribute removed and still no slotted content, clear the span
             this.labelSpan.textContent = '';
        }
        // If there IS slotted content, we let it take precedence and don't touch labelSpan.textContent
        break;
      case 'checked':
        this.checkboxElement.checked = value !== null;
        break;
      case 'disabled':
        const isDisabled = value !== null;
        this.checkboxElement.disabled = isDisabled;
        this.toggleAttribute('disabled', isDisabled); 
        this.tabIndex = isDisabled ? -1 : 0;
        break;
    }
  }

  // Getter/Setter for checked property
  get checked(): boolean {
    return this.hasAttribute('checked');
  }

  set checked(isChecked: boolean) {
    if (isChecked) {
      this.setAttribute('checked', '');
    } else {
      this.removeAttribute('checked');
    }
  }

  // Getter/Setter for disabled property
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
}

customElements.define('teskooano-checkbox', TeskooanoCheckbox); 