import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import type { TeskooanoSlider } from "../../../core/components/slider/Slider.js";
import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import {
  ControlRegistration,
  EngineSettingsController,
} from "../controller/EngineSettings.controller.js";

const controlConfig = [
  { key: "showGrid", type: "toggle", label: "Show Grid" },
  {
    key: "showCelestialLabels",
    type: "toggle",
    label: "Show Celestial Labels",
  },
  { key: "showAuMarkers", type: "toggle", label: "Show AU Markers" },
  { key: "showDebrisEffects", type: "toggle", label: "Show Debris Effects" },
  { key: "showOrbitLines", type: "toggle", label: "Show Orbit Lines" },
  {
    key: "showPredictionLines",
    type: "toggle",
    label: "Show Prediction Lines",
  },
  { key: "isDebugMode", type: "toggle", label: "Debug Mode" },
  {
    key: "fov",
    type: "slider",
    label: "FOV",
    min: 30,
    max: 140,
    step: 1,
    value: 75,
    helpText: "Adjust the camera Field of View (degrees)",
  },
] as const;

const styles = `
  :host {
    display: block;
    width: 100%;
    height: 100%;
    overflow: auto;
    padding: 10px !important;
    font-family: var(--font-family, sans-serif);
    font-size: 0.9em;
    border-top: 1px solid var(--color-border-alt, #5a5a7a);
  }
  .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  label {
    margin-right: 10px;
    color: var(--color-text-secondary, #aaa);
  }
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 34px;
    height: 20px;
  }
  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-surface-alt, #3a3a4e);
    transition: .4s;
    border-radius: 20px;
    border: 1px solid var(--color-border-alt, #5a5a7a);
  }
  .slider:before {
    position: absolute;
    content: "";
    height: 12px;
    width: 12px;
    left: 3px;
    bottom: 3px;
    background-color: var(--color-text-secondary, #aaa);
    transition: .4s;
    border-radius: 50%;
  }
  input:checked + .slider {
    background-color: var(--color-primary, #6c63ff);
    border-color: var(--color-primary, #6c63ff);
  }
  input:checked + .slider:before {
    transform: translateX(14px);
    background-color: white;
  }
  .error-message {
      color: var(--color-error, #f44336);
      font-style: italic;
      margin-top: 10px;
  }
`;

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

    const styleElement = document.createElement("style");
    styleElement.textContent = styles;
    this.shadowRoot!.appendChild(styleElement);

    const controlsForController: ControlRegistration[] = [];

    controlConfig.forEach((config) => {
      const { container, control } = this.createControl(config);
      this.shadowRoot!.appendChild(container);
      controlsForController.push({
        key: config.key,
        type: config.type,
        element: control,
      });
    });

    const errorMessageElement = document.createElement("div");
    errorMessageElement.id = "error-message";
    errorMessageElement.className = "error-message";
    errorMessageElement.style.display = "none";
    this.shadowRoot!.appendChild(errorMessageElement);

    this._controller = new EngineSettingsController(
      controlsForController,
      errorMessageElement,
    );
  }

  private createControl(config: (typeof controlConfig)[number]) {
    const container = document.createElement("div");
    let controlElement: HTMLElement;

    if (config.type === "slider") {
      container.className = "setting-row-full"; // Sliders can take full width
      const slider = document.createElement(
        "teskooano-slider",
      ) as TeskooanoSlider & { name: string };
      slider.id = config.key;
      slider.name = config.key;
      slider.setAttribute("label", config.label);
      slider.setAttribute("min", String(config.min));
      slider.setAttribute("max", String(config.max));
      slider.setAttribute("step", String(config.step));
      slider.setAttribute("value", String(config.value));
      if ("helpText" in config) {
        slider.setAttribute("help-text", config.helpText);
      }
      slider.setAttribute("editable-value", "");
      container.appendChild(slider);
      controlElement = slider;
    } else {
      container.className = "setting-row";
      const label = document.createElement("label");
      label.htmlFor = config.key;
      label.textContent = config.label;

      const switchLabel = document.createElement("label");
      switchLabel.className = "toggle-switch";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = config.key;
      input.name = config.key;

      const sliderSpan = document.createElement("span");
      sliderSpan.className = "slider";

      switchLabel.append(input, sliderSpan);
      container.append(label, switchLabel);
      controlElement = input;
    }

    return { container, control: controlElement };
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
   * Required for the `IContentRenderer` interface. Returns the host element.
   * @returns The component's host element.
   */
  get element(): HTMLElement {
    return this;
  }
}
