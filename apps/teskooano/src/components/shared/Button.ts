import type { TeskooanoTooltip } from "./Tooltip"; // Import the tooltip type

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      /* position: relative; */ /* REMOVED: Let's see if this fixes layout issues */
      display: inline-block;
      box-sizing: border-box;
      /* Component will use global font */
      /* Define base styling using global tokens */
      --icon-size: var(--font-size-base); /* Link icon size to base font size */
      /* Default gap size (Medium) */
      --icon-gap: var(--space-2); /* Use space-2 (8px) for default gap */
      /* REMOVED: Host z-index boost no longer needed */
      /* z-index: auto; */
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
      /* REMOVED: width: 100%; Let host control width via inline-block */
      /* width: 100%; */ 
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

    /* --- Image Variant --- */
    /* Special styling for buttons that are just raster images (PNG, JPG) */
    :host([variant="image"]) button {
      padding: 0; /* No padding to allow image fill */
      min-height: auto;
      min-width: auto;
      /* Fixed size */
      width: 45px;
      height: 45px;
      background-color: transparent;
      border-color: transparent;
      gap: 0;
      line-height: 0; 
      display: flex; 
      align-items: center;
    }
    :host([variant="image"]) {
      /* Remove host height constraint */
      /* height: 100%; */
      display: inline-flex; 
      align-items: center; 
      /* Add margin to the host element */
      margin-right: var(--space-sm, 8px);
    }
    :host([variant="image"]) button:hover:not([disabled]) {
        background-color: var(--color-surface-hover);
        border-color: transparent;
    }
    :host([variant="image"]) button:active:not([disabled]) {
        background-color: var(--color-surface-active);
        border-color: transparent;
    }
    :host([variant="image"]) button:focus-visible {
       /* Simple outline for image buttons */
       outline: var(--border-width-medium) solid var(--color-border-focus); 
       outline-offset: 1px; 
       border-color: transparent;
    }

    /* --- Sizes using host attributes --- */
    :host([size="xs"]) button {
        min-height: calc(var(--space-1) * 2 + var(--line-height-base) * 0.5em);
        padding: var(--space-1) var(--space-2);
        font-size: var(--font-size-small);
        border-radius: var(--radius-sm);
        gap: var(--icon-gap); /* Use scaled gap */
    }
    :host([size="xs"]) {
         --icon-size: var(--font-size-small);
         --icon-gap: var(--space-1); /* Smaller gap for small buttons */
    }

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

    /* XL Size */
    :host([size="xl"]) button {
        min-height: calc(var(--space-4) * 2 + var(--line-height-base) * 1em); /* Larger padding */
        padding: var(--space-4) var(--space-6); /* Larger padding */
        font-size: var(--font-size-xlarge); /* Larger font */
        border-radius: var(--radius-xl); /* Larger radius */
        gap: var(--icon-gap); /* Use scaled gap */
    }
    :host([size="xl"]) {
         --icon-size: var(--font-size-xlarge); /* Larger icon */
         --icon-gap: var(--space-4); /* Largest gap */
    }

    /* Add gap only if icon is followed by default slot content */
    ::slotted([slot="icon"] + slot:not([name]):not(:empty)) { 
        margin-right: var(--icon-gap);
    }

    /* Hide default slot (text) when mobile attribute is present */
    :host([mobile]) button > slot:not([name='icon']) {
      display: none;
    }

    /* Explicitly hide the tooltip when it's inside the shadow DOM */
    teskooano-tooltip {
      display: none;
    }
  </style>
  <button part="button" aria-describedby="internal-tooltip">
    <slot name="icon"></slot>
    <slot></slot> <!-- Default slot for button text -->
  </button>
  <!-- Tooltip is initially here for structure and content, but will be moved -->
  <teskooano-tooltip id="internal-tooltip" exportparts="tooltip,content,icon,text-content,title,main">
      <slot name="tooltip-icon" slot="icon"></slot>
      <slot name="tooltip-title" slot="title"></slot>
      <slot name="tooltip-text"></slot> <!-- Default slot for tooltip main text -->
  </teskooano-tooltip>
