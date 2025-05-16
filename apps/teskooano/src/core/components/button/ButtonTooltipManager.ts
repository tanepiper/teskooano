import type { TeskooanoButton } from "./Button";
import type { TeskooanoTooltip } from "../tooltip/Tooltip";

/**
 * Manages the behavior and content of a tooltip associated with a TeskooanoButton.
 * This class encapsulates tooltip-specific logic, such as showing, hiding,
 * updating content based on button attributes/slots, and handling DOM interactions.
 */
export class ButtonTooltipManager {
  private buttonInstance: TeskooanoButton;
  private tooltipElement: TeskooanoTooltip | null;
  private nativeButtonElement: HTMLButtonElement;

  private tooltipOriginContainer: Node | null = null;
  private isTooltipInBody: boolean = false;

  /**
   * Creates an instance of ButtonTooltipManager.
   * @param buttonInstance The TeskooanoButton instance this manager is for.
   * @param nativeButtonElement The native HTMLButtonElement within the TeskooanoButton's shadow DOM.
   * @param tooltipElement The TeskooanoTooltip element associated with the button.
   */
  constructor(
    buttonInstance: TeskooanoButton,
    nativeButtonElement: HTMLButtonElement,
    tooltipElement: TeskooanoTooltip | null,
  ) {
    this.buttonInstance = buttonInstance;
    this.nativeButtonElement = nativeButtonElement;
    this.tooltipElement = tooltipElement;

    if (this.tooltipElement) {
      this.tooltipOriginContainer = this.tooltipElement.parentNode ?? null;
    }
  }

  /**
   * Shows the tooltip if the button is not disabled and the tooltip has content.
   * Manages moving the tooltip to the document body for correct positioning
   * and temporarily removes the native button title to prevent double tooltips.
   */
  public show(): void {
    if (
      this.buttonInstance.disabled ||
      !this.tooltipElement ||
      !this.hasContent()
    ) {
      return;
    }

    this.updateContent(); // Ensure content is fresh

    // Temporarily remove native title from button to prevent double tooltip
    const originalTitle = this.nativeButtonElement.getAttribute("title");
    if (originalTitle) {
      this.nativeButtonElement.removeAttribute("title");
      this.nativeButtonElement.dataset.originalTitle = originalTitle;
    }

    if (!this.isTooltipInBody && this.tooltipElement) {
      // Move to body for correct positioning if not already there
      document.body.appendChild(this.tooltipElement);
      this.isTooltipInBody = true;
    }

    this.tooltipElement.show(this.buttonInstance); // Show tooltip, anchored to the TeskooanoButton
  }

  /**
   * Hides the tooltip and schedules its removal from the DOM after a short delay
   * to allow for animations. Restores the native button title if applicable.
   */
  public hide(): void {
    if (this.tooltipElement) {
      this.tooltipElement.hide();

      // Delay removal to allow for fade-out animations
      setTimeout(() => {
        this.removeTooltipFromDomAndRestoreButtonTitle();
      }, 50); // Match original delay
    }
  }

  /**
   * Removes the tooltip from the document body, re-attaches it to its original
   * container if possible, and restores the native title attribute on the button
   * if it was temporarily removed.
   * @private
   */
  private removeTooltipFromDomAndRestoreButtonTitle(): void {
    if (
      this.isTooltipInBody &&
      this.tooltipElement &&
      document.body.contains(this.tooltipElement)
    ) {
      try {
        document.body.removeChild(this.tooltipElement);
        // Attempt to re-attach to original container if it's still in DOM
        if (
          this.tooltipOriginContainer &&
          document.contains(this.tooltipOriginContainer)
        ) {
          this.tooltipOriginContainer.appendChild(this.tooltipElement);
        } else {
          // If origin is gone, it's okay, especially if button itself is being removed.
        }
        this.isTooltipInBody = false;

        // Restore native title if applicable
        const originalTitle = this.nativeButtonElement.dataset.originalTitle;
        if (
          !this.buttonInstance.hasAttribute("tooltip-text") &&
          originalTitle
        ) {
          this.nativeButtonElement.setAttribute("title", originalTitle);
        }
        delete this.nativeButtonElement.dataset.originalTitle;
      } catch (error) {
        console.error(
          "[ButtonTooltipManager] Error removing/restoring tooltip:",
          error,
        );
        this.isTooltipInBody = false; // Reset state
        delete this.nativeButtonElement.dataset.originalTitle;
      }
    }
  }

