import {
  celestialObjectsStore,
  renderableObjectsStore,
} from "@teskooano/core-state";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
} from "@teskooano/data-types";
import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import * as THREE from "three";
import { PanelToolbarButtonConfig } from "../../../stores/toolbarStore"; // Import toolbar types
import type { CompositeEnginePanel } from "../../engine/CompositeEnginePanel"; // Import parent panel type

// Import Fluent UI Icons
import TargetIcon from "@fluentui/svg-icons/icons/target_24_regular.svg?raw";

import FocusControlTemplate from "./FocusControl.template.js";
import { calculateCameraDistance } from "./FocusControl.camera"; // Import camera distance function
import {
  populateFocusList,
  updateFocusHighlight,
  updateObjectStatusInList,
} from "./FocusControl.list"; // Import list functions


export class FocusControl extends HTMLElement implements IContentRenderer {
  private listContainer: HTMLElement | null = null;
  private resetButton: HTMLElement | null = null;
  private clearButton: HTMLElement | null = null;

  private _parentPanel: CompositeEnginePanel | null = null; // Store parent panel instance

  private _currentFocusedId: string | null = null;
  private _handleObjectsLoaded: () => void;
  private _handleObjectDestroyed: () => void;
  private _handleRendererFocusChange: (event: Event) => void; // Store handler reference
  private _handleObjectStatusChanged: (event: Event) => void; // Store handler reference
  private _handleInfluencesChanged: () => void; // Store handler reference

  // Store subscription for automatic updates
  private _celestialObjectsUnsubscribe: (() => void) | null = null;
  private _previousObjectsState: Record<string, CelestialObject> = {};

  // --- Static Configuration ---
  public static readonly componentName = "focus-control";

  public static registerToolbarButtonConfig(): PanelToolbarButtonConfig {
    return {
      id: "focus_control", // Base ID
      iconSvg: TargetIcon,
      title: "Focus Control",
      type: "panel",
      componentName: this.componentName,
      panelTitle: "Focus Control",
      behaviour: "toggle",
    };
  }
  // --- End Static Configuration ---

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(FocusControlTemplate.content.cloneNode(true));