`;

export class TeskooanoButton extends HTMLElement {
  static observedAttributes = [
    "disabled",
    "type",
    "title",
    "fullwidth",
    "size",
    "tooltip-text",
    "tooltip-title",
    "tooltip-icon-svg",
  ];

  private buttonElement: HTMLButtonElement;
  private tooltipElement: TeskooanoTooltip | null = null;
  private tooltipOriginContainer: Node | null = null; // To remember where to put it back
  private isTooltipInBody: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.buttonElement = this.shadowRoot!.querySelector("button")!;
    this.tooltipElement = this.shadowRoot!.querySelector("teskooano-tooltip");
    // Store the original parent (the shadow root fragment)
    this.tooltipOriginContainer = this.tooltipElement?.parentNode ?? null;

    this.addEventListener("click", this.handleClick);
    this.addEventListener("mouseenter", this.showTooltip);
    this.addEventListener("focusin", this.showTooltip);
    this.addEventListener("mouseleave", this.hideTooltip);
    this.addEventListener("focusout", this.hideTooltip);
  }

  connectedCallback() {
    this.updateDisabledState();
    this.updateAttribute("type", this.getAttribute("type") || "button");
    if (!this.hasAttribute("tooltip-text")) {
      this.setButtonAttribute("title", this.getAttribute("title"));
    }
    this.updateTooltipContent(); // Populate content while it's in shadow DOM
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.handleClick);
    this.removeEventListener("mouseenter", this.showTooltip);
    this.removeEventListener("focusin", this.showTooltip);
    this.removeEventListener("mouseleave", this.hideTooltip);
    this.removeEventListener("focusout", this.hideTooltip);

    // Ensure tooltip is removed from body if button disconnects while it's shown
    this.removeTooltipFromBody();
  }

  private removeTooltipFromBody() {
    if (
      this.isTooltipInBody &&
      this.tooltipElement &&
      document.body.contains(this.tooltipElement)
    ) {
      document.body.removeChild(this.tooltipElement);
      this.isTooltipInBody = false;
      // Optionally put it back in shadow DOM, though less critical on disconnect
      // if (this.tooltipOriginContainer) {
      //    this.tooltipOriginContainer.appendChild(this.tooltipElement);
      // }
    }
  }

  private handleClick = (e: MouseEvent) => {
    if (this.disabled) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
  };

  private showTooltip = () => {
    if (this.disabled || !this.tooltipElement || !this.hasTooltipContent()) {
      return;
    }

    // Ensure content is up-to-date before showing/moving
    this.updateTooltipContent();

    // Temporarily remove native title to prevent double tooltip
    const originalTitle = this.buttonElement.getAttribute("title");
    if (originalTitle) {
      this.buttonElement.removeAttribute("title");
      // Store it temporarily if we need to restore it precisely
      this.buttonElement.dataset.originalTitle = originalTitle;
    }

    if (!this.isTooltipInBody) {
      document.body.appendChild(this.tooltipElement);
      this.isTooltipInBody = true;

      requestAnimationFrame(() => {
        if (!this.tooltipElement) return;

        const buttonRect = this.getBoundingClientRect();
        const tooltipRect = this.tooltipElement.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        const gap = 4;

        let top = scrollY + buttonRect.bottom + gap;
        let baseLeft = scrollX + buttonRect.left;
        let transformX = buttonRect.width / 2 - tooltipRect.width / 2;

        const viewportHeight = document.documentElement.clientHeight;
        const viewportWidth = document.documentElement.clientWidth;

        if (top + tooltipRect.height > scrollY + viewportHeight) {
          top = scrollY + buttonRect.top - tooltipRect.height - gap;
        }
        if (top < scrollY) {
          top = scrollY + gap;
        }

        const finalLeft = baseLeft + transformX;
        if (finalLeft < scrollX) {
          transformX = -buttonRect.left + gap;
        } else if (finalLeft + tooltipRect.width > scrollX + viewportWidth) {
          const maxLeft = scrollX + viewportWidth - tooltipRect.width - gap;
          transformX = maxLeft - baseLeft;
        }

        // --- DEBUG LOGGING ---
        if (this.getAttribute("title") === "Add Engine View") {
          // Identify the '+' button
          console.log("Tooltip Pos Debug (+ Button):", {
            buttonLeft: buttonRect.left,
            buttonWidth: buttonRect.width,
            tooltipWidth: tooltipRect.width,
            baseLeftStyle: baseLeft,
            transformXStyle: transformX,
            finalCalcLeft: finalLeft,
          });
        }
        // --- END DEBUG LOGGING ---

        this.tooltipElement.style.position = "absolute";
        this.tooltipElement.style.top = `${top}px`;
        this.tooltipElement.style.left = `${baseLeft}px`;
        //this.tooltipElement.style.transform = `translateX(${transformX}px)`;
      });
    }

    this.tooltipElement.show();
  };

  private hideTooltip = () => {
    if (this.tooltipElement) {
      if (!this.isTooltipInBody) {
        this.tooltipElement.hide();
        return;
      }

      const handleTransitionEnd = (event: TransitionEvent) => {
        if (
          event.propertyName !== "opacity" &&
          event.propertyName !== "visibility"
        ) {
          return;
        }
        this.tooltipElement?.removeEventListener(
          "transitionend",
          handleTransitionEnd,
        );

        if (
          this.isTooltipInBody &&
          this.tooltipElement &&
          document.body.contains(this.tooltipElement)
        ) {
          try {
            document.body.removeChild(this.tooltipElement);
            if (this.tooltipOriginContainer) {
              this.tooltipOriginContainer.appendChild(this.tooltipElement);
            }
            this.isTooltipInBody = false;

            this.tooltipElement?.style.removeProperty("top");
            this.tooltipElement?.style.removeProperty("left");
            this.tooltipElement?.style.removeProperty("position");
            this.tooltipElement?.style.removeProperty("transform");

            // Restore native title ONLY if tooltip-text is not set AND original title existed
            const originalTitle = this.buttonElement.dataset.originalTitle;
            if (!this.hasAttribute("tooltip-text") && originalTitle) {
              this.setButtonAttribute("title", originalTitle);
            }
            // Clean up dataset attribute
            delete this.buttonElement.dataset.originalTitle;
          } catch (error) {
            console.error("Error removing/restoring tooltip:", error);
            this.isTooltipInBody = false;
            delete this.buttonElement.dataset.originalTitle; // Ensure cleanup even on error
          }
        }
      };

      this.tooltipElement.addEventListener(
        "transitionend",
        handleTransitionEnd,
        { once: true },
      );
      this.tooltipElement.hide();

      // Fallback timeout remains the same
      setTimeout(() => {
        if (
          this.isTooltipInBody &&
          this.tooltipElement &&
          document.body.contains(this.tooltipElement)
        ) {
          console.warn("Tooltip removal fallback timeout triggered.");
          // Manually trigger cleanup, including title restoration attempt
          handleTransitionEnd({ propertyName: "opacity" } as TransitionEvent);
        }
      }, 300);
    }
  };

  private hasTooltipContent(): boolean {
    const hasText =
      !!this.getAttribute("tooltip-text") ||
      !!this.querySelector('[slot="tooltip-text"]')?.textContent?.trim() ||
      !!this.getAttribute("title");
    const hasTitle =
      !!this.getAttribute("tooltip-title") ||
      !!this.querySelector('[slot="tooltip-title"]')?.textContent?.trim();
    const hasIcon =
      !!this.getAttribute("tooltip-icon-svg") ||
      !!this.querySelector('[slot="tooltip-icon"]');

    return hasText || hasTitle || hasIcon;
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;

    switch (name) {
      case "disabled":
        this.updateDisabledState();
        if (this.disabled) this.hideTooltip();
        break;
      case "tooltip-text":
      case "tooltip-title":
      case "tooltip-icon-svg":
        this.updateTooltipContent(); // Update content
        // Native title handling is now done in show/hide
        break;
      case "title": // Only update tooltip content if title changes (used as fallback)
        if (!this.hasAttribute("tooltip-text")) {
          this.updateTooltipContent();
          // Also update button title if custom tooltip isn't showing
          if (!this.isTooltipInBody) {
            this.setButtonAttribute("title", newValue);
          }
        }
        break;
      case "fullwidth":
      case "size":
        break;
      default:
        if (name === "type") {
          this.setButtonAttribute(name, newValue || "button");
        }
        break;
    }
  }

  // Helper to update attributes on the internal button (excluding title handling)
  private updateAttribute(name: string, value: string | null) {
    if (name === "title") return; // Title is handled specially based on tooltip presence

    this.setButtonAttribute(name, value);
  }

  // Internal helper to actually set attributes on the button element
  private setButtonAttribute(name: string, value: string | null) {
    if (value !== null) {
      this.buttonElement.setAttribute(name, value);
    } else {
      this.buttonElement.removeAttribute(name);
    }
  }

  private updateTooltipContent() {
    if (!this.tooltipElement) return;

    const text =
      this.getAttribute("tooltip-text") ?? this.getAttribute("title") ?? "";
    const title = this.getAttribute("tooltip-title");
    const iconSvg = this.getAttribute("tooltip-icon-svg");

    const textSlot = this.shadowRoot?.querySelector(
      'slot[name="tooltip-text"]',
    ) as HTMLSlotElement | null;
    const titleSlot = this.shadowRoot?.querySelector(
      'slot[name="tooltip-title"]',
    ) as HTMLSlotElement | null;
    const iconSlot = this.shadowRoot?.querySelector(
      'slot[name="tooltip-icon"]',
    ) as HTMLSlotElement | null;

    const hasTextSlotContent = !!this.querySelector('[slot="tooltip-text"]');
    const hasTitleSlotContent = !!this.querySelector('[slot="tooltip-title"]');
    const hasIconSlotContent = !!this.querySelector('[slot="tooltip-icon"]');

    // Text Content
    if (textSlot && !hasTextSlotContent) {
      this.setTextSlotContent(textSlot, text);
    } else if (textSlot && hasTextSlotContent && textSlot.textContent !== "") {
      this.setTextSlotContent(textSlot, "");
    }

    // Title Content
    if (titleSlot && !hasTitleSlotContent) {
      this.setTextSlotContent(titleSlot, title);
    } else if (titleSlot && hasTitleSlotContent && titleSlot.innerHTML !== "") {
      this.setTextSlotContent(titleSlot, null);
    }

    // Icon Content
    if (iconSlot && !hasIconSlotContent) {
      this.setIconSlotContent(iconSlot, iconSvg);
    } else if (iconSlot && hasIconSlotContent && iconSlot.innerHTML !== "") {
      this.setIconSlotContent(iconSlot, null);
    }

    // REMOVED: Title attribute handling moved to show/hide tooltip methods
  }

  private setTextSlotContent(
    slotElement: HTMLSlotElement | null,
    text: string | null,
  ) {
    if (!slotElement) return;
    // Use textContent for safety, unless HTML is explicitly needed (which it isn't here)
    slotElement.textContent = text ?? "";
  }

  private setIconSlotContent(
    slotElement: HTMLSlotElement | null,
    svgString: string | null,
  ) {
    if (!slotElement) return;
    // Assuming svgString is safe, validated SVG markup
    slotElement.innerHTML = svgString ?? "";
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
      this.buttonElement.setAttribute("aria-disabled", "true");
    } else {
      this.buttonElement.removeAttribute("disabled");
      this.buttonElement.removeAttribute("aria-disabled");
    }
  }

  // Getter/setter for size property
  get size(): string | null {
    return this.getAttribute("size");
  }
  set size(newSize: string | null) {
    if (newSize) {
      const validSizes = ["xs", "sm", "md", "lg", "xl"];
      if (validSizes.includes(newSize)) {
        this.setAttribute("size", newSize);
      } else {
        console.warn(
          `Invalid size "${newSize}" for teskooano-button. Using default.`,
        );
        this.removeAttribute("size");
      }
    } else {
      this.removeAttribute("size");
    }
  }
}
