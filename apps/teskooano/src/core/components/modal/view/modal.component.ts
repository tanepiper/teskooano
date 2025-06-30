import { modalStyles, modalTemplate } from "./modal.template";
import type { ModalResult } from "../../../controllers/dockview/types/index";

export interface ModalOptions {
  title: string;
  content: HTMLElement;
  confirmText?: string;
  closeText?: string;
  secondaryText?: string;
  hideSecondaryButton?: boolean;
}

export class ModalComponent extends HTMLElement {
  static readonly componentName = "teskooano-modal";

  private _resolve!: (result: ModalResult) => void;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = modalStyles;

    const template = document.createElement("template");
    template.innerHTML = modalTemplate;

    this.shadowRoot!.append(style, template.content.cloneNode(true));
  }

  connectedCallback() {
    this.shadowRoot
      ?.getElementById("confirm-btn")
      ?.addEventListener("click", () => this.close("confirm"));
    this.shadowRoot
      ?.getElementById("close-btn")
      ?.addEventListener("click", () => this.close("close"));
    this.shadowRoot
      ?.getElementById("secondary-btn")
      ?.addEventListener("click", () => this.close("secondary"));

    // Add initial animation class
    requestAnimationFrame(() => {
      this.classList.add("visible");
    });
  }

  public show(options: ModalOptions): Promise<ModalResult> {
    return new Promise((resolve) => {
      this._resolve = resolve;
      this.render(options);
    });
  }

  public close(result: ModalResult) {
    this.classList.remove("visible");
    this.addEventListener(
      "transitionend",
      () => {
        if (this.parentNode) {
          this.parentNode.removeChild(this);
        }
        this._resolve(result);
      },
      { once: true },
    );
  }

  private render(options: ModalOptions) {
    const titleEl = this.shadowRoot!.getElementById("modal-title");
    if (titleEl) {
      titleEl.textContent = options.title;
    }

    const bodySlot = this.shadowRoot!.querySelector("slot:not([name])");
    if (bodySlot) {
      // Clear existing content
      while (bodySlot.firstChild) {
        bodySlot.removeChild(bodySlot.firstChild);
      }
      bodySlot.appendChild(options.content);
    }

    this.updateButton("confirm-btn", options.confirmText);
    this.updateButton("close-btn", options.closeText);
    this.updateButton(
      "secondary-btn",
      options.secondaryText,
      options.hideSecondaryButton,
    );
  }

  private updateButton(id: string, text?: string, forceHide?: boolean) {
    const button = this.shadowRoot!.getElementById(id) as HTMLButtonElement;
    if (button) {
      if (text && !forceHide) {
        button.textContent = text;
        button.classList.remove("hidden");
      } else {
        button.classList.add("hidden");
      }
    }
  }
}

customElements.define(ModalComponent.componentName, ModalComponent);
