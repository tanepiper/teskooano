import type { DockviewPanelApi } from "dockview-core";
import { createComponentState, Events } from "@teskooano/ui-plugin/patterns";
import type {
  ModalPanelOptions,
  ModalResult,
} from "../view/modal-panel.component";

/**
 * Controller for the DockView modal panel that handles all business logic,
 * button interactions, and content management using reactive state patterns.
 */
export class ModalPanelController {
  private shadowRoot: ShadowRoot;
  private panelApi: DockviewPanelApi;
  private modalPanel: any; // Reference to the modal panel component
  private state: any; // Enhanced state with emit and cleanup methods

  // DOM element references
  private titleElement: HTMLElement | null = null;
  private confirmButton: HTMLButtonElement | null = null;
  private closeButton: HTMLButtonElement | null = null;
  private secondaryButton: HTMLButtonElement | null = null;

  constructor(
    shadowRoot: ShadowRoot,
    panelApi: DockviewPanelApi,
    modalPanel?: any,
  ) {
    this.shadowRoot = shadowRoot;
    this.panelApi = panelApi;
    this.modalPanel = modalPanel;

    // Initialize reactive state
    this.state = createComponentState(
      {
        title: "",
        content: null as string | HTMLElement | null,
        confirmText: "Confirm",
        closeText: "Cancel",
        secondaryText: "Secondary",
        hideConfirmButton: false,
        hideCloseButton: false,
        hideSecondaryButton: true, // Hidden by default
        isVisible: false,
      },
      {
        componentName: "modal-panel-controller",
      },
    );

    // Add computed properties
    this.state.computed("hasContent", {
      deps: ["content"],
      compute: (content: string | HTMLElement | null) => content !== null,
    });

    this.state.computed("shouldShowConfirm", {
      deps: ["hideConfirmButton"],
      compute: (hideConfirmButton: boolean) => !hideConfirmButton,
    });

    this.state.computed("shouldShowClose", {
      deps: ["hideCloseButton"],
      compute: (hideCloseButton: boolean) => !hideCloseButton,
    });

    this.state.computed("shouldShowSecondary", {
      deps: ["hideSecondaryButton"],
      compute: (hideSecondaryButton: boolean) => !hideSecondaryButton,
    });

    this.initializeElements();
    this.setupEventListeners();
    this.setupStateWatchers();
  }

  /**
   * Initializes the modal with the given options.
   */
  public initialize(options: ModalPanelOptions): void {
    console.log(
      "ModalPanelController: initialize() called with options:",
      options,
    );

    // Update state with new options
    this.state.update({
      title: options.title,
      content: options.content,
      confirmText: options.confirmText || "Confirm",
      closeText: options.closeText || "Cancel",
      secondaryText: options.secondaryText || "Secondary",
      hideConfirmButton: options.hideConfirmButton || false,
      hideCloseButton: options.hideCloseButton || false,
      hideSecondaryButton: options.hideSecondaryButton !== false, // Default to true
      isVisible: true,
    });

    // Ensure all UI elements are properly initialized with proper timing
    this.ensureUIInitialized(options);

    console.log("ModalPanelController: initialize() completed");
  }

