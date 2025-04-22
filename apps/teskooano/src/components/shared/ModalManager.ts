import type {
  DockviewController,
  ModalResult,
} from "../../controllers/dockviewController"; // Import controller type
import { TeskooanoModal } from "./Modal"; // Import for the TeskooanoModal web component class

export interface ModalOptions {
  id?: string;
  title: string;
  content: string | HTMLElement;
  width?: number;
  height?: number;
  confirmText?: string;
  closeText?: string;
  secondaryText?: string;
  hideCloseButton?: boolean;
  hideConfirmButton?: boolean;
  hideSecondaryButton?: boolean;
}

/**
 * Manages the creation and interaction of modal dialogs using Dockview overlays
 * and the TeskooanoModal web component.
 */
export class ModalManager {
  private _dockviewController: DockviewController; // Store controller

  /**
   * Create a new ModalManager
   * @param dockviewController The DockviewController instance
   */
  constructor(dockviewController: DockviewController) {
    this._dockviewController = dockviewController;
  }

  /**
   * Shows a modal dialog with the specified options
   * @param options Modal configuration options
   * @returns Promise that resolves with the action taken
   */
  public show(options: ModalOptions): Promise<ModalResult> {
    // Use the controller's showOverlay method
    const modalId =
      options.id ||
      `modal-overlay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const width = options.width || 450;
    const height = options.height || 250;

    // --- Create the TeskooanoModal element ---
    const modalElement = new TeskooanoModal();
    modalElement.style.width = "100%";
    modalElement.style.height = "100%";

    // Configure the modal element based on options
    try {
      if (options.title) {
        modalElement.setAttribute("title", options.title);
      }
      if (options.content) {
        modalElement.setContent(options.content);
      }
      if (options.confirmText) {
        modalElement.setAttribute("confirm-text", options.confirmText);
      }
      if (options.closeText) {
        modalElement.setAttribute("close-text", options.closeText);
      }
      if (options.secondaryText) {
        modalElement.setAttribute("secondary-text", options.secondaryText);
      }
      if (options.hideCloseButton) {
        modalElement.setAttribute("hide-close-button", "");
      }
      if (options.hideConfirmButton) {
        modalElement.setAttribute("hide-confirm-button", "");
      }
      if (
        options.hideSecondaryButton === undefined ||
        options.hideSecondaryButton === true
      ) {
        // Default to hiding secondary if undefined or explicitly true
        modalElement.setAttribute("hide-secondary-button", "");
      }
    } catch (error) {
      console.error("ModalManager: Error configuring modal element:", error);
      // Return a rejected promise or a promise resolved with 'dismissed'
      return Promise.resolve("dismissed"); // Or Promise.reject(error)
    }

    // --- Add event listeners to the modal element ---
    // These listeners will call the controller's hideOverlay method
    const handleConfirm = () =>
      this._dockviewController.hideOverlay(modalId, "confirm");
    const handleClose = () =>
      this._dockviewController.hideOverlay(modalId, "close");
    const handleSecondary = () =>
      this._dockviewController.hideOverlay(modalId, "secondary");

    modalElement.addEventListener("modal-confirm", handleConfirm);
    modalElement.addEventListener("modal-close", handleClose);
    modalElement.addEventListener("modal-additional", handleSecondary);

    // --- Show the overlay using the controller ---
    const overlayPromise = this._dockviewController.showOverlay(
      modalId,
      modalElement,
      { width, height },
    );

    // --- Cleanup listeners when the overlay promise resolves/rejects ---
    overlayPromise.finally(() => {
      console.log(`ModalManager: Cleaning up listeners for ${modalId}`);
      modalElement.removeEventListener("modal-confirm", handleConfirm);
      modalElement.removeEventListener("modal-close", handleClose);
      modalElement.removeEventListener("modal-additional", handleSecondary);
    });

    return overlayPromise;
  }

  /**
   * Cleans up all active modals (delegates to controller)
   */
  public dispose(): void {
    // Controller handles overlay disposal now
    // If ModalManager had other resources, dispose them here
    console.log("ModalManager: Dispose called. Controller handles overlays.");
  }
}
