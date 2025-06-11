import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import type { CompositeEngineState } from "../../engine-panel/panels/types.js";
import type { TeskooanoSlider } from "../../../core/components/slider/Slider.js";
import { Subscription } from "rxjs";
import { CustomEvents, SliderValueChangePayload } from "@teskooano/data-types";

type ControlRefs = {
  gridToggle: HTMLInputElement;
  labelsToggle: HTMLInputElement;
  auMarkersToggle: HTMLInputElement;
  debrisEffectsToggle: HTMLInputElement;
  orbitLinesToggle: HTMLInputElement;
  fovSliderElement: TeskooanoSlider;
  debugModeToggle: HTMLInputElement;
  errorMessageElement: HTMLElement;
};

/**
 * Controller for the EngineUISettingsPanel view.
 *
 * This class encapsulates all business logic for the engine settings panel.
 * It handles UI element interactions, manages state synchronization with the
 * parent CompositeEnginePanel, and displays error messages.
 */
export class EngineSettingsController {
  private _refs: ControlRefs;
  private _parentPanel: CompositeEnginePanel | null = null;
  private _unsubscribeParentState: Subscription | null = null;

  /**
   * Creates an instance of EngineSettingsController.
   * @param controlRefs An object containing references to the view's DOM elements.
   */
  constructor(controlRefs: ControlRefs) {
    this._refs = controlRefs;
  }

  /**
   * Initializes the controller by adding event listeners.
   */
  public initialize(): void {
    this.addEventListeners();
  }

  /**
   * Cleans up resources by removing event listeners and unsubscribing from state.
   */
  public dispose(): void {
    this.removeEventListeners();
    this._unsubscribeParentState?.unsubscribe();
    this._unsubscribeParentState = null;
  }

  /**
   * Sets the reference to the parent CompositeEnginePanel and syncs the UI state.
   * @param panel The parent engine panel instance.
   */
  public setParentPanel(panel: CompositeEnginePanel): void {
    if (this._parentPanel === panel) {
      return;
    }
    this._parentPanel = panel;
    this.syncWithParentPanelState();
  }

  /**
   * Attaches event listeners to the interactive UI elements.
   */
  private addEventListeners(): void {
    this._refs.gridToggle?.addEventListener(
      "change",
      this.handleGridToggleChange,
    );
    this._refs.labelsToggle?.addEventListener(
      "change",
      this.handleLabelsToggleChange,
    );
    this._refs.auMarkersToggle?.addEventListener(
      "change",
      this.handleAuMarkersToggleChange,
    );
    this._refs.debrisEffectsToggle?.addEventListener(
      "change",
      this.handleDebrisEffectsToggleChange,
    );
    this._refs.orbitLinesToggle?.addEventListener(
      "change",
      this.handleOrbitLinesToggleChange,
    );
    this._refs.fovSliderElement?.addEventListener(
      CustomEvents.SLIDER_CHANGE,
      this.handleFovChange as EventListener,
    );
    this._refs.debugModeToggle?.addEventListener(
      "change",
      this.handleDebugModeToggleChange,
    );
  }

  /**
   * Removes all attached event listeners for cleanup.
   */
  private removeEventListeners(): void {
    this._refs.gridToggle?.removeEventListener(
      "change",
      this.handleGridToggleChange,
    );
    this._refs.labelsToggle?.removeEventListener(
      "change",
      this.handleLabelsToggleChange,
    );
    this._refs.auMarkersToggle?.removeEventListener(
      "change",
      this.handleAuMarkersToggleChange,
    );
    this._refs.debrisEffectsToggle?.removeEventListener(
      "change",
      this.handleDebrisEffectsToggleChange,
    );
    this._refs.orbitLinesToggle?.removeEventListener(
      "change",
      this.handleOrbitLinesToggleChange,
    );
    this._refs.fovSliderElement?.removeEventListener(
      CustomEvents.SLIDER_CHANGE,
      this.handleFovChange as EventListener,
    );
    this._refs.debugModeToggle?.removeEventListener(
      "change",
      this.handleDebugModeToggleChange,
    );
  }

