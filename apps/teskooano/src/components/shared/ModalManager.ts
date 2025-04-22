import type {
  DockviewApi,
  IDockviewPanel,
  IContentRenderer,
  GroupPanelPartInitParameters,
} from "dockview-core";
import type { DockviewController } from "../../controllers/dockviewController"; // Import controller type
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

export type ModalResult = "confirm" | "close" | "secondary" | "dismissed";

/**
 * Modal content renderer class for DockView.
 * Initializes the TeskooanoModal element with parameters passed from ModalManager.
 */
class ModalContentRenderer implements IContentRenderer {
  private readonly _element: HTMLElement;
  private _modalElement: TeskooanoModal; // Use specific type

  get element(): HTMLElement {
    return this._element;
  }

  get modalElement(): TeskooanoModal {
    return this._modalElement;
  }

  constructor() {
    console.log("ModalContentRenderer: Constructor called");
    this._element = document.createElement("div");
    this._element.style.width = "100%";
    this._element.style.height = "100%";
    this._element.style.overflow = "hidden";

    // Instantiate modal element first
    this._modalElement = new TeskooanoModal();

    try {
      // Style and append inside try
      this._modalElement.style.width = "100%";
      this._modalElement.style.height = "100%";
      this._element.appendChild(this._modalElement);
      console.log(
        "ModalContentRenderer: TeskooanoModal element styled and appended.",
      );
    } catch (error) {
      console.error(
        "ModalContentRenderer: Error during constructor element styling/appending:",
        error,
      );
      const errorMsg = error instanceof Error ? error.message : String(error);
      this._element.textContent = `Error creating modal content: ${errorMsg}`;
      this._element.style.color = "red";
    }
  }

  // Receives params passed from addPanel
  init(parameters: GroupPanelPartInitParameters): void {
    console.log(
      "ModalContentRenderer: Init called with params:",
      parameters.params,
    );
    try {
      const params = parameters.params as Partial<ModalOptions>;

      if (params.title) {
        this._modalElement.setAttribute("title", params.title);
      }
      if (params.content) {
        this._modalElement.setContent(params.content);
      }
      if (params.confirmText) {
        this._modalElement.setAttribute("confirm-text", params.confirmText);
      }
      if (params.closeText) {
        this._modalElement.setAttribute("close-text", params.closeText);
      }
      if (params.secondaryText) {
        this._modalElement.setAttribute("secondary-text", params.secondaryText);
      }
      if (params.hideCloseButton) {
        this._modalElement.setAttribute("hide-close-button", "");
      }
      if (params.hideConfirmButton) {
        this._modalElement.setAttribute("hide-confirm-button", "");
      }
      if (params.hideSecondaryButton) {
        this._modalElement.setAttribute("hide-secondary-button", "");
      }
      console.log("ModalContentRenderer: Init completed successfully.");
    } catch (error) {
      console.error("ModalContentRenderer: Error during init:", error);
      // Update element to show error
      const errorMsg = error instanceof Error ? error.message : String(error);
      this._element.textContent = `Error initializing modal content: ${errorMsg}`;
      this._element.style.color = "red";
    }
  }
}

/**
 * Manages the creation and interaction of modal dialogs using Dockview panels
 * and the TeskooanoModal web component.
 */
export class ModalManager {
  private _dockviewController: DockviewController; // Store controller
  private _dockviewContainer: HTMLElement; // Store the container element
  private _activeModals: Map<
    string,
    {
      panel: IDockviewPanel;
      modalElement: TeskooanoModal; // Store the element directly
      resolve: (value: ModalResult) => void;
      reject: (reason?: any) => void;
    }
  > = new Map();
  private static readonly MODAL_COMPONENT_NAME = "modal-content-renderer";

  /**
   * Create a new ModalManager
   * @param dockviewController The DockviewController instance
   * @param dockviewContainer The HTML element that Dockview is mounted within
   */
  constructor(
    dockviewController: DockviewController,
    dockviewContainer: HTMLElement,
  ) {
    this._dockviewController = dockviewController;
    this._dockviewContainer = dockviewContainer; // Store the container

    // Register our modal component renderer with the controller
    this._dockviewController.registerComponent(
      ModalManager.MODAL_COMPONENT_NAME,
      ModalContentRenderer,
    );
  }

