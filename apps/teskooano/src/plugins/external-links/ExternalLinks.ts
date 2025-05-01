import type { TeskooanoButton } from "../../core/components/button/Button"; // Correct casing
import { template } from "./external-links.template"; // Import the template

// Define interfaces for link data
interface ExternalLink {
  url: string;
  label: string;
  iconSvg: string;
}

/**
 * Custom Element `teskooano-external-links`.
 *
 * Displays a set of icon buttons linking to external project resources (like GitHub, Mastodon).
 * Uses the `teskooano-button` component for rendering.
 */
export class ExternalLinksComponent extends HTMLElement {
  private readonly links: ExternalLink[] = [
    {
      url: "https://github.com/tanepiper/teskooano",
      label: "GitHub Repository",
      iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
        </svg>`,
    },
    {
      url: "https://mastodon.gamedev.place/@teskooano",
      label: "Follow on Mastodon",
      iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M15.66 9.59c-.23 1.13-2.1 2.37-4.26 2.61-1.12.12-2.22.24-3.4.18-1.92-.08-3.44-.43-3.44-.43 0 .17.01.34.04.5 0.24 1.77 1.88 1.88 3.42 1.93 1.56.05 2.95-.36 2.95-.36l.06 1.31s-1.09.55-2.95.66c-1.07.05-2.4-.03-3.95-.42C.68 14.75.1 11.4.01 8.01c-.03-1-.01-1.95-.01-2.75 0-3.47 2.44-4.48 2.44-4.48C3.67.24 5.78.02 8 0h.05c2.19.02 4.3.24 5.53.76 0 0 2.43 1.02 2.43 4.49 0 0 .03 2.56-.35 4.34zM13.12 5.52v4.2h-1.78V5.65c0-.86-.39-1.3-1.16-1.3-.86 0-1.29.52-1.29 1.55v2.23H7.11V5.89c0-1.03-.43-1.55-1.29-1.55-.78 0-1.16.43-1.16 1.3v4.08H2.88V5.52c0-.86.24-1.54.71-2.05s1.1-.76 1.89-.76c.92 0 1.61.33 2.07.99L8 4.39l.44-.7c.46-.66 1.15-.99 2.07-.99.79 0 1.43.25 1.91.76.48.5.72 1.19.72 2.05z"/>
        </svg>`,
    },
  ];

  /**
   * Constructs the ExternalLinksComponent.
   * Attaches the shadow DOM and initiates rendering.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.render();
  }

  /**
   * Standard connectedCallback lifecycle method.
   * Currently no specific logic needed here.
   */
  connectedCallback() {}

  /**
   * Renders the component's content within the Shadow DOM using the template
   * and dynamically created buttons.
   */
  private render(): void {
    if (!this.shadowRoot) return;

    // Clear previous content and apply template
    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    const container = this.shadowRoot.querySelector(
      ".external-links-component-container",
    );
    if (!container) {
      console.error(
        "[ExternalLinksComponent] Could not find container in template.",
      );
      return;
    }

    // Create and append buttons based on the links array
    this.links.forEach((link) => {
      const button = this._createLinkButton(link);
      container.appendChild(button);
    });
  }

  /**
   * Helper method to create a `teskooano-button` for an external link.
   *
   * @param {ExternalLink} linkData - The data for the link (URL, label, icon).
   * @returns {TeskooanoButton} The configured button element.
   */
  private _createLinkButton(linkData: ExternalLink): TeskooanoButton {
    const button = document.createElement(
      "teskooano-button",
    ) as TeskooanoButton;
    button.setAttribute("variant", "icon-toolbar");
    button.setAttribute("aria-label", linkData.label);
    button.setAttribute("title", linkData.label); // Add tooltip
    button.onclick = () => window.open(linkData.url, "_blank");

    const icon = document.createElement("span");
    icon.slot = "icon";
    icon.innerHTML = linkData.iconSvg;

    button.appendChild(icon);
    return button;
  }
}
