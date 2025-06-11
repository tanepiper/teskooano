import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import { PanelToolbarItemConfig } from "@teskooano/ui-plugin";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import DataUsageIcon from "@fluentui/svg-icons/icons/data_usage_24_regular.svg?raw";
import type { RendererInfoParams } from "../types";
import { template } from "./RendererInfoDisplay.template.js";
import { RendererInfoDisplayController } from "../controller/RendererInfoDisplay.controller.js";

/**
 * Custom Element `renderer-info-display`.
 *
 * Displays real-time statistics from the `ModularSpaceRenderer`.
 * This view component is responsible for rendering the UI and delegating all
 * business logic to the `RendererInfoDisplayController`.
 *
 * Implements Dockview `IContentRenderer` to be used as panel content.
 */
export class RendererInfoDisplay
  extends HTMLElement
  implements IContentRenderer
{
  private _controller: RendererInfoDisplayController;

  /**
   * Unique identifier for the custom element.
   */
  public static readonly componentName = "renderer-info-display";

  /**
   * Generates the configuration required to register this panel as a toolbar button.
   *
   * @returns {PanelToolbarItemConfig} Configuration object for the UI plugin manager.
   */
  public static registerToolbarButtonConfig(): PanelToolbarItemConfig {
    return {
      id: "renderer_info",
      target: "engine-toolbar",
      iconSvg: DataUsageIcon,
      title: "Renderer Info",
      type: "panel",
      componentName: this.componentName,
      panelTitle: "Renderer Info",
      behaviour: "toggle",
    };
  }

  /**
   * Constructs the RendererInfoDisplay panel.
   * Sets up the shadow DOM, applies the HTML template, queries DOM elements,
   * and instantiates the controller.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    const elements = {
      fpsValue: this.shadowRoot!.getElementById("fps-value")!,
      drawCallsValue: this.shadowRoot!.getElementById("draw-calls-value")!,
      trianglesValue: this.shadowRoot!.getElementById("triangles-value")!,
      memoryValue: this.shadowRoot!.getElementById("memory-value")!,
      camPosValue: this.shadowRoot!.getElementById("cam-pos-value")!,
      fovValue: this.shadowRoot!.getElementById("fov-value")!,
      connectionStatus: this.shadowRoot!.getElementById("connection-status")!,
      refreshButton: this.shadowRoot!.getElementById(
        "refresh-button",
      ) as HTMLButtonElement,
    };

    this._controller = new RendererInfoDisplayController(this, elements);
  }

  /**
   * Called when the element is added to the document's DOM.
   * Initializes the controller.
   */
  connectedCallback() {
    this._controller.initialize();
  }

  /**
   * Called when the element is removed from the document's DOM.
   * Cleans up the controller to prevent memory leaks.
   */
  disconnectedCallback() {
    this._controller.dispose();
  }

  /**
   * Dockview panel initialization method.
   * Passes the parent panel instance to the controller.
   *
   * @param {GroupPanelPartInitParameters} parameters - Initialization parameters from Dockview.
   */
  public init(parameters: GroupPanelPartInitParameters): void {
    const params = parameters.params as RendererInfoParams;

    if (
      params.parentInstance &&
      typeof params.parentInstance.getRenderer === "function"
    ) {
      this._controller.setParentPanel(
        params.parentInstance as CompositeEnginePanel,
      );
    } else {
      console.warn(
        `[RendererInfoDisplay] Parent instance not provided or invalid in init params.`,
      );
    }
  }

  /**
   * Required by Dockview `IContentRenderer`.
   *
   * @returns {HTMLElement} The root element of the panel content.
   */
  get element(): HTMLElement {
    return this;
  }
}
