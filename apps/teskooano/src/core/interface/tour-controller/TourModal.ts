import type { TeskooanoModalManager } from "../../components/modal";
import type { ModalResult } from "../../controllers/dockview/types";

/**
 * A custom element that acts as a trigger to show the initial tour prompt modal.
 * It relies on a static ModalManager instance being injected.
 */
export class TeskooanoTourModal extends HTMLElement {
  private static modalManager: TeskooanoModalManager | null = null;

  private onAccept: (() => void) | null = null;
  private onDecline: (() => void) | null = null;
  private modalShown = false;

  /**
   * Injects the ModalManager instance required to show the modal.
   * This should be called once during application setup.
   * @param manager The ModalManager instance.
   */
  static setModalManager(manager: TeskooanoModalManager): void {
    TeskooanoTourModal.modalManager = manager;
  }

  /**
   * Sets the callback functions for the modal actions.
   * @param onAccept Function to call when the user accepts the tour.
   * @param onDecline Function to call when the user declines the tour.
   */
  public setCallbacks(onAccept: () => void, onDecline: () => void): void {
    this.onAccept = onAccept;
    this.onDecline = onDecline;
    this.showModalIfNeeded();
  }

  connectedCallback(): void {
    this.showModalIfNeeded();
  }

  private async showModalIfNeeded(): Promise<void> {
    if (
      !TeskooanoTourModal.modalManager ||
      !this.onAccept ||
      !this.onDecline ||
      !this.isConnected ||
      this.modalShown
    ) {
      return;
    }

    this.modalShown = true;

    try {
      const result: ModalResult = await TeskooanoTourModal.modalManager.show({
        id: "tour-prompt-modal",
        title: "Welcome to Teskooano!",
        content: `<p>Would you like to take a quick tour of the interface?</p>
                  <p><small>You can restart the tour later from the help menu.</small></p>`,
        confirmText: "Start Tour",
        closeText: "Maybe Later",
        hideSecondaryButton: true,
        width: 400,
        height: 220,
      });

      if (result === "confirm") {
        this.onAccept();
      } else {
        this.onDecline();
      }
    } catch (error) {
      console.error("Error showing tour modal:", error);

      if (this.onDecline) {
        this.onDecline();
      }
    } finally {
      this.remove();
    }
  }
}

const ELEMENT_TAG = "teskooano-tour-modal";
if (!customElements.get(ELEMENT_TAG)) {
  customElements.define(ELEMENT_TAG, TeskooanoTourModal);
}
