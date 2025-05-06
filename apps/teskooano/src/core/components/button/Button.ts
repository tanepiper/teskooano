import type { TeskooanoTooltip } from "../tooltip/Tooltip";

import { template } from "./Button.template";

/**
 * A custom button element `<teskooano-button>` that extends standard button functionality
 * with features like tooltips, different sizes, variants, and an active state.
 * It supports disabling the button and handling tooltip display logic.
 *
 * @element teskooano-button
 * @attr {boolean} [disabled=false] - Disables the button.
 * @attr {"button" | "submit" | "reset"} [type="button"] - The type of the button.
 * @attr {string} [title] - Standard HTML title attribute. Used as tooltip text if `tooltip-text` is not provided.
 * @attr {boolean} [fullwidth=false] - Makes the button take up the full width of its container.
 * @attr {"xs" | "sm" | "md" | "lg" | "xl"} [size="md"] - Sets the size of the button.
 * @attr {string} [tooltip-text] - Text content for the tooltip. Overrides the `title` attribute for the tooltip.
 * @attr {string} [tooltip-title] - Title content for the tooltip.
 * @attr {string} [tooltip-icon] - SVG string or path for an icon within the tooltip. Overrides the button's icon if provided.
 * @attr {boolean} [active=false] - Indicates if the button is in an active state (e.g., toggled on).
 * @attr {"primary" | "secondary" | "tertiary" | "danger" | "icon"} [variant="primary"] - Sets the visual style variant of the button.
 *
 * @slot - Default slot for the button's text content.
 * @slot icon - Slot for an icon to be displayed within the button.
 * @slot tooltip-text - Slot for providing custom text content to the tooltip.
 * @slot tooltip-title - Slot for providing custom title content to the tooltip.
 * @slot tooltip-icon - Slot for providing a custom icon to the tooltip. Overrides `tooltip-icon` attribute and `icon` slot.
 *
 * @csspart button - The native button element.
 * @csspart icon - The container for the icon slot.
 * @csspart label - The container for the default slot (text).
 */
export class TeskooanoButton extends HTMLElement {
  /**
   * Attributes observed for changes.
   * @internal
   */
  static observedAttributes = [
    "disabled",
    "type",
    "title",
    "fullwidth",
    "size",
    "tooltip-text",
    "tooltip-title",
    "tooltip-icon",
    "active",
    "variant",
  ];

  /** @internal */
  private buttonElement: HTMLButtonElement;
  /** @internal */
  private tooltipElement: TeskooanoTooltip | null = null;
  /** @internal Holds the original parent node of the tooltip before it's moved to the body. */
  private tooltipOriginContainer: Node | null = null;
  /** @internal Tracks if the tooltip is currently appended to the document body. */
  private isTooltipInBody: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.buttonElement = this.shadowRoot!.querySelector("button")!;
    this.tooltipElement = this.shadowRoot!.querySelector("teskooano-tooltip");

    this.tooltipOriginContainer = this.tooltipElement?.parentNode ?? null;

