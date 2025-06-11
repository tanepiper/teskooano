import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import type { TeskooanoSlider } from "../../../core/components/slider/Slider.js";
import { Subscription } from "rxjs";
import { CustomEvents, SliderValueChangePayload } from "@teskooano/data-types";

/**
 * Defines the structure for the UI elements passed from the view
 * to the controller.
 */
export interface EngineSettingsElements {
  gridToggle: HTMLInputElement;
  labelsToggle: HTMLInputElement;
  auMarkersToggle: HTMLInputElement;
  debrisEffectsToggle: HTMLInputElement;
  orbitLinesToggle: HTMLInputElement;
  fovSliderElement: TeskooanoSlider;
  debugModeToggle: HTMLInputElement;
  errorMessageElement: HTMLElement;
}

/**
 * Controller for the EngineUISettingsPanel view.
 *
 * This class contains all the business logic for the engine settings panel.
 * It handles UI element interactions, manages state synchronization with the
 * parent `CompositeEnginePanel`, and updates the view in response to state changes.
 */
export class EngineSettingsController {
  private _elements: EngineSettingsElements;
  private _parentPanel: CompositeEnginePanel | null = null;
  private _unsubscribeParentState: Subscription | null = null;

  /**
   * Creates an instance of EngineSettingsController.
   * @param elements The UI elements from the view that this controller will manage.
   */
  constructor(elements: EngineSettingsElements) {
    this._elements = elements;
  }

  /**
   * Initializes the controller by attaching event listeners.
   */
  public initialize(): void {
    this.addEventListeners();
  }

  /**
   * Cleans up resources by removing event listeners and subscriptions.
   */
  public dispose(): void {
    this.removeEventListeners();
    this._unsubscribeParentState?.unsubscribe();
    this._unsubscribeParentState = null;
  }

  /**
   * Sets the parent panel, which is the source of truth for settings,
   * and triggers the initial state synchronization.
   * @param panel The parent CompositeEnginePanel instance.
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
    this._elements.gridToggle.addEventListener(
      "change",
      this.handleGridToggleChange,
    );
    this._elements.labelsToggle.addEventListener(
      "change",
      this.handleLabelsToggleChange,
    );
    this._elements.auMarkersToggle.addEventListener(
      "change",
      this.handleAuMarkersToggleChange,
    );
    this._elements.debrisEffectsToggle.addEventListener(
      "change",
      this.handleDebrisEffectsToggleChange,
    );
    this._elements.orbitLinesToggle.addEventListener(
      "change",
      this.handleOrbitLinesToggleChange,
    );
    this._elements.fovSliderElement.addEventListener(
      CustomEvents.SLIDER_CHANGE,
      this.handleFovChange as EventListener,
    );
    this._elements.debugModeToggle.addEventListener(
      "change",
      this.handleDebugModeToggleChange,
    );
  }

  /**
   * Removes event listeners from the UI elements.
   */
  private removeEventListeners(): void {
    this._elements.gridToggle.removeEventListener(
      "change",
      this.handleGridToggleChange,
    );
    this._elements.labelsToggle.removeEventListener(
      "change",
      this.handleLabelsToggleChange,
    );
    this._elements.auMarkersToggle.removeEventListener(
      "change",
      this.handleAuMarkersToggleChange,
    );
    this._elements.debrisEffectsToggle.removeEventListener(
      "change",
      this.handleDebrisEffectsToggleChange,
    );
    this._elements.orbitLinesToggle.removeEventListener(
      "change",
      this.handleOrbitLinesToggleChange,
    );
    this._elements.fovSliderElement.removeEventListener(
      CustomEvents.SLIDER_CHANGE,
      this.handleFovChange as EventListener,
    );
    this._elements.debugModeToggle.removeEventListener(
      "change",
      this.handleDebugModeToggleChange,
    );
  }

  /**
   * Connects to the parent panel's state, gets the initial state,
   * and subscribes to future updates.
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
        (newState) => this.updateUiState(newState),
      );
    } catch (error) {
      const errMsg =
        "Failed to get initial state or subscribe to parent panel.";
      this.showError(errMsg);
      console.error(`[EngineSettingsController] ${errMsg}`, error);
      this._unsubscribeParentState?.unsubscribe();
    }
  }

  /**
   * Updates the UI controls to reflect the provided state.
   * @param viewState The latest state object from the parent panel.
   */
  private updateUiState(
    viewState: ReturnType<CompositeEnginePanel["getViewState"]>,
  ): void {
    this._elements.gridToggle.checked = viewState.showGrid ?? true;
    this._elements.labelsToggle.checked = viewState.showCelestialLabels ?? true;
    this._elements.auMarkersToggle.checked = viewState.showAuMarkers ?? true;
    this._elements.debrisEffectsToggle.checked =
      viewState.showDebrisEffects ?? false;
    this._elements.orbitLinesToggle.checked = viewState.showOrbitLines ?? true;
    this._elements.debugModeToggle.checked = viewState.isDebugMode ?? false;

    if (
      this._elements.fovSliderElement &&
      typeof viewState.fov === "number" &&
      this._elements.fovSliderElement.value !== viewState.fov
    ) {
      this._elements.fovSliderElement.value = viewState.fov;
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
      if (
        !event.detail ||
        typeof event.detail.value !== "number" ||
        isNaN(event.detail.value)
      ) {
        this.showError("Invalid FOV value received from slider event.");
        return;
      }
      this._parentPanel.updateViewState({ fov: event.detail.value });
      this.clearError();
    } catch (error) {
      this.showError("An error occurred while updating Field of View (FOV).");
    }
  };

  /**
   * Displays an error message in the view.
   * @param message The error message to display.
   */
  private showError(message: string): void {
    this._elements.errorMessageElement.textContent = message;
    this._elements.errorMessageElement.style.display = "block";
  }

  /**
   * Hides the error message area in the view.
   */
  private clearError(): void {
    this._elements.errorMessageElement.textContent = "";
    this._elements.errorMessageElement.style.display = "none";
  }
}
