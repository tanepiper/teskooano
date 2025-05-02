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

    if (!this.hasAttribute("tabindex")) {
      this.setAttribute("tabindex", "-1");
    }

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
    this.updatePositioning();
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

      requestAnimationFrame(() => this._calculateAndAdjustPosition());
    } else {
      this.tooltipElement?.style.setProperty("opacity", "0");
      this.tooltipElement?.style.setProperty("visibility", "hidden");

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
    const trigger = this._triggerElement ?? this.parentElement;

    if (!this.tooltipElement || !trigger) {
      this.tooltipElement?.style.setProperty("transform", "none");
      console.warn(
        "[Tooltip] Cannot calculate position: missing tooltip or trigger element.",
      );
      return;
    }

    this.tooltipElement.style.transform = "none";

    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const vAlign = this.getAttribute("vertical-align") || "below";
    const hAlign = this.getAttribute("horizontal-align") || "center";

    const gap = 5;

    let top = 0;
    let left = 0;

    if (vAlign === "below") {
      top = triggerRect.bottom + gap;
    } else {
      top = triggerRect.top - tooltipRect.height - gap;
    }

    if (hAlign === "center") {
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    } else if (hAlign === "start") {
      left = triggerRect.left;
    } else {
      left = triggerRect.right - tooltipRect.width;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 5;

    if (left < margin) {
      left = margin;
    } else if (left + tooltipRect.width > viewportWidth - margin) {
      left = viewportWidth - tooltipRect.width - margin;
    }

    if (top < margin) {
      top = margin;

      if (vAlign === "above") {
        top = triggerRect.bottom + gap;
      }
    } else if (top + tooltipRect.height > viewportHeight - margin) {
      top = viewportHeight - tooltipRect.height - margin;

      if (vAlign === "below") {
        top = triggerRect.top - tooltipRect.height - gap;
      }
    }

    if (top < margin) top = margin;
    if (top + tooltipRect.height > viewportHeight - margin) {
      top = viewportHeight - tooltipRect.height - margin;
    }

    this.tooltipElement.style.position = "fixed";
    this.tooltipElement.style.left = `${Math.round(left)}px`;
    this.tooltipElement.style.top = `${Math.round(top)}px`;
    this.tooltipElement.style.transform = "none";
  }

  /**
   * Updates the tooltip's positioning classes based on the
   * 'vertical-align' and 'horizontal-align' attributes.
   */
  private updatePositioning() {
    if (!this.tooltipElement) return;

    const vAlign = this.getAttribute("vertical-align") || "below";
    const hAlign = this.getAttribute("horizontal-align") || "center";

    this.tooltipElement.classList.remove(
      "vertical-above",
      "vertical-below",
      "horizontal-start",
      "horizontal-center",
      "horizontal-end",
    );

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
      console.warn(
        "[Tooltip] No trigger element provided to show(), falling back to parentElement. Consider explicitly setting the trigger.",
      );
      this._triggerElement = this.parentElement;
    } else if (!this._triggerElement) {
      console.error(
        "[Tooltip] Cannot show: No trigger element set or provided, and no parentElement available.",
      );
      return;
    }
    this.setAttribute("visible", "");
  }

  /**
   * Hides the tooltip by removing the 'visible' attribute.
   */
  hide() {
    this._triggerElement = null;
    this.removeAttribute("visible");
  }

  /**
   * Sets the text content of the title slot.
   * @param {string} text - The text to display in the title.
   */
  set titleContent(text: string) {
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
    const iconSlot = this.shadowRoot?.querySelector('slot[name="icon"]');
    if (iconSlot) {
      iconSlot.innerHTML = svgString;
    }
  }

  /**
   * Sets the text content of the default (main) slot.
   * @param {string} text - The text to display.
   */
  set mainContent(text: string) {
    const mainSlot = this.shadowRoot?.querySelector("slot:not([name])");
    if (mainSlot) {
      mainSlot.textContent = text;
    }
  }
}
