import {
  GroupPanelPartInitParameters,
  IContentRenderer,
  DockviewPanelApi,
} from "dockview-core";
import { createComponentState, Events } from "@teskooano/ui-plugin/patterns";
import { modalStyles, modalTemplate } from "./modal-panel.template";
import { ModalPanelController } from "../controller/modal-panel.controller";

export interface ModalPanelOptions {
  title: string;
  content: string | HTMLElement;
  confirmText?: string;
  closeText?: string;
  secondaryText?: string;
  hideCloseButton?: boolean;
  hideConfirmButton?: boolean;
  hideSecondaryButton?: boolean;
  width?: number;
  height?: number;
}

export type ModalResult = "confirm" | "close" | "secondary" | "dismissed";

/**
 * DockView-based modal panel component that replaces the overlay modal system.
 * This component implements IContentRenderer and can be managed through the DockView system.
 * Now uses reactive state patterns for improved state management.
 */
export class ModalPanel extends HTMLElement implements IContentRenderer {
  public static readonly componentName = "teskooano-modal-panel";

  private _panelApi: DockviewPanelApi | undefined;
  private _controller: ModalPanelController | undefined;
  private state: any; // Enhanced reactive state
  public _resolvePromise: ((result: ModalResult) => void) | undefined;

  /**
   * Required by Dockview's IContentRenderer interface.
   */
  get element(): HTMLElement {
    return this;
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Initialize reactive state for panel management
    this.state = createComponentState(
      {
        isInitialized: false,
        isVisible: false,
        currentOptions: null as ModalPanelOptions | null,
      },
      {
        componentName: "modal-panel",
        autoEvents: [
          {
            eventType: Events.PANEL_CLOSED,
            handler: (payload: any) => {
              // Handle panel closed events from other sources
              if (
                payload.panelId === "modal-panel" &&
                payload.source !== "modal-panel-controller"
              ) {
                this.handleExternalClose();
              }
            },
          },
        ],
      },
    );

    // Add computed properties
    this.state.computed("shouldShow", {
      deps: ["isInitialized", "currentOptions"],
      compute: (
        isInitialized: boolean,
        currentOptions: ModalPanelOptions | null,
      ) => {
        return isInitialized && currentOptions !== null;
      },
    });

    // Set up styles and template
    const style = document.createElement("style");
    style.textContent = modalStyles;

    const template = document.createElement("template");
    template.innerHTML = modalTemplate;

    this.shadowRoot!.append(style, template.content.cloneNode(true));

    this.setupStateWatchers();
  }

  /**
   * Dockview lifecycle method called when the panel is initialized.
   */
  init(params: GroupPanelPartInitParameters): void {
    console.log("ModalPanel: init() called with params:", params);
    this._panelApi = params.api;

    // Set the panel ID for CSS targeting
    if (this._panelApi?.id) {
      // Add the panel ID as a data attribute for CSS targeting
      this.setAttribute("data-panel-id", this._panelApi.id);
      // Also add as a CSS class for easier targeting
      this.classList.add("modal-panel");
      this.classList.add(`modal-panel-${this._panelApi.id}`);

      console.log("ModalPanel: Panel ID assigned:", this._panelApi.id);
    }

    // Inject global CSS to remove box shadow from DockView container
    this.injectGlobalModalStyles();

    // Get modal options from panel parameters
    const modalOptions = params.params as ModalPanelOptions;
    console.log("ModalPanel: modalOptions:", modalOptions);

    if (modalOptions) {
      // Update state
      this.state.update({
        isInitialized: true,
        currentOptions: modalOptions,
        isVisible: true,
      });

      console.log("ModalPanel: Creating controller");
      this._controller = new ModalPanelController(
        this.shadowRoot!,
        this._panelApi,
        this,
      );

      // Store a reference to this instance so the manager can find it
      (this as any)._modalInstance = this;

      console.log("ModalPanel: Controller created with modal panel reference");

      this._controller.initialize(modalOptions);

      // Emit panel opened event with the actual panel ID
      this.state.emit(Events.PANEL_OPENED, {
        panelId: this._panelApi.id || "modal-panel",
        title: modalOptions.title,
        state: "opened",
      });
    } else {
      console.log("ModalPanel: No modalOptions provided");
    }
  }

