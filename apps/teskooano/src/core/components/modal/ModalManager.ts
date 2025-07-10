import type { DockviewController } from "../../controllers/dockview";
import type { ModalResult } from "../../controllers/dockview/types/index";
import { TeskooanoModal } from "./Modal";

/**
 * Options for the modal manager.
 */
export interface ModalOptions {
  /**
   * The ID of the modal.
   */
  id?: string;
  /**
   * The title of the modal.
   */
  title: string;
  /**
   * The content of the modal.
   */
  content: string | HTMLElement;
  /**
   * The width of the modal.
   */
  width?: number;
  /**
   * The height of the modal.
   */
  height?: number;
  /**
   * The text for the confirm button.
   */
  confirmText?: string;
  /**
   * The text for the close button.
   */
  closeText?: string;
  /**
   * The text for the secondary button.
   */
  secondaryText?: string;
  /**
   * Whether to hide the close button.
   */
  hideCloseButton?: boolean;
  /**
   * Whether to hide the confirm button.
   */
  hideConfirmButton?: boolean;
  /**
   * Whether to hide the secondary button.
   */
  hideSecondaryButton?: boolean;
}

/**
 * Manages the creation and interaction of modal dialogs using Dockview overlays
 * and the TeskooanoModal web component.
 */
export class TeskooanoModalManager {
  private _dockviewController: DockviewController | null = null;
  private isInitialized = false;

  /**
   * Create a new ModalManager
   * Dependencies are injected via initialize()
   */
  constructor() {}

  /**
   * Initializes the manager with necessary dependencies.
   * @param dockviewController The DockviewController instance.
   */
  public initialize(dockviewController: DockviewController): void {
    if (this.isInitialized) {
      console.warn("ModalManager already initialized.");
      return;
    }
    this._dockviewController = dockviewController;
    this.isInitialized = true;
  }

  /**
   * Shows a modal dialog with the specified options
   * @param options Modal configuration options
   * @returns Promise that resolves with the action taken
   */
  public show(options: ModalOptions): Promise<ModalResult> {
    const modalId =
      options.id ||
      `modal-overlay-${Date.now()}-${performance.now().toString(36).substring(2, 7)}`;

    const width = options.width || 450;
    const height = options.height || 250;

    if (!this.isInitialized || !this._dockviewController) {
      console.error(
        "ModalManager not initialized. Call initialize() before show().",
      );
      return Promise.resolve("dismissed");
    }

    const modalElement = new TeskooanoModal();
    modalElement.style.width = "100%";
    modalElement.style.height = "100%";

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
        modalElement.setAttribute("hide-secondary-button", "");
      }
    } catch (error) {
      console.error("ModalManager: Error configuring modal element:", error);

      return Promise.resolve("dismissed");
    }

    const handleConfirm = () =>
      this._dockviewController!.hideOverlay(modalId, "confirm");
    const handleClose = () =>
      this._dockviewController!.hideOverlay(modalId, "close");
    const handleSecondary = () =>
      this._dockviewController!.hideOverlay(modalId, "secondary");

    modalElement.addEventListener("modal-confirm", handleConfirm);
    modalElement.addEventListener("modal-close", handleClose);
    modalElement.addEventListener("modal-additional", handleSecondary);

    const overlayPromise = this._dockviewController!.showOverlay(
      modalId,
      modalElement,
      {
        width,
        height,
        title: options.title,
        confirmText: options.confirmText,
        closeText: options.closeText,
      },
    );

    overlayPromise.finally(() => {
      modalElement.removeEventListener("modal-confirm", handleConfirm);
      modalElement.removeEventListener("modal-close", handleClose);
      modalElement.removeEventListener("modal-additional", handleSecondary);
    });

    return overlayPromise;
  }

  /**
   * Cleans up all active modals (delegates to controller)
   */
  public dispose(): void {}
}
