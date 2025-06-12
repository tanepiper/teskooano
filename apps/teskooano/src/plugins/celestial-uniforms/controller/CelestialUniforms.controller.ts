import { celestialObjects$, getCelestialObjects } from "@teskooano/core-state";
import { type CelestialObject, CelestialStatus } from "@teskooano/data-types";
import { Subscription } from "rxjs";
import type { CelestialUniformsEditor } from "../view/CelestialUniforms.view";
import { UniformsRendererFactory } from "./uniform-renderers/UniformsRendererFactory";

/**
 * Controller for the CelestialUniformsEditor view.
 *
 * This class encapsulates all the business logic for the uniforms editor panel.
 * It manages subscriptions to state, handles focus changes, and orchestrates
 * the rendering of UI controls by delegating to specialized renderer classes.
 */
export class CelestialUniformsController {
  private _view: CelestialUniformsEditor;
  private _container: HTMLElement;
  private _placeholder: HTMLElement;
  private _titleEl: HTMLElement;

  private unsubscribeObjectsStore: Subscription | null = null;
  private currentSelectedId: string | null = null;
  private activeInputSubscriptions: Subscription[] = [];
  private _lastRenderedObjectId: string | null = null;

  private _handleRendererFocusChange: (event: Event) => void;
  private _handleFocusRequestInitiated: (event: Event) => void;

  /**
   * Creates an instance of CelestialUniformsController.
   * @param view The CelestialUniformsEditor view instance.
   * @param container The main container element to render controls into.
   * @param placeholder The placeholder element to show messages.
   * @param titleEl The title element of the panel.
   */
  constructor(
    view: CelestialUniformsEditor,
    container: HTMLElement,
    placeholder: HTMLElement,
    titleEl: HTMLElement,
  ) {
    this._view = view;
    this._container = container;
    this._placeholder = placeholder;
    this._titleEl = titleEl;

    this._handleRendererFocusChange = (event: Event): void => {
      const customEvent = event as CustomEvent<{
        focusedObjectId: string | null;
      }>;
      if (customEvent.detail) {
        if (this.currentSelectedId !== customEvent.detail.focusedObjectId) {
          this.handleSelectionChange(customEvent.detail.focusedObjectId);
        }
      }
    };

    this._handleFocusRequestInitiated = (event: Event): void => {
      const customEvent = event as CustomEvent<{ objectId: string | null }>;
      if (customEvent.detail && customEvent.detail.objectId) {
        if (this.currentSelectedId !== customEvent.detail.objectId) {
          this.handleSelectionChange(customEvent.detail.objectId);
        }
      } else {
        console.warn(
          "[CelestialUniformsController] Received focus request with no objectId.",
        );
      }
    };
  }

  /**
   * Initializes the controller, setting up listeners and initial state.
   */
  public initialize(): void {
    this.setupObjectListener();

    document.addEventListener(
      "renderer-focus-changed",
      this._handleRendererFocusChange,
    );

    document.addEventListener(
      "focus-request-initiated",
      this._handleFocusRequestInitiated,
    );
  }

  /**
   * Cleans up all subscriptions and event listeners.
   */
  public dispose(): void {
    this._cleanupSubscriptions();
    this.unsubscribeObjectsStore?.unsubscribe();
    this.unsubscribeObjectsStore = null;

    document.removeEventListener(
      "renderer-focus-changed",
      this._handleRendererFocusChange,
    );

    document.removeEventListener(
      "focus-request-initiated",
      this._handleFocusRequestInitiated,
    );
  }

  /**
   * Handles the initial selection of an object when the panel is created.
   * @param selectedId The ID of the initially focused object, if any.
   */
  public handleInitialSelection(selectedId: string | null): void {
    this.handleSelectionChange(selectedId);
  }

  private _cleanupSubscriptions(): void {
    this.activeInputSubscriptions.forEach((sub) => sub.unsubscribe());
    this.activeInputSubscriptions = [];
  }

  private setupObjectListener(): void {
    this.unsubscribeObjectsStore = celestialObjects$.subscribe(
      (allCelestials) => {
        if (this.currentSelectedId) {
          const celestialData = allCelestials[this.currentSelectedId];

          if (!celestialData) {
            console.warn(
              `[CelestialUniformsController] Previously selected object ${this.currentSelectedId} not found in latest state. Triggering deselection.`,
            );
            this.handleSelectionChange(null);
          } else if (celestialData.status === CelestialStatus.DESTROYED) {
            console.warn(
              `[CelestialUniformsController] Selected object ${this.currentSelectedId} (${celestialData.name}) is now destroyed. Triggering deselection.`,
            );
            this.handleSelectionChange(null, celestialData);
          }
        }
      },
    );
  }

  private handleSelectionChange(
    selectedId: string | null,
    potentiallyDestroyedObject?: CelestialObject,
  ): void {
    if (
      selectedId === this.currentSelectedId &&
      selectedId === this._lastRenderedObjectId &&
      selectedId !== null
    ) {
      return;
    }

    if (
      selectedId === null &&
      this.currentSelectedId === null &&
      this._lastRenderedObjectId === null
    ) {
      return;
    }

    const oldSelectedId = this.currentSelectedId;
    this.currentSelectedId = selectedId;

    this._cleanupSubscriptions();
    this._view.clearContainer();

    if (!selectedId) {
      this._lastRenderedObjectId = null;
      let message = "Select a celestial object to edit its properties.";
      if (
        potentiallyDestroyedObject &&
        potentiallyDestroyedObject.status === CelestialStatus.DESTROYED
      ) {
        message = `Object '${potentiallyDestroyedObject.name}' has been destroyed.`;
      } else if (oldSelectedId && !potentiallyDestroyedObject) {
        const allCelestials = getCelestialObjects();
        const oldObjectData = allCelestials[oldSelectedId];
        if (!oldObjectData) {
          message = `Object previously selected (${oldSelectedId}) is no longer available.`;
        }
      }
      this._view.showPlaceholder(message);
      this._view.setTitle("Celestial Uniforms Editor");
      return;
    }

    const celestialData = getCelestialObjects()[selectedId];

    if (celestialData) {
      if (celestialData.status === CelestialStatus.DESTROYED) {
        this._view.showPlaceholder(
          `Object '${celestialData.name}' has been destroyed.`,
        );
        this._view.setTitle("Celestial Uniforms Editor");
        this._lastRenderedObjectId = null;
      } else {
        this._view.setTitle(
          `Editing: ${celestialData.name} (${celestialData.type})`,
        );
        this.renderUniformsUI(celestialData);
      }
    } else {
      this._view.showPlaceholder(
        `Selected object data not found for ID: ${selectedId}.`,
      );
      this._view.setTitle("Celestial Uniforms Editor");
      this._lastRenderedObjectId = null;
    }
  }

  private renderUniformsUI(celestial: CelestialObject): void {
    this._view.hidePlaceholder();

    const renderer = UniformsRendererFactory.getRendererForCelestial(celestial);

    if (renderer) {
      this.activeInputSubscriptions = renderer.render(
        this._container,
        celestial,
      );
    } else {
      this._view.showPlaceholder(
        `No specific uniform editor for type: ${celestial.type}`,
      );
    }
    this._lastRenderedObjectId = celestial.id;
  }
}
