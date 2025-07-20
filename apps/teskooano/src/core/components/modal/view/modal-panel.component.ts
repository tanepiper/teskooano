import {
  GroupPanelPartInitParameters,
  IContentRenderer,
  DockviewPanelApi,
} from "dockview-core";
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
 */
export class ModalPanel extends HTMLElement implements IContentRenderer {
  public static readonly componentName = "teskooano-modal-panel";

  private _panelApi: DockviewPanelApi | undefined;
  private _controller: ModalPanelController | undefined;
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

    const style = document.createElement("style");
    style.textContent = modalStyles;

    const template = document.createElement("template");
    template.innerHTML = modalTemplate;

    this.shadowRoot!.append(style, template.content.cloneNode(true));
  }

  /**
   * Dockview lifecycle method called when the panel is initialized.
   */
  init(params: GroupPanelPartInitParameters): void {
    console.log("ModalPanel: init() called with params:", params);
    this._panelApi = params.api;

    // Get modal options from panel parameters
    const modalOptions = params.params as ModalPanelOptions;
    console.log("ModalPanel: modalOptions:", modalOptions);

    if (modalOptions) {
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
    } else {
      console.log("ModalPanel: No modalOptions provided");
    }
  }

  /**
   * Shows the modal with the given options and returns a promise that resolves with the result.
   */
  public show(options: ModalPanelOptions): Promise<ModalResult> {
    return new Promise((resolve) => {
      this._resolvePromise = resolve;

      if (this._controller) {
        this._controller.initialize(options);
      }
    });
  }

  /**
   * Closes the modal with the specified result.
   */
  public close(result: ModalResult): void {
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
    // Add initial animation class
    requestAnimationFrame(() => {
      this.classList.add("visible");
    });
  }

  /**
   * Custom element lifecycle callback.
   */
  disconnectedCallback(): void {
    console.log("ModalPanel: disconnectedCallback() called");
    this._controller?.dispose();

    // Resolve with dismissed if the panel is removed without explicit action
    if (this._resolvePromise) {
      this._resolvePromise("dismissed");
      this._resolvePromise = undefined;
    }
  }
}
