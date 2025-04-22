const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      --modal-width: var(--width, 450px);
      --modal-height: var(--height, 250px);
      --header-background: var(--color-surface-3, #333344);
      --body-background: var(--color-surface-2, #272736);
      --footer-background: var(--color-surface-3, #333344);
      --border-color: var(--color-border, #50506a);
      --title-color: var(--color-text-primary, #eeeef5);
      --content-color: var(--color-text-secondary, #ccccdd);
      font-family: var(--font-family-base, system-ui);
    }

    .modal-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background-color: var(--body-background);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md, 4px);
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3, 12px);
      background-color: var(--header-background);
      border-bottom: 1px solid var(--border-color);
      min-height: 40px;
    }

    .modal-title {
      margin: 0;
      font-size: var(--font-size-large, 16px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--title-color);
    }

    .modal-body {
      flex: 1;
      padding: var(--space-4, 16px);
      overflow-y: auto;
      color: var(--content-color);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-2, 8px);
      padding: var(--space-3, 12px);
      background-color: var(--footer-background);
      border-top: 1px solid var(--border-color);
    }

    ::slotted([slot="content"]) {
      display: block;
      width: 100%;
    }

    /* Hide buttons if specified via attributes */
    :host([hide-close-button]) .close-button {
      display: none;
    }

    :host([hide-confirm-button]) .confirm-button {
      display: none;
    }

    :host([hide-secondary-button]) .secondary-button {
      display: none;
    }
  </style>

  <div class="modal-container" part="container">
    <div class="modal-header" part="header">
      <h3 class="modal-title" part="title"></h3>
    </div>
    <div class="modal-body" part="body">
      <slot name="content"></slot>
    </div>
    <div class="modal-footer" part="footer">
      <teskooano-button class="secondary-button" variant="ghost" size="sm">
        <span class="secondary-text">Secondary</span>
      </teskooano-button>
      <teskooano-button class="close-button" variant="ghost" size="sm">
        <span class="close-text">Cancel</span>
      </teskooano-button>
      <teskooano-button class="confirm-button" variant="primary" size="sm">
        <span class="confirm-text">Confirm</span>
      </teskooano-button>
    </div>
  </div>
`;

export class TeskooanoModal extends HTMLElement {
  static get observedAttributes() {
    return [
      'title', 
      'confirm-text', 
      'close-text', 
      'secondary-text', 
      'hide-close-button', 
      'hide-confirm-button', 
      'hide-secondary-button'
    ];
  }

  // Elements
  private titleElement: HTMLHeadingElement;
  private confirmButtonText: HTMLSpanElement;
  private closeButtonText: HTMLSpanElement;
  private secondaryButtonText: HTMLSpanElement;
  private confirmButton: HTMLElement;
  private closeButton: HTMLElement;
  private secondaryButton: HTMLElement;

  // Event handlers
  private confirmHandler: (() => void) | null = null;
  private closeHandler: (() => void) | null = null;
  private secondaryHandler: (() => void) | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    // Get references to elements
    this.titleElement = this.shadowRoot!.querySelector('.modal-title')!;
    this.confirmButton = this.shadowRoot!.querySelector('.confirm-button')!;
    this.closeButton = this.shadowRoot!.querySelector('.close-button')!;
    this.secondaryButton = this.shadowRoot!.querySelector('.secondary-button')!;
    this.confirmButtonText = this.shadowRoot!.querySelector('.confirm-text')!;
    this.closeButtonText = this.shadowRoot!.querySelector('.close-text')!;
    this.secondaryButtonText = this.shadowRoot!.querySelector('.secondary-text')!;

    // Set up button event listeners
    this.confirmButton.addEventListener('click', () => {
      if (this.confirmHandler) {
        this.confirmHandler();
      }
      // Dispatch custom event for modal-confirm
      this.dispatchEvent(new CustomEvent('modal-confirm', { bubbles: true, composed: true }));
    });

    this.closeButton.addEventListener('click', () => {
      if (this.closeHandler) {
        this.closeHandler();
      }
      // Dispatch custom event for modal-close
      this.dispatchEvent(new CustomEvent('modal-close', { bubbles: true, composed: true }));
    });

    this.secondaryButton.addEventListener('click', () => {
      if (this.secondaryHandler) {
        this.secondaryHandler();
      }
      // Dispatch custom event for modal-additional
      this.dispatchEvent(new CustomEvent('modal-additional', { bubbles: true, composed: true }));
    });
  }

  connectedCallback() {
    // Set initial values from attributes
    this.updateTitle();
    this.updateButtonTexts();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'title':
        this.updateTitle();
        break;
      case 'confirm-text':
      case 'close-text':
      case 'secondary-text':
        this.updateButtonTexts();
        break;
      // Visibility attributes are handled via CSS
    }
  }

  private updateTitle() {
    this.titleElement.textContent = this.getAttribute('title') || 'Dialog';
  }

  private updateButtonTexts() {
    this.confirmButtonText.textContent = this.getAttribute('confirm-text') || 'Confirm';
    this.closeButtonText.textContent = this.getAttribute('close-text') || 'Cancel';
    this.secondaryButtonText.textContent = this.getAttribute('secondary-text') || 'Secondary Action';
  }

  // Public methods to set content and button handlers
  public setContent(content: string | HTMLElement) {
    const contentSlot = this.shadowRoot!.querySelector('slot[name="content"]') as HTMLSlotElement;
    
    // Clear existing content
    const assignedElements = contentSlot.assignedElements ? contentSlot.assignedElements() : [];
    [...assignedElements].forEach(el => el.remove());
    
    // Add new content
    if (typeof content === 'string') {
      const contentElement = document.createElement('div');
      contentElement.slot = 'content';
      contentElement.innerHTML = content;
      this.appendChild(contentElement);
    } else {
      content.slot = 'content';
      this.appendChild(content);
    }
  }

  public setConfirmHandler(handler: () => void) {
    this.confirmHandler = handler;
  }

  public setCloseHandler(handler: () => void) {
    this.closeHandler = handler;
  }

  public setSecondaryHandler(handler: () => void) {
    this.secondaryHandler = handler;
  }
}

// Define the custom element
const ELEMENT_TAG = "teskooano-modal";
if (!customElements.get(ELEMENT_TAG)) {
  customElements.define(ELEMENT_TAG, TeskooanoModal);
} 