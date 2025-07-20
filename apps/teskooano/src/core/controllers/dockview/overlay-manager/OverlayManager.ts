import {
  type ActiveOverlay,
  type ModalResult,
  type OverlayOptions,
} from "../types/index";
import { ModalPanel } from "../../../components/modal";

/**
 * Manages modal-like overlays within a Dockview container.
 * Handles creation, positioning, display, and disposal of overlays.
 */
export class OverlayManager {
  private _overlayContainer: HTMLElement;
  private _activeOverlays: Map<string, ActiveOverlay> = new Map();

  /**
   * Creates an instance of OverlayManager.
   * @param container - The root HTML element that will contain the overlays.
   */
  constructor(container: HTMLElement) {
    this._overlayContainer = container;
  }

  /**
   * Shows a modal-like overlay centered in the Dockview container.
   * @param id Unique ID for this overlay instance.
   * @param content The HTML element to display within the overlay.
   * @param options Configuration for the modal.
   * @returns A promise that resolves with the result when the overlay is hidden.
   */
  public async showOverlay(
    id: string,
    content: HTMLElement,
    options: OverlayOptions,
  ): Promise<ModalResult> {
    if (this._activeOverlays.has(id)) {
      console.warn(`OverlayManager: Overlay with ID ${id} already shown.`);
      // Immediately resolve if the modal is already open
      return Promise.resolve("dismissed");
    }

    const modal = new ModalPanel();
    this._overlayContainer.appendChild(modal);

    const promise = modal.show({
      title: options.title,
      content,
      confirmText: options.confirmText,
      closeText: options.closeText,
      secondaryText: options.secondaryText,
      hideSecondaryButton: options.hideSecondaryButton,
    });

    // Store a reference to the modal so we can potentially interact with it later
    // For now, the modal manages its own lifecycle.
    this._activeOverlays.set(id, { element: modal });

    // The modal's promise will resolve when it's closed.
    // We also need to clean up our registry when it closes.
    return promise.finally(() => {
      this._activeOverlays.delete(id);
    });
  }

  /**
   * Hides an overlay and resolves the promise with the result.
   * @param id The ID of the overlay to hide.
   * @param result The result to resolve the promise with.
   */
  public hideOverlay(id: string, result: ModalResult): void {
    const overlay = this._activeOverlays.get(id);
    if (overlay) {
      (overlay.element as ModalPanel).close(result);
    }
  }

  /**
   * Hides and disposes all active overlays.
   */
  public dispose(): void {
    this._activeOverlays.forEach((activeOverlay) => {
      // Assuming modal component has a 'close' method that removes it
      if (typeof (activeOverlay.element as any).close === "function") {
        (activeOverlay.element as any).close("dismissed");
      }
    });
    this._activeOverlays.clear();
  }
}
