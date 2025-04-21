// import type { PanelViewState } from "@teskooano/core-state"; // Removed - Type defined in CompositePanel
// import { panelRegistry } from "@teskooano/core-state"; // Removed
// import type { EnginePanel } from "../engine/EnginePanel"; // Removed
// import type { ModularSpaceRenderer } from "@teskooano/renderer-threejs"; // Not needed directly
import type { CompositeEnginePanel } from "../engine/CompositeEnginePanel"; // Import parent panel type
import type { PanelViewState } from "../engine/CompositeEnginePanel"; // Import type from parent

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
    <label for="fov-slider">FOV</label>
    <input type="range" id="fov-slider" min="30" max="140" step="1">
    <span id="fov-value" class="value-display">75</span>
  </div>
  <div id="error-message" class="error-message" style="display: none;"></div>
`;

export class EngineUISettingsPanel extends HTMLElement {
  private gridToggle: HTMLInputElement | null = null;
  private labelsToggle: HTMLInputElement | null = null;
  private auMarkersToggle: HTMLInputElement | null = null;
  private debrisEffectsToggle: HTMLInputElement | null = null;
  private fovSlider: HTMLInputElement | null = null;
  private fovValueDisplay: HTMLElement | null = null;
  private errorMessageElement: HTMLElement | null = null;

  private _parentPanel: CompositeEnginePanel | null = null;
  private _unsubscribeParentState: (() => void) | null = null;

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
    this.fovSlider = this.shadowRoot!.getElementById("fov-slider") as HTMLInputElement;
    this.fovValueDisplay = this.shadowRoot!.getElementById("fov-value");
    this.errorMessageElement = this.shadowRoot!.getElementById("error-message");

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
    this.fovSlider?.addEventListener("input", this.handleFovChange);
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
    this.fovSlider?.removeEventListener("input", this.handleFovChange);
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
      (newState: PanelViewState) => {
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

  private handleFovChange = (event: Event): void => {
    if (!this._parentPanel || !this.fovSlider || !this.fovValueDisplay) return;
    const newFov = parseInt((event.target as HTMLInputElement).value, 10);
    this._parentPanel.setFov(newFov);
    this.fovValueDisplay.textContent = newFov.toString();
  };

  private updateUiState(viewState: PanelViewState): void {
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
    if (this.fovSlider && this.fovValueDisplay) {
      const currentFov = viewState.fov ?? 75;
      this.fovSlider.value = currentFov.toString();
      this.fovValueDisplay.textContent = currentFov.toString();
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
}

customElements.define("engine-ui-settings-panel", EngineUISettingsPanel);
