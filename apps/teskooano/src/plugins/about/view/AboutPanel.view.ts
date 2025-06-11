import { IContentRenderer, GroupPanelPartInitParameters } from "dockview-core";
import { template } from "./AboutPanel.template";
import "../../../core/components/card";
import { AboutPanelController } from "../controller/AboutPanel.controller";

/**
 * Custom element `<teskooano-about-panel>` that serves as the view for the "About" panel.
 *
 * This component is responsible for rendering the UI and delegating all business
 * logic to the `AboutPanelController`. It implements Dockview's `IContentRenderer`
 * to be used as panel content.
 *
 * @element teskooano-about-panel
 */
export class AboutPanel extends HTMLElement implements IContentRenderer {
  public static readonly componentName = "teskooano-about-panel";

  private _controller: AboutPanelController;

  /** Root element accessible for Dockview */
  get element(): HTMLElement {
    return this;
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this._controller = new AboutPanelController(this.shadowRoot!);
  }

  /**
   * Dockview initialization function.
   * @param params
   */
  init(params: GroupPanelPartInitParameters): void {
    // No specific parameters needed for this simple panel.
  }

  connectedCallback() {
    this._controller.initialize();
  }

  disconnectedCallback() {
    this._controller.dispose();
  }
}

// Define the custom element if not already defined
if (!customElements.get(AboutPanel.componentName)) {
  customElements.define(AboutPanel.componentName, AboutPanel);
}
