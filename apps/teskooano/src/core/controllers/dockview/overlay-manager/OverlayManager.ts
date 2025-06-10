import { Overlay } from "dockview-core/dist/esm/overlay/overlay";
import { ActiveOverlay, ModalResult, OverlayOptions } from "../types";

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

    this._overlayContainer.style.position = "relative";
  }

  /**
   * Shows a modal-like overlay centered in the Dockview container.
   * @param id Unique ID for this overlay instance.
   * @param element The HTML element to display within the overlay.
   * @param options Dimensions for the overlay.
   * @returns A promise that resolves with the result when the overlay is hidden.
   */
  public showOverlay(
    id: string,
    element: HTMLElement,
    options: OverlayOptions,
  ): Promise<ModalResult> {
    return new Promise((resolve) => {
      if (this._activeOverlays.has(id)) {
        console.warn(`OverlayManager: Overlay with ID ${id} already shown.`);
        resolve("dismissed");
        return;
      }

      const containerRect = this._overlayContainer.getBoundingClientRect();
      const width = options.width;
      const height = options.height;
      const top = Math.max(
        0,
        containerRect.top + containerRect.height / 2 - height / 2,
      );
      const left = Math.max(
        0,
        containerRect.left + containerRect.width / 2 - width / 2,
      );

      try {
        const overlayInstance = new Overlay({
          container: this._overlayContainer,
          content: element,
          top: top,
          left: left,
          width: width,
          height: height,
        });

        const overlayElement = overlayInstance.element as HTMLElement;

        overlayInstance.setVisible(true);
        overlayInstance.bringToFront();

        this._activeOverlays.set(id, {
          overlay: overlayInstance,
          element: overlayElement,
          resolve,
        });
      } catch (error) {
        console.error(`OverlayManager: Failed to create overlay ${id}:`, error);
        resolve("dismissed");
      }
    });
  }

  /**
   * Hides and cleans up a specific overlay.
   * @param id The ID of the overlay to hide.
   * @param result The reason the overlay is being hidden (e.g., 'confirm', 'close').
   */
  public hideOverlay(id: string, result: ModalResult): void {
    const overlayData = this._activeOverlays.get(id);
    if (!overlayData) {
      console.warn(
        `OverlayManager: No active overlay found with ID ${id} to hide.`,
      );
      return;
    }

    try {
      overlayData.overlay.setVisible(false);
      overlayData.overlay.dispose();
    } catch (error) {
      console.error(
        `OverlayManager: Error during overlay cleanup for ${id}:`,
        error,
      );
    }

    overlayData.resolve(result);
    this._activeOverlays.delete(id);
  }

  /**
   * Hides and disposes all active overlays.
   */
  public dispose(): void {
    this._activeOverlays.forEach((_, id) => {
      this.hideOverlay(id, "dismissed");
    });
  }
}
