import { currentSeed } from "@teskooano/core-state";
import { DockviewApi } from "dockview-core";
import { generateAndLoadSystem } from "../../systems/system-generator";
import { type TeskooanoButton } from "../shared/Button";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      align-items: baseline;
      gap: var(--space-sm, 8px);
      font-family: var(--font-family, sans-serif);
    }

    /* Styles for the native input */
    #seed-input {
      box-sizing: border-box;
      width: 120px;
      padding: var(--space-xs, 4px) var(--space-sm, 8px);
      border: 1px solid var(--color-border, #50506a);
      border-radius: var(--border-radius-sm, 3px);
      background-color: var(--color-surface-inset, #1a1a2e);
      color: var(--color-text, #e0e0fc);
      font-size: var(--font-size-md, 1em);
      line-height: 1.5;
      vertical-align: baseline;
    }

    #seed-input:focus {
      outline: 2px solid var(--color-primary-light, #9fa8da);
      outline-offset: 1px;
      border-color: var(--color-primary-light, #9fa8da);
    }

    .seed-label {
      font-size: var(--font-size-sm, 0.9em);
      color: var(--color-text-secondary, #aaa);
      font-weight: var(--font-weight-medium, 500);
      margin-right: var(--space-xxs, 2px);
    }

    :host([mobile]) #seed-input {
      width: 80px;
    }

    /* Target the text span we added earlier */
    :host([mobile]) #generate-button span:not([slot='icon']) {
       display: none; /* Hide text, keep icon */
    }

    :host([mobile]) #generate-button span[slot="icon"] {
      margin-right: 0; /* Remove margin when text is hidden */
    }
  </style>
  <span class="seed-label">Seed:</span>
  <input type="text" id="seed-input" placeholder="System seed" />
  <teskooano-button id="generate-button">
    <span slot="icon">🌍</span>
    <span>Generate</span>
  </teskooano-button>
`;

export class ToolbarSeedForm extends HTMLElement {
  private inputElement: HTMLInputElement | null = null;
  private buttonElement: TeskooanoButton | null = null;
  private _isGenerating = false; // Prevent multiple clicks
  private static dockviewApi: DockviewApi | null = null; // Static reference to dockview API
  private unsubscribeSeed: (() => void) | null = null; // Use function type

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.inputElement = this.shadowRoot!.getElementById(
      "seed-input",
    ) as HTMLInputElement;
    this.buttonElement = this.shadowRoot!.getElementById(
      "generate-button",
    ) as TeskooanoButton;

    // Set initial value from the store and subscribe to changes
    if (this.inputElement) {
      const initialSeed = currentSeed.get(); // Get current value from store
      this.inputElement.value = initialSeed;

      // Subscribe to the seed store
      this.unsubscribeSeed = currentSeed.subscribe((seed) => {
        if (this.inputElement && this.inputElement.value !== seed) {
          this.inputElement.value = seed;
        }
      });
    }

    this.buttonElement.addEventListener("click", this.handleGenerate);
    this.inputElement.addEventListener("keydown", this.handleKeydown);
  }

  disconnectedCallback() {
    this.buttonElement?.removeEventListener("click", this.handleGenerate);
    this.inputElement?.removeEventListener("keydown", this.handleKeydown);
    // Unsubscribe from the store when the element is removed
    if (this.unsubscribeSeed) {
      this.unsubscribeSeed();
      this.unsubscribeSeed = null;
    }
  }

  // Static method to set the Dockview API reference
  public static setDockviewApi(api: DockviewApi): void {
    ToolbarSeedForm.dockviewApi = api;
  }

  private handleKeydown = (e: KeyboardEvent) => {
    // Generate system when pressing Enter in the input field
    if (e.key === "Enter") {
      this.handleGenerate();
    }
  };

  public tourGenerate = async () => {
    this.handleGenerate();
  };

  private handleGenerate = async () => {
    if (
      !ToolbarSeedForm.dockviewApi ||
      !this.inputElement ||
      !this.buttonElement
    ) {
      console.error(
        "Dockview API not set or essential elements not found in ToolbarSeedForm!",
      );
      return;
    }
    if (this._isGenerating) return;

    this._isGenerating = true;
    this.buttonElement.disabled = true;

    // Use icon to indicate progress
    const iconElement = this.buttonElement.querySelector('span[slot="icon"]');
    const originalIcon = iconElement?.textContent || "🌍";
    if (iconElement) iconElement.textContent = "⏳"; // Loading indicator

    const inputSeed = this.inputElement.value; // Get seed from input

    try {
      // Call the extracted generator function
      const success = await generateAndLoadSystem(
        inputSeed,
        ToolbarSeedForm.dockviewApi,
      );
      if (success) {
        console.log(
          "[ToolbarSeedForm] System generation initiated successfully via shared function.",
        );
        // Input value will be updated via store subscription if seed changed
      } else {
        console.error(
          "[ToolbarSeedForm] System generation failed via shared function.",
        );
        // Maybe add some user feedback here? Like flashing the input red?
      }
    } catch (error) {
      // This catch is likely redundant if generateAndLoadSystem handles its errors,
      // but kept as a safeguard.
      console.error(
        "[ToolbarSeedForm] Unexpected error calling generateAndLoadSystem:",
        error,
      );
    } finally {
      this._isGenerating = false;
      // Ensure button is re-enabled even if errors occurred
      if (this.buttonElement) this.buttonElement.disabled = false;
      // Restore original icon
      if (iconElement) iconElement.textContent = originalIcon;
    }
  };
}

// Define the custom element
customElements.define("toolbar-seed-form", ToolbarSeedForm);
