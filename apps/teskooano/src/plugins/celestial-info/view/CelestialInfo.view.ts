import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import { PanelToolbarItemConfig } from "@teskooano/ui-plugin";
import { CelestialInfoController } from "../controller/CelestialInfo.controller";
import { template } from "./CelestialInfo.template";
import InfoIcon from "@fluentui/svg-icons/icons/info_24_regular.svg?raw";
import { FormatUtils } from "../utils/FormatUtils";

/**
 * Custom Element `<celestial-info>`.
 *
 * This view component is responsible for rendering the panel's UI and delegating
 * all business logic to the `CelestialInfoController`. It implements Dockview's
 * `IContentRenderer` interface to be used as panel content.
 */
export class CelestialInfo extends HTMLElement implements IContentRenderer {
  private _controller: CelestialInfoController;

  /**
   * Unique identifier for the custom element.
   */
  public static readonly componentName = "celestial-info";

  /**
   * Generates the configuration required to register this panel as a toolbar button.
   */
  public static registerToolbarButtonConfig(): PanelToolbarItemConfig {
    return {
      id: "celestial_info",
      target: "engine-toolbar",
      iconSvg: InfoIcon,
      title: "Celestial Info",
      type: "panel",
      componentName: this.componentName,
      panelTitle: "Celestial Info",
      behaviour: "toggle",
    };
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(template.content.cloneNode(true));

    const container = shadow.querySelector(".container") as HTMLElement;
    const placeholder = shadow.querySelector(".placeholder") as HTMLElement;

    this._controller = new CelestialInfoController(
      this,
      container,
      placeholder,
    );
  }

  init(parameters: GroupPanelPartInitParameters): void {
    // The controller handles the init logic, this is just to satisfy the interface.
  }

  get element(): HTMLElement {
    return this;
  }

  connectedCallback() {
    this._controller.initialize();
  }

  disconnectedCallback() {
    this._controller.dispose();
  }
}

customElements.define(CelestialInfo.componentName, CelestialInfo);

export { FormatUtils };
