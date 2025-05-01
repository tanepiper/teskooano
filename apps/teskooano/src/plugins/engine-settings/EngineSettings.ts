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
import { CustomEvents, SliderValueChangePayload } from "@teskooano/data-types";

/**
 * @element engine-ui-settings-panel
 * @summary Provides UI controls for adjusting engine visualization settings.
 *
 * This custom element displays toggles and sliders to modify the visual representation
 * within a linked `CompositeEnginePanel`. It interacts directly with the parent panel
 * to get and set state like grid visibility, labels, field of view, etc.
 *
 * Implements the `IContentRenderer` interface required by Dockview to be used as
 * panel content.
 *
 * @fires {CustomEvent<SliderValueChangePayload>} CustomEvents.SLIDER_CHANGE - Bubbles up from the internal `teskooano-slider` for FOV changes.
 *
 * @attr {CompositeEnginePanel | null} parentPanel - (Private) Reference to the parent engine panel instance.
 *
 * @csspart container - The main container div for the settings panel.
 * @csspart error-message - The element used to display error messages.
 * @csspart form-group - A container for a label and its associated control (e.g., toggle, slider).
 * @csspart slider-label - The label specifically for the FOV slider.
 * @csspart toggle-label - The label associated with a toggle switch.
 */
export class EngineUISettingsPanel
  extends HTMLElement
  implements IContentRenderer
{
  /** Reference to the grid visibility toggle checkbox. */
  private gridToggle: HTMLInputElement | null = null;
  /** Reference to the celestial labels toggle checkbox. */
  private labelsToggle: HTMLInputElement | null = null;
  /** Reference to the AU markers toggle checkbox. */
  private auMarkersToggle: HTMLInputElement | null = null;
  /** Reference to the debris effects toggle checkbox. */
  private debrisEffectsToggle: HTMLInputElement | null = null;
  /** Reference to the Field of View (FOV) slider element. */
  private fovSliderElement: TeskooanoSlider | null = null;
  /** Reference to the element displaying error messages. */
  private errorMessageElement: HTMLElement | null = null;
  /** Reference to the debug mode toggle checkbox. */
  private debugModeToggle: HTMLInputElement | null = null;

  /** Stores the reference to the parent `CompositeEnginePanel` instance. */
  private _parentPanel: CompositeEnginePanel | null = null;
  /** Stores the RxJS subscription to the parent panel's state changes. */
  private _unsubscribeParentState: Subscription | null = null;

  /**
   * Static getter for the custom element tag name.
   * Used for registration and referencing.
   */
  public static readonly componentName = "engine-ui-settings-panel";

  /**
   * Generates the configuration required by the UI plugin system
   * to register this panel as a toggle button in a toolbar.
   *
   * @returns {PanelToolbarItemConfig} Configuration object for the UI plugin manager.
   */
  public static registerToolbarButtonConfig(): PanelToolbarItemConfig {
    return {
      id: "engine_settings", // Unique ID for this toolbar item
      target: "engine-toolbar", // ID of the target toolbar to add this to
      iconSvg: SettingsIcon, // SVG icon for the button
      title: "Engine Settings", // Tooltip / accessible label for the button
      type: "panel", // Indicates this button controls a panel
      componentName: this.componentName, // Tag name of the panel component
      panelTitle: "Engine Settings", // Title displayed on the panel itself
      behaviour: "toggle", // Button toggles the panel visibility
    };
  }

  /**
   * Constructs the EngineUISettingsPanel.
   * Sets up the shadow DOM and clones the HTML template content.
   * Handles potential errors during template cloning.
   */
  constructor() {
    super();
    if (
      !template ||
      !(template instanceof HTMLTemplateElement) ||
      !template.content
    ) {
      console.error(
        "[EngineUISettingsPanel] Invalid template or template.content! Cannot initialize.",
      );
      // Optionally throw an error or set an internal error state
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
      // Set an internal error state or display an error message within the component
    }
  }

  /**
   * Standard HTMLElement lifecycle callback.
   * Called when the element is added to the document's DOM.
   * Caches references to internal DOM elements, sets up event listeners,
   * and attempts to sync with the parent panel state if already set.
   */
  connectedCallback() {
    // Query for elements within the shadow root
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

    // Verify elements were found
    if (
      !this.gridToggle ||
      !this.labelsToggle ||
      !this.fovSliderElement /* etc. */
    ) {
      console.warn(
        "[EngineUISettingsPanel] Could not find all expected elements in the shadow DOM.",
      );
      // Potentially display an error or disable functionality
    }

    this.addEventListeners();

    // If the parent panel was set before connection, sync now.
    if (this._parentPanel) {
      this.syncWithParentPanelState();
    }
  }

  /**
   * Standard HTMLElement lifecycle callback.
   * Called when the element is removed from the document's DOM.
   * Cleans up event listeners and RxJS subscriptions to prevent memory leaks.
   */
  disconnectedCallback() {
    this.removeEventListeners();
    this._unsubscribeParentState?.unsubscribe();
    this._unsubscribeParentState = null;
  }

  /**
   * Attaches event listeners to the interactive UI elements (toggles, slider).
   * Uses bound methods to maintain the correct `this` context.
   * @private
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
    // Ensure the slider element exists before adding listener
    if (this.fovSliderElement) {
      this.fovSliderElement.addEventListener(
        CustomEvents.SLIDER_CHANGE,
        this.handleFovChange as EventListener, // Cast necessary for CustomEvent handling
      );
    }
    this.debugModeToggle?.addEventListener(
      "change",
      this.handleDebugModeToggleChange,
    );
  }

  /**
   * Removes event listeners from the UI elements.
   * Important for cleanup during disconnection.
   * @private
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
    if (this.fovSliderElement) {
      this.fovSliderElement.removeEventListener(
        CustomEvents.SLIDER_CHANGE,
        this.handleFovChange as EventListener,
      );
    }
    this.debugModeToggle?.removeEventListener(
      "change",
      this.handleDebugModeToggleChange,
    );
  }

  // --- Dockview IContentRenderer Implementation ---

  /**
   * Dockview `IContentRenderer` initialization method.
   * Called by Dockview when the panel content is created.
   * Expects the parent `CompositeEnginePanel` instance to be passed via
   * `parameters.params.parentInstance` for establishing communication.
   *
   * @param {GroupPanelPartInitParameters} parameters - Initialization parameters provided by Dockview, potentially containing the parent panel instance.
   */
  public init(parameters: GroupPanelPartInitParameters): void {
    // Type assertion for expected parameters
    const params = parameters.params as {
      parentInstance?: CompositeEnginePanel;
    };

    if (params?.parentInstance) {
      // Basic check to see if it looks like the expected panel type
      if (
        typeof params.parentInstance === "object" &&
        params.parentInstance !== null &&
        "getViewState" in params.parentInstance && // Check for a key method
        typeof params.parentInstance.getViewState === "function"
      ) {
        this.setParentPanel(params.parentInstance);
      } else {
        const errMsg =
          "Received parentInstance parameter, but it doesn't appear to be a valid CompositeEnginePanel instance.";
        this.showError(errMsg);
        console.error(
          `[EngineUISettingsPanel] ${errMsg}`,
          params.parentInstance,
        );
      }
    } else {
      const errMsg =
        "Initialization parameters did not include 'parentInstance'. This settings panel cannot function without a linked parent CompositeEnginePanel.";
      this.showError(errMsg);
      console.error(`[EngineUISettingsPanel] ${errMsg}`, parameters);
    }
  }

  /**
   * Required by Dockview `IContentRenderer`.
   * Returns the root HTMLElement of this component, which is the component itself.
   *
   * @returns {HTMLElement} The instance of `EngineUISettingsPanel`.
   */
  get element(): HTMLElement {
    return this;
  }

  // --- Component Logic ---

  /**
   * Stores the provided `CompositeEnginePanel` instance as the parent
   * and triggers the initial state synchronization if the component is connected.
   *
   * @param {CompositeEnginePanel} panel - The parent engine panel instance to link to.
   */
  public setParentPanel(panel: CompositeEnginePanel): void {
    if (this._parentPanel === panel) {
      console.warn(
        "[EngineUISettingsPanel] setParentPanel called with the same panel instance.",
      );
      return; // Avoid redundant setup
    }
    this._parentPanel = panel;
    // If connectedCallback has already run and elements are cached,
    // sync state now. Otherwise, connectedCallback will handle the initial sync.
    if (this.isConnected) {
      this.syncWithParentPanelState();
    }
  }

  /**
   * Establishes the connection to the parent panel's state observable.
   * It gets the initial state, updates the UI, and subscribes to future updates.
   * Handles potential errors during state retrieval or subscription.
   * @private
   */
  private syncWithParentPanelState(): void {
    if (!this._parentPanel) {
      this.showError("Cannot sync state: Parent panel reference is missing.");
      console.warn(
        "[EngineUISettingsPanel] syncWithParentPanelState called but _parentPanel is null.",
      );
      return;
    }

    // Unsubscribe from any previous subscription
    this._unsubscribeParentState?.unsubscribe();

    try {
      // Get the current state immediately
      const initialState = this._parentPanel.getViewState();
      this.updateUiState(initialState); // Update UI with initial values
      this.clearError(); // Clear any previous errors

      // Subscribe to subsequent state changes
      this._unsubscribeParentState = this._parentPanel.subscribeToViewState(
        (newState: CompositeEngineState) => {
          // Defensively check if still connected when update arrives
          if (this.isConnected) {
            this.updateUiState(newState);
          }
        },
      );
    } catch (error) {
      const errMsg =
        "Failed to get initial state or subscribe to parent panel.";
      this.showError(errMsg);
      console.error(`[EngineUISettingsPanel] ${errMsg}`, error);
      // Ensure subscription is cleaned up if error occurred during setup
      this._unsubscribeParentState?.unsubscribe();
      this._unsubscribeParentState = null;
    }
  }

  /**
   * Event handler for the grid toggle checkbox changes.
   * Updates the parent panel's grid visibility state.
   * @param {Event} event - The change event object.
   * @private
   */
  private handleGridToggleChange = (event: Event): void => {
    if (!this._parentPanel) return;
    const isChecked = (event.target as HTMLInputElement).checked;
    // Consider adding error handling for the parent panel call
    this._parentPanel.setShowGrid(isChecked);
  };

  /**
   * Event handler for the celestial labels toggle checkbox changes.
   * Updates the parent panel's label visibility state.
   * @param {Event} event - The change event object.
   * @private
   */
  private handleLabelsToggleChange = (event: Event): void => {
    if (!this._parentPanel) return;
    const isChecked = (event.target as HTMLInputElement).checked;
    this._parentPanel.setShowCelestialLabels(isChecked);
  };

  /**
   * Event handler for the AU markers toggle checkbox changes.
   * Updates the parent panel's AU marker visibility state.
   * @param {Event} event - The change event object.
   * @private
   */
  private handleAuMarkersToggleChange = (event: Event): void => {
    if (!this._parentPanel) return;
    const isChecked = (event.target as HTMLInputElement).checked;
    this._parentPanel.setShowAuMarkers(isChecked);
  };

  /**
   * Event handler for the debris effects toggle checkbox changes.
   * Updates the parent panel's debris effects enabled state.
   * @param {Event} event - The change event object.
   * @private
   */
  private handleDebrisEffectsToggleChange = (event: Event): void => {
    if (!this._parentPanel) return;
    const isChecked = (event.target as HTMLInputElement).checked;
    this._parentPanel.setDebrisEffectsEnabled(isChecked);
  };

  /**
   * Event handler for the debug mode toggle checkbox changes.
   * Updates the parent panel's debug mode state.
   * @param {Event} event - The change event object.
   * @private
   */
  private handleDebugModeToggleChange = (event: Event): void => {
    if (!this._parentPanel) return;
    const isChecked = (event.target as HTMLInputElement).checked;
    this._parentPanel.setDebugMode(isChecked);
  };

  /**
   * Event handler for the FOV slider's custom change event (`CustomEvents.SLIDER_CHANGE`).
   * Validates the event payload and updates the parent panel's FOV state.
   * Includes error handling for invalid values or issues communicating with the parent.
   * @param {CustomEvent<SliderValueChangePayload>} event - The custom event object containing the new slider value.
   * @private
   */
  private handleFovChange = (
    event: CustomEvent<SliderValueChangePayload>,
  ): void => {
    if (!this._parentPanel) {
      this.showError(
        "Cannot handle FOV change: Parent panel reference missing.",
      );
      console.warn(
        "[EngineUISettingsPanel] handleFovChange called but _parentPanel is null.",
      );
      return;
    }

    try {
      // Validate the detail payload
      if (
        !event.detail ||
        typeof event.detail.value !== "number" ||
        isNaN(event.detail.value)
      ) {
        console.warn(
          "[EngineUISettingsPanel] FOV slider event received invalid or missing detail value:",
          event.detail,
        );
        this.showError("Invalid FOV value received from slider event.");
        return;
      }

      const newValue = event.detail.value;
      // Update the parent panel state
      this._parentPanel.updateViewState({ fov: newValue });
      this.clearError(); // Clear error on successful update
    } catch (error) {
      console.error(
        "[EngineUISettingsPanel] Error updating FOV via parent panel:",
        error,
      );
      this.showError("An error occurred while updating Field of View (FOV).");
    }
  };

  /**
   * Synchronizes the state of the UI controls (toggles, slider) with the
   * provided state object from the parent panel.
   * Checks if the component is connected to the DOM before attempting updates.
   *
   * @param {CompositeEngineState} viewState - The latest state object from the parent panel.
   * @private
   */
  private updateUiState(viewState: CompositeEngineState): void {
    // Don't try to update DOM elements if not connected
    if (!this.isConnected) {
      console.warn(
        "[EngineUISettingsPanel] Attempted to update UI state while disconnected.",
      );
      return;
    }

    // Update toggles, checking if the element exists first
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

    // Update slider, checking if the element exists and value is defined
    if (this.fovSliderElement && typeof viewState.fov === "number") {
      // Only update if the value has actually changed to avoid potential event loops
      if (this.fovSliderElement.value !== viewState.fov) {
        this.fovSliderElement.value = viewState.fov;
      }
    }
  }

  // --- Error Handling ---

  /**
   * Displays an error message within the panel's designated error area.
   * Makes the error area visible.
   *
   * @param {string} message - The error message to display.
   * @private
   */
  private showError(message: string): void {
    if (this.errorMessageElement) {
      this.errorMessageElement.textContent = message;
      this.errorMessageElement.style.display = "block"; // Make it visible
    } else {
      // Fallback if the error element isn't found
      console.error(
        `[EngineUISettingsPanel] Error Display Failed (Element Missing): ${message}`,
      );
    }
  }

  /**
   * Hides the error message area and clears its content.
   * @private
   */
  private clearError(): void {
    if (this.errorMessageElement) {
      this.errorMessageElement.textContent = "";
      this.errorMessageElement.style.display = "none"; // Hide it
    }
  }
}
