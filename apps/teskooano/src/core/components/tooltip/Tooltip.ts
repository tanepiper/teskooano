import { template } from "./Tooltip.template.ts";

/**
 * @element teskooano-tooltip
 * @summary A custom element for displaying tooltips.
 *
 * @slot - The default slot is used for the main text content of the tooltip.
 * @slot icon - Slot for an optional icon to display before the text.
 * @slot title - Slot for an optional title to display above the main text.
 *
 * @attr {boolean} [visible=false] - Controls the visibility of the tooltip. Set the attribute to make it visible.
 * @attr {'above'|'below'} [vertical-align=above] - Vertical alignment relative to the trigger element.
 * @attr {'start'|'center'|'end'} [horizontal-align=center] - Horizontal alignment relative to the trigger element.
 *
 * @csspart tooltip - The main tooltip container div.
 * @csspart content - The container for the tooltip's content (icon and text).
 * @csspart icon - The container for the icon slot.
 * @csspart text-content - The container for the title and main text slots.
 * @csspart title - The container for the title slot.
 * @csspart main - The container for the default (main text) slot.
 *
 * @cssprop [--color-tooltip-background=--color-surface-inverse] - Background color of the tooltip.
 * @cssprop [--color-tooltip-text=--color-text-inverse] - Text color of the tooltip.
 * @cssprop [--color-tooltip-title-text=--color-text-inverse] - Text color of the tooltip title.
 * @cssprop [--color-border-inverse=--color-surface-3] - Border color of the tooltip.
 * @cssprop [--space-2=8px] - Padding and gap within the tooltip.
 * @cssprop [--space-3=12px] - Padding within the tooltip.
 * @cssprop [--space-1=4px] - Margin below the title.
 * @cssprop [--radius-md=6px] - Border radius of the tooltip.
 * @cssprop [--border-width-thin=1px] - Border width of the tooltip.
 * @cssprop [--shadow-md] - Box shadow of the tooltip.
 * @cssprop [--font-size-small=0.875rem] - Font size of the tooltip text.
 * @cssprop [--line-height-tight=1.4] - Line height of the tooltip text.
 * @cssprop [--font-weight-semibold] - Font weight of the tooltip title.
 * @cssprop [--z-index-tooltip=100] - Z-index of the tooltip.
 * @cssprop [--transition-duration-fast=150ms] - Transition duration for show/hide.
 * @cssprop [--transition-timing-base=ease-in-out] - Transition timing function for show/hide.
 */
export class TeskooanoTooltip extends HTMLElement {
  /**
   * Attributes to observe for changes.
   * Includes 'visible', 'vertical-align', 'horizontal-align'.
   */
  static observedAttributes = ["visible", "vertical-align", "horizontal-align"];

  private tooltipElement: HTMLElement | null = null;
  /**
   * The element that triggered the tooltip and relative to which it should be positioned.
   * @private
   */
  private _triggerElement: HTMLElement | null = null;

  /**
   * Initializes the component, attaches the shadow DOM, and clones the template content.
   * Sets a default tabindex and generates a unique ID if not provided.
   */
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

  /**
   * Called when the element is added to the document's DOM.
   * Updates initial visibility based on the 'visible' attribute.
   */
  connectedCallback() {
    this.updateVisibility();
    this.updatePositioning(); // Initial positioning
  }

