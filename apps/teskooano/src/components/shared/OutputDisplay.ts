import { CustomEvents } from "@teskooano/data-types";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      position: relative;
      font-family: var(--font-family, sans-serif);
      font-size: var(--font-size-md, 1em);
      color: var(--color-text, #e0e0fc);
      background-color: var(--color-surface-inset, #1a1a2e);
      padding: var(--space-sm, 8px) var(--space-md, 12px);
      border-radius: var(--border-radius-md, 5px);
      border: 1px solid var(--color-border, #50506a);
      margin-bottom: var(--space-md, 12px);
      overflow-x: auto; /* Allow horizontal scrolling for long content */
      white-space: pre-wrap; /* Preserve whitespace and wrap lines */
      word-break: break-word;
    }
    :host([monospace]) {
        font-family: var(--font-family-monospace, monospace);
        white-space: pre; /* Preserve all whitespace with monospace */
    }
    /* Add a subtle scrollbar style */
    ::-webkit-scrollbar {
        height: 6px;
        background-color: transparent;
    }
    ::-webkit-scrollbar-thumb {
        background-color: var(--color-border, #50506a);
        border-radius: 3px;
    }
    
    /* Copy button styles */
    .copy-button {
      position: absolute;
      top: var(--space-xs, 4px);
      right: var(--space-xs, 4px);
      background-color: var(--color-surface, #2a2a3e);
      color: var(--color-text-secondary, #aaa);
      border: 1px solid var(--color-border, #50506a);
      border-radius: var(--border-radius-sm, 3px);
      padding: var(--space-xxs, 2px) var(--space-xs, 4px);
      font-size: var(--font-size-sm, 0.9em);
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
      background-color: var(--color-surface-highlight, #3a3a5e);
    }
    
    .copy-button:active {
      background-color: var(--color-surface-pressed, #1a1a2e);
    }
    
    .copy-button:focus {
      outline: 2px solid var(--color-primary, #6c63ff);
      outline-offset: -1px;
    }
    
    /* Copy feedback message */
    .copy-feedback {
      position: absolute;
      top: var(--space-xs, 4px);
      right: var(--space-xl, 32px);
      background-color: var(--color-success-bg, #1e3a2d);
      color: var(--color-success-text, #a0d9b5);
      border-radius: var(--border-radius-sm, 3px);
      padding: var(--space-xxs, 2px) var(--space-xs, 4px);
      font-size: var(--font-size-sm, 0.9em);
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

    // Listen for changes in slotted content to update internal state
    this.slotElement.addEventListener("slotchange", this.handleSlotChange);

    // Add copy button click handler
    this.copyButton.addEventListener("click", this.handleCopyClick);
  }

  connectedCallback() {
    this.updateMonospaceAttribute(this.getAttribute("monospace"));
    this.updateCopyEnabledAttribute(this.getAttribute("copy-enabled"));
    this.updateValueAttribute(this.getAttribute("value"));

    // Make component focusable
    if (!this.hasAttribute("tabindex")) {
      this.setAttribute("tabindex", "0");
    }

    // Set role for accessibility
    this.setAttribute("role", "textbox");
    this.setAttribute("aria-readonly", "true");
  }

  disconnectedCallback() {
    // Remove event listeners
    this.slotElement.removeEventListener("slotchange", this.handleSlotChange);
    this.copyButton.removeEventListener("click", this.handleCopyClick);

    // Clear any pending timeouts
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
    // Update the value attribute to reflect slotted content
    const slottedText = this.getSlottedText();
    if (slottedText && !this.hasAttribute("value")) {
      this._internalUpdate = true;
      this.setAttribute("value", slottedText);
      this._internalUpdate = false;
    }

    // Dispatch event when content changes
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

      // Dispatch event when content changes
      this.dispatchEvent(
        new CustomEvent(CustomEvents.COPY, {
          bubbles: true,
          composed: true,
          detail: { success: true },
        }),
      );
    } catch (error) {
      console.error("Failed to copy text:", error);

      // Dispatch event when copy error occurs
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

    // Clear any existing timeout
    if (this._copyTimeout !== null) {
      window.clearTimeout(this._copyTimeout);
    }

    // Hide the feedback after 2 seconds
    this._copyTimeout = window.setTimeout(() => {
      this.copyFeedback.classList.remove("visible");
      this._copyTimeout = null;
    }, 2000);
  }

  private updateValueAttribute(value: string | null) {
    // Set textContent only if the default slot is empty
    if (value !== null && this.slotElement.assignedNodes().length === 0) {
      this.textContent = value; // Directly set textContent on host
    } else if (
      value === null &&
      this.slotElement.assignedNodes().length === 0
    ) {
      // Clear if attribute removed and slot empty
      this.textContent = "";
    }

    // Update ARIA attributes
    if (value !== null) {
      this.setAttribute(
        "aria-label",
        `Output: ${value.substring(0, 50)}${value.length > 50 ? "..." : ""}`,
      );
    }
  }

  private updateMonospaceAttribute(value: string | null) {
    // Attribute presence toggles the host style
    // Styling is handled via :host([monospace]) CSS rule

    // Update ARIA to indicate monospace format if enabled
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

  // Public API
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

  // Copy text to clipboard programmatically
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

  // Clear the display
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

customElements.define("teskooano-output-display", TeskooanoOutputDisplay);