    this.addEventListener("click", this.handleClick);
    this.addEventListener("mouseenter", this.showTooltip);
    this.addEventListener("focusin", this.showTooltip);
    this.addEventListener("mouseleave", this.hideTooltip);
    this.addEventListener("focusout", this.hideTooltip);
  }

  /**
   * Called when the element is added to the document's DOM.
   * @internal
   */
  connectedCallback() {
    this.updateDisabledState();
    this.updateAttribute("type", this.getAttribute("type") || "button");
    if (!this.hasAttribute("tooltip-text")) {
      this.setButtonAttribute("title", this.getAttribute("title"));
    }
    this.updateActiveState();
    this.updateTooltipContent();
    this.updateVariant();
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.handleClick);
    this.removeEventListener("mouseenter", this.showTooltip);
    this.removeEventListener("focusin", this.showTooltip);
    this.removeEventListener("mouseleave", this.hideTooltip);
    this.removeEventListener("focusout", this.hideTooltip);

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

    this.updateTooltipContent();

    const originalTitle = this.buttonElement.getAttribute("title");
    if (originalTitle) {
      this.buttonElement.removeAttribute("title");

      this.buttonElement.dataset.originalTitle = originalTitle;
    }

    if (!this.isTooltipInBody) {
      document.body.appendChild(this.tooltipElement);
      this.isTooltipInBody = true;
    }

    this.tooltipElement.show(this);
  };

  private hideTooltip = () => {
    if (this.tooltipElement) {
      this.tooltipElement.hide();

      setTimeout(() => {
        if (
          this.isTooltipInBody &&
          this.tooltipElement &&
          this.tooltipElement.parentElement === document.body
        ) {
          try {
            document.body.removeChild(this.tooltipElement);
            if (this.tooltipOriginContainer) {
              if (document.contains(this.tooltipOriginContainer)) {
                this.tooltipOriginContainer.appendChild(this.tooltipElement);
              } else {
                console.warn(
                  "[Button] Tooltip origin container disconnected, cannot re-attach.",
                );
              }
            }
            this.isTooltipInBody = false;

            const originalTitle = this.buttonElement.dataset.originalTitle;
            if (!this.hasAttribute("tooltip-text") && originalTitle) {
              this.setButtonAttribute("title", originalTitle);
            }

            delete this.buttonElement.dataset.originalTitle;
          } catch (error) {
            console.error("Error removing/restoring tooltip:", error);
            this.isTooltipInBody = false;
            delete this.buttonElement.dataset.originalTitle;
          }
        }
      }, 50);
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
      !!this.getAttribute("tooltip-icon") ||
      !!this.querySelector('[slot="tooltip-icon"]') ||
      (this.variant === "icon" && !!this.querySelector('[slot="icon"]'));

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
      case "tooltip-icon":
        this.updateTooltipContent();
        break;
      case "title":
        if (!this.hasAttribute("tooltip-text")) {
          this.updateTooltipContent();
          if (!this.isTooltipInBody) {
            this.setButtonAttribute("title", newValue);
          }
        }
        break;
      case "active":
        this.updateTooltipContent();
        this.updateActiveState();
        break;
      case "fullwidth":
      case "size":
        break;
      case "variant":
        this.updateVariant();
        this.updateTooltipContent();
        break;
      default:
        if (name === "type") {
          this.setButtonAttribute(name, newValue || "button");
        }
        break;
    }
  }

  private updateAttribute(name: string, value: string | null) {
    if (name === "title") return;

    this.setButtonAttribute(name, value);
  }

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
    const specificTooltipIconSvg = this.getAttribute("tooltip-icon");

    const textSlot = this.shadowRoot?.querySelector(
      'slot[name="tooltip-text"]',
    ) as HTMLSlotElement | null;
    const titleSlot = this.shadowRoot?.querySelector(
      'slot[name="tooltip-title"]',
    ) as HTMLSlotElement | null;
    const tooltipIconSlot = this.shadowRoot?.querySelector(
      'slot[name="tooltip-icon"]',
    ) as HTMLSlotElement | null;
    const mainIconSlot = this.shadowRoot?.querySelector(
      'slot[name="icon"]',
    ) as HTMLSlotElement | null;

    const hasTextSlotContent = !!this.querySelector('[slot="tooltip-text"]');
    const hasTitleSlotContent = !!this.querySelector('[slot="tooltip-title"]');
    const hasTooltipIconSlotContent = !!this.querySelector(
      '[slot="tooltip-icon"]',
    );

    if (textSlot && !hasTextSlotContent) {
      this.setTextSlotContent(textSlot, text);
    } else if (textSlot && hasTextSlotContent && textSlot.textContent !== "") {
      this.setTextSlotContent(textSlot, "");
    }

    if (titleSlot && !hasTitleSlotContent) {
      this.setTextSlotContent(titleSlot, title);
    } else if (titleSlot && hasTitleSlotContent && titleSlot.innerHTML !== "") {
      this.setTextSlotContent(titleSlot, null);
    }

    let finalIconSvg: string | null = null;
    if (hasTooltipIconSlotContent) {
      finalIconSvg = null;
    } else if (specificTooltipIconSvg !== null) {
      finalIconSvg = specificTooltipIconSvg;
    } else {
      const assignedElements = mainIconSlot?.assignedElements({
        flatten: true,
      });
      if (assignedElements && assignedElements.length > 0) {
        finalIconSvg = assignedElements[0].innerHTML ?? null;
      } else {
        finalIconSvg = mainIconSlot?.innerHTML ?? null;
      }
    }

    this.setIconSlotContent(tooltipIconSlot, finalIconSvg);
  }

  private setTextSlotContent(
    slotElement: HTMLSlotElement | null,
    text: string | null,
  ) {
    if (!slotElement) return;

    slotElement.textContent = text ?? "";
  }

  private setIconSlotContent(
    slotElement: HTMLSlotElement | null,
    svgString: string | null,
  ) {
    if (!slotElement) return;

    slotElement.innerHTML = svgString ?? "";
  }

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

  get variant(): string | null {
    return this.getAttribute("variant");
  }

  private updateActiveState() {
    if (this.hasAttribute("active")) {
      this.buttonElement.classList.add("active");
    } else {
      this.buttonElement.classList.remove("active");
    }
  }

  private updateVariant() {
    this.setButtonAttribute("variant", this.variant);
  }

  public refreshTooltipContent() {
    this.updateTooltipContent();
  }

  get active(): boolean {
    return this.hasAttribute("active");
  }

  set active(isActive: boolean) {
    if (isActive) {
      this.setAttribute("active", "");
    } else {
      this.removeAttribute("active");
    }
  }
}
