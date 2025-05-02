import { CelestialObject } from "@teskooano/data-types";
import {
  DockviewPanelApi,
  GroupPanelPartInitParameters,
  IContentRenderer,
} from "dockview-core";

interface ProgressParams {
  planetList?: { id: string; name: string }[];
}

interface TextureProgressEventDetail {
  objectId: string;
  objectName: string;
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

    this._params?.params?.planetList?.forEach((planet: CelestialObject) => {
      this._textureStates.set(planet.id, {
        status: "pending",
        name: planet.name,
      });
    });

    this.updateProgressDisplay();
    this.addEventListeners();

    this._timeoutId = window.setTimeout(() => {
      console.warn("[ProgressPanel] Auto-closing panel due to timeout.");
      this._api?.close();
    }, 60000);
  }

  private addEventListeners(): void {
    document.addEventListener("texture-progress", this.handleTextureProgress);
    document.addEventListener(
      "texture-generation-complete",
      this.handleGenerationComplete,
    );
  }

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

  private handleTextureProgress = (event: Event): void => {
    const customEvent = event as CustomEvent<TextureProgressEventDetail>;
    const detail = customEvent.detail;

    if (detail && this._textureStates.has(detail.objectId)) {
      const currentState = this._textureStates.get(detail.objectId);
      if (currentState) {
        this._textureStates.set(detail.objectId, {
          ...currentState,
          status: detail.status,

          name: detail.objectName || currentState.name,
        });
        this.updateProgressDisplay();
        this.checkCompletionAndClose();
      }
    } else {
    }
  };

  private handleGenerationComplete = (): void => {
    this.closePanel(1000);
  };

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
      let statusIcon = "⏳";
      if (value.status === "generating") statusIcon = "⚙️";
      if (value.status === "cached") statusIcon = "💾";
      if (value.status === "complete") statusIcon = "✅";
      if (value.status === "error") statusIcon = "❌";

      html += `<li style="margin-bottom: 5px;">${statusIcon} ${
        value.name
      } (${key.replace("planet-", "")})</li>`;
    });
    html += "</ul>";
    listElement.innerHTML = html;
  }

  private checkCompletionAndClose(): void {
    let allDone = true;
    this._textureStates.forEach((value) => {
      if (value.status === "pending" || value.status === "generating") {
        allDone = false;
      }
    });

    if (allDone) {
      this.closePanel(3000);
    }
  }

  private closePanel(delayMs: number): void {
    if (this._timeoutId) clearTimeout(this._timeoutId);
    this._timeoutId = window.setTimeout(() => {
      this._api?.close();
    }, delayMs);
  }

  dispose(): void {
    this.removeEventListeners();
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
    }
  }
}
