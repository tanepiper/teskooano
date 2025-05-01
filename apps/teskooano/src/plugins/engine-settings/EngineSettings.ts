import type {
  CompositeEnginePanel,
  CompositeEngineState,
} from "../engine-panel/panels/CompositeEnginePanel.js";
import type { TeskooanoSlider } from "../../core/components/slider/Slider.js";
import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import { Subscription } from "rxjs";

import SettingsIcon from "@fluentui/svg-icons/icons/settings_24_regular.svg?raw";
import { template } from "./EngineSettings.template.js";
import { PanelToolbarItemConfig } from "@teskooano/ui-plugin";

/**
 * Custom Element `engine-ui-settings-panel`.
 *
 * Provides a user interface for adjusting visual settings of a linked
 * `CompositeEnginePanel` (e.g., toggling grids, labels, effects, adjusting FOV).
 * It requires a `parentInstance` (the `CompositeEnginePanel`) to be passed
 * during initialization to function correctly.
 *
 * Implements Dockview `IContentRenderer` for use as panel content.
 */
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
  private _unsubscribeParentState: Subscription | null = null;

  /**
   * Unique identifier for the custom element.
   */
  public static readonly componentName = "engine-ui-settings-panel";

  /**
   * Generates the configuration required to register this panel as a toolbar button.
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
   * Sets up the shadow DOM and applies the HTML template.
   */
  constructor() {
    super();
    if (
      !template ||
      !(template instanceof HTMLTemplateElement) ||
      !template.content
    ) {
      console.error(
        "[EngineUISettingsPanel] Invalid template or template.content!",
      );
      return;
    }

    this.attachShadow({ mode: "open" });
    try {
      const clonedContent = template.content.cloneNode(true);
      this.shadowRoot!.appendChild(clonedContent);
    } catch (error) {
      console.error(
        "[EngineUISettingsPanel] Error appending template content to shadowRoot:",
        error,
      );
    }
  }

  /**
   * Called when the element is added to the document's DOM.
   * Caches DOM element references, adds event listeners, and syncs
   * with the parent panel state if available.
   */
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

  /**
   * Called when the element is removed from the document's DOM.
   * Cleans up event listeners and subscriptions to prevent memory leaks.
   */
  disconnectedCallback() {
    this.removeEventListeners();
    this._unsubscribeParentState?.unsubscribe();
    this._unsubscribeParentState = null;
  }

  /**
   * Adds event listeners to the interactive UI elements.
   */
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

  /**
   * Removes event listeners from the interactive UI elements.
   */
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

  /**
   * Dockview panel initialization method.
   * Expects the parent `CompositeEnginePanel` instance to be passed in `parameters.params.parentInstance`.
   *
   * @param {GroupPanelPartInitParameters} parameters - Initialization parameters from Dockview.
   */
  public init(parameters: GroupPanelPartInitParameters): void {
    const params = parameters.params as {
      parentInstance?: CompositeEnginePanel;
    };

    if (params?.parentInstance) {
      if (
        params.parentInstance instanceof Object &&
        "getViewState" in params.parentInstance
      ) {
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

  /**
   * Sets the reference to the parent engine panel.
   * If the component is already connected to the DOM, it immediately syncs the UI state.
   *
   * @param {CompositeEnginePanel} panel - The parent panel instance.
   */
  public setParentPanel(panel: CompositeEnginePanel): void {
    this._parentPanel = panel;
    // If connectedCallback has already run, sync state now.
    // Otherwise, connectedCallback will handle the initial sync.
    if (this.isConnected) {
      this.syncWithParentPanelState();
    }
  }

  /**
   * Subscribes to the parent panel's view state changes and updates the UI accordingly.
   * Also performs an initial UI state synchronization.
   */
  private syncWithParentPanelState(): void {
    if (!this._parentPanel) {
      this.showError("Cannot sync: Parent panel not available.");
      console.warn(
        "[EngineUISettingsPanel] syncWithParentPanelState called without a parent panel.",
      );
      return;
    }

    this._unsubscribeParentState?.unsubscribe();

    try {
      const initialState = this._parentPanel.getViewState();
      this.updateUiState(initialState);
      this.clearError();

      this._unsubscribeParentState = this._parentPanel.subscribeToViewState(
        (newState: CompositeEngineState) => {
          this.updateUiState(newState);
        },
      );
    } catch (error) {
      const errMsg = "Error syncing with parent panel state.";
      this.showError(errMsg);
      console.error(`[EngineUISettingsPanel] ${errMsg}`, error);
    }
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

    if (
      event instanceof CustomEvent &&
      typeof event.detail?.value === "number"
    ) {
      newFov = event.detail.value;
    } else {
      console.warn(
        "[EngineUISettingsPanel] Received 'change' event without expected numeric detail.value. Attempting fallback. Event:",
        event,
      );
      const slider = event.target as TeskooanoSlider;
      if (slider && typeof slider.value === "number") {
        newFov = slider.value;
      } else {
        this.showError("Could not determine FOV value.");
        return;
      }
    }

    if (typeof newFov === "number" && !isNaN(newFov)) {
      try {
        this._parentPanel.setFov(newFov);
        this.clearError();
      } catch (error) {
        const errMsg = "Error setting FOV on parent panel.";
        this.showError(errMsg);
        console.error(`[EngineUISettingsPanel] ${errMsg}`, error);
      }
    } else {
      this.showError("Invalid FOV value received.");
      console.error("[EngineUISettingsPanel] Invalid FOV value:", newFov);
    }
  };

  /**
   * Updates the UI elements (toggles, slider) based on the provided state object.
   *
   * @param {CompositeEngineState} viewState - The state object from the parent panel.
   */
  private updateUiState(viewState: CompositeEngineState): void {
    if (!this.isConnected) return;

    if (this.gridToggle) {
      this.gridToggle.checked = viewState.showGrid ?? false;
    }
    if (this.labelsToggle) {
      this.labelsToggle.checked = viewState.showCelestialLabels ?? false;
    }
    if (this.auMarkersToggle) {
      this.auMarkersToggle.checked = viewState.showAuMarkers ?? false;
    }
    if (this.debrisEffectsToggle) {
      this.debrisEffectsToggle.checked = viewState.showDebrisEffects ?? false;
    }
    if (this.debugModeToggle) {
      this.debugModeToggle.checked = viewState.isDebugMode ?? false;
    }
    if (this.fovSliderElement && viewState.fov !== undefined) {
      if (this.fovSliderElement.value !== viewState.fov) {
        this.fovSliderElement.value = viewState.fov;
      }
    }
  }

  /**
   * Displays an error message in the designated error area.
   *
   * @param {string} message - The error message to display.
   */
  private showError(message: string): void {
    if (this.errorMessageElement) {
      this.errorMessageElement.textContent = message;
      this.errorMessageElement.style.display = "block";
    }
  }

  /**
   * Hides the error message area.
   */
  private clearError(): void {
    if (this.errorMessageElement) {
      this.errorMessageElement.textContent = "";
      this.errorMessageElement.style.display = "none";
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