    // Bind event handlers to maintain correct 'this' context
    this._handleObjectsLoaded = this._populateListInternal.bind(this);
    this._handleObjectDestroyed = this._populateListInternal.bind(this);
    this._handleRendererFocusChange = (event: Event): void => {
      const customEvent = event as CustomEvent<{
        focusedObjectId: string | null;
      }>;
      if (customEvent.detail) {
        this._updateHighlightInternal(customEvent.detail.focusedObjectId);
      }
    };
    this._handleObjectStatusChanged = (event: Event): void => {
      const customEvent = event as CustomEvent<{
        objectId: string;
        status: CelestialStatus;
      }>;
      if (customEvent.detail) {
        const { objectId, status } = customEvent.detail;
        this._updateObjectStatusInternal(objectId, status);
      }
    };
    this._handleInfluencesChanged = this._populateListInternal.bind(this);
  }

  connectedCallback() {
    this.listContainer = this.shadowRoot!.getElementById("target-list");
    this.resetButton = this.shadowRoot!.getElementById("reset-view");
    this.clearButton = this.shadowRoot!.getElementById("clear-focus");

    this.addEventListeners();
    this._populateListInternal();

    this._previousObjectsState = { ...celestialObjectsStore.get() };
    this._celestialObjectsUnsubscribe = celestialObjectsStore.subscribe(
      (objects) => {
        this.checkForStatusChanges(objects);
      }
    );

    document.addEventListener(
      "celestial-objects-loaded",
      this._handleObjectsLoaded
    );
    document.addEventListener(
      "celestial-object-destroyed",
      this._handleObjectDestroyed
    );
    document.addEventListener(
      "celestial-object-status-changed",
      this._handleObjectStatusChanged
    );
    document.addEventListener(
      "celestial-influences-changed",
      this._handleInfluencesChanged
    );
    document.addEventListener(
      "renderer-focus-changed",
      this._handleRendererFocusChange
    );
  }

  disconnectedCallback() {
    this.removeEventListeners();
    if (this._celestialObjectsUnsubscribe) {
      this._celestialObjectsUnsubscribe();
      this._celestialObjectsUnsubscribe = null;
    }
  }

  public setParentPanel(panel: CompositeEnginePanel): void {
    this._parentPanel = panel;
  }

  public tourFocus = (): void => {
    const activeButtons = Array.from(
      this.listContainer!.querySelectorAll("button.focus-item:not([disabled])")
    );
    if (activeButtons.length === 0) {
      console.warn("[FocusControl] No active objects found for tour focus");
      return;
    }
    const randomButton = activeButtons[
      Math.floor(Math.random() * activeButtons.length)
    ] as HTMLElement;
    if (randomButton) {
      randomButton.click();
    }
  };

  public getRandomActiveObjectId = (): [string | null, string | null] => {
    const objects = celestialObjectsStore.get();
    const activeObjects = Object.values(objects).filter(
      (obj) =>
        obj.status !== CelestialStatus.DESTROYED &&
        obj.status !== CelestialStatus.ANNIHILATED
    );
    if (activeObjects.length === 0) {
      console.warn("[FocusControl] No active objects available");
      return [null, null];
    }
    const randomObject =
      activeObjects[Math.floor(Math.random() * activeObjects.length)];
    return [randomObject.id, null];
  };

  // Public method remains the same, but internal calculation is delegated
  public focusOnObject = (objectId: string): boolean => {
    if (!this._parentPanel) return false;
    const objects = celestialObjectsStore.get();
    const targetObject = objects[objectId];

    if (!targetObject) {
      console.warn(`[FocusControl] Target object ${objectId} not found.`);
      return false;
    }

    if (
      targetObject.type === CelestialType.ASTEROID_FIELD ||
      targetObject.type === CelestialType.OORT_CLOUD
    ) {
      console.warn(
        `[FocusControl] Direct focus disallowed for type: ${targetObject.type}`
      );
      return false;
    }

    if (
      targetObject.status === CelestialStatus.DESTROYED ||
      targetObject.status === CelestialStatus.ANNIHILATED
    ) {
      console.warn(
        `[FocusControl] Cannot focus on object ${objectId} with status ${targetObject.status}`
      );
      return false;
    }

    // Use the imported function, passing the renderer
    const distance = calculateCameraDistance(
      targetObject,
      this._parentPanel.getRenderer()
    );

    this._parentPanel.focusOnObject(objectId, distance);
    return true;
  };

  private addEventListeners(): void {
    if (this.resetButton) {
      this.resetButton.addEventListener("click", () => {
        this._parentPanel?.resetCameraView();
      });
    } else {
       console.warn("[FocusControl] Reset button element not found.");
    }

    if (this.clearButton) {
      this.clearButton.addEventListener("click", () => {
        this._parentPanel?.clearFocus();
      });
    } else {
       console.warn("[FocusControl] Clear button element not found.");
    }

    this.shadowRoot!.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const button = target.closest("button.focus-item") as HTMLButtonElement;

      if (button?.dataset.id) {
        const objectId = button.dataset.id;

        if (
          button.disabled ||
          button.classList.contains("destroyed") ||
          button.classList.contains("annihilated")
        ) {
          return;
        }

        const currentObjects = celestialObjectsStore.get();
        const currentObject = currentObjects[objectId];
        if (
          !currentObject ||
          currentObject.status === CelestialStatus.DESTROYED ||
          currentObject.status === CelestialStatus.ANNIHILATED
        ) {
          console.warn(
            `[FocusControl] Click ignored for object ${objectId}: Object no longer active in current state.`
          );
          this._populateListInternal();
          return;
        }

        this.dispatchEvent(
          new CustomEvent("focus-request-initiated", {
            bubbles: true,
            composed: true,
            detail: { objectId },
          })
        );

        const currentRenderables = renderableObjectsStore.get();
        const targetObjectRenderable = currentRenderables[objectId];

        if (!targetObjectRenderable) {
          console.warn(
            `[FocusControl] Could not find renderable object data for ${objectId} in store.`
          );
          return;
        }

        const targetPosition = targetObjectRenderable.position;
        if (!targetPosition || !(targetPosition instanceof THREE.Vector3)) {
          console.error(
            `[FocusControl] Invalid or missing position data on renderable object ${objectId}`
          );
          return;
        }

        const renderer = this._parentPanel?.getRenderer();
        if (!renderer?.camera?.position) {
          console.error(
            "[FocusControl] Cannot get renderer or camera position."
          );
          return;
        }

        // Reset camera zoom
        if (
          "zoom" in renderer.camera &&
          "updateProjectionMatrix" in renderer.camera
        ) {
          const cameraWithZoom = renderer.camera as
            | THREE.PerspectiveCamera
            | THREE.OrthographicCamera;
          cameraWithZoom.zoom = 1;
          cameraWithZoom.updateProjectionMatrix();
        }

        // Use the imported function here as well
        const desiredDistance = calculateCameraDistance(currentObject, renderer);

        const currentCameraPosition = renderer.camera.position.clone();
        const direction = currentCameraPosition.clone().sub(targetPosition);
        if (direction.lengthSq() < 0.0001) {
          direction.set(0, 1, 0); // Default direction if already at target
        } else {
          direction.normalize();
        }

        const cameraPosition = targetPosition
          .clone()
          .addScaledVector(direction, desiredDistance);

        renderer?.setFollowTarget(
          objectId,
          targetPosition.clone(),
          cameraPosition
        );

        this._parentPanel?.updateViewState({ focusedObjectId: objectId });
      }
    });
    // Global listeners moved to connectedCallback
  }

  private removeEventListeners(): void {
    // Rely on element disconnection for shadowRoot listener cleanup
    document.removeEventListener(
      "celestial-objects-loaded",
      this._handleObjectsLoaded
    );
    document.removeEventListener(
      "celestial-object-destroyed",
      this._handleObjectDestroyed
    );
    document.removeEventListener(
      "celestial-influences-changed",
      this._handleInfluencesChanged
    );
    document.removeEventListener(
      "renderer-focus-changed",
      this._handleRendererFocusChange
    );
    document.removeEventListener(
      "celestial-object-status-changed",
      this._handleObjectStatusChanged
    );
  }

  private _populateListInternal = (): void => {
    if (!this.listContainer) return;
    const objects = celestialObjectsStore.get();
    populateFocusList(
      this.listContainer,
      objects,
      this._currentFocusedId
    );
  };

  private _updateHighlightInternal(focusedId: string | null): void {
    if (!this.listContainer) return;
    if (this._currentFocusedId === focusedId) return;
    this._currentFocusedId = focusedId;
    updateFocusHighlight(this.listContainer, this._currentFocusedId);
  }

  private _updateObjectStatusInternal(
    objectId: string,
    status: CelestialStatus
  ): void {
    if (!this.listContainer) return;
    const needsFullRefresh = updateObjectStatusInList(
      this.listContainer,
      objectId,
      status
    );
    if (needsFullRefresh) {
      this._populateListInternal();
    } else {
      const isInactive =
        status === CelestialStatus.DESTROYED ||
        status === CelestialStatus.ANNIHILATED;
      if (isInactive && this._currentFocusedId === objectId) {
        this._parentPanel?.clearFocus();
      }
    }
  }

  private checkForStatusChanges(
    currentObjects: Record<string, CelestialObject>
  ): void {
    if (Object.keys(this._previousObjectsState).length === 0) {
      this._previousObjectsState = { ...currentObjects };
      return;
    }

    let needsListUpdate = false;
    let focusClearedDueToChange = false;

    Object.entries(currentObjects).forEach(([id, obj]) => {
      const prevObj = this._previousObjectsState[id];
      if (!prevObj) {
        needsListUpdate = true; // New object
      } else if (prevObj.status !== obj.status) {
        this._updateObjectStatusInternal(id, obj.status);
        if (
          this._currentFocusedId === id &&
          (obj.status === CelestialStatus.DESTROYED ||
            obj.status === CelestialStatus.ANNIHILATED)
        ) {
          this._parentPanel?.clearFocus();
          focusClearedDueToChange = true;
        }
      } else if (prevObj.currentParentId !== obj.currentParentId) {
        needsListUpdate = true; // Hierarchy changed
      }
    });

    Object.keys(this._previousObjectsState).forEach((id) => {
      if (!currentObjects[id]) {
        needsListUpdate = true; // Object removed
        if (this._currentFocusedId === id) {
          this._parentPanel?.clearFocus();
          focusClearedDueToChange = true;
        }
      }
    });

    this._previousObjectsState = { ...currentObjects };

    if (needsListUpdate && !focusClearedDueToChange) {
      this._populateListInternal();
    }
  }

  public init(parameters: GroupPanelPartInitParameters): void {
    const params = parameters.params as {
      parentInstance?: CompositeEnginePanel;
    };
    if (
      params?.parentInstance &&
      typeof params.parentInstance === 'object' && // More robust check
      typeof (params.parentInstance as any).focusOnObject === 'function'
    ) {
      this.setParentPanel(params.parentInstance);
    } else {
      console.error(
        "[FocusControl] Initialization parameters did not include a valid 'parentInstance'. Cannot link to parent."
      );
    }
  }

  get element(): HTMLElement {
    return this;
  }
}

customElements.define("focus-control", FocusControl);
