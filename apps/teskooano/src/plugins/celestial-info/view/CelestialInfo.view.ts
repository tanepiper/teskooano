import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import { PanelToolbarItemConfig } from "@teskooano/ui-plugin";
import { CelestialInfoController } from "../controller/CelestialInfo.controller";
import { template } from "./CelestialInfo.template";
import InfoIcon from "@fluentui/svg-icons/icons/info_24_regular.svg?raw";
import { FormatUtils } from "../utils/formatters";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel";

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
    // REQUIRE panel API ID - no fallback
    if (!parameters.api?.id) {
      throw new Error("[CelestialInfo] Panel ID is required but not provided");
    }

    const parentPanel = (parameters.params as any)
      ?.parentInstance as CompositeEnginePanel;

    // Set data-panel-id attribute for declarative access
    // For child panels, use parent panel ID if available, otherwise use own ID
    const panelId = parentPanel?.panelId || parameters.api.id;
    this.setAttribute("data-panel-id", panelId);

    if (parentPanel) {
      this._controller.setParentPanel(parentPanel);
    } else {
      console.warn(
        "[CelestialInfo] No parent panel instance found in parameters",
      );
    }
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

export { FormatUtils };
