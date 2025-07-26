import { CustomEvents } from "@teskooano/data-types";
import { createComponentState } from "@teskooano/ui-plugin/patterns";

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

interface OutputDisplayState {
  value: string;
  isMonospace: boolean;
  isCopyEnabled: boolean;
  hasSlotContent: boolean;
  copyFeedbackVisible: boolean;
}

export class TeskooanoOutputDisplay extends HTMLElement {
  static observedAttributes = ["value", "monospace", "copy-enabled"];

  private slotElement: HTMLSlotElement;
  private copyButton: HTMLButtonElement;
  private copyFeedback: HTMLElement;
  private copyTimeout: number | null = null;

  // Use the new reactive state pattern
  private state = createComponentState(
    {
      value: "",
      isMonospace: false,
      isCopyEnabled: false,
      hasSlotContent: false,
      copyFeedbackVisible: false,
    } as OutputDisplayState,
    {
      componentName: "teskooano-output-display",
    },
  );

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    this.slotElement = this.shadowRoot!.querySelector("slot")!;
    this.copyButton = this.shadowRoot!.querySelector(".copy-button")!;
    this.copyFeedback = this.shadowRoot!.querySelector(".copy-feedback")!;
  }

  connectedCallback() {
    this.updateStateFromAttributes();
    this.setupStateWatchers();
    this.setupEventListeners();

    if (!this.hasAttribute("tabindex")) {
      this.setAttribute("tabindex", "0");
    }

    this.setAttribute("role", "textbox");
    this.setAttribute("aria-readonly", "true");
  }

  disconnectedCallback() {
    this.clearCopyTimeout();
    this.state.cleanup(); // Automatic cleanup of all subscriptions
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;

    switch (name) {
      case "value":
        this.state.set("value", newValue || "");
        break;
      case "monospace":
        this.state.set("isMonospace", newValue !== null);
        break;
      case "copy-enabled":
        this.state.set("isCopyEnabled", newValue !== null);
        break;
    }
  }

  private updateStateFromAttributes(): void {
    this.state.set("value", this.getAttribute("value") || "");
    this.state.set("isMonospace", this.hasAttribute("monospace"));
    this.state.set("isCopyEnabled", this.hasAttribute("copy-enabled"));
  }

  private setupStateWatchers(): void {
    // Watch for value changes
    this.state.watch("value", (value: string) => {
      this.updateValueDisplay(value);
    });

    // Watch for monospace changes
    this.state.watch("isMonospace", (isMonospace: boolean) => {
      this.updateMonospaceDisplay(isMonospace);
    });

    // Watch for copy enabled changes
    this.state.watch("isCopyEnabled", (isCopyEnabled: boolean) => {
      this.updateCopyButtonVisibility(isCopyEnabled);
    });

    // Watch for slot content changes
    this.state.watch("hasSlotContent", (hasSlotContent: boolean) => {
      if (hasSlotContent && !this.state.get("value")) {
        const slottedText = this.getSlottedText();
        if (slottedText) {
          this.state.set("value", slottedText);
        }
      }
    });

    // Watch for copy feedback visibility
    this.state.watch("copyFeedbackVisible", (copyFeedbackVisible: boolean) => {
      if (copyFeedbackVisible) {
        this.copyFeedback.classList.add("visible");
      } else {
        this.copyFeedback.classList.remove("visible");
      }
    });
  }

  private setupEventListeners(): void {
    this.slotElement.addEventListener("slotchange", this.handleSlotChange);
    this.copyButton.addEventListener("click", this.handleCopyClick);
  }

  private handleSlotChange = () => {
    const slottedText = this.getSlottedText();
    this.state.set("hasSlotContent", !!slottedText);

    if (slottedText && !this.state.get("value")) {
      this.state.set("value", slottedText);
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
    this.state.set("copyFeedbackVisible", true);

    this.clearCopyTimeout();
    this.copyTimeout = window.setTimeout(() => {
      this.state.set("copyFeedbackVisible", false);
      this.copyTimeout = null;
    }, 2000);
  }

  private clearCopyTimeout() {
    if (this.copyTimeout !== null) {
      window.clearTimeout(this.copyTimeout);
      this.copyTimeout = null;
    }
  }

  private updateValueDisplay(value: string): void {
    if (value && !this.state.get("hasSlotContent")) {
      this.textContent = value;
    } else if (!value && !this.state.get("hasSlotContent")) {
      this.textContent = "";
    }

    if (value) {
      this.setAttribute(
        "aria-label",
        `Output: ${value.substring(0, 50)}${value.length > 50 ? "..." : ""}`,
      );
    }
  }

  private updateMonospaceDisplay(isMonospace: boolean): void {
    if (isMonospace) {
      this.setAttribute("aria-description", "Displayed in monospace font");
    } else {
      this.removeAttribute("aria-description");
    }
  }

  private updateCopyButtonVisibility(isCopyEnabled: boolean): void {
    this.copyButton.style.display = isCopyEnabled ? "block" : "none";
  }

  get value(): string {
    const slottedText = this.getSlottedText();
    if (slottedText) {
      return slottedText;
    }
    return this.state.get("value") || this.textContent || "";
  }

  set value(newValue: string) {
    this.state.set("value", newValue);
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
    this.state.set("value", "");

    this.dispatchEvent(
      new CustomEvent(CustomEvents.CLEAR, { bubbles: true, composed: true }),
    );
  }
}
