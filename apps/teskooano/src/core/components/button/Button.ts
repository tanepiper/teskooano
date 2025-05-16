import type { TeskooanoTooltip } from "../tooltip/Tooltip";
import { template } from "./Button.template";
import { ButtonTooltipManager } from "./ButtonTooltipManager";

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
  private tooltipManager: ButtonTooltipManager;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.buttonElement = this.shadowRoot!.querySelector("button")!;

    const tooltipElement = this.shadowRoot!.querySelector(
      "teskooano-tooltip",
    ) as TeskooanoTooltip | null;

    this.tooltipManager = new ButtonTooltipManager(
      this,
      this.buttonElement,
      tooltipElement,
    );

    this.addEventListener("click", this.handleClickProxy);
    this.addEventListener("mouseenter", this.handleShowTooltipProxy);
    this.addEventListener("focusin", this.handleShowTooltipProxy);
    this.addEventListener("mouseleave", this.handleHideTooltipProxy);
    this.addEventListener("focusout", this.handleHideTooltipProxy);
  }

  /**
   * Called when the element is added to the document's DOM.
   * @internal
   */
  connectedCallback() {
    this.updateDisabledState();
    this.updateAttribute("type", this.getAttribute("type") || "button");

    if (!this.hasAttribute("tooltip-text") && this.hasAttribute("title")) {
      // this.buttonElement.setAttribute("title", this.getAttribute("title")); // Manager handles this interaction now
    }
    this.updateActiveState();
    this.tooltipManager.updateContent();
    this.updateVariant();
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.handleClickProxy);
    this.removeEventListener("mouseenter", this.handleShowTooltipProxy);
    this.removeEventListener("focusin", this.handleShowTooltipProxy);
    this.removeEventListener("mouseleave", this.handleHideTooltipProxy);
    this.removeEventListener("focusout", this.handleHideTooltipProxy);
    this.tooltipManager.disconnected();
  }

  private handleClickProxy = (e: MouseEvent) => {
    if (this.disabled) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
  };

  private handleShowTooltipProxy = () => {
    this.tooltipManager.show();
  };

  private handleHideTooltipProxy = () => {
    this.tooltipManager.hide();
  };

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;

    switch (name) {
      case "disabled":
        this.updateDisabledState();
        if (this.disabled) this.tooltipManager.hide();
        break;
      case "tooltip-text":
      case "tooltip-title":
      case "tooltip-icon":
        this.tooltipManager.updateContent();
        break;
      case "title":
        if (!this.hasAttribute("tooltip-text")) {
          this.tooltipManager.updateContent();
        }
        break;
      case "active":
        this.updateActiveState();
        this.tooltipManager.updateContent();
        break;
      case "fullwidth":
      case "size":
        break;
      case "variant":
        this.updateVariant();
        this.tooltipManager.updateContent();
        break;
      default:
        if (name === "type") {
          this.setButtonAttribute(name, newValue || "button");
        }
        break;
    }
  }

  private updateAttribute(name: string, value: string | null) {
    if (name === "type") {
      this.setButtonAttribute(name, value);
    }
  }

  private setButtonAttribute(name: string, value: string | null) {
    if (value !== null) {
      this.buttonElement.setAttribute(name, value);
    } else {
      this.buttonElement.removeAttribute(name);
    }
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
    this.tooltipManager.updateContent();
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
