import type { DockviewPanelApi } from "dockview-core";
import type {
  ModalPanelOptions,
  ModalResult,
} from "../view/modal-panel.component";

/**
 * Controller for the DockView modal panel that handles all business logic,
 * button interactions, and content management.
 */
export class ModalPanelController {
  private shadowRoot: ShadowRoot;
  private panelApi: DockviewPanelApi;
  private modalPanel: any; // Reference to the modal panel component

  // DOM element references
  private titleElement: HTMLElement | null = null;
  private confirmButton: HTMLButtonElement | null = null;
  private closeButton: HTMLButtonElement | null = null;
  private secondaryButton: HTMLButtonElement | null = null;
  private contentSlot: HTMLSlotElement | null = null;

  constructor(
    shadowRoot: ShadowRoot,
    panelApi: DockviewPanelApi,
    modalPanel?: any,
  ) {
    this.shadowRoot = shadowRoot;
    this.panelApi = panelApi;
    this.modalPanel = modalPanel;
    this.initializeElements();
    this.setupEventListeners();
  }

  /**
   * Initializes the modal with the given options.
   */
  public initialize(options: ModalPanelOptions): void {
    console.log("ModalPanelController: initialize() called");
    this.updateTitle(options.title);
    this.updateContent(options.content);
    this.updateButtons(options);
    console.log("ModalPanelController: initialize() completed");
  }

  /**
   * Closes the modal with the specified result.
   */
  public close(result: ModalResult): void {
    console.log("ModalPanelController: close() called with result:", result);

    // Resolve the promise directly through the modal panel
    if (this.modalPanel && this.modalPanel._resolvePromise) {
      console.log(
        "ModalPanelController: Resolving promise with result:",
        result,
      );
      this.modalPanel._resolvePromise(result);
      this.modalPanel._resolvePromise = undefined;
    } else {
      console.log("ModalPanelController: No _resolvePromise available");
    }

    // Close the panel only if it's still valid
    try {
      if (this.panelApi && typeof this.panelApi.close === "function") {
        this.panelApi.close();
      }
    } catch (error) {
      console.debug(
        "ModalPanelController: Panel already closed or invalid:",
        error,
      );
    }
  }

  /**
   * Cleans up resources when the controller is disposed.
   */
  public dispose(): void {
    console.log("ModalPanelController: dispose() called");
  }

  /**
   * Initializes DOM element references.
   */
  private initializeElements(): void {
    this.titleElement = this.shadowRoot.getElementById("modal-title");
    this.confirmButton = this.shadowRoot.getElementById(
      "confirm-button",
    ) as HTMLButtonElement;
    this.closeButton = this.shadowRoot.getElementById(
      "close-button",
    ) as HTMLButtonElement;
    this.secondaryButton = this.shadowRoot.getElementById(
      "secondary-button",
    ) as HTMLButtonElement;
    this.contentSlot = this.shadowRoot.querySelector(
      'slot[name="content"]',
    ) as HTMLSlotElement;
  }

  /**
   * Sets up event listeners for button interactions.
   */
  private setupEventListeners(): void {
    console.log("ModalPanelController: Setting up event listeners");
    console.log("ModalPanelController: confirmButton:", this.confirmButton);
    console.log("ModalPanelController: closeButton:", this.closeButton);
    console.log("ModalPanelController: secondaryButton:", this.secondaryButton);

    this.confirmButton?.addEventListener("click", () => {
      console.log("ModalPanelController: Confirm button clicked");
      this.close("confirm");
    });

    this.closeButton?.addEventListener("click", () => {
      console.log("ModalPanelController: Close button clicked");
      this.close("close");
    });

    this.secondaryButton?.addEventListener("click", () => {
      console.log("ModalPanelController: Secondary button clicked");
      this.close("secondary");
    });

    // Handle escape key
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  /**
   * Handles keyboard events for the modal.
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      this.close("close");
    }
  }

  /**
   * Updates the modal title.
   */
  private updateTitle(title: string): void {
    if (this.titleElement) {
      this.titleElement.textContent = title;
    }
  }

  /**
   * Updates the modal content.
   */
  private updateContent(content: string | HTMLElement): void {
    if (!this.contentSlot) return;

    // Clear existing content
    const assignedElements = this.contentSlot.assignedElements();
    assignedElements.forEach((el) => el.remove());

    if (typeof content === "string") {
      const contentElement = document.createElement("div");
      contentElement.slot = "content";
      contentElement.innerHTML = content;
      this.shadowRoot.host.appendChild(contentElement);
    } else {
      content.slot = "content";
      this.shadowRoot.host.appendChild(content);
    }
  }

  /**
   * Updates button visibility and text based on options.
   */
  private updateButtons(options: ModalPanelOptions): void {
    // Update button text
    if (options.confirmText && this.confirmButton) {
      this.confirmButton.textContent = options.confirmText;
    }

    if (options.closeText && this.closeButton) {
      this.closeButton.textContent = options.closeText;
    }

    if (options.secondaryText && this.secondaryButton) {
      this.secondaryButton.textContent = options.secondaryText;
    }

    // Update button visibility
    if (options.hideConfirmButton && this.confirmButton) {
      this.confirmButton.classList.add("hidden");
    }

    if (options.hideCloseButton && this.closeButton) {
      this.closeButton.classList.add("hidden");
    }

    if (options.hideSecondaryButton && this.secondaryButton) {
      this.secondaryButton.classList.add("hidden");
    }
  }
}
