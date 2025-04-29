import { CelestialObject } from "@teskooano/data-types";
import {
  DockviewPanelApi,
  GroupPanelPartInitParameters,
  IContentRenderer,
} from "dockview-core";

interface ProgressParams {
  planetList?: { id: string; name: string }[];
}

// Define the structure of the progress event detail
interface TextureProgressEventDetail {
  objectId: string;
  objectName: string; // Include name for display
  status: "pending" | "generating" | "cached" | "complete" | "error";
  message?: string;
}

/**
 * A Dockview panel to display texture generation progress using CustomEvents.
 */
export class ProgressPanel implements IContentRenderer {
  private readonly _element: HTMLElement;
  private _params: GroupPanelPartInitParameters | undefined;
  private _api: DockviewPanelApi | undefined;

  // Store texture processing states
  private _textureStates: Map<string, { status: string; name: string }> =
    new Map();
  private _timeoutId: number | undefined;

  get element(): HTMLElement {
    return this._element;
  }

  constructor() {
    this._element = document.createElement("div");
    this._element.style.height = "100%";
    this._element.style.width = "100%";
    this._element.style.padding = "15px";
    this._element.style.boxSizing = "border-box";
    this._element.style.overflowY = "auto";
    this._element.innerHTML =
      '<h4>Texture Generation Progress</h4><div id="progress-list">Initializing...</div>';
  }

  init(parameters: GroupPanelPartInitParameters): void {
    this._params = parameters;
    this._api = parameters.api;

    // Initialize state from params
    this._params?.params?.planetList?.forEach((planet: CelestialObject) => {
      // Ensure we only track planets passed in initially
      this._textureStates.set(planet.id, {
        status: "pending",
        name: planet.name,
      });
    });

    this.updateProgressDisplay(); // Initial render
    this.addEventListeners(); // Add listeners for custom events

    // Set a timeout to automatically close the panel as a fallback
    // In a perfect world, the 'texture-generation-complete' event would handle this.
    this._timeoutId = window.setTimeout(() => {
      console.warn("[ProgressPanel] Auto-closing panel due to timeout.");
      this._api?.close();
    }, 60000); // Close after 60 seconds regardless
  }

  // Add event listeners
  private addEventListeners(): void {
    document.addEventListener("texture-progress", this.handleTextureProgress);
    document.addEventListener(
      "texture-generation-complete",
      this.handleGenerationComplete,
    );
  }

  // Remove event listeners on dispose
  private removeEventListeners(): void {
    document.removeEventListener(
      "texture-progress",
      this.handleTextureProgress,
    );
    document.removeEventListener(
      "texture-generation-complete",
      this.handleGenerationComplete,
    );
  }

  // Handle individual texture progress updates
  private handleTextureProgress = (event: Event): void => {
    const customEvent = event as CustomEvent<TextureProgressEventDetail>;
    const detail = customEvent.detail;

    if (detail && this._textureStates.has(detail.objectId)) {
      const currentState = this._textureStates.get(detail.objectId);
      if (currentState) {
        this._textureStates.set(detail.objectId, {
          ...currentState,
          status: detail.status,
          // Optionally update name if provided in event, though unlikely to change
          name: detail.objectName || currentState.name,
        });
        this.updateProgressDisplay();
        this.checkCompletionAndClose(); // Check if all done after each update
      }
    } else {
      // console.warn("[ProgressPanel] Received progress for untracked object:", detail?.objectId);
    }
  };

  // Handle overall completion signal
  private handleGenerationComplete = (): void => {
    // Force close after a short delay
    this.closePanel(1000);
  };

  // Update the visual display
  private updateProgressDisplay(): void {
    const listElement = this._element.querySelector("#progress-list");
    if (!listElement) return;

    if (this._textureStates.size === 0) {
      listElement.innerHTML =
        "<p>No planets found for texture generation tracking.</p>";
      return;
    }

    let html = '<ul style="list-style: none; padding: 0; margin: 0;">';
    this._textureStates.forEach((value, key) => {
      let statusIcon = "⏳"; // Pending
      if (value.status === "generating") statusIcon = "⚙️"; // Processing
      if (value.status === "cached") statusIcon = "💾"; // Cached
      if (value.status === "complete") statusIcon = "✅"; // Complete
      if (value.status === "error") statusIcon = "❌"; // Error

      html += `<li style="margin-bottom: 5px;">${statusIcon} ${
        value.name
      } (${key.replace("planet-", "")})</li>`; // Shorten ID display
    });
    html += "</ul>";
    listElement.innerHTML = html;
  }

  // Check if all tracked items are complete or errored
  private checkCompletionAndClose(): void {
    let allDone = true;
    this._textureStates.forEach((value) => {
      if (value.status === "pending" || value.status === "generating") {
        allDone = false;
      }
    });

    if (allDone) {
      this.closePanel(3000); // Close after 3 seconds delay
    }
  }

  // Close the panel after a delay
  private closePanel(delayMs: number): void {
    if (this._timeoutId) clearTimeout(this._timeoutId); // Clear auto-close timer
    this._timeoutId = window.setTimeout(() => {
      this._api?.close();
    }, delayMs);
  }

  dispose(): void {
    this.removeEventListeners(); // IMPORTANT: Remove listeners
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
    }
  }
}
