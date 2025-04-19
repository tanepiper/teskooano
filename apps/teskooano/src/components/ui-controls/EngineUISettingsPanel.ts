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
  <div id="error-message" class="error-message" style="display: none;"></div>
`;

export class EngineUISettingsPanel extends HTMLElement {
  private gridToggle: HTMLInputElement | null = null;
  private labelsToggle: HTMLInputElement | null = null;
  private auMarkersToggle: HTMLInputElement | null = null;
  private debrisEffectsToggle: HTMLInputElement | null = null;
  private errorMessageElement: HTMLElement | null = null;

  private _parentPanel: CompositeEnginePanel | null = null; // Store parent panel instance
  private _unsubscribeParentState: (() => void) | null = null; // To unsub from parent state

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
    this.errorMessageElement = this.shadowRoot!.getElementById("error-message");

    this.addEventListeners();

    // Attempt to sync state if parent panel is already set
    if (this._parentPanel) {
      this.syncWithParentPanelState();
    }
  }

  disconnectedCallback() {
    this.removeEventListeners();
    this._unsubscribeParentState?.(); // Unsubscribe from parent state
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
  }

  /**
   * Public method for the parent component (CompositeEnginePanel)
   * to provide its instance.
   */
  public setParentPanel(panel: CompositeEnginePanel): void {
    console.log("[EngineUISettingsPanel] Parent panel set.");
    this._parentPanel = panel;
    // If connected, sync state now
    if (this.isConnected) {
      this.syncWithParentPanelState();
    }
  }

  // Method to get initial state and subscribe to updates from parent panel
  private syncWithParentPanelState(): void {
    if (!this._parentPanel) {
      this.showError("Parent panel not available.");
      return;
    }

    // Unsubscribe from previous parent state if any
    this._unsubscribeParentState?.();

    // Get initial state from parent panel
    const initialState = this._parentPanel.getViewState();
    this.updateToggleState(initialState);

    // Subscribe to state changes from parent panel
    this._unsubscribeParentState = this._parentPanel.subscribeToViewState(
      (newState: PanelViewState) => {
        this.updateToggleState(newState);
      },
    );
  }

  // Event handlers bound to the class instance
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

  private updateToggleState(viewState: PanelViewState): void {
    if (this.gridToggle) {
      this.gridToggle.checked = viewState.showGrid ?? true; // Default to true if undefined
    }
    if (this.labelsToggle) {
      this.labelsToggle.checked = viewState.showCelestialLabels ?? true; // Default to true if undefined
    }
    if (this.auMarkersToggle) {
      this.auMarkersToggle.checked = viewState.showAuMarkers ?? true; // Default to true if undefined
    }
    if (this.debrisEffectsToggle) {
      this.debrisEffectsToggle.checked = viewState.showDebrisEffects ?? false; // Default to true if undefined
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

// Define the custom element
customElements.define("engine-ui-settings-panel", EngineUISettingsPanel);
