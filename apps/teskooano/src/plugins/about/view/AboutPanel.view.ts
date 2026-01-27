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
    // REQUIRE panel API ID - no fallback
    if (!params.api?.id) {
      throw new Error("[AboutPanel] Panel ID is required but not provided");
    }

    // Set data-panel-id attribute for declarative access
    // About panel is standalone, so use its own ID
    this.setAttribute("data-panel-id", params.api.id);
  }

  connectedCallback() {
    this._controller.initialize();
  }

  disconnectedCallback() {
    this._controller.dispose();
  }
}
