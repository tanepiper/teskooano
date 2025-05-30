import { CustomEvents } from "@teskooano/data-types";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      position: relative;
      font-family: var(--font-family-base);
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      background-color: var(--color-surface-1);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      border: var(--border-width-thin) solid var(--color-border-subtle);
      margin-bottom: var(--space-md);
      overflow-x: auto; /* Allow horizontal scrolling for long content */
      white-space: pre-wrap; /* Preserve whitespace and wrap lines */
      word-break: break-word;
    }
    :host([monospace]) {
        font-family: var(--font-family-monospace);
        white-space: pre; /* Preserve all whitespace with monospace */
    }
    /* Add a subtle scrollbar style */
    ::-webkit-scrollbar {
        height: var(--space-1); /* 4px */
        background-color: transparent;
    }
    ::-webkit-scrollbar-thumb {
        background-color: var(--color-border-subtle);
        border-radius: var(--radius-sm); /* Match height/2 for pill*/
    }
    
    /* Copy button styles */
    .copy-button {
      position: absolute;
      top: var(--space-1);
      right: var(--space-1);
      background-color: var(--color-surface-2);
      color: var(--color-text-secondary);
      border: var(--border-width-thin) solid var(--color-border-subtle);
      border-radius: var(--radius-sm);
      padding: calc(var(--space-1) / 2) var(--space-1);
      font-size: var(--font-size-1);
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s ease, background-color 0.2s ease;
    }
    
    :host(:hover) .copy-button,
    :host(:focus-within) .copy-button,
    .copy-button:focus {
      opacity: 1;
    }
    
    .copy-button:hover {
      background-color: var(--color-surface-3);
    }
    
    .copy-button:active {
      background-color: var(--color-surface-1);
    }
    
    .copy-button:focus {
      outline: var(--border-width-medium) solid var(--color-primary);
      outline-offset: -1px;
    }
    
    /* Copy feedback message */
    .copy-feedback {
      position: absolute;
      top: var(--space-1);
      right: var(--space-6);
      background-color: var(--color-success-background);
      color: var(--color-success-text);
      border-radius: var(--radius-sm);
      padding: calc(var(--space-1) / 2) var(--space-1);
      font-size: var(--font-size-1);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .copy-feedback.visible {
      opacity: 1;
    }
    
    /* Content wrapper */
    .content-wrapper {
      width: 100%;
    }
  </style>
  <div class="content-wrapper">
    <slot></slot> <!-- Default slot for content -->
    <button class="copy-button" aria-label="Copy to clipboard" tabindex="0">Copy</button>
    <span class="copy-feedback" aria-live="polite">Copied!</span>
  </div>
`;

export class TeskooanoOutputDisplay extends HTMLElement {
  static observedAttributes = ["value", "monospace", "copy-enabled"];

  private slotElement: HTMLSlotElement;
  private copyButton: HTMLButtonElement;
  private copyFeedback: HTMLElement;
  private _internalUpdate = false;
  private _copyTimeout: number | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    this.slotElement = this.shadowRoot!.querySelector("slot")!;
    this.copyButton = this.shadowRoot!.querySelector(".copy-button")!;
    this.copyFeedback = this.shadowRoot!.querySelector(".copy-feedback")!;

    this.slotElement.addEventListener("slotchange", this.handleSlotChange);

    this.copyButton.addEventListener("click", this.handleCopyClick);
  }

  connectedCallback() {
    this.updateMonospaceAttribute(this.getAttribute("monospace"));
    this.updateCopyEnabledAttribute(this.getAttribute("copy-enabled"));
    this.updateValueAttribute(this.getAttribute("value"));

    if (!this.hasAttribute("tabindex")) {
      this.setAttribute("tabindex", "0");
    }

    this.setAttribute("role", "textbox");
    this.setAttribute("aria-readonly", "true");
  }

  disconnectedCallback() {
    this.slotElement.removeEventListener("slotchange", this.handleSlotChange);
    this.copyButton.removeEventListener("click", this.handleCopyClick);

    if (this._copyTimeout !== null) {
      window.clearTimeout(this._copyTimeout);
      this._copyTimeout = null;
    }
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;

    switch (name) {
      case "value":
        if (!this._internalUpdate) {
          this.updateValueAttribute(newValue);
        }
        break;
      case "monospace":
        this.updateMonospaceAttribute(newValue);
        break;
      case "copy-enabled":
        this.updateCopyEnabledAttribute(newValue);
        break;
    }
  }

  private handleSlotChange = () => {
    const slottedText = this.getSlottedText();
    if (slottedText && !this.hasAttribute("value")) {
      this._internalUpdate = true;
      this.setAttribute("value", slottedText);
      this._internalUpdate = false;
    }

    this.dispatchEvent(
      new CustomEvent(CustomEvents.CONTENT_CHANGE, {
        bubbles: true,
        composed: true,
        detail: { content: this.value },
      }),
    );
  };

  private getSlottedText(): string {
    const nodes = this.slotElement.assignedNodes();
    return nodes
      .map((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          return (node as Element).textContent;
        }
        return "";
      })
      .join("")
      .trim();
  }

  private handleCopyClick = async (e: Event) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(this.value);
      this.showCopyFeedback();

      this.dispatchEvent(
        new CustomEvent(CustomEvents.COPY, {
          bubbles: true,
          composed: true,
          detail: { success: true },
        }),
      );
    } catch (error) {
      console.error("Failed to copy text:", error);

      this.dispatchEvent(
        new CustomEvent(CustomEvents.COPY, {
          bubbles: true,
          composed: true,
          detail: { success: false, error: error },
        }),
      );
    }
  };

  private showCopyFeedback() {
    this.copyFeedback.classList.add("visible");

    if (this._copyTimeout !== null) {
      window.clearTimeout(this._copyTimeout);
    }

    this._copyTimeout = window.setTimeout(() => {
      this.copyFeedback.classList.remove("visible");
      this._copyTimeout = null;
    }, 2000);
  }

  private updateValueAttribute(value: string | null) {
    if (value !== null && this.slotElement.assignedNodes().length === 0) {
      this.textContent = value;
    } else if (
      value === null &&
      this.slotElement.assignedNodes().length === 0
    ) {
      this.textContent = "";
    }

    if (value !== null) {
      this.setAttribute(
        "aria-label",
        `Output: ${value.substring(0, 50)}${value.length > 50 ? "..." : ""}`,
      );
    }
  }

  private updateMonospaceAttribute(value: string | null) {
    if (value !== null) {
      this.setAttribute("aria-description", "Displayed in monospace font");
    } else {
      this.removeAttribute("aria-description");
    }
  }

  private updateCopyEnabledAttribute(value: string | null) {
    const copyEnabled = value !== null;
    this.copyButton.style.display = copyEnabled ? "block" : "none";
  }

  get value(): string {
    const slottedText = this.getSlottedText();
    if (slottedText) {
      return slottedText;
    }
    return this.getAttribute("value") ?? this.textContent ?? "";
  }

  set value(newValue: string) {
    this._internalUpdate = true;
    this.setAttribute("value", newValue);
    this._internalUpdate = false;
  }

  public async copyToClipboard(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(this.value);
      this.showCopyFeedback();
      return true;
    } catch (error) {
      console.error("Failed to copy text:", error);
      return false;
    }
  }

  public clear() {
    this.textContent = "";
    this._internalUpdate = true;
    this.setAttribute("value", "");
    this._internalUpdate = false;

    this.dispatchEvent(
      new CustomEvent(CustomEvents.CLEAR, { bubbles: true, composed: true }),
    );
  }
}
