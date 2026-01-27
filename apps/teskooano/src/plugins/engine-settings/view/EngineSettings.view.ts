import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import type { TeskooanoSlider } from "../../../core/components/slider/Slider.js";
import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import {
  type ControlRegistration,
  type EngineOptionRegistration,
  type CameraOptionRegistration,
  EngineSettingsController,
} from "../controller/EngineSettings.controller.js";
import { template } from "./EngineSettings.template.js";

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
  private engineSection!: HTMLDivElement;
  private cameraSection!: HTMLDivElement;
  private errorMessageElement!: HTMLDivElement;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    this.initializeElements();
    this.createControls();
  }

  connectedCallback() {
    this._controller.initialize();
  }

  private initializeElements(): void {
    this.engineSection = this.shadowRoot!.querySelector("#engine-section")!;
    this.cameraSection = this.shadowRoot!.querySelector("#camera-section")!;
    this.errorMessageElement =
      this.shadowRoot!.querySelector("#error-message")!;
  }

  private createControls(): void {
    const controlsForController: ControlRegistration[] = [];

    // Create controls and organize them by section
    controlConfig.forEach((config) => {
      const { container, control } = this.createControl(config);

      if (config.key === "fov") {
        this.cameraSection.appendChild(container);
        const reg: CameraOptionRegistration = {
          key: "fov",
          type: "slider",
          element: control as unknown as HTMLElement,
        };
        controlsForController.push(reg);
      } else {
        this.engineSection.appendChild(container);
        const reg: EngineOptionRegistration = {
          key: config.key,
          type: "toggle",
          element: control as HTMLInputElement,
        };
        controlsForController.push(reg);
      }
    });

    this._controller = new EngineSettingsController(
      controlsForController,
      this.errorMessageElement,
    );
  }

  /**
   * Creates a control element based on the configuration.
   */
  private createControl(config: (typeof controlConfig)[number]) {
    const container = document.createElement("div");
    let controlElement: HTMLElement;

    if (config.type === "slider") {
      container.className = "setting-row-full";
      const slider = this.createSliderControl(config);
      container.appendChild(slider);
      controlElement = slider;
    } else {
      container.className = "setting-row";
      const { label, switchLabel, input } = this.createToggleControl(config);
      container.appendChild(label);
      container.appendChild(switchLabel);
      controlElement = input;
    }

    return { container, control: controlElement };
  }

  /**
   * Creates a slider control with proper slot usage.
   */
  private createSliderControl(
    config: Extract<(typeof controlConfig)[number], { type: "slider" }>,
  ): TeskooanoSlider {
    const slider = document.createElement(
      "teskooano-slider",
    ) as TeskooanoSlider & { name: string };

    // Set attributes that the component observes
    slider.id = config.key;
    slider.name = config.key;
    slider.setAttribute("min", String(config.min));
    slider.setAttribute("max", String(config.max));
    slider.setAttribute("step", String(config.step));
    slider.setAttribute("value", String(config.value));
    slider.setAttribute("editable-value", "");

    // Create label slot content
    const labelSlot = document.createElement("span");
    labelSlot.setAttribute("slot", "label");
    labelSlot.textContent = config.label;
    slider.appendChild(labelSlot);

    // Create help-text slot content if provided
    if (config.helpText) {
      const helpSlot = document.createElement("span");
      helpSlot.setAttribute("slot", "help-text");
      helpSlot.textContent = config.helpText;
      slider.appendChild(helpSlot);
    }

    return slider;
  }

  /**
   * Creates a toggle control.
   */
  private createToggleControl(
    config: Extract<(typeof controlConfig)[number], { type: "toggle" }>,
  ): {
    label: HTMLLabelElement;
    switchLabel: HTMLLabelElement;
    input: HTMLInputElement;
  } {
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

    return { label, switchLabel, input };
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
    // REQUIRE panel API ID
    if (!parameters.api?.id) {
      throw new Error(
        "[EngineUISettingsPanel] Panel ID is required but not provided",
      );
    }

    const parent = (parameters.params as any)
      ?.parentInstance as CompositeEnginePanel;

    // REQUIRE parent panel connection - no fallback
    if (!parent?.panelId) {
      throw new Error(
        "[EngineUISettingsPanel] Must be connected to a CompositeEnginePanel",
      );
    }

    // Set data-panel-id to parent panel ID (for event extraction in nested components)
    // Child panels use parent ID so nested components can find the engine panel context
    this.setAttribute("data-panel-id", parent.panelId);

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
