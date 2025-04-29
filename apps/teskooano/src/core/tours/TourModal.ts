import type { ModalManager, ModalResult } from "../shared/ModalManager";

/**
 * A custom element that acts as a trigger to show the initial tour prompt modal.
 * It relies on a static ModalManager instance being injected.
 */
export class TeskooanoTourModal extends HTMLElement {
  private static modalManager: ModalManager | null = null;

  private onAccept: (() => void) | null = null;
  private onDecline: (() => void) | null = null;
  private modalShown = false;

  /**
   * Injects the ModalManager instance required to show the modal.
   * This should be called once during application setup.
   * @param manager The ModalManager instance.
   */
  static setModalManager(manager: ModalManager): void {
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
    this.showModalIfNeeded(); // Attempt to show modal now that callbacks are set
  }

  connectedCallback(): void {
    // Attempt to show the modal as soon as the element is connected
    // and potentially callbacks are already set.
    this.showModalIfNeeded();
  }

  private async showModalIfNeeded(): Promise<void> {
    // Ensure manager exists, callbacks are set, element is in DOM, and modal hasn't been shown
    if (
      !TeskooanoTourModal.modalManager ||
      !this.onAccept ||
      !this.onDecline ||
      !this.isConnected ||
      this.modalShown
    ) {
      return;
    }

    this.modalShown = true; // Prevent showing multiple times

    try {
      const result: ModalResult = await TeskooanoTourModal.modalManager.show({
        id: "tour-prompt-modal", // Give it a specific ID
        title: "Welcome to Teskooano!",
        content: `<p>Would you like to take a quick tour of the interface?</p>
                  <p><small>You can restart the tour later from the help menu.</small></p>`, // HTML content
        confirmText: "Start Tour",
        closeText: "Maybe Later",
        hideSecondaryButton: true, // Only need Confirm (Start) and Close (Later)
        width: 400,
        height: 220,
      });

      // Handle the result
      if (result === "confirm") {
        this.onAccept();
      } else {
        // 'close' or 'dismissed' treated as decline
        this.onDecline();
      }
    } catch (error) {
      console.error("Error showing tour modal:", error);
      // Optionally call decline if there was an error showing the modal
      if (this.onDecline) {
        this.onDecline();
      }
    } finally {
      // Remove this trigger element from the DOM after the modal is handled
      this.remove();
    }
  }
}

// Define the custom element
const ELEMENT_TAG = "teskooano-tour-modal";
if (!customElements.get(ELEMENT_TAG)) {
  customElements.define(ELEMENT_TAG, TeskooanoTourModal);
}
