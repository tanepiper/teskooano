import type { TeskooanoButton } from "../../../core/components/button/Button.js";
import type { ExternalLink } from "../types.js";
import { links } from "../data/links.js";

/**
 * Controller for the ExternalLinks view.
 *
 * This class handles the logic for rendering the external link buttons
 * into the component's view.
 */
export class ExternalLinksController {
  private _container: HTMLElement;

  /**
   * Creates an instance of the controller.
   * @param container The container element from the view where buttons will be rendered.
   */
  constructor(container: HTMLElement) {
    this._container = container;
  }

  /**
   * Initializes the controller, triggering the rendering of buttons.
   */
  public initialize(): void {
    this.renderButtons();
  }

  /**
   * Clears the container and renders a button for each external link.
   */
  private renderButtons(): void {
    this._container.innerHTML = ""; // Clear existing content
    links.forEach((link) => {
      const button = this.createLinkButton(link);
      this._container.appendChild(button);
    });
  }

  /**
   * Creates and configures a button element for a given external link.
   * @param linkData The data for the link.
   * @returns The configured button element.
   */
  private createLinkButton(linkData: ExternalLink): TeskooanoButton {
    if (!customElements.get("teskooano-button")) {
      console.error(
        "[ExternalLinksController] <teskooano-button> custom element is not defined.",
      );
      return document.createElement("span") as unknown as TeskooanoButton;
    }

    const button = document.createElement(
      "teskooano-button",
    ) as TeskooanoButton;

    button.setAttribute("variant", "icon-toolbar");
    button.setAttribute("aria-label", linkData.label);
    button.onclick = () =>
      window.open(linkData.url, "_blank", "noopener,noreferrer");

    button.setAttribute("tooltip-text", linkData.tooltipText ?? linkData.label);
    button.setAttribute(
      "tooltip-title",
      linkData.tooltipTitle ?? linkData.label,
    );
    button.setAttribute(
      "tooltip-icon-svg",
      linkData.tooltipIconSvg ?? linkData.iconSvg,
    );

    const icon = document.createElement("span");
    icon.slot = "icon";
    icon.innerHTML = linkData.iconSvg;
    button.appendChild(icon);

    return button;
  }
}
