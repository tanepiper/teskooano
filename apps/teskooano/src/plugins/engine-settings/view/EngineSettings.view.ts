import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import SettingsIcon from "@fluentui/svg-icons/icons/settings_24_regular.svg?raw";
import { PanelToolbarItemConfig } from "@teskooano/ui-plugin";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import {
  EngineSettingsController,
  type EngineSettingsElements,
} from "../controller/EngineSettings.controller.js";
import { template } from "./EngineSettings.template.js";

/**
 * @element engine-ui-settings-panel
 * @summary Provides UI controls for adjusting engine visualization settings.
 *
 * This custom element displays toggles and sliders to modify the visual representation
 * within a linked `CompositeEnginePanel`. It delegates all logic to the `EngineSettingsController`.
 *
 * Implements the `IContentRenderer` interface required by Dockview to be used as
 * panel content.
 *
 * @attr {CompositeEnginePanel | null} parentPanel - (Private) Reference to the parent engine panel instance.
 *
 * @csspart container - The main container div for the settings panel.
 * @csspart error-message - The element used to display error messages.
 * @csspart form-group - A container for a label and its associated control (e.g., toggle, slider).
 * @csspart slider-label - The label specifically for the FOV slider.
 * @csspart toggle-label - The label associated with a toggle switch.
 */
export class EngineUISettingsPanel
  extends HTMLElement
  implements IContentRenderer
{
  private controller!: EngineSettingsController;

  /**
   * Static getter for the custom element tag name.
   * Used for registration and referencing.
   */
  public static readonly componentName = "engine-ui-settings-panel";

  /**
   * Generates the configuration required by the UI plugin system
   * to register this panel as a toggle button in a toolbar.
   *
   * @returns {PanelToolbarItemConfig} Configuration object for the UI plugin manager.
   */
  public static registerToolbarButtonConfig(): PanelToolbarItemConfig {
    return {
      id: "engine_settings",
      target: "engine-toolbar",
      iconSvg: SettingsIcon,
      title: "Engine Settings",
      type: "panel",
      componentName: this.componentName,
      panelTitle: "Engine Settings",
      behaviour: "toggle",
    };
  }

  /**
   * Constructs the EngineUISettingsPanel.
   * Sets up the shadow DOM, finds UI elements, and instantiates the controller.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    const elements: EngineSettingsElements = {
      gridToggle: this.shadowRoot!.getElementById(
        "grid-toggle",
      ) as HTMLInputElement,
      labelsToggle: this.shadowRoot!.getElementById(
        "labels-toggle",
      ) as HTMLInputElement,
      auMarkersToggle: this.shadowRoot!.getElementById(
        "au-markers-toggle",
      ) as HTMLInputElement,
      debrisEffectsToggle: this.shadowRoot!.getElementById(
        "debris-effects-toggle",
      ) as HTMLInputElement,
      orbitLinesToggle: this.shadowRoot!.getElementById(
        "orbit-lines-toggle",
      ) as HTMLInputElement,
      fovSliderElement: this.shadowRoot!.getElementById("fov-slider") as any, // Cast as any to satisfy TeskooanoSlider type
      debugModeToggle: this.shadowRoot!.getElementById(
        "debug-mode-toggle",
      ) as HTMLInputElement,
      errorMessageElement: this.shadowRoot!.getElementById(
        "error-message",
      ) as HTMLElement,
    };

    this.controller = new EngineSettingsController(elements);
  }

  /**
   * Standard HTMLElement lifecycle callback.
   * Called when the element is added to the document's DOM.
   * Initializes the controller.
   */
  connectedCallback() {
    this.controller.initialize();
  }

  /**
   * Standard HTMLElement lifecycle callback.
   * Called when the element is removed from the document's DOM.
   * Disposes of the controller to clean up resources.
   */
  disconnectedCallback() {
    this.controller.dispose();
  }

  /**
   * Dockview `IContentRenderer` initialization method.
   * Passes the parent panel instance to the controller.
   * @param parameters - Initialization parameters provided by Dockview.
   */
  public init(parameters: GroupPanelPartInitParameters): void {
    const parent = (parameters.params as any)
      ?.parentInstance as CompositeEnginePanel;

    if (
      parent &&
      typeof parent.getRenderer === "function" &&
      parent.engineCameraManager
    ) {
      this.controller.setParentPanel(parent);
    } else {
      console.error(
        `[EngineUISettingsPanel] Initialization did not provide a valid parent panel.`,
        parameters.params,
      );
    }
  }

  /**
   * Required by Dockview `IContentRenderer`.
   * Returns the root HTMLElement of this component, which is the component itself.
   *
   * @returns {HTMLElement} The instance of `EngineUISettingsPanel`.
   */
  get element(): HTMLElement {
    return this;
  }
}