  /**
   * Checks if there is any content to display in the tooltip.
   * Considers tooltip-specific attributes, slots, and the native button title.
   * @returns True if there is content for the tooltip, false otherwise.
   */
  public hasContent(): boolean {
    const btn = this.buttonInstance;
    const hasText =
      !!btn.getAttribute("tooltip-text") ||
      !!btn.querySelector('[slot="tooltip-text"]')?.textContent?.trim() ||
      !!btn.getAttribute("title"); // Native title can be tooltip text
    const hasTitle =
      !!btn.getAttribute("tooltip-title") ||
      !!btn.querySelector('[slot="tooltip-title"]')?.textContent?.trim();
    const hasIcon =
      !!btn.getAttribute("tooltip-icon") ||
      !!btn.querySelector('[slot="tooltip-icon"]') ||
      (btn.variant === "icon" && !!btn.querySelector('[slot="icon"]')); // Button's own icon can be tooltip icon
    return hasText || hasTitle || hasIcon;
  }

  /**
   * Updates the content of the tooltip by setting the textContent or innerHTML
   * of the relevant slots within the button's shadow DOM that are part of the
   * `teskooano-tooltip`'s template. This relies on the re-slotting mechanism
   * in `Button.template.ts`.
   * Prioritizes slotted content over attributes.
   */
  public updateContent(): void {
    if (!this.tooltipElement) return;

    const btn = this.buttonInstance;

    // Determine text content
    const textAttr =
      btn.getAttribute("tooltip-text") ?? btn.getAttribute("title");
    const textSlotInButton = btn.shadowRoot?.querySelector(
      'slot[name="tooltip-text"]',
    ) as HTMLSlotElement | null;
    const hasTextSlotted = !!btn.querySelector('[slot="tooltip-text"]'); // User provided <span slot="tooltip-text">

    if (textSlotInButton) {
      if (hasTextSlotted) {
        textSlotInButton.textContent = ""; // Clear default content if user slotted something
      } else {
        textSlotInButton.textContent = textAttr ?? ""; // Use attribute if no slot used
      }
    }

    // Determine title content
    const titleAttr = btn.getAttribute("tooltip-title");
    const titleSlotInButton = btn.shadowRoot?.querySelector(
      'slot[name="tooltip-title"]',
    ) as HTMLSlotElement | null;
    const hasTitleSlotted = !!btn.querySelector('[slot="tooltip-title"]');

    if (titleSlotInButton) {
      if (hasTitleSlotted) {
        titleSlotInButton.textContent = "";
      } else {
        titleSlotInButton.textContent = titleAttr ?? "";
      }
    }

    // Determine icon content
    const specificTooltipIconAttr = btn.getAttribute("tooltip-icon");
    const iconSlotInButton = btn.shadowRoot?.querySelector(
      'slot[name="tooltip-icon"]',
    ) as HTMLSlotElement | null;
    const hasTooltipIconSlotted = !!btn.querySelector('[slot="tooltip-icon"]');

    if (iconSlotInButton) {
      if (hasTooltipIconSlotted) {
        iconSlotInButton.innerHTML = ""; // Clear default content
      } else {
        let iconSvgToShow = specificTooltipIconAttr;
        if (!iconSvgToShow) {
          // Fallback: Use the button's main icon if variant is "icon" or if it's generally desired
          const mainButtonIconSlot = btn.shadowRoot?.querySelector(
            'slot[name="icon"]',
          ) as HTMLSlotElement | null;
          if (mainButtonIconSlot) {
            const assigned = mainButtonIconSlot.assignedElements({
              flatten: true,
            });
            if (assigned.length > 0 && assigned[0]) {
              iconSvgToShow =
                (assigned[0] as HTMLElement).querySelector("svg")?.outerHTML ||
                assigned[0].innerHTML;
            } else {
              iconSvgToShow = mainButtonIconSlot.innerHTML; // Default content of the button's icon slot
            }
          }
        }
        iconSlotInButton.innerHTML = iconSvgToShow ?? "";
      }
    }
  }

  /**
   * Cleans up the tooltip when the associated button is disconnected from the DOM.
   * Ensures the tooltip is removed from the body and the button's native title is restored.
   */
  public disconnected(): void {
    // Called when the button is disconnected
    this.removeTooltipFromDomAndRestoreButtonTitle();
  }
}
