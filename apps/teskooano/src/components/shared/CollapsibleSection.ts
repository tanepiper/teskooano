const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
      border: 1px solid var(--color-border, #50506a); /* Updated theme variable */
      margin-bottom: var(--space-sm, 8px); /* Reduced margin */
      border-radius: var(--border-radius-md, 5px); /* Updated theme variable */
      overflow: hidden; /* Prevents content bleed when closed */
      background-color: var(--color-surface, #2a2a3e); /* Updated theme variable */
    }
    .header {
      background-color: var(--color-background, #1a1a2e); /* Updated theme variable */
      padding: var(--space-xs, 4px) var(--space-sm, 8px); /* Reduced padding */
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      user-select: none;
      /* Keep subtle border, might be needed depending on bg colors */
      border-bottom: 1px solid var(--color-border-subtle, #30304a); 
    }
    /* Keep brightness hover for now */
    .header:hover {
       filter: brightness(1.2);
    }
    .title {
      font-weight: var(--font-weight-medium, 500); /* Use theme variable */
      font-size: var(--font-size-sm, 0.9em); /* Slightly smaller title */
      color: var(--color-text, #e0e0fc); /* Updated theme variable */
    }
    .toggle {
      font-size: 1.1em; /* Keep toggle size relative */
      transition: transform 0.2s ease-in-out;
      color: var(--color-text-secondary, #aaa); /* Use secondary text color */
      margin-left: var(--space-sm, 8px); /* Space between title and toggle */
    }
    .content {
      padding: var(--space-sm, 8px); /* Reduced padding */
      /* Transition for smooth collapse/expand */
      max-height: 1000px; /* Set a large max-height for open state */
      overflow: hidden;
      transition: max-height 0.3s ease-in-out, padding 0.3s ease-in-out, border-top 0.3s ease-in-out;
      /* Removed border-top, rely on header border */
    }
    :host([closed]) .content {
      max-height: 0;
      padding-top: 0;
      padding-bottom: 0;
      /* border-top-color: transparent; Removed */
    }
    :host([closed]) .header {
       border-bottom-color: transparent; /* Hide border when closed */
    }
    :host([closed]) .toggle {
       transform: rotate(-90deg);
    }
    
    /* Focus styles for keyboard navigation */
    .header:focus {
      outline: 2px solid var(--color-primary, #6c63ff);
      outline-offset: -2px;
    }
    
    /* Use focus-visible for better UX - only show outline when using keyboard */
    .header:focus:not(:focus-visible) {
      outline: none;
    }
  </style>
  <div class="header" tabindex="0" role="button" aria-expanded="true">
    <span class="title">Section Title</span>
    <span class="toggle">▼</span>
  </div>
  <div class="content" role="region">
    <slot></slot> <!-- Content goes here -->
  </div>
`;

export class CollapsibleSection extends HTMLElement {
  private headerElement: HTMLElement | null = null;
  private contentElement: HTMLElement | null = null;
  private _internalUpdate = false;

  static get observedAttributes() {
    return ['title', 'closed'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.headerElement = this.shadowRoot!.querySelector('.header');
    this.contentElement = this.shadowRoot!.querySelector('.content');
    
    // Add event listeners
    this.headerElement?.addEventListener('click', this.toggle);
    this.headerElement?.addEventListener('keydown', this.handleKeydown);

    // Set initial title
    this.updateTitle(this.getAttribute('title'));

    // Set initial state based on attribute (default open)
    if (!this.hasAttribute('closed')) {
        this.open();
    } else {
        this.close();
    }
    
    // Update ARIA attributes
    this.updateAriaAttributes();
  }

  disconnectedCallback() {
    this.headerElement?.removeEventListener('click', this.toggle);
    this.headerElement?.removeEventListener('keydown', this.handleKeydown);
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) return;
    
    if (name === 'title') {
      this.updateTitle(newValue);
    } else if (name === 'closed' && !this._internalUpdate) {
      // Update ARIA when closed state changes
      this.updateAriaAttributes();
      
      // Dispatch event when closed state changes via attribute
      this.dispatchEvent(new CustomEvent('toggle', { 
        bubbles: true, 
        composed: true,
        detail: { 
          closed: this.hasAttribute('closed'),
          source: 'attribute'
        } 
      }));
    }
  }

  private updateTitle(title: string | null) {
     if (this.shadowRoot) {
      const titleElement = this.shadowRoot.querySelector('.title');
      if (titleElement) {
        titleElement.textContent = title || 'Section';
      }
    }
  }
  
  private updateAriaAttributes() {
    if (this.headerElement && this.contentElement) {
      const isExpanded = !this.hasAttribute('closed');
      this.headerElement.setAttribute('aria-expanded', String(isExpanded));
      
      // Set a unique ID for the content region
      const contentId = this.contentElement.id || `section-content-${this.getUniqueId()}`;
      this.contentElement.id = contentId;
      
      // Connect header to content with aria-controls
      this.headerElement.setAttribute('aria-controls', contentId);
    }
  }
  
  // Generate a simple unique ID for ARIA attributes
  private getUniqueId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private toggle = () => {
    if (this.hasAttribute('closed')) {
      this.open();
    } else {
      this.close();
    }
  }
  
  private handleKeydown = (e: KeyboardEvent) => {
    // Toggle on Space or Enter key
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.toggle();
    }
  }

  public open() {
    if (this.hasAttribute('closed')) {
      this._internalUpdate = true;
      this.removeAttribute('closed');
      this._internalUpdate = false;
      
      this.updateAriaAttributes();
      
      // Dispatch toggle event
      this.dispatchEvent(new CustomEvent('toggle', { 
        bubbles: true, 
        composed: true,
        detail: { 
          closed: false,
          source: 'method'
        }
      }));
    }
  }

  public close() {
    if (!this.hasAttribute('closed')) {
      this._internalUpdate = true;
      this.setAttribute('closed', '');
      this._internalUpdate = false;
      
      this.updateAriaAttributes();
      
      // Dispatch toggle event
      this.dispatchEvent(new CustomEvent('toggle', { 
        bubbles: true, 
        composed: true,
        detail: { 
          closed: true,
          source: 'method'
        }
      }));
    }
  }
  
  // Public API to check closed state
  public get isClosed(): boolean {
    return this.hasAttribute('closed');
  }
}

// Ensure it's only defined once
if (!customElements.get('collapsible-section')) {
  customElements.define('collapsible-section', CollapsibleSection);
} 