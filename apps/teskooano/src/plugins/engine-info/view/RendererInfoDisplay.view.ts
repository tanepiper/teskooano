import DataUsageIcon from "@fluentui/svg-icons/icons/data_usage_24_regular.svg?raw";
import { PanelToolbarItemConfig } from "@teskooano/ui-plugin";
import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import { RendererInfoDisplayController } from "../controller/RendererInfoDisplay.controller.js";
import type { RendererInfoParams } from "../types";
import { template } from "./RendererInfoDisplay.template.js";

/**
 * A custom element (`<renderer-info-display>`) that displays real-time
 * statistics from the `ModularSpaceRenderer`.
 *
 * This view component is responsible for rendering the UI and delegating all
 * business logic to the `RendererInfoDisplayController`. It implements Dockview's
 * `IContentRenderer` interface to be used as panel content.
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
   * This static method is used by the plugin system to create a corresponding
   * toolbar item.
   *
   * @returns The configuration object for the UI plugin manager.
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
   * Constructs the `RendererInfoDisplay` panel.
   *
   * This sets up the shadow DOM, clones the HTML template, queries for necessary
   * DOM element references, and instantiates the controller, passing it the view
   * instance and the element references.
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
    };

    this._controller = new RendererInfoDisplayController(this, elements);
  }

  /**
   * Standard custom element lifecycle callback.
   * Called when the element is added to the document's DOM. This method
   * initializes the controller.
   */
  connectedCallback() {
    this._controller.initialize();
  }

  /**
   * Standard custom element lifecycle callback.
   * Called when the element is removed from the document's DOM. This method
   * cleans up the controller to prevent memory leaks.
   */
  disconnectedCallback() {
    this._controller.dispose();
  }

  /**
   * Dockview `IContentRenderer` initialization method.
   *
   * This method is called by Dockview when the panel is created. It receives the
   * parent `CompositeEnginePanel` instance via the parameters and passes it to
   * the controller.
   *
   * @param parameters - Initialization parameters from Dockview.
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
   * Required by Dockview's `IContentRenderer` interface.
   *
   * @returns The root element of the panel content, which is the custom element itself.
   */
  get element(): HTMLElement {
    return this;
  }
}
