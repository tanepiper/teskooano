import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import type { TeskooanoSlider } from "../../../core/components/slider/Slider.js";
import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import { template } from "./EngineSettings.template.js";
import { EngineSettingsController } from "../controller/EngineSettings.controller.js";

/**
 * @element engine-ui-settings-panel
 * @summary Provides UI controls for adjusting engine visualization settings.
 *
 * This custom element displays toggles and sliders to modify the visual representation
 * within a linked `CompositeEnginePanel`. It delegates all logic to the `EngineSettingsController`.
 *
 * Implements the `IContentRenderer` interface required by Dockview to be used as
 * panel content.
 */
export class EngineUISettingsPanel
  extends HTMLElement
  implements IContentRenderer
{
  private _controller!: EngineSettingsController;

  /**
   * Constructs the EngineUISettingsPanel.
   * Sets up the shadow DOM and instantiates the controller.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    const controlRefs = {
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
      fovSliderElement: this.shadowRoot!.getElementById(
        "fov-slider",
      ) as TeskooanoSlider,
      debugModeToggle: this.shadowRoot!.getElementById(
        "debug-mode-toggle",
      ) as HTMLInputElement,
      errorMessageElement: this.shadowRoot!.getElementById(
        "error-message",
      ) as HTMLElement,
    };

    this._controller = new EngineSettingsController(controlRefs);
  }

  /**
   * Standard HTMLElement lifecycle callback.
   * Called when the element is added to the document's DOM.
   */
  connectedCallback() {
    this._controller.initialize();
  }

  /**
   * Standard HTMLElement lifecycle callback.
   * Called when the element is removed from the document's DOM.
   */
  disconnectedCallback() {
    this._controller.dispose();
  }

  /**
   * Dockview `IContentRenderer` initialization method.
   * @param parameters Initialization parameters provided by Dockview.
   */
  public init(parameters: GroupPanelPartInitParameters): void {
    const parent = (parameters.params as any)
      ?.parentInstance as CompositeEnginePanel;

    if (
      parent &&
      typeof parent.getViewState === "function" &&
      typeof parent.subscribeToViewState === "function"
    ) {
      this._controller.setParentPanel(parent);
    } else {
      const errMsg =
        "Initialization parameters did not include a valid parent panel.";
      this._controller.showError(errMsg);
      console.error(`[EngineUISettingsPanel] ${errMsg}`, parameters.params);
    }
  }

  /**
   * Required by Dockview `IContentRenderer`.
   * @returns The root HTMLElement of this component.
   */
  get element(): HTMLElement {
    return this;
  }
}
