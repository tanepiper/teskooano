import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import type { CompositeEngineState } from "../../engine-panel/panels/types.js";
import type { TeskooanoSlider } from "../../../core/components/slider/Slider.js";
import { StateSubscriptionMixin } from "@teskooano/core-state";
import { CustomEvents, SliderValueChangePayload } from "@teskooano/data-types";

type ControlRefs = {
  // Toggles - keys must match CompositeEngineState properties
  showGrid: HTMLInputElement;
  showCelestialLabels: HTMLInputElement;
  showAuMarkers: HTMLInputElement;
  showDebrisEffects: HTMLInputElement;
  showOrbitLines: HTMLInputElement;
  showPredictionLines: HTMLInputElement;
  isDebugMode: HTMLInputElement;

  // Sliders
  fov: TeskooanoSlider;

  // Other
  errorMessageElement: HTMLElement;
};

type ControlConfig = {
  key: keyof ControlRefs & keyof CompositeEngineState;
  type: "toggle" | "slider";
};

/**
 * Controller for the EngineUISettingsPanel view.
 *
 * This class encapsulates all business logic for the engine settings panel.
 * It handles UI element interactions, manages state synchronization with the
 * parent CompositeEnginePanel, and displays error messages.
 */
export class EngineSettingsController extends StateSubscriptionMixin {
  private _refs: ControlRefs;
  private _parentPanel: CompositeEnginePanel | null = null;
  private _eventHandlerMap: Map<string, EventListenerOrEventListenerObject> =
    new Map();

  // Configuration drives UI logic, mapping refs to their behavior
  private readonly _controlConfig: ReadonlyArray<ControlConfig> = [
    { key: "showGrid", type: "toggle" },
    { key: "showCelestialLabels", type: "toggle" },
    { key: "showAuMarkers", type: "toggle" },
    { key: "showDebrisEffects", type: "toggle" },
    { key: "showOrbitLines", type: "toggle" },
    { key: "showPredictionLines", type: "toggle" },
    { key: "isDebugMode", type: "toggle" },
    { key: "fov", type: "slider" },
  ];

  /**
   * Creates an instance of EngineSettingsController.
   * @param controlRefs An object containing references to the view's DOM elements.
   */
  constructor(controlRefs: ControlRefs) {
    super();
    this._refs = controlRefs;
    this.bindHandlers();
  }

  /**
   * Binds event handler functions to the class instance, ensuring `this`
   * context is correct and allowing them to be added and removed as listeners.
   */
  private bindHandlers(): void {
    this._eventHandlerMap.set("toggle", this.handleToggleChange.bind(this));
    this._eventHandlerMap.set(
      "slider",
      this.handleFovChange.bind(this) as EventListener,
    );
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
    super.dispose();
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
   * Attaches event listeners to the interactive UI elements based on the control config.
   */
  private addEventListeners(): void {
    this._controlConfig.forEach(({ key, type }) => {
      const element = this._refs[key];
      if (!element) return;

      if (type === "toggle") {
        element.addEventListener(
          "change",
          this._eventHandlerMap.get("toggle")!,
        );
      } else if (type === "slider") {
        element.addEventListener(
          CustomEvents.SLIDER_CHANGE,
          this._eventHandlerMap.get("slider")!,
        );
      }
    });
  }

  /**
   * Removes all attached event listeners for cleanup.
   */
  private removeEventListeners(): void {
    this._controlConfig.forEach(({ key, type }) => {
      const element = this._refs[key];
      if (!element) return;

      if (type === "toggle") {
        element.removeEventListener(
          "change",
          this._eventHandlerMap.get("toggle")!,
        );
      } else if (type === "slider") {
        element.removeEventListener(
          CustomEvents.SLIDER_CHANGE,
          this._eventHandlerMap.get("slider")!,
        );
      }
    });
  }

  /**
   * Establishes connection to the parent panel's state and updates the UI.
   */
  private syncWithParentPanelState(): void {
    if (!this._parentPanel) {
      this.showError("Cannot sync state: Parent panel reference is missing.");
      return;
    }

    try {
      const initialState = this._parentPanel.getViewState();
      this.updateUiState(initialState);
      this.clearError();

      // ✅ Using StateSubscriptionMixin for clean subscription management
      this.subscribeToState(
        this._parentPanel.viewState$,
        (newState: CompositeEngineState) => this.updateUiState(newState),
      );
    } catch (error) {
      const errMsg =
        "Failed to get initial state or subscribe to parent panel.";
      this.showError(errMsg);
      console.error(`[EngineSettingsController] ${errMsg}`, error);
    }
  }

  /**
   * Generic handler for all toggle input change events.
   * Uses the element's `name` attribute to identify the state key to update.
   */
  private handleToggleChange = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    const key = target.name as keyof CompositeEngineState;
    if (key && this._parentPanel) {
      this._parentPanel.setProperty(key, target.checked);
    }
  };

  /**
   * Handler for the FOV slider's custom change event.
   */
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

      this._parentPanel.setProperty("fov", newValue);
      this.clearError();
    } catch (error) {
      this.showError("An error occurred while updating Field of View (FOV).");
    }
  };

  /**
   * Synchronizes the UI controls with the provided state object by
   * iterating through the control configuration.
   * @param viewState The latest state from the parent panel.
   */
  private updateUiState(viewState: CompositeEngineState): void {
    this._controlConfig.forEach(({ key, type }) => {
      const element = this._refs[key];
      const value = viewState[key];

      if (!element || value === undefined) return;

      if (type === "toggle" && typeof value === "boolean") {
        (element as HTMLInputElement).checked = value;
      } else if (type === "slider" && typeof value === "number") {
        const slider = element as TeskooanoSlider;
        if (slider.value !== value) {
          slider.value = value;
        }
      }
    });
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
