import type { TeskooanoTooltip } from "../Tooltip"; // Import the tooltip type

import { template } from "./Button.template";

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