  /**
   * Closes the modal with the specified result.
   */
  public close(result: ModalResult): void {
    console.log("ModalPanelController: close() called with result:", result);

    // Update state to reflect closing
    this.state.set("isVisible", false);

    // Emit panel closed event with the actual panel ID
    this.state.emit(Events.PANEL_CLOSED, {
      panelId: this.panelApi.id || "modal-panel",
      state: "closed",
      source: "modal-panel-controller",
    });

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
   * Gets the panel ID for CSS targeting and external access.
   */
  public getPanelId(): string | undefined {
    return this.panelApi.id;
  }

  /**
   * Cleans up resources when the controller is disposed.
   */
  public dispose(): void {
    console.log("ModalPanelController: dispose() called");
    this.state.cleanup();
    document.removeEventListener("keydown", this.handleKeyDown.bind(this));
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
  }

  /**
   * Sets up event listeners for button interactions.
   */
  private setupEventListeners(): void {
    console.log("ModalPanelController: Setting up event listeners");

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
   * Sets up reactive state watchers for automatic UI updates.
   */
  private setupStateWatchers(): void {
    // Update title when it changes
    this.state.watch("title", (title: string) => {
      if (this.titleElement) {
        this.titleElement.textContent = title;
      }
    });

    // Update content when it changes
    this.state.watch("content", (content: string | HTMLElement | null) => {
      console.log("ModalPanelController: Content state changed:", content);
      this.updateContent(content);
    });

    // Update button text
    this.state.watch("confirmText", (text: string) => {
      if (this.confirmButton) {
        this.confirmButton.textContent = text;
      }
    });

    this.state.watch("closeText", (text: string) => {
      if (this.closeButton) {
        this.closeButton.textContent = text;
      }
    });

    this.state.watch("secondaryText", (text: string) => {
      if (this.secondaryButton) {
        this.secondaryButton.textContent = text;
      }
    });

    // Update button visibility
    this.state.watch("shouldShowConfirm", (shouldShow: boolean) => {
      if (this.confirmButton) {
        this.confirmButton.classList.toggle("hidden", !shouldShow);
      }
    });

    this.state.watch("shouldShowClose", (shouldShow: boolean) => {
      if (this.closeButton) {
        this.closeButton.classList.toggle("hidden", !shouldShow);
      }
    });

    this.state.watch("shouldShowSecondary", (shouldShow: boolean) => {
      if (this.secondaryButton) {
        this.secondaryButton.classList.toggle("hidden", !shouldShow);
      }
    });
  }

  /**
   * Handles keyboard events for the modal.
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape" && this.state.get("isVisible")) {
      this.close("close");
    }
  }

  /**
   * Updates the modal content using reactive state.
   */
  private updateContent(content: string | HTMLElement | null): void {
    if (!content) return;

    // The content needs to be added to the host element (the modal panel itself)
    // so it can be distributed to the named slot
    const hostElement = this.shadowRoot.host as HTMLElement;

    // Clear existing slotted content
    const existingContent = hostElement.querySelectorAll('[slot="content"]');
    existingContent.forEach((el) => el.remove());

    if (typeof content === "string") {
      const contentElement = document.createElement("div");
      contentElement.slot = "content";
      contentElement.innerHTML = content;
      hostElement.appendChild(contentElement);
    } else if (content instanceof HTMLElement) {
      content.slot = "content";
      hostElement.appendChild(content);
    }

    console.log(
      "ModalPanelController: Content updated, slotted elements:",
      hostElement.querySelectorAll('[slot="content"]').length,
    );
  }

  /**
   * Ensures all UI elements (content, buttons, title) are properly initialized.
   */
  private ensureUIInitialized(options: ModalPanelOptions): void {
    // Immediate initialization
    this.updateContent(options.content);
    this.updateButtonText(options);
    this.updateButtonVisibility(options);

    if (this.titleElement) {
      this.titleElement.textContent = options.title;
    }

    // Fallback with proper timing to ensure DOM is ready
    requestAnimationFrame(() => {
      this.updateContent(options.content);
      this.updateButtonText(options);
      this.updateButtonVisibility(options);

      if (this.titleElement) {
        this.titleElement.textContent = options.title;
      }

      // Additional debugging
      const hostElement = this.shadowRoot.host as HTMLElement;
      const slottedElements = hostElement.querySelectorAll('[slot="content"]');
      console.log(
        "ModalPanelController: After requestAnimationFrame, slotted elements:",
        slottedElements.length,
      );
      console.log(
        "ModalPanelController: Button text - Confirm:",
        this.confirmButton?.textContent,
        "Close:",
        this.closeButton?.textContent,
      );
    });
  }

  /**
   * Updates button text based on options.
   */
  private updateButtonText(options: ModalPanelOptions): void {
    if (this.confirmButton && options.confirmText) {
      this.confirmButton.textContent = options.confirmText;
    }

    if (this.closeButton && options.closeText) {
      this.closeButton.textContent = options.closeText;
    }

    if (this.secondaryButton && options.secondaryText) {
      this.secondaryButton.textContent = options.secondaryText;
    }
  }

  /**
   * Updates button visibility based on options.
   */
  private updateButtonVisibility(options: ModalPanelOptions): void {
    if (this.confirmButton) {
      this.confirmButton.classList.toggle(
        "hidden",
        !!options.hideConfirmButton,
      );
    }

    if (this.closeButton) {
      this.closeButton.classList.toggle("hidden", !!options.hideCloseButton);
    }

    if (this.secondaryButton) {
      this.secondaryButton.classList.toggle(
        "hidden",
        options.hideSecondaryButton !== false,
      );
    }
  }
}
