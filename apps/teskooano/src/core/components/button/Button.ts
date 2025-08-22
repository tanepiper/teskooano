import type { TeskooanoTooltip } from "../tooltip/Tooltip";
import { template } from "./Button.template";
import { ButtonTooltipManager } from "./ButtonTooltipManager";
import { createComponentState, Events } from "@teskooano/ui-plugin/patterns";

/**
 * A custom button element `<teskooano-button>` that extends standard button functionality
 * with features like tooltips, different sizes, variants, and an active state.
 * Built with the new Teskooano UI patterns for reactive state management and event-driven communication.
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
 * @attr {"primary" | "ghost" | "image" | "icon"} [variant] - Sets the visual style variant of the button.
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
 *
 * @fires button:clicked - Emitted when button is clicked (not disabled)
 * @fires button:activated - Emitted when button becomes active
 * @fires button:deactivated - Emitted when button becomes inactive
 * @fires tooltip:shown - Emitted when tooltip is displayed
 * @fires tooltip:hidden - Emitted when tooltip is hidden
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
  /** @internal - Reactive state management */
  private state = createComponentState(
    {
      disabled: false,
      type: "button",
      title: null,
      fullwidth: false,
      size: "md",
      tooltipText: null,
      tooltipTitle: null,
      tooltipIcon: null,
      active: false,
      variant: null,
      isHovered: false,
      isFocused: false,
      tooltipVisible: false,
    },
    {
      componentName: "teskooano-button",
      autoEvents: [
        // Listen for global theme changes to update button styling
        {
          eventType: Events.THEME_CHANGED,
          handler: () => {
            this.refreshTooltipContent();
          },
        },
      ],
    },
  );

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

    // Setup computed properties for derived state
    this.state.computed("shouldShowTooltip", {
      deps: ["tooltipText", "tooltipTitle", "tooltipIcon", "title", "disabled"],
      compute: (
        tooltipText: string | null,
        tooltipTitle: string | null,
        tooltipIcon: string | null,
        title: string | null,
        disabled: boolean,
      ) => {
        return (
          !disabled &&
          (!!tooltipText || !!tooltipTitle || !!tooltipIcon || !!title)
        );
      },
    });

    this.state.computed("effectiveTooltipText", {
      deps: ["tooltipText", "title"],
      compute: (tooltipText: string | null, title: string | null) =>
        tooltipText || title || "",
    });

    this.state.computed("isInteractable", {
      deps: ["disabled"],
      compute: (disabled: boolean) => !disabled,
    });

    this.state.computed("buttonClasses", {
      deps: ["active", "variant", "size"],
      compute: (active: boolean, variant: string | null, size: string) => {
        const classes = [];
        if (active) classes.push("active");
        if (variant) classes.push(`variant-${variant}`);
        if (size && size !== "md") classes.push(`size-${size}`);
        return classes.join(" ");
      },
    });

    // Setup event listeners with reactive state integration
    this.addEventListener("click", this.handleClickProxy);
    this.addEventListener("mouseenter", this.handleMouseEnter);
    this.addEventListener("focusin", this.handleFocusIn);
    this.addEventListener("mouseleave", this.handleMouseLeave);
    this.addEventListener("focusout", this.handleFocusOut);

    // Setup state watchers for automatic UI updates
    this.setupStateWatchers();
  }

  /**
   * Called when the element is added to the document's DOM.
   * @internal
   */
  connectedCallback() {
    // Sync initial state from attributes
    this.state.update({
      disabled: this.hasAttribute("disabled"),
      type: this.getAttribute("type") || "button",
      title: this.getAttribute("title"),
      fullwidth: this.hasAttribute("fullwidth"),
      size: this.getAttribute("size") || "md",
      tooltipText: this.getAttribute("tooltip-text"),
      tooltipTitle: this.getAttribute("tooltip-title"),
      tooltipIcon: this.getAttribute("tooltip-icon"),
      active: this.hasAttribute("active"),
      variant: this.getAttribute("variant"),
    });

    // Initialize tooltip content
    this.tooltipManager.updateContent();
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.handleClickProxy);
    this.removeEventListener("mouseenter", this.handleMouseEnter);
    this.removeEventListener("focusin", this.handleFocusIn);
    this.removeEventListener("mouseleave", this.handleMouseLeave);
    this.removeEventListener("focusout", this.handleFocusOut);
    this.tooltipManager.disconnected();

    // Clean up reactive state
    this.state.cleanup();
  }

  /**
   * Setup reactive state watchers for automatic UI updates
   * @internal
   */
  private setupStateWatchers(): void {
    // Watch for disabled state changes
    this.state.watch("disabled", (disabled: boolean) => {
      this.updateDisabledState();
      if (disabled) {
        this.hideTooltip();
      }
    });

    // Watch for tooltip-related state changes
    this.state.watch("shouldShowTooltip", (shouldShow: boolean) => {
      if (!shouldShow) {
        this.hideTooltip();
      }
    });

    // Watch for tooltip visibility changes and emit events
    this.state.watch("tooltipVisible", (visible: boolean) => {
      if (visible) {
        this.state.emit("tooltip:shown", {
          buttonId: this.id,
          tooltipText: this.state.get("effectiveTooltipText"),
          source: "teskooano-button",
        });
      } else {
        this.state.emit("tooltip:hidden", {
          buttonId: this.id,
          source: "teskooano-button",
        });
      }
    });

    // Watch for active state changes and emit events
    this.state.watch("active", (active: boolean, oldActive: boolean) => {
      this.updateActiveState();
      if (active !== oldActive) {
        this.state.emit(active ? "button:activated" : "button:deactivated", {
          buttonId: this.id,
          active,
          source: "teskooano-button",
        });
      }
    });

    // Watch for variant changes
    this.state.watch("variant", () => {
      this.updateVariant();
      this.refreshTooltipContent();
    });

    // Watch for size changes
    this.state.watch("size", () => {
      // Size changes are handled via CSS, no DOM updates needed
    });

    // Watch for type changes
    this.state.watch("type", (type: string) => {
      this.setButtonAttribute("type", type);
    });
  }

  /**
   * Handle mouse enter with reactive state
   * @internal
   */
  private handleMouseEnter = (): void => {
    this.state.set("isHovered", true);
    this.showTooltip();
  };

  /**
   * Handle focus in with reactive state
   * @internal
   */
  private handleFocusIn = (): void => {
    this.state.set("isFocused", true);
    this.showTooltip();
  };

  /**
   * Handle mouse leave with reactive state
   * @internal
   */
  private handleMouseLeave = (): void => {
    this.state.set("isHovered", false);
    this.hideTooltip();
  };

  /**
   * Handle focus out with reactive state
   * @internal
   */
  private handleFocusOut = (): void => {
    this.state.set("isFocused", false);
    this.hideTooltip();
  };

  /**
   * Show tooltip using reactive state
   * @internal
   */
  private showTooltip(): void {
    const shouldShow = this.state.get("shouldShowTooltip");
    if (shouldShow && !this.state.get("tooltipVisible")) {
      this.state.set("tooltipVisible", true);
      this.tooltipManager.show();
    }
  }

  /**
   * Hide tooltip using reactive state
   * @internal
   */
  private hideTooltip(): void {
    if (this.state.get("tooltipVisible")) {
      this.state.set("tooltipVisible", false);
      this.tooltipManager.hide();
    }
  }

  private handleClickProxy = (e: MouseEvent) => {
    if (this.state.get("disabled")) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }

    // Emit click event through the event system
    this.state.emit("button:clicked", {
      buttonId: this.id,
      variant: this.state.get("variant"),
      active: this.state.get("active"),
      disabled: this.state.get("disabled"),
      source: "teskooano-button",
    });
  };

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;

    // Update reactive state based on attribute changes
    switch (name) {
      case "disabled":
        this.state.set("disabled", newValue !== null);
        break;
      case "tooltip-text":
        this.state.set("tooltipText", newValue);
        this.tooltipManager.updateContent();
        break;
      case "tooltip-title":
        this.state.set("tooltipTitle", newValue);
        this.tooltipManager.updateContent();
        break;
      case "tooltip-icon":
        this.state.set("tooltipIcon", newValue);
        this.tooltipManager.updateContent();
        break;
      case "title":
        this.state.set("title", newValue);
        if (!this.hasAttribute("tooltip-text")) {
          this.tooltipManager.updateContent();
        }
        break;
      case "active":
        this.state.set("active", newValue !== null);
        this.tooltipManager.updateContent();
        break;
      case "fullwidth":
        this.state.set("fullwidth", newValue !== null);
        break;
      case "size":
        this.state.set("size", newValue || "md");
        break;
      case "variant":
        this.state.set("variant", newValue);
        this.tooltipManager.updateContent();
        break;
      case "type":
        this.state.set("type", newValue || "button");
        break;
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
    return this.state.get("disabled");
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

  get size(): string {
    return this.state.get("size");
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
    return this.state.get("variant");
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
    return this.state.get("active");
  }

  set active(isActive: boolean) {
    if (isActive) {
      this.setAttribute("active", "");
    } else {
      this.removeAttribute("active");
    }
  }
}
