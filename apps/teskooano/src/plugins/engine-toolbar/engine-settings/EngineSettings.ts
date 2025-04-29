import type {
  CompositeEnginePanel,
  CompositeEngineState,
} from "../../engine/panels/CompositeEnginePanel.js"; // Import parent panel type
import type { TeskooanoSlider } from "../../../core/components/slider/Slider.js"; // Import the slider type
import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import { PanelToolbarButtonConfig } from "../EngineToolbar.store.js"; // Import toolbar types

import SettingsIcon from "@fluentui/svg-icons/icons/settings_24_regular.svg?raw";
import { template } from "./EngineSettings.template";

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

  constructor() {
    super();
    console.log("[EngineUISettingsPanel] Constructor running..."); // Debug log
    // Check if template and template.content are valid before using
    if (
      !template ||
      !(template instanceof HTMLTemplateElement) ||
      !template.content
    ) {
      console.error(
        "[EngineUISettingsPanel] Invalid template or template.content!",
      );
      // Optionally throw an error or handle gracefully
      return;
    }
    console.log(
      "[EngineUISettingsPanel] Template content childElementCount:",
      template.content.childElementCount,
    ); // Debug log
    console.log(
      "[EngineUISettingsPanel] Template content first child:",
      template.content.firstChild?.nodeName,
    ); // Debug log

    this.attachShadow({ mode: "open" });
    try {
      const clonedContent = template.content.cloneNode(true);
      // console.log('[EngineUISettingsPanel] Cloned template content:', clonedContent); // Optional: log the whole node
      this.shadowRoot!.appendChild(clonedContent);
      console.log(
        "[EngineUISettingsPanel] Appended template content to shadowRoot.",
      ); // Debug log
    } catch (error) {
      console.error(
        "[EngineUISettingsPanel] Error appending template content to shadowRoot:",
        error,
      ); // Debug log
    }
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
