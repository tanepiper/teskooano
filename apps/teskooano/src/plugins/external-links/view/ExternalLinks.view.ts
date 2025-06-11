import { ExternalLinksController } from "../controller/ExternalLinks.controller.js";
import { template } from "./external-links.template.js";

/**
 * @element teskooano-external-links-component
 * @summary Displays a set of icon buttons linking to external project resources.
 *
 * This component renders a list of predefined external links (e.g., GitHub, social media)
 * as `teskooano-button` elements with icons. It's designed to be used as a toolbar widget.
 * It delegates all rendering logic to the `ExternalLinksController`.
 *
 * @csspart container - The main container `div` holding the link buttons.
 */
export class ExternalLinksComponent extends HTMLElement {
  private controller!: ExternalLinksController;

  /**
   * Constructs the ExternalLinksComponent.
   * Attaches the shadow DOM and instantiates the controller.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    const container = this.shadowRoot!.querySelector(
      ".external-links-component-container",
    );
    if (!container) {
      console.error(
        "[ExternalLinksComponent] Container not found in template.",
      );
      return;
    }

    this.controller = new ExternalLinksController(container as HTMLElement);
  }

  /**
   * Standard connectedCallback lifecycle method.
   * Initializes the controller to render the component's content.
   */
  connectedCallback() {
    this.controller?.initialize();
  }
}
