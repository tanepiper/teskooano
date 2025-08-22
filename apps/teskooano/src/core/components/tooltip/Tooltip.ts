import { template } from "./Tooltip.template";
import { createComponentState } from "@teskooano/ui-plugin/patterns";

interface TooltipState {
  isVisible: boolean;
  verticalAlign: "above" | "below";
  horizontalAlign: "start" | "center" | "end";
  timeout: number;
  triggerElement: HTMLElement | null;
  position: {
    top: number;
    left: number;
  } | null;
}

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
 * @attr {number} [timeout=5000] - Auto-hide timeout in milliseconds. Set to 0 to disable auto-hide.
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
   * Includes 'visible', 'vertical-align', 'horizontal-align', 'timeout'.
   */
  static observedAttributes = [
    "visible",
    "vertical-align",
    "horizontal-align",
    "timeout",
  ];

  private tooltipElement: HTMLElement | null = null;
  private hideTimeout: number | null = null;

  // Use the new reactive state pattern
  private state = createComponentState(
    {
      isVisible: false,
      verticalAlign: "below" as const,
      horizontalAlign: "center" as const,
      timeout: 5000,
      triggerElement: null,
      position: null,
    } as TooltipState,
    {
      componentName: "teskooano-tooltip",
    },
  );

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
    this.updateStateFromAttributes();
    this.setupStateWatchers();
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
    if (oldValue === newValue) return;

    switch (name) {
      case "visible":
        this.state.set("isVisible", newValue !== null);
        break;
      case "vertical-align":
        this.state.set(
          "verticalAlign",
          (newValue as "above" | "below") || "below",
        );
        break;
      case "horizontal-align":
        this.state.set(
          "horizontalAlign",
          (newValue as "start" | "center" | "end") || "center",
        );
        break;
      case "timeout":
        const timeoutValue = parseInt(newValue || "5000", 10);
        this.state.set("timeout", isNaN(timeoutValue) ? 5000 : timeoutValue);
        break;
    }
  }

  private updateStateFromAttributes(): void {
    this.state.set("isVisible", this.hasAttribute("visible"));
    this.state.set(
      "verticalAlign",
      (this.getAttribute("vertical-align") as "above" | "below") || "below",
    );
    this.state.set(
      "horizontalAlign",
      (this.getAttribute("horizontal-align") as "start" | "center" | "end") ||
        "center",
    );

    const timeoutAttr = this.getAttribute("timeout");
    const timeoutValue = timeoutAttr ? parseInt(timeoutAttr, 10) : 5000;
    this.state.set("timeout", isNaN(timeoutValue) ? 5000 : timeoutValue);
  }

  private setupStateWatchers(): void {
    // Watch for visibility changes
    this.state.watch("isVisible", (isVisible: boolean) => {
      this.updateVisibility(isVisible);
    });

    // Watch for alignment changes
    this.state.watch("verticalAlign", () => {
      this.updatePositioning();
    });

    this.state.watch("horizontalAlign", () => {
      this.updatePositioning();
    });

    // Watch for timeout changes
    this.state.watch("timeout", () => {
      if (this.state.get("isVisible")) {
        this.startHideTimeout();
      }
    });

    // Watch for trigger element changes
    this.state.watch("triggerElement", (triggerElement: HTMLElement | null) => {
      if (triggerElement && this.state.get("isVisible")) {
        requestAnimationFrame(() => this.calculateAndAdjustPosition());
      }
    });

    // Watch for position changes
    this.state.watch(
      "position",
      (position: { top: number; left: number } | null) => {
        if (position && this.tooltipElement) {
          this.tooltipElement.style.position = "fixed";
          this.tooltipElement.style.left = `${Math.round(position.left)}px`;
          this.tooltipElement.style.top = `${Math.round(position.top)}px`;
          this.tooltipElement.style.transform = "none";
        }
      },
    );
  }

  /**
   * Updates the tooltip's opacity and visibility styles based on the visibility state.
   */
  private updateVisibility(isVisible: boolean) {
    if (isVisible) {
      this.tooltipElement?.style.setProperty("opacity", "1");
      this.tooltipElement?.style.setProperty("visibility", "visible");

      requestAnimationFrame(() => this.calculateAndAdjustPosition());
      this.startHideTimeout();
    } else {
      this.tooltipElement?.style.setProperty("opacity", "0");
      this.tooltipElement?.style.setProperty("visibility", "hidden");

      this.tooltipElement?.style.removeProperty("left");
      this.tooltipElement?.style.removeProperty("top");
      this.tooltipElement?.style.removeProperty("transform");

      this.clearHideTimeout();
    }
  }

  /**
   * Stores the trigger element reference for position calculations.
   * To be called *before* showing the tooltip if not using the default show method.
   * @param triggerElement - The element to position relative to.
   */
  public setTriggerElement(triggerElement: HTMLElement | null): void {
    this.state.set("triggerElement", triggerElement);
  }

  /**
   * Calculates the tooltip's position based on alignment attributes and the trigger element,
   * then adjusts it to stay within the viewport boundaries.
   */
  private calculateAndAdjustPosition() {
    const trigger = this.state.get("triggerElement") ?? this.parentElement;

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
    const vAlign = this.state.get("verticalAlign");
    const hAlign = this.state.get("horizontalAlign");

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

    this.state.set("position", { top, left });
  }

  /**
   * Updates the tooltip's positioning classes based on the
   * 'vertical-align' and 'horizontal-align' attributes.
   */
  private updatePositioning() {
    if (!this.tooltipElement) return;

    const vAlign = this.state.get("verticalAlign");
    const hAlign = this.state.get("horizontalAlign");

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
      this.state.set("triggerElement", triggerElement);
    } else if (!this.state.get("triggerElement") && this.parentElement) {
      console.warn(
        "[Tooltip] No trigger element provided to show(), falling back to parentElement. Consider explicitly setting the trigger.",
      );
      this.state.set("triggerElement", this.parentElement);
    } else if (!this.state.get("triggerElement")) {
      console.error(
        "[Tooltip] Cannot show: No trigger element set or provided, and no parentElement available.",
      );
      return;
    }
    this.state.set("isVisible", true);
  }

  /**
   * Hides the tooltip by removing the 'visible' attribute.
   */
  hide() {
    this.state.set("triggerElement", null);
    this.state.set("isVisible", false);
  }

  /**
   * Starts the timeout to automatically hide the tooltip.
   * Uses the configurable timeout attribute or defaults to 5 seconds.
   */
  private startHideTimeout() {
    this.clearHideTimeout();

    const timeoutMs = this.state.get("timeout");
    if (timeoutMs > 0) {
      this.hideTimeout = window.setTimeout(() => {
        this.hide();
        this.hideTimeout = null;
      }, timeoutMs);
    }
  }

  /**
   * Clears the hide timeout if it exists.
   */
  private clearHideTimeout() {
    if (this.hideTimeout !== null) {
      window.clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
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

  /**
   * Gets the timeout duration in milliseconds.
   * @returns Timeout duration in milliseconds
   */
  get timeout(): number {
    return this.state.get("timeout");
  }

  /**
   * Sets the timeout duration in milliseconds.
   * @param {number} value - Timeout duration in milliseconds
   */
  set timeout(value: number) {
    if (value < 0) {
      console.warn(
        `[Tooltip] Invalid timeout value: ${value}, must be non-negative`,
      );
      return;
    }
    this.state.set("timeout", value);
  }

  /**
   * Cleanup when component is disconnected
   */
  disconnectedCallback() {
    this.clearHideTimeout();
    this.state.cleanup(); // Automatic cleanup of all subscriptions
  }
}