  /**
   * Shows the modal with the given options and returns a promise that resolves with the result.
   * This method maintains backward compatibility with the external API.
   */
  public show(options: ModalPanelOptions): Promise<ModalResult> {
    return new Promise((resolve) => {
      this._resolvePromise = resolve;

      // Update state with new options
      this.state.update({
        currentOptions: options,
        isVisible: true,
      });

      if (this._controller) {
        this._controller.initialize(options);
      }
    });
  }

  /**
   * Closes the modal with the specified result.
   * This method maintains backward compatibility with the external API.
   */
  public close(result: ModalResult): void {
    // Update state to reflect closing
    this.state.update({
      isVisible: false,
      currentOptions: null,
    });

    if (this._resolvePromise) {
      this._resolvePromise(result);
      this._resolvePromise = undefined;
    }

    // Remove the panel from DockView
    if (this._panelApi) {
      this._panelApi.close();
    }
  }

  /**
   * Custom element lifecycle callback.
   */
  connectedCallback(): void {
    // Add initial animation class when component becomes visible
    this.state.watch("shouldShow", (shouldShow: boolean) => {
      if (shouldShow) {
        requestAnimationFrame(() => {
          this.classList.add("visible");
        });
      } else {
        this.classList.remove("visible");
      }
    });
  }

  /**
   * Custom element lifecycle callback.
   */
  disconnectedCallback(): void {
    console.log("ModalPanel: disconnectedCallback() called");

    // Update state to reflect disconnection
    this.state.set("isVisible", false);

    this._controller?.dispose();

    // Resolve with dismissed if the panel is removed without explicit action
    if (this._resolvePromise) {
      this._resolvePromise("dismissed");
      this._resolvePromise = undefined;
    }

    // Clean up reactive state
    this.state.cleanup();
  }

  /**
   * Sets up reactive state watchers for component lifecycle management.
   */
  private setupStateWatchers(): void {
    // Watch for visibility changes
    this.state.watch("isVisible", (isVisible: boolean) => {
      console.log("ModalPanel: Visibility changed to:", isVisible);

      if (isVisible) {
        this.classList.add("visible");
      } else {
        this.classList.remove("visible");
      }
    });

    // Watch for initialization state
    this.state.watch("isInitialized", (isInitialized: boolean) => {
      console.log(
        "ModalPanel: Initialization state changed to:",
        isInitialized,
      );
    });
  }

  /**
   * Handles external close events (e.g., from other components).
   */
  private handleExternalClose(): void {
    console.log("ModalPanel: Handling external close event");

    // Update state and resolve promise with dismissed
    this.state.set("isVisible", false);

    if (this._resolvePromise) {
      this._resolvePromise("dismissed");
      this._resolvePromise = undefined;
    }
  }

  /**
   * Gets the panel ID for CSS targeting and external access.
   * This allows external code to target specific modal instances with CSS.
   *
   * @returns The unique panel ID assigned by DockView
   *
   * @example
   * ```typescript
   * const modal = document.querySelector('teskooano-modal-panel');
   * const panelId = modal.getPanelId();
   * // Use in CSS: [data-panel-id="panel-123"] { ... }
   * // Or CSS class: .modal-panel-panel-123 { ... }
   * ```
   */
  public getPanelId(): string | undefined {
    return this._panelApi?.id;
  }

  /**
   * Injects global CSS rules for modal-specific styling.
   */
  private injectGlobalModalStyles(): void {
    // Check if the styles are already injected to avoid duplicates
    if (document.getElementById("teskooano-modal-global-styles")) {
      return;
    }

    const globalStyle = document.createElement("style");
    globalStyle.id = "teskooano-modal-global-styles";
    globalStyle.textContent = `
      /* Remove box shadow from DockView resize container when it contains a modal */
      .dv-resize-container:has(teskooano-modal-panel) {
        box-shadow: none !important;
      }

      .dv-resize-container:has(teskooano-modal-panel) .dv-groupview {
        background-color: transparent !important;
      }
      .dv-resize-container:has(teskooano-modal-panel) .dv-tabs-and-actions-container {
        display:none;
      }
      
      /* Alternative selector for broader compatibility */
      .dv-resize-container teskooano-modal-panel {
        /* Ensure modal doesn't inherit container shadows */
      }
      
      /* Remove specific DockView floating panel shadows for modals */
      .dv-dockview-floating-box:has(teskooano-modal-panel) {
        box-shadow: none !important;
      }
    `;

    document.head.appendChild(globalStyle);
    console.log("ModalPanel: Global modal styles injected");
  }
}
