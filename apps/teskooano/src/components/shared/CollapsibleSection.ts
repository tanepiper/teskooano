import { createHtmlElement } from "@teskooano/common";
import { CustomEvents } from "@teskooano/types";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      border: var(--border-width-thin) solid var(--color-border-subtle); /* Use global tokens */
      margin-bottom: var(--spacing-md); /* Use global spacing */
      border-radius: var(--radius-md); /* Use global radius */
      overflow: hidden; /* Prevents content bleed when closed */
      background-color: var(--color-surface-2); /* Use global surface color */
      /* Ensure the host itself can flex if needed by parent */
      display: flex; 
      flex-direction: column;
      min-height: 0; /* Prevent shrinking issues in flex context */
    }
    .header {
      background-color: var(--color-surface-3); /* Use slightly lighter surface for header */
      padding: var(--space-2) var(--space-3); /* Use global spacing */
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      user-select: none;
      /* Keep subtle border, might be needed depending on bg colors */
      border-bottom: var(--border-width-thin) solid var(--color-border-subtle); 
      flex-shrink: 0; /* Prevent header from shrinking */
    }
    /* Keep brightness hover for now */
    .header:hover {
       filter: brightness(1.2);
    }
    .title {
      font-weight: var(--font-weight-medium); /* Use global weight */
      font-size: var(--font-size-base); /* Use base font size */
      color: var(--color-text-primary); /* Use global text color */
    }
    .toggle {
      font-size: 1.1em; /* Keep toggle size relative */
      transition: transform var(--transition-duration-fast) var(--transition-timing-base);
      color: var(--color-text-secondary); /* Use global secondary text color */
      margin-left: var(--space-3); /* Use global spacing */
    }
    .content {
      padding: var(--spacing-md); /* Use global padding */
      /* Transition for smooth collapse/expand - REMOVED max-height */
      /* max-height: 1000px; */ /* REMOVED - Let flex control height */
      overflow: hidden; /* Keep hidden for collapse */
      transition: padding var(--transition-duration-base) var(--transition-timing-base),
                  opacity var(--transition-duration-base) var(--transition-timing-base),
                  flex-basis var(--transition-duration-base) var(--transition-timing-base); /* Add flex-basis */
      opacity: 1;
      /* Let flex determine height when open */
      flex: 1 1 auto; /* Allow content to grow/shrink */
      min-height: 0; /* Prevent flex overflow issues */
      /* Add flex context for slotted children if needed */
      display: flex; 
      flex-direction: column;
      /* Removed border-top, rely on header border */
    }
    :host([closed]) .content {
      max-height: 0; /* Keep for closing animation */
      padding-top: 0;
      padding-bottom: 0;
      border-top-color: transparent; /* Keep border transition smooth */
      opacity: 0; /* Fade out content */
      min-height: 0; /* Ensure it can shrink to zero */
      overflow: hidden; /* Ensure content is clipped */
      flex: 0 0 0px; /* Explicitly set flex basis to 0 when closed */
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
    .header:focus-visible {
        outline: var(--border-width-medium) solid var(--color-border-focus);
        outline-offset: 1px;
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
    return ["title", "closed"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.headerElement = this.shadowRoot!.querySelector(".header");
    this.contentElement = this.shadowRoot!.querySelector(".content");

    // Add event listeners
    this.headerElement?.addEventListener("click", this.toggle);
    this.headerElement?.addEventListener("keydown", this.handleKeydown);

    // Set initial title
    this.updateTitle(this.getAttribute("title"));

    // Set initial state based on attribute (default open)
    if (!this.hasAttribute("closed")) {
      this.open();
    } else {
      this.close();
    }

    // Update ARIA attributes
    this.updateAriaAttributes();
  }

  disconnectedCallback() {
    this.headerElement?.removeEventListener("click", this.toggle);
    this.headerElement?.removeEventListener("keydown", this.handleKeydown);
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;

    if (name === "title") {
      this.updateTitle(newValue);
    } else if (name === "closed" && !this._internalUpdate) {
      // Update ARIA when closed state changes
      this.updateAriaAttributes();

      // Dispatch event when closed state changes via attribute
      this.dispatchEvent(
        new CustomEvent(CustomEvents.TOGGLE, {
          bubbles: true,
          composed: true,
          detail: {
            closed: this.hasAttribute("closed"),
            source: "attribute",
          },
        }),
      );
    }
  }

  private updateTitle(title: string | null) {
    if (this.shadowRoot) {
      const titleElement = this.shadowRoot.querySelector(".title");
      if (titleElement) {
        titleElement.textContent = title || "Section";
      }
    }
  }

  private updateAriaAttributes() {
    if (this.headerElement && this.contentElement) {
      const isExpanded = !this.hasAttribute("closed");
      this.headerElement.setAttribute("aria-expanded", String(isExpanded));

      // Set a unique ID for the content region
      const contentId =
        this.contentElement.id || `section-content-${this.getUniqueId()}`;
      this.contentElement.id = contentId;

      // Connect header to content with aria-controls
      this.headerElement.setAttribute("aria-controls", contentId);
    }
  }

  // Generate a simple unique ID for ARIA attributes
  private getUniqueId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private toggle = () => {
    if (this.hasAttribute("closed")) {
      this.open();
    } else {
      this.close();
    }
  };

  private handleKeydown = (e: KeyboardEvent) => {
    // Toggle on Space or Enter key
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      this.toggle();
    }
  };

  public open() {
    if (this.hasAttribute("closed")) {
      this._internalUpdate = true;
      this.removeAttribute("closed");
      this._internalUpdate = false;

      this.updateAriaAttributes();

      // Dispatch toggle event
      this.dispatchEvent(
        new CustomEvent(CustomEvents.TOGGLE, {
          bubbles: true,
          composed: true,
          detail: {
            closed: false,
            source: "method",
          },
        }),
      );
    }
  }

  public close() {
    if (!this.hasAttribute("closed")) {
      this._internalUpdate = true;
      this.setAttribute("closed", "");
      this._internalUpdate = false;

      this.updateAriaAttributes();

      // Dispatch toggle event
      this.dispatchEvent(
        new CustomEvent(CustomEvents.TOGGLE, {
          bubbles: true,
          composed: true,
          detail: {
            closed: true,
            source: "method",
          },
        }),
      );
    }
  }

  // Public API to check closed state
  public get isClosed(): boolean {
    return this.hasAttribute("closed");
  }
}

// Ensure it's only defined once
if (!customElements.get("collapsible-section")) {
  customElements.define("collapsible-section", CollapsibleSection);
}
