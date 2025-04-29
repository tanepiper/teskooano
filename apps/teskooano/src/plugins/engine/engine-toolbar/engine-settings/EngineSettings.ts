import type {
  CompositeEnginePanel,
  CompositeEngineState,
} from "../../panels/CompositeEnginePanel.js"; // Import parent panel type
// import "../shared/Slider.js"; // REMOVED - Import the slider component
import type { TeskooanoSlider } from "../../../../core/components/slider/Slider.js"; // Import the slider type
// Import Dockview types and panel registry
import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import { PanelToolbarButtonConfig } from "../EngineToolbar.store.js"; // Import toolbar types

// Import Fluent UI Icons
import SettingsIcon from "@fluentui/svg-icons/icons/settings_24_regular.svg?raw";

// Define expected params
interface EngineUISettingsParams {
  parentEnginePanelId?: string;
}

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      padding: 10px;
      font-family: var(--font-family, sans-serif);
      font-size: 0.9em;
      border-top: 1px solid var(--color-border-alt, #5a5a7a); /* Add separator */
    }
    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .setting-row input[type=range] {
      flex-grow: 1;
      margin: 0 10px;
    }
    .setting-row .value-display {
      min-width: 30px; /* Ensure space for value */
      text-align: right;
      color: var(--color-text-primary, #eee);
    }
    label {
      margin-right: 10px;
      color: var(--color-text-secondary, #aaa);
    }
    /* Basic toggle switch styles */
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
    /* Add margin to the slider component */
    teskooano-slider {
      /* Override default margin if needed, or use existing variables */
      /* Example: margin-bottom: var(--space-sm, 8px); */
    }
    .error-message {
        color: var(--color-error, #f44336);
        font-style: italic;
        margin-top: 10px;
    }
  </style>
  <div class="setting-row">
    <label for="grid-toggle">Show Grid</label>
    <label class="toggle-switch">
      <input type="checkbox" id="grid-toggle">
      <span class="slider"></span>
    </label>
  </div>
  <div class="setting-row">
    <label for="labels-toggle">Show Celestial Labels</label>
    <label class="toggle-switch">
      <input type="checkbox" id="labels-toggle">
      <span class="slider"></span>
    </label>
  </div>
  <div class="setting-row">
    <label for="au-markers-toggle">Show AU Markers</label>
    <label class="toggle-switch">
      <input type="checkbox" id="au-markers-toggle">
      <span class="slider"></span>
    </label>
  </div>
  <div class="setting-row">
    <label for="debris-effects-toggle">Show Debris Effects</label>
    <label class="toggle-switch">
      <input type="checkbox" id="debris-effects-toggle">
      <span class="slider"></span>
    </label>
  </div>
  <div class="setting-row">
    <label for="debug-mode-toggle">Debug Mode</label>
    <label class="toggle-switch">
      <input type="checkbox" id="debug-mode-toggle">
      <span class="slider"></span>
    </label>
  </div>
  <teskooano-slider 
    id="fov-slider" 
    label="FOV" 
    min="30" 
    max="140" 
    step="1" 
    value="75"
    editable-value
    help-text="Adjust the camera Field of View (degrees)"
  ></teskooano-slider>
  <div id="error-message" class="error-message" style="display: none;"></div>
`;

export class EngineUISettingsPanel
  extends HTMLElement
  implements IContentRenderer
{
  private gridToggle: HTMLInputElement | null = null;
  private labelsToggle: HTMLInputElement | null = null;
  private auMarkersToggle: HTMLInputElement | null = null;
  private debrisEffectsToggle: HTMLInputElement | null = null;
  private fovSliderElement: TeskooanoSlider | null = null;
  private errorMessageElement: HTMLElement | null = null;
  private debugModeToggle: HTMLInputElement | null = null;

  private _parentPanel: CompositeEnginePanel | null = null;
  private _unsubscribeParentState: (() => void) | null = null;

  // --- Static Configuration ---
  public static readonly componentName = "engine-ui-settings-panel";

  public static registerToolbarButtonConfig(): PanelToolbarButtonConfig {
    return {
      id: "engine_settings", // Base ID, EngineToolbar will add apiId
      iconSvg: SettingsIcon,
      title: "Engine Settings",
      type: "panel",
      componentName: this.componentName,
      panelTitle: "Engine Settings", // Default panel title
      behaviour: "toggle",
    };
  }
  // --- End Static Configuration ---

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.gridToggle = this.shadowRoot!.getElementById(
      "grid-toggle",
    ) as HTMLInputElement;
    this.labelsToggle = this.shadowRoot!.getElementById(
      "labels-toggle",
    ) as HTMLInputElement;
    this.auMarkersToggle = this.shadowRoot!.getElementById(
      "au-markers-toggle",
    ) as HTMLInputElement;
    this.debrisEffectsToggle = this.shadowRoot!.getElementById(
      "debris-effects-toggle",
    ) as HTMLInputElement;
    this.fovSliderElement = this.shadowRoot!.getElementById(
      "fov-slider",
    ) as TeskooanoSlider;
    this.errorMessageElement = this.shadowRoot!.getElementById("error-message");
    this.debugModeToggle = this.shadowRoot!.getElementById(
      "debug-mode-toggle",
    ) as HTMLInputElement;

    this.addEventListeners();

    if (this._parentPanel) {
      this.syncWithParentPanelState();
    }
  }

  disconnectedCallback() {
    this.removeEventListeners();
    this._unsubscribeParentState?.();
    this._unsubscribeParentState = null;
  }

  private addEventListeners(): void {
    this.gridToggle?.addEventListener("change", this.handleGridToggleChange);
    this.labelsToggle?.addEventListener(
      "change",
      this.handleLabelsToggleChange,
    );
    this.auMarkersToggle?.addEventListener(
      "change",
      this.handleAuMarkersToggleChange,
    );
    this.debrisEffectsToggle?.addEventListener(
      "change",
      this.handleDebrisEffectsToggleChange,
    );
    this.fovSliderElement?.addEventListener("change", this.handleFovChange);
    this.debugModeToggle?.addEventListener(
      "change",
      this.handleDebugModeToggleChange,
    );
  }

  private removeEventListeners(): void {
    this.gridToggle?.removeEventListener("change", this.handleGridToggleChange);
    this.labelsToggle?.removeEventListener(
      "change",
      this.handleLabelsToggleChange,
    );
    this.auMarkersToggle?.removeEventListener(
      "change",
      this.handleAuMarkersToggleChange,
    );
    this.debrisEffectsToggle?.removeEventListener(
      "change",
      this.handleDebrisEffectsToggleChange,
    );
    this.fovSliderElement?.removeEventListener("change", this.handleFovChange);
    this.debugModeToggle?.removeEventListener(
      "change",
      this.handleDebugModeToggleChange,
    );
  }

  public init(parameters: GroupPanelPartInitParameters): void {
    // const params = parameters.params as EngineUISettingsParams; // REMOVE THIS LINE
    // Define params type inline
    const params = parameters.params as {
      parentInstance?: CompositeEnginePanel;
    }; // ADD THIS LINE
    console.log(`[EngineUISettingsPanel] Initializing with params:`, params);

    // Check for the directly passed instance
    if (params?.parentInstance) {
      // Add a basic type check
      if (
        params.parentInstance instanceof Object &&
        "getViewState" in params.parentInstance
      ) {
        console.log(
          `[EngineUISettingsPanel] Setting parent panel via direct instance.`,
        );
        this.setParentPanel(params.parentInstance);
      } else {
        const errMsg =
          "Received parentInstance, but it doesn't seem to be a valid CompositeEnginePanel.";
        this.showError(errMsg);
        console.error(`[EngineUISettingsPanel] ${errMsg}`);
      }
    } else {
      const errMsg =
        "Initialization parameters did not include 'parentInstance'. Cannot link to parent.";
      this.showError(errMsg);
      console.error(`[EngineUISettingsPanel] ${errMsg}`);
    }
  }

  public setParentPanel(panel: CompositeEnginePanel): void {
    this._parentPanel = panel;
    if (this.isConnected) {
      this.syncWithParentPanelState();
    }
  }

  private syncWithParentPanelState(): void {
    if (!this._parentPanel) {
      this.showError("Parent panel not available.");
      return;
    }

    this._unsubscribeParentState?.();

    const initialState = this._parentPanel.getViewState();
    this.updateUiState(initialState);

    this._unsubscribeParentState = this._parentPanel.subscribeToViewState(
      (newState: CompositeEngineState) => {
        this.updateUiState(newState);
      },
    );
  }

  private handleGridToggleChange = (event: Event): void => {
    if (!this._parentPanel) return;
    const isChecked = (event.target as HTMLInputElement).checked;
    this._parentPanel.setShowGrid(isChecked);
  };

  private handleLabelsToggleChange = (event: Event): void => {
    if (!this._parentPanel) return;
    const isChecked = (event.target as HTMLInputElement).checked;
    this._parentPanel.setShowCelestialLabels(isChecked);
  };

  private handleAuMarkersToggleChange = (event: Event): void => {
    if (!this._parentPanel) return;
    const isChecked = (event.target as HTMLInputElement).checked;
    this._parentPanel.setShowAuMarkers(isChecked);
  };

  private handleDebrisEffectsToggleChange = (event: Event): void => {
    if (!this._parentPanel) return;
    const isChecked = (event.target as HTMLInputElement).checked;
    this._parentPanel.setDebrisEffectsEnabled(isChecked);
  };

  private handleDebugModeToggleChange = (event: Event): void => {
    if (!this._parentPanel) return;
    const isChecked = (event.target as HTMLInputElement).checked;
    this._parentPanel.setDebugMode(isChecked);
  };

  private handleFovChange = (event: Event): void => {
    if (!this._parentPanel) return;

    let newFov: number | undefined;

    // Check if it's a CustomEvent and has the expected detail
    if (
      event instanceof CustomEvent &&
      typeof event.detail?.value === "number"
    ) {
      newFov = event.detail.value;
    } else {
      // Fallback or error - shouldn't happen if Slider dispatches correctly
      console.warn(
        "[EngineUISettingsPanel] Received 'change' event without expected numeric detail.value. Event:",
        event,
      );
      // Optionally, try reading from target as a last resort, but it might be unreliable
      const slider = event.target as TeskooanoSlider;
      if (slider && typeof slider.value === "number") {
        newFov = slider.value;
      } else {
        return; // Can't determine new value
      }
    }

    // Ensure we have a valid number before calling the parent
    if (typeof newFov === "number" && !isNaN(newFov)) {
      this._parentPanel.setFov(newFov);
    } else {
      console.error(
        "[EngineUISettingsPanel] Invalid or undefined FOV value processed.",
      );
    }
  };

  private updateUiState(viewState: CompositeEngineState): void {
    if (this.gridToggle) {
      this.gridToggle.checked = viewState.showGrid ?? true;
    }
    if (this.labelsToggle) {
      this.labelsToggle.checked = viewState.showCelestialLabels ?? true;
    }
    if (this.auMarkersToggle) {
      this.auMarkersToggle.checked = viewState.showAuMarkers ?? true;
    }
    if (this.debrisEffectsToggle) {
      this.debrisEffectsToggle.checked = viewState.showDebrisEffects ?? false;
    }
    if (this.fovSliderElement) {
      const currentFov = viewState.fov ?? 75;
      this.fovSliderElement.value = currentFov;
    }
    if (this.debugModeToggle) {
      this.debugModeToggle.checked = viewState.isDebugMode ?? false;
    }
  }

  private showError(message: string): void {
    if (this.errorMessageElement) {
      this.errorMessageElement.textContent = message;
      this.errorMessageElement.style.display = "block";
    }
  }

  private clearError(): void {
    if (this.errorMessageElement) {
      this.errorMessageElement.style.display = "none";
      this.errorMessageElement.textContent = "";
    }
  }

  // ADD REQUIRED GETTER FOR IContentRenderer
  get element(): HTMLElement {
    return this;
  }
}

customElements.define("engine-ui-settings-panel", EngineUISettingsPanel);