  /**
   * Shows a modal dialog with the specified options
   * @param options Modal configuration options
   * @returns Promise that resolves with the action taken
   */
  public show(options: ModalOptions): Promise<ModalResult> {
    return new Promise((resolve, reject) => {
      const panelId =
        options.id ||
        `modal-panel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // Check if modal with this ID already exists
      const existingModal = this._activeModals.get(panelId);
      if (existingModal) {
        console.warn(`Modal with ID ${panelId} already exists. Activating.`);
        const panelApi = existingModal.panel as any; // Type assertion workaround
        if (panelApi.api && typeof panelApi.api.setActive === "function") {
          panelApi.api.setActive();
        }
        return;
      }

      const width = options.width || 450;
      const height = options.height || 250;

      // Prepare params to pass to the renderer via Dockview
      const modalParams: Partial<ModalOptions> = { ...options };
      // Ensure secondary button hidden state is explicitly passed if not provided (default hide)
      if (options.hideSecondaryButton === undefined) {
        modalParams.hideSecondaryButton = true;
      }

      // --- Calculate position relative to Dockview container's internal scroll area ---
      const containerRect = this._dockviewContainer.getBoundingClientRect(); // Still useful for dimensions
      const containerScrollTop = this._dockviewContainer.scrollTop;
      const containerScrollLeft = this._dockviewContainer.scrollLeft;

      // Calculate desired top-left based on container dimensions only
      const desiredTop = containerRect.height / 2 - height / 2;
      const desiredLeft = containerRect.width / 2 - width / 2;

      // Add scroll offset to position relative to the scrolled origin
      const top = Math.max(0, desiredTop + containerScrollTop);
      const left = Math.max(0, desiredLeft + containerScrollLeft);

      // Log calculated values relative to container
      console.log(
        `ModalManager: Container Rect - width: ${containerRect.width}, height: ${containerRect.height}, scrollTop: ${containerScrollTop}, scrollLeft: ${containerScrollLeft}`,
      );
      console.log(
        `ModalManager: Calculated position (relative to container scroll origin) - top: ${top}, left: ${left}`,
      );

      // Create the panel using the controller
      const panel = this._dockviewController.addPanel({
        id: panelId,
        component: ModalManager.MODAL_COMPONENT_NAME,
        params: modalParams, // Pass options as params
        floating: {
          position: {
            // Use nested position
            top: top, // Use calculated top
            left: left, // Use calculated left
          },
          width,
          height,
        },
      });

      // --- Get the modal element (asynchronously) ---
      // Use setTimeout to allow Dockview time to fully initialize the panel content
      setTimeout(() => {
        let modalElement: TeskooanoModal | null = null;
        const panelApi = panel as any; // Keep type assertion for now

        // --- Attempt 1: Access via Group's Element ---
        try {
          const group = panelApi.group; // Access the group model/api via the panel
          if (group && group.element) {
            // Check if group and its element exist
            console.log(
              "ModalManager: Attempting querySelector on group's element (delayed)",
            );
            modalElement = group.element.querySelector(
              "teskooano-modal",
            ) as TeskooanoModal;
            if (modalElement) {
              console.log(
                "ModalManager: Found modalElement via group.element.querySelector",
              );
            }
          } else {
            console.log(
              "ModalManager: panelApi.group or group.element not found.",
            );
          }
        } catch (e) {
          console.error("ModalManager: Error accessing group or elements:", e);
        }

        // --- Attempt 2: Fallback to Panel's Element ---
        if (!modalElement) {
          const panelElement = panelApi.element; // Direct element of the panel view
          if (panelElement) {
            console.log(
              "ModalManager: Attempting querySelector on panel.element as fallback (delayed)",
            );
            modalElement = panelElement.querySelector(
              "teskooano-modal",
            ) as TeskooanoModal;
            if (modalElement) {
              console.log(
                "ModalManager: Found modalElement via panel.element.querySelector",
              );
            }
          } else {
            console.log(
              "ModalManager: panelApi.element not found for fallback querySelector.",
            );
          }
        }

        // --- Attempt 3: Fallback to original component instance check (Less reliable) ---
        if (!modalElement) {
          const panelContent = panelApi.content as ModalContentRenderer;
          if (
            panelContent &&
            typeof panelContent.modalElement === "object" &&
            panelContent.modalElement instanceof HTMLElement
          ) {
            console.log(
              "ModalManager: Found modalElement via panel.content.modalElement (fallback)",
            );
            modalElement = panelContent.modalElement;
          }
        }

        // Check if we found the element either way
        if (modalElement) {
          console.log(
            "ModalManager: Modal element obtained. Setting up interaction.",
          );
          this.setupModalInteraction(
            panelId,
            panel,
            modalElement,
            resolve,
            reject,
          );
        } else {
          console.error(
            `ModalManager: Could not find teskooano-modal within panel ${panelId} after delay (checked group/panel elements and content).`,
          );
          reject(new Error(`Could not find modal content for ${panelId}`));
          // Clean up panel
          // Use optional chaining for safety as api might not exist if panel creation failed early
          panelApi.api?.close();
          return;
        }
      }, 0); // Use a minimal delay
    });
  }

  /**
   * Helper method to store modal data and add event listeners
   */
  private setupModalInteraction(
    panelId: string,
    panel: IDockviewPanel,
    modalElement: TeskooanoModal,
    resolve: (value: ModalResult) => void,
    reject: (reason?: any) => void,
  ) {
    // Store the modal in our active modals map
    this._activeModals.set(panelId, {
      panel,
      modalElement, // Store element directly
      resolve,
      reject,
    });

    // Add event listeners
    const handleConfirm = () => this._resolveModal(panelId, "confirm");
    const handleClose = () => this._resolveModal(panelId, "close");
    const handleSecondary = () => this._resolveModal(panelId, "secondary");

    modalElement.addEventListener("modal-confirm", handleConfirm);
    modalElement.addEventListener("modal-close", handleClose);
    modalElement.addEventListener("modal-additional", handleSecondary);

    // Handle panel closing
    const panelApi = panel as any; // Type assertion workaround
    if (typeof panelApi.onDidClose === "function") {
      panelApi.onDidClose(() => {
        if (this._activeModals.has(panelId)) {
          // Remove event listeners first
          modalElement.removeEventListener("modal-confirm", handleConfirm);
          modalElement.removeEventListener("modal-close", handleClose);
          modalElement.removeEventListener("modal-additional", handleSecondary);

          // Resolve as dismissed
          this._resolveModal(panelId, "dismissed");
        }
      });
    }

    // Activate the panel
    if (panelApi.api && typeof panelApi.api.setActive === "function") {
      panelApi.api.setActive();
    }
  }

  /**
   * Resolves the promise for a specific modal and cleans up
   */
  private _resolveModal(panelId: string, result: ModalResult): void {
    const modalData = this._activeModals.get(panelId);
    if (!modalData) return; // Already resolved or doesn't exist

    console.log(
      `ModalManager: Resolving modal ${panelId} with result: ${result}`,
    );

    // Resolve the promise
    modalData.resolve(result);

    // Close the panel only if it wasn't a dismissal (already closed)
    if (result !== "dismissed") {
      // Workaround for API type issue
      const panelApi = modalData.panel as any;
      if (panelApi.api && typeof panelApi.api.close === "function") {
        panelApi.api.close();
      }
    }

    // Remove from active modals map
    this._activeModals.delete(panelId);
  }

  /**
   * Cleans up all active modals
   */
  public dispose(): void {
    this._activeModals.forEach((modalData, panelId) => {
      console.warn(
        `ModalManager: Closing unresolved modal ${panelId} during dispose.`,
      );
      this._resolveModal(panelId, "dismissed");
    });
    this._activeModals.clear();
  }
}