  /**
   * Called when an observed attribute changes.
   * @param name - The name of the attribute that changed.
   * @param oldValue - The previous value of the attribute.
   * @param newValue - The new value of the attribute.
   */
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (name === "visible") {
      this.updateVisibility();
    } else if (name === "vertical-align" || name === "horizontal-align") {
      this.updatePositioning();
    }
  }

  /**
   * Updates the tooltip's opacity and visibility styles based on the presence
   * of the 'visible' attribute.
   */
  private updateVisibility() {
    if (this.hasAttribute("visible")) {
      this.tooltipElement?.style.setProperty("opacity", "1");
      this.tooltipElement?.style.setProperty("visibility", "visible");
      // Use requestAnimationFrame to ensure styles are applied and dimensions are readable
      requestAnimationFrame(() => this._calculateAndAdjustPosition());
    } else {
      this.tooltipElement?.style.setProperty("opacity", "0");
      this.tooltipElement?.style.setProperty("visibility", "hidden");
      // Reset position styles when hiding
      this.tooltipElement?.style.removeProperty("left");
      this.tooltipElement?.style.removeProperty("top");
      this.tooltipElement?.style.removeProperty("transform");
    }
  }

  /**
   * Stores the trigger element reference for position calculations.
   * To be called *before* showing the tooltip if not using the default show method.
   * @param triggerElement - The element to position relative to.
   */
  public setTriggerElement(triggerElement: HTMLElement | null): void {
    this._triggerElement = triggerElement;
  }

  /**
   * Calculates the tooltip's position based on alignment attributes and the trigger element,
   * then adjusts it to stay within the viewport boundaries.
   * @private
   */
  private _calculateAndAdjustPosition() {
    // Use the stored trigger element, fallback to parentElement with a warning
    const trigger = this._triggerElement ?? this.parentElement;

    if (!this.tooltipElement || !trigger) {
      // Ensure transforms are cleared even if we can't position
      this.tooltipElement?.style.setProperty("transform", "none");
      console.warn(
        "[Tooltip] Cannot calculate position: missing tooltip or trigger element.",
      );
      return;
    }

    // Ensure transforms are cleared before measuring
    this.tooltipElement.style.transform = "none";

    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const vAlign = this.getAttribute("vertical-align") || "below"; // Default to below
    const hAlign = this.getAttribute("horizontal-align") || "center"; // Default to center

    const gap = 5; // Space between trigger and tooltip (including arrow)

    let top = 0;
    let left = 0;

    // Calculate initial vertical position
    if (vAlign === "below") {
      top = triggerRect.bottom + gap;
    } else {
      // "above"
      top = triggerRect.top - tooltipRect.height - gap;
    }

    // Calculate initial horizontal position
    if (hAlign === "center") {
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    } else if (hAlign === "start") {
      left = triggerRect.left;
    } else {
      // "end"
      left = triggerRect.right - tooltipRect.width;
    }

    // Viewport collision detection and adjustment
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 5; // Extra space from viewport edges

    // Adjust horizontal position
    if (left < margin) {
      left = margin;
    } else if (left + tooltipRect.width > viewportWidth - margin) {
      left = viewportWidth - tooltipRect.width - margin;
    }

    // Adjust vertical position
    if (top < margin) {
      top = margin;
      // Potentially flip alignment if it hits top and was 'above'
      if (vAlign === "above") {
        top = triggerRect.bottom + gap; // Flip to below
        // TODO: Could also update the arrow direction class if needed
      }
    } else if (top + tooltipRect.height > viewportHeight - margin) {
      top = viewportHeight - tooltipRect.height - margin;
      // Potentially flip alignment if it hits bottom and was 'below'
      if (vAlign === "below") {
        top = triggerRect.top - tooltipRect.height - gap; // Flip to above
        // TODO: Could also update the arrow direction class if needed
      }
    }

    // Final check after potential flipping to prevent going off-screen again
    if (top < margin) top = margin;
    if (top + tooltipRect.height > viewportHeight - margin) {
      top = viewportHeight - tooltipRect.height - margin;
    }

    // Apply the calculated and adjusted position
    // We position relative to the viewport, so use fixed positioning logic essentially
    this.tooltipElement.style.position = "fixed"; // Use fixed for viewport positioning
    this.tooltipElement.style.left = `${Math.round(left)}px`;
    this.tooltipElement.style.top = `${Math.round(top)}px`;
    this.tooltipElement.style.transform = "none"; // Override any CSS transforms
  }

  /**
   * Updates the tooltip's positioning classes based on the
   * 'vertical-align' and 'horizontal-align' attributes.
   */
  private updatePositioning() {
    if (!this.tooltipElement) return;

    const vAlign = this.getAttribute("vertical-align") || "below"; // Default to below
    const hAlign = this.getAttribute("horizontal-align") || "center"; // Default to center

    // Remove existing alignment classes
    this.tooltipElement.classList.remove(
      "vertical-above",
      "vertical-below",
      "horizontal-start",
      "horizontal-center",
      "horizontal-end",
    );

    // Add new classes
    this.tooltipElement.classList.add(
      `vertical-${vAlign}`,
      `horizontal-${hAlign}`,
    );
  }

  /**
   * Makes the tooltip visible by adding the 'visible' attribute.
   * Optionally accepts the trigger element directly.
   * @param triggerElement - The element to position relative to (optional).
   */
  show(triggerElement?: HTMLElement | null) {
    if (triggerElement) {
      this._triggerElement = triggerElement;
    } else if (!this._triggerElement && this.parentElement) {
      // Fallback to parentElement if no trigger provided or set previously
      console.warn(
        "[Tooltip] No trigger element provided to show(), falling back to parentElement. Consider explicitly setting the trigger.",
      );
      this._triggerElement = this.parentElement;
    } else if (!this._triggerElement) {
      console.error(
        "[Tooltip] Cannot show: No trigger element set or provided, and no parentElement available.",
      );
      return; // Cannot position without a reference
    }
    this.setAttribute("visible", "");
  }

  /**
   * Hides the tooltip by removing the 'visible' attribute.
   */
  hide() {
    this._triggerElement = null; // Clear trigger reference on hide
    this.removeAttribute("visible");
  }

  /**
   * Sets the text content of the title slot.
   * @param {string} text - The text to display in the title.
   */
  set titleContent(text: string) {
    // Prefer using slots directly for static content.
    // This setter is for dynamic updates via JavaScript.
    const titleSlot = this.shadowRoot?.querySelector('slot[name="title"]');
    if (titleSlot) {
      titleSlot.textContent = text;
    }
  }

  /**
   * Sets the inner HTML of the icon slot.
   * @param {string} svgString - A string containing valid SVG markup.
   */
  set iconContent(svgString: string) {
    // Prefer using slots directly for static content.
    // This setter is for dynamic updates via JavaScript.
    const iconSlot = this.shadowRoot?.querySelector('slot[name="icon"]');
    if (iconSlot) {
      iconSlot.innerHTML = svgString; // Assumes svgString is valid SVG markup
    }
  }

  /**
   * Sets the text content of the default (main) slot.
   * @param {string} text - The text to display.
   */
  set mainContent(text: string) {
    // Prefer using slots directly for static content.
    // This setter is for dynamic updates via JavaScript.
    const mainSlot = this.shadowRoot?.querySelector("slot:not([name])");
    if (mainSlot) {
      mainSlot.textContent = text;
    }
  }
}
