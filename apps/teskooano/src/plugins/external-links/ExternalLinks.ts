import {
  // Remove unused Dockview imports
  // DockviewApi,
  // DockviewReadyEvent,
  // DockviewPanelApi,
  // IContentRenderer,
  // PanelInitParameters,
} from "dockview-core";

// Import the CSS as a string - Vite handles this with ?raw
import styles from "./external-links.css?raw";

/**
 * Simple component to display buttons linking to external resources in the toolbar using Shadow DOM.
 */
export class ExternalLinksComponent extends HTMLElement {
  // Placeholder URLs - these should ideally come from config
  private readonly GITHUB_URL = "https://github.com/TanePiper/open-space-2";
  private readonly MASTODON_URL = "https://mastodon.social/@tanepiper"; // Replace if needed

  constructor() {
    super();
    // Attach Shadow DOM
    this.attachShadow({ mode: 'open' });
    // Remove classList.add for the host, CSS will target :host
    // this.classList.add("external-links-component-container");
    this.render();
  }

  /**
   * Called when the element is added to the DOM.
   */
  connectedCallback() {
    // No need to check for shadowRoot here as it's created in constructor
    // Render is already called in constructor
    // if (!this.shadowRoot) {
    //   this.render();
    // }
  }

  /**
   * Renders the component's content within the Shadow DOM.
   */
  private render(): void {
    // Ensure shadowRoot exists
    if (!this.shadowRoot) return;

    // Clear any previous shadow DOM content
    this.shadowRoot.innerHTML = "";

    // Create a style element and inject CSS
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    this.shadowRoot.appendChild(styleElement);

    // Create a container div inside shadow DOM for flex layout
    const container = document.createElement('div');
    // We can apply the container class directly here or use :host selector in CSS
    container.classList.add("external-links-component-container");

    // Create GitHub Button
    const githubButton = document.createElement("teskooano-button");
    githubButton.setAttribute("variant", "toolbar");
    githubButton.setAttribute("aria-label", "GitHub Repository");
    githubButton.textContent = "GitHub";
    githubButton.onclick = () => window.open(this.GITHUB_URL, "_blank");
    container.appendChild(githubButton); // Append to container

    // Create Mastodon Button
    const mastodonButton = document.createElement("teskooano-button");
    mastodonButton.setAttribute("variant", "toolbar");
    mastodonButton.setAttribute("aria-label", "Follow on Mastodon");
    mastodonButton.textContent = "Mastodon";
    mastodonButton.onclick = () => window.open(this.MASTODON_URL, "_blank");
    container.appendChild(mastodonButton); // Append to container

    // Append the container to the shadow root
    this.shadowRoot.appendChild(container);
  }

  // --- Remove Dockview lifecycle methods ---
}

// --- Register the Custom Element ---
const ELEMENT_TAG = "teskooano-external-links-component";
if (!customElements.get(ELEMENT_TAG)) {
  customElements.define(ELEMENT_TAG, ExternalLinksComponent);
} 