  /**
   * Establishes connection to the parent panel's state and updates the UI.
   */
  private syncWithParentPanelState(): void {
    if (!this._parentPanel) {
      this.showError("Cannot sync state: Parent panel reference is missing.");
      return;
    }

    this._unsubscribeParentState?.unsubscribe();

    try {
      const initialState = this._parentPanel.getViewState();
      this.updateUiState(initialState);
      this.clearError();

      this._unsubscribeParentState = this._parentPanel.subscribeToViewState(
        (newState: CompositeEngineState) => this.updateUiState(newState),
      );
    } catch (error) {
      const errMsg =
        "Failed to get initial state or subscribe to parent panel.";
      this.showError(errMsg);
      console.error(`[EngineSettingsController] ${errMsg}`, error);
      this._unsubscribeParentState?.unsubscribe();
      this._unsubscribeParentState = null;
    }
  }

  private handleGridToggleChange = (event: Event): void => {
    this._parentPanel?.setShowGrid((event.target as HTMLInputElement).checked);
  };

  private handleLabelsToggleChange = (event: Event): void => {
    this._parentPanel?.setShowCelestialLabels(
      (event.target as HTMLInputElement).checked,
    );
  };

  private handleAuMarkersToggleChange = (event: Event): void => {
    this._parentPanel?.setShowAuMarkers(
      (event.target as HTMLInputElement).checked,
    );
  };

  private handleDebrisEffectsToggleChange = (event: Event): void => {
    this._parentPanel?.setDebrisEffectsEnabled(
      (event.target as HTMLInputElement).checked,
    );
  };

  private handleOrbitLinesToggleChange = (event: Event): void => {
    this._parentPanel?.updateViewState({
      showOrbitLines: (event.target as HTMLInputElement).checked,
    });
  };

  private handleDebugModeToggleChange = (event: Event): void => {
    this._parentPanel?.setDebugMode((event.target as HTMLInputElement).checked);
  };

  private handleFovChange = (
    event: CustomEvent<SliderValueChangePayload>,
  ): void => {
    if (!this._parentPanel) {
      this.showError(
        "Cannot handle FOV change: Parent panel reference missing.",
      );
      return;
    }

    try {
      const newValue = event.detail?.value;
      if (typeof newValue !== "number" || isNaN(newValue)) {
        this.showError("Invalid FOV value received from slider event.");
        return;
      }

      this._parentPanel.updateViewState({ fov: newValue });
      this.clearError();
    } catch (error) {
      this.showError("An error occurred while updating Field of View (FOV).");
    }
  };

  /**
   * Synchronizes the UI controls with the provided state object.
   * @param viewState The latest state from the parent panel.
   */
  private updateUiState(viewState: CompositeEngineState): void {
    if (this._refs.gridToggle) {
      this._refs.gridToggle.checked = viewState.showGrid ?? true;
    }
    if (this._refs.labelsToggle) {
      this._refs.labelsToggle.checked = viewState.showCelestialLabels ?? true;
    }
    if (this._refs.auMarkersToggle) {
      this._refs.auMarkersToggle.checked = viewState.showAuMarkers ?? true;
    }
    if (this._refs.debrisEffectsToggle) {
      this._refs.debrisEffectsToggle.checked =
        viewState.showDebrisEffects ?? false;
    }
    if (this._refs.orbitLinesToggle) {
      this._refs.orbitLinesToggle.checked = viewState.showOrbitLines ?? true;
    }
    if (this._refs.debugModeToggle) {
      this._refs.debugModeToggle.checked = viewState.isDebugMode ?? false;
    }

    if (this._refs.fovSliderElement && typeof viewState.fov === "number") {
      if (this._refs.fovSliderElement.value !== viewState.fov) {
        this._refs.fovSliderElement.value = viewState.fov;
      }
    }
  }

  /**
   * Displays an error message in the view.
   * @param message The error message to display.
   */
  public showError(message: string): void {
    if (this._refs.errorMessageElement) {
      this._refs.errorMessageElement.textContent = message;
      this._refs.errorMessageElement.style.display = "block";
    }
  }

  /**
   * Hides the error message area in the view.
   */
  private clearError(): void {
    if (this._refs.errorMessageElement) {
      this._refs.errorMessageElement.textContent = "";
      this._refs.errorMessageElement.style.display = "none";
    }
  }
}
