const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      /* Position relative allows absolute positioning of the tooltip content */
      position: relative;
      display: inline-block; /* Or block, depending on context */
      /* Prevent host from interfering with layout */
      /* width: 0; 
      height: 0; */
    }

    /* Style the tooltip bubble */
    .tooltip {
      
      background-color: var(--color-tooltip-background, var(--color-surface-inverse, #333)); /* Inverse surface */
      color: var(--color-tooltip-text, var(--color-text-inverse, #fff)); /* Inverse text */
      padding: var(--space-2, 8px) var(--space-3, 12px);
      border-radius: var(--radius-md, 6px);
      border: var(--border-width-thin) solid var(--color-border-inverse, var(--color-surface-3, #555));
      box-shadow: var(--shadow-md); 
      font-size: var(--font-size-small, 0.875rem);
      line-height: var(--line-height-tight, 1.4);
      z-index: var(--z-index-tooltip, 100);
      
      /* Hide by default, show on hover/focus of the parent/trigger */
      opacity: 0;
      visibility: hidden;
      transition: opacity var(--transition-duration-fast, 150ms) var(--transition-timing-base, ease-in-out), 
                  visibility var(--transition-duration-fast, 150ms) var(--transition-timing-base, ease-in-out);
      pointer-events: none; /* Allow clicks to pass through */
      white-space: nowrap; /* Prevent wrapping by default */
      max-width: 300px; /* Add a max-width */
       text-wrap: auto;
       fill: #fff;
    }

    /* Basic Arrow - pointing UP */
    .tooltip::after {
      content: '';
      position: absolute;
      bottom: 100%; /* Position arrow at the top of the tooltip */
      left: 50%;
      transform: translateX(-50%);
      border-width: 5px;
      border-style: solid;
      /* Make bottom border visible, others transparent */
      border-color: transparent transparent var(--color-tooltip-background, var(--color-surface-inverse, #333)) transparent;
    }


    /* Content layout */
    .tooltip-content {
       display: flex;
       align-items: center;
       gap: var(--space-2, 8px);
    }
    
    .icon ::slotted(svg) {
        fill: #fff;
    }

    .text-content {
        display: flex;
        flex-direction: column;
    }

    .main {
           word-break: break-word;
       word-wrap: break-word;
       width: 100%;
       }

    .title {
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--space-1, 4px);
        color: var(--color-tooltip-title-text, var(--color-text-inverse, #fff)); /* Can override */
    }
    
    /* Hide sections if slots are empty */
    .icon:empty,
    .title:empty {
      display: none;
    }

  </style>
  
  <div class="tooltip" role="tooltip" part="tooltip">
    <div class="tooltip-content" part="content">
      <div class="icon" part="icon"><slot name="icon"></slot></div>
      <div class="text-content" part="text-content">
         <div class="title" part="title"><slot name="title"></slot></div>
         <div class="main" part="main"><slot></slot></div> <!-- Default slot for main text -->
      </div>
    </div>
  </div>
`;

export class TeskooanoTooltip extends HTMLElement {
  static observedAttributes = ["visible"]; // Control visibility via attribute

  private tooltipElement: HTMLElement | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.tooltipElement = this.shadowRoot!.querySelector(".tooltip");

    // Ensure the host doesn't steal focus
    if (!this.hasAttribute("tabindex")) {
      this.setAttribute("tabindex", "-1");
    }

    // Generate a unique ID if one isn't provided
    if (!this.id) {
      this.id = `tooltip-${crypto.randomUUID()}`;
    }
  }

  connectedCallback() {
    this.updateVisibility();
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (name === "visible") {
      this.updateVisibility();
    }
  }

  private updateVisibility() {
    if (this.hasAttribute("visible")) {
      this.tooltipElement?.style.setProperty("opacity", "1");
      this.tooltipElement?.style.setProperty("visibility", "visible");
    } else {
      this.tooltipElement?.style.setProperty("opacity", "0");
      this.tooltipElement?.style.setProperty("visibility", "hidden");
    }
  }

  // --- Methods to control visibility --- //
  show() {
    this.setAttribute("visible", "");
  }

  hide() {
    this.removeAttribute("visible");
  }

  // --- Optional: Setters for dynamic content --- //
  // Note: Using slots is generally preferred for static content.

  set titleContent(text: string) {
    const titleSlot = this.shadowRoot?.querySelector('slot[name="title"]');
    if (titleSlot) {
      titleSlot.textContent = text;
    }
  }

  set iconContent(svgString: string) {
    const iconSlot = this.shadowRoot?.querySelector('slot[name="icon"]');
    if (iconSlot) {
      iconSlot.innerHTML = svgString; // Assumes svgString is valid SVG markup
    }
  }

  set mainContent(text: string) {
    // Default slot doesn't have a name attribute
    const mainSlot = this.shadowRoot?.querySelector("slot:not([name])");
    if (mainSlot) {
      mainSlot.textContent = text;
    }
  }
}
