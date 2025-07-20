import type { DockviewController } from "../../controllers/dockview";
import type {
  ModalPanelOptions,
  ModalResult,
} from "./view/modal-panel.component";

/**
 * Options for the DockView modal manager.
 */
export interface DockViewModalOptions extends ModalPanelOptions {
  /**
   * The ID of the modal panel.
   */
  id?: string;
  /**
   * The position for the floating panel.
   */
  position?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

/**
 * Manages the creation and interaction of modal dialogs using DockView floating panels
 * instead of overlays. This provides better integration with the DockView system.
 */
export class DockViewModalManager {
  private _dockviewController: DockviewController | null = null;
  private isInitialized = false;
  private _modalCounter = 0;

  /**
   * Create a new DockViewModalManager
   * Dependencies are injected via initialize()
   */
  constructor() {}

  /**
   * Initializes the manager with necessary dependencies.
   * @param dockviewController The DockviewController instance.
   */
  public initialize(dockviewController: DockviewController): void {
    if (this.isInitialized) {
      console.warn("DockViewModalManager already initialized.");
      return;
    }
    this._dockviewController = dockviewController;
    this.isInitialized = true;
  }

  /**
   * Shows a modal dialog as a floating DockView panel with the specified options
   * @param options Modal configuration options
   * @returns Promise that resolves with the action taken
   */
  public show(options: DockViewModalOptions): Promise<ModalResult> {
    if (!this.isInitialized || !this._dockviewController) {
      console.error(
        "DockViewModalManager not initialized. Call initialize() before show().",
      );
      return Promise.resolve("dismissed");
    }

    this._modalCounter++;
    const modalId = options.id || `modal-panel-${this._modalCounter}`;

    // Calculate default position (center of screen)
    const defaultPosition = this.calculateDefaultPosition(options);
    const position = options.position || defaultPosition;

    // Create panel options
    const panelOptions = {
      id: modalId,
      component: "teskooano-modal-panel",
      title: options.title,
      params: {
        title: options.title,
        content: options.content,
        confirmText: options.confirmText,
        closeText: options.closeText,
        secondaryText: options.secondaryText,
        hideCloseButton: options.hideCloseButton,
        hideConfirmButton: options.hideConfirmButton,
        hideSecondaryButton: options.hideSecondaryButton,
        width: options.width,
        height: options.height,
      },
    };

    try {
      // Create the floating panel
      const panelApi = this._dockviewController.addFloatingPanel(
        panelOptions,
        position,
      );

      if (!panelApi) {
        console.error("DockViewModalManager: Failed to create modal panel");
        return Promise.resolve("dismissed");
      }

      // Return a promise that resolves when the modal is closed
      return new Promise<ModalResult>((resolve) => {
        // Wait for the panel to be fully initialized and then set up the promise resolution
        setTimeout(() => {
          // Find the modal panel element in the DOM
          const modalElement = document.querySelector(
            "teskooano-modal-panel",
          ) as any;
          console.log(
            "DockViewModalManager: Found modal element:",
            modalElement,
          );
          if (modalElement && modalElement._resolvePromise === undefined) {
            console.log("DockViewModalManager: Setting up promise resolution");
            // Set up the promise resolution
            modalElement._resolvePromise = resolve;
          } else {
            console.log(
              "DockViewModalManager: Modal element not found or _resolvePromise already set",
            );
          }
        }, 200); // Increased timeout to ensure initialization is complete

        // Listen for panel removal as fallback
        const handlePanelRemoved = (removedPanelId: string) => {
          if (removedPanelId === modalId) {
            resolve("dismissed");
            this._dockviewController!.onPanelRemoved$.subscribe(
              handlePanelRemoved,
            ).unsubscribe();
          }
        };

        this._dockviewController!.onPanelRemoved$.subscribe(handlePanelRemoved);
      });
    } catch (error) {
      console.error("DockViewModalManager: Error creating modal panel:", error);
      return Promise.resolve("dismissed");
    }
  }

  /**
   * Calculates a default centered position for the modal panel.
   */
  private calculateDefaultPosition(options: DockViewModalOptions): {
    top: number;
    left: number;
    width: number;
    height: number;
  } {
    const width = options.width || 450;
    const height = options.height || 300;

    // Center the modal on screen
    const top = Math.max(50, (window.innerHeight - height) / 2);
    const left = Math.max(50, (window.innerWidth - width) / 2);

    return { top, left, width, height };
  }

  /**
   * Cleans up the manager
   */
  public dispose(): void {
    this._dockviewController = null;
    this.isInitialized = false;
  }
}
