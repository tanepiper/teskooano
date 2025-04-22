import {
  celestialObjectsStore,
  currentSeed,
  systemNameStore,
} from "@teskooano/core-state";
import { type CelestialObject } from "@teskooano/data-types";
import { DockviewApi } from "dockview-core";
import { generateAndLoadSystem } from "../../systems/system-generator.js";
import "../shared/Button.ts";
import { TeskooanoModal } from "../shared/Modal";
import { SystemControlsTemplate } from "./SystemControls.template";
import * as SystemActions from "./system-controls.actions.js";
import * as SystemControlsUI from "./system-controls.ui.js";

/**
 * @element system-controls
 * @description
 * A custom element that provides UI controls for managing the star system generation,
 * loading, saving, and clearing within the Teskooano application.
 * It interacts with the core state stores (`celestialObjectsStore`, `currentSeed`, `systemNameStore`)
 * and actions to modify the application state.
 *
 * @attr {boolean} mobile - Indicates if the component should render in a mobile-friendly layout.
 *
 * @fires system-action - Dispatched when a system-level action (like clear) occurs.
 *                        (Note: This is currently handled internally via `actions.clearState`).
 * @fires resetSimulationTime - Dispatched after importing a system to reset the simulation loop timer.
 */
class SystemControls
  extends HTMLElement
  implements SystemControlsUI.SystemControlsUIContract
{
  // DOM elements
  /** @internal The main container element for the controls. */
  private container: HTMLElement | null = null;
  /** @internal The element shown when no system is loaded. */
  private emptyState: HTMLElement | null = null;
  /** @internal The element shown when a system is loaded. */
  private loadedState: HTMLElement | null = null;
  /** @internal The input field for the system seed. */
  private seedInput: HTMLInputElement | null = null;
  /** @internal The form containing the seed input and submit button. */
  private seedForm: HTMLFormElement | null = null;
  /** @internal The element displaying the current system identifier (name or seed). */
  private systemIdentifierEl: HTMLElement | null = null;
  /** @internal The element displaying the number of celestial objects. */
  private celestialCountEl: HTMLElement | null = null;
  /** @internal A collection of all action buttons within the component. */
  private buttons: NodeListOf<HTMLElement> | null = null;
  /** @internal The overlay shown during loading/generation states. */
  private loadingOverlay: HTMLElement | null = null;
  /** @internal Reference to the currently active modal, if any. */
  private activeModal: TeskooanoModal | null = null;

  // State & Properties
  /** @internal Flag indicating if the mobile layout is active. Controlled by the `mobile` attribute. */
  private _isMobile: boolean = false;
  /** @internal Flag indicating if a system generation/import/export process is currently running. */
  private _isProcessing: boolean = false;
  /** @internal Flag indicating if a system generation process is currently running. Required by UIContract. */
  public isGenerating(): boolean {
    return this._isProcessing;
  }
  /** @internal Reference to the Dockview API, used for potential panel interactions. */
  private dockviewApi: DockviewApi | null = null;

  // Store Unsubscribers
  /** @internal Array holding unsubscribe functions for Nanostore subscriptions. */
  private unsubscribers: (() => void)[] = [];

  /**
   * Observed attributes for the custom element.
   * @returns {string[]} An array of attribute names to observe.
   */
  static get observedAttributes() {
    // Only observe mobile, other state comes from store
    return ["mobile"];
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(SystemControlsTemplate.content.cloneNode(true));
  }

  /**
   * Sets the Dockview API instance for the component.
   * Allows the component to interact with the Dockview layout engine if needed.
   * @param {DockviewApi} api - The Dockview API instance.
   */
  public setDockviewApi(api: DockviewApi): void {
    this.dockviewApi = api;
    console.log("SystemControls: Dockview API set.");
  }

  /**
   * Lifecycle callback executed when the element is connected to the DOM.
   * @internal
   */
  connectedCallback() {
    console.log("SystemControls connected");

    // Cache DOM elements
    this.container =
      this.shadowRoot?.querySelector(".system-controls-container") || null;
    this.emptyState = this.shadowRoot?.querySelector(".state--empty") || null;
    this.loadedState = this.shadowRoot?.querySelector(".state--loaded") || null;
    this.seedInput = this.shadowRoot?.querySelector("#seed") || null;
    this.seedForm =
      (this.shadowRoot?.querySelector(".seed-form") as HTMLFormElement) || null;
    this.systemIdentifierEl =
      this.shadowRoot?.querySelector(".system-identifier") || null;
    this.celestialCountEl =
      this.shadowRoot?.querySelector(".celestial-count") || null;
    this.buttons =
      this.shadowRoot?.querySelectorAll(
        'teskooano-button[data-action], teskooano-button[type="submit"]',
      ) || null;
    this.loadingOverlay =
      this.shadowRoot?.querySelector(".loading-overlay") || null;

    // Add event listeners
    this.addEventListeners();

    // Subscribe to stores
    this.subscribeToStores();

    // Initial UI update based on current store state
    this.updateDisplay(
      celestialObjectsStore.get(),
      currentSeed.get(),
      systemNameStore.get(),
    );
    // Set initial seed input value
    if (this.seedInput) {
      this.seedInput.value = currentSeed.get() || "";
    }
  }

  /**
   * Lifecycle callback executed when the element is disconnected from the DOM.
   * @internal
   */
  disconnectedCallback() {
    console.log("SystemControls disconnected");
    this.removeEventListeners();
    // Unsubscribe from all stores
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    // Clean up any active modal
    this._closeActiveModal();
  }

  /**
   * Lifecycle callback executed when an observed attribute changes.
   * @param {string} name - The name of the attribute that changed.
   * @param {string | null} oldValue - The previous value of the attribute.
   * @param {string | null} newValue - The new value of the attribute.
   * @internal
   */
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (name === "mobile") {
      this._isMobile = newValue !== null;
      this.updateButtonSizes();
      // Re-run display logic if mobile status affects layout significantly
      this.updateDisplay(
        celestialObjectsStore.get(),
        currentSeed.get(),
        systemNameStore.get(),
      );
    }
  }

  /**
   * Subscribes to the relevant Nanostores and stores the unsubscribe functions.
   * @private
   */
  private subscribeToStores() {
    // Subscribe to celestialObjectsStore
    const unsubObjects = celestialObjectsStore.subscribe(
      (objects: Record<string, CelestialObject>) => {
        this.updateDisplay(objects, currentSeed.get(), systemNameStore.get());
      },
    );
    this.unsubscribers.push(unsubObjects);

    // Current Seed subscription
    const unsubSeed = currentSeed.subscribe((seed: string) => {
      console.log("SystemControls: currentSeed updated", seed);
      this.updateDisplay(
        celestialObjectsStore.get(),
        seed,
        systemNameStore.get(),
      );
    });
    this.unsubscribers.push(unsubSeed);

    // Subscribe to System Name Store
    const unsubName = systemNameStore.subscribe((name: string | null) => {
      console.log("SystemControls: systemNameStore updated", name);
      this.updateDisplay(celestialObjectsStore.get(), currentSeed.get(), name);
    });
    this.unsubscribers.push(unsubName);
  }

  /**
   * Generates a system using a random seed. Typically used for tours or demonstrations.
   * @public
   */
  public tourRandomSeed() {
    if (this._isProcessing) return;
    this.setProcessing(true);
    SystemActions.generateRandomSystem(this.dockviewApi)
      .then((result) => {
        const randomButton = this.shadowRoot?.querySelector(
          '[data-action="random"] span',
        ) as HTMLElement;
        if (result && randomButton) {
          this.showFeedback(
            randomButton.parentElement!,
            result.symbol,
            !result.success,
          );
        }
      })
      .catch((error) => {
        console.error("Error during random generation:", error);
        const randomButton = this.shadowRoot?.querySelector(
          '[data-action="random"] span',
        ) as HTMLElement;
        if (randomButton) {
          this.showFeedback(randomButton.parentElement!, "❌", true);
        }
      })
      .finally(() => {
        this.setProcessing(false);
      });
  }

  /**
   * Updates the size and appearance of buttons based on the mobile state.
   * Calls the external UI handler.
   * @private
   */
  private updateButtonSizes() {
    SystemControlsUI.updateButtonSizesUI(this);
  }

  /**
   * Updates the component's display based on the current system state (objects, seed, name).
   * Calls the external UI handler.
   * @param {Record<string, CelestialObject>} objects - The current map of celestial objects.
   * @param {string} seed - The current system seed.
   * @param {string | null} systemName - The current system name.
   * @private
   */
  private updateDisplay(
    objects: Record<string, CelestialObject>,
    seed: string,
    systemName: string | null,
  ): void {
    const identifier =
      systemName || `Seed: ${seed.substring(0, 8)}...` || "N/A";
    SystemControlsUI.updateDisplayUI(this, objects, identifier);
  }

  /**
   * Adds event listeners to the interactive elements within the component.
   * @private
   */
  private addEventListeners() {
    const submitButton = this.seedForm?.querySelector(
      'teskooano-button[type="submit"]',
    );
    submitButton?.addEventListener("click", this.handleSeedSubmit);

    this.buttons?.forEach((button) => {
      if (button.getAttribute("type") !== "submit") {
        button.addEventListener("click", this.handleActionClick);
      }
    });
  }

  /**
   * Removes event listeners added by `addEventListeners`.
   * @private
   */
  private removeEventListeners() {
    const submitButton = this.seedForm?.querySelector(
      'teskooano-button[type="submit"]',
    );
    submitButton?.removeEventListener("click", this.handleSeedSubmit);

    this.buttons?.forEach((button) => {
      if (button.getAttribute("type") !== "submit") {
        button.removeEventListener("click", this.handleActionClick);
      }
    });
  }

  /**
   * Handles the submission of the seed form (triggered by button click).
   * Validates the seed input and calls the system generation function.
   * @param {Event} event - The click event object.
   * @private
   */
  private handleSeedSubmit = async (event: Event) => {
    event.preventDefault();
    console.log("handleSeedSubmit triggered via BUTTON CLICK.");

    if (this._isProcessing) {
      console.log("Submit prevented: _isProcessing is true.");
      return;
    }

    const seed = this.seedInput?.value.trim() ?? "";
    console.log(
      `Seed value from input: "${this.seedInput?.value}", Trimmed: "${seed}"`,
    );

    // Basic validation feedback
    if (!seed && this.seedInput) {
      console.log("Validation failed: Seed is empty after trimming.");
      console.warn("Seed input is empty");
      this.seedInput.classList.add("error");
      this.seedInput.setAttribute("placeholder", "Seed cannot be empty!");
      const submitButton = this.seedForm?.querySelector(
        'teskooano-button[type="submit"] span',
      );
      if (submitButton) {
        this.showFeedback(
          submitButton.parentElement as HTMLElement,
          "⚠️",
          true,
        );
      }

      setTimeout(() => {
        this.seedInput?.classList.remove("error");
        this.seedInput?.setAttribute("placeholder", "Enter seed...");
      }, 2000);
      return;
    }

    console.log(`Validation passed. Proceeding with seed: "${seed}"`);
    this.setProcessing(true);

    try {
      console.log("Calling generateAndLoadSystem...");
      const success = await generateAndLoadSystem(seed, this.dockviewApi);
      // Feedback handled by store updates triggering updateDisplay
      if (!success) {
        console.error("System generation failed.");
        const submitButton = this.seedForm?.querySelector(
          'teskooano-button[type="submit"] span',
        );
        if (submitButton) {
          this.showFeedback(
            submitButton.parentElement as HTMLElement,
            "❌",
            true,
            3000,
          );
        }
      }
      console.log(`generateAndLoadSystem returned: ${success}`);
    } catch (error) {
      console.error("Error during generateAndLoadSystem call:", error);
      const submitButton = this.seedForm?.querySelector(
        'teskooano-button[type="submit"] span',
      );
      if (submitButton) {
        this.showFeedback(
          submitButton.parentElement as HTMLElement,
          "❌",
          true,
          3000,
        );
      }
    } finally {
      console.log("Resetting processing state.");
      this.setProcessing(false);
    }
  };

  /**
   * Handles clicks on buttons with `data-action` attributes.
   * Dispatches calls to specific handler methods based on the action.
   * @param {Event} event - The click event object.
   * @private
   */
  private handleActionClick = async (event: Event) => {
    if (this._isProcessing) return;

    const button = event.currentTarget as HTMLElement;
    const action = button.dataset.action;

    if (!action) return;
    console.log("Action clicked:", action);

    if (action !== "create-blank" && action !== "copy-seed") {
      this.setProcessing(true);
    }

    let result: SystemActions.ActionResult | null = null;
    let shouldShowFeedback = true;

    try {
      switch (action) {
        case "export":
          result = await this._handleExport();
          break;
        case "import":
          result = await this._handleImport();
          shouldShowFeedback = false;
          break;
        case "random":
          result = await this._handleRandom();
          break;
        case "clear":
          result = await this._handleClear();
          if (!result) shouldShowFeedback = false;
          break;
        case "create-blank":
          this._handleCreateBlank();
          shouldShowFeedback = false;
          break;
        case "copy-seed":
          result = await this._handleCopySeed();
          break;
        default:
          console.warn(`Unhandled action: ${action}`);
          if (
            this._isProcessing &&
            action !== "create-blank" &&
            action !== "copy-seed"
          ) {
            this.setProcessing(false);
          }
          return;
      }

      const feedbackTarget = button.querySelector("span") || button;
      if (shouldShowFeedback && result) {
        this.showFeedback(
          feedbackTarget.parentElement!,
          result.symbol,
          !result.success,
        );
      } else if (!shouldShowFeedback) {
        console.log(
          `Action '${action}' feedback handled elsewhere or skipped.`,
        );
      } else {
        console.log(
          `Action '${action}' completed without explicit feedback result.`,
        );
      }
    } catch (error) {
      console.error(`Error during action '${action}':`, error);
      const message = error instanceof Error ? error.message : "Unknown error";
      const feedbackTarget = button.querySelector("span") || button;
      if (message !== "File selection cancelled.") {
        this.showFeedback(feedbackTarget.parentElement!, "❌", true);
      }
      shouldShowFeedback = false;
    } finally {
      if (
        this._isProcessing &&
        action !== "create-blank" &&
        action !== "copy-seed"
      ) {
        this.setProcessing(false);
      }
    }
  };

  // --- Private Action Handlers ---

  /** @private Handles the 'export' action. */
  private async _handleExport(): Promise<SystemActions.ActionResult> {
    const seed = currentSeed.get();
    const objectsMap = celestialObjectsStore.get();
    return await SystemActions.exportSystem(seed, objectsMap);
  }

  /** @private Handles the 'import' action. */
  private async _handleImport(): Promise<SystemActions.ActionResult | null> {
    try {
      const file = await SystemActions.triggerImportDialog();
      this.setProcessing(true);
      const result = await SystemActions.importSystem(file, this.dockviewApi);
      this.setProcessing(false);
      const importButton = this.shadowRoot?.querySelector(
        '[data-action="import"] span',
      ) as HTMLElement;
      if (importButton)
        this.showFeedback(
          importButton.parentElement!,
          result.symbol,
          !result.success,
        );
      return result;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "File selection cancelled."
      ) {
        console.log("Import cancelled by user.");
        if (this._isProcessing) this.setProcessing(false);
        return null;
      } else {
        console.error("Error during import process:", error);
        this.setProcessing(false);
        const importButton = this.shadowRoot?.querySelector(
          '[data-action="import"] span',
        ) as HTMLElement;
        if (importButton)
          this.showFeedback(importButton.parentElement!, "❌", true);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Import Error",
          symbol: "❌",
        };
      }
    }
  }

  /** @private Handles the 'random' action. */
  private async _handleRandom(): Promise<SystemActions.ActionResult> {
    return await SystemActions.generateRandomSystem(this.dockviewApi);
  }

  /** @private Handles the 'clear' action. */
  private async _handleClear(): Promise<SystemActions.ActionResult | null> {
    if (
      !confirm(
        "Are you sure you want to clear the current system? This cannot be undone.",
      )
    ) {
      console.log("Clear cancelled by user.");
      this.setProcessing(false);
      return null;
    }
    return await SystemActions.clearSystem();
  }

  /** @private Handles the 'create-blank' action by showing a modal. */
  private _handleCreateBlank(): void {
    if (this.activeModal) {
      console.warn("Create Blank Modal already open.");
      return;
    }

    const modal = document.createElement("teskooano-modal") as TeskooanoModal;
    modal.setAttribute("title", "Create New System");
    modal.setAttribute("confirm-text", "Create");
    modal.setAttribute("close-text", "Cancel");
    modal.setAttribute("hide-secondary-button", "");
    modal.style.position = "fixed";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.zIndex = "1000";
    modal.style.width = "min(90vw, 450px)";
    modal.style.maxHeight = "80vh";

    const formContent = document.createElement("div");
    formContent.innerHTML = `
        <style>
            .form-group { margin-bottom: 1rem; }
            label { display: block; margin-bottom: 0.5rem; color: var(--color-text-secondary); font-size: var(--font-size-small); }
            input[type="text"] {
                box-sizing: border-box;
                width: 100%;
                padding: var(--space-2, 8px);
                border: 1px solid var(--color-border);
                background-color: var(--color-surface-1);
                color: var(--color-text-primary);
                border-radius: var(--radius-sm);
                font-size: var(--font-size-base);
            }
            input[type="text"]:focus {
                outline: none;
                border-color: var(--color-primary);
                box-shadow: 0 0 0 2px var(--color-primary-emphasis);
            }
            .error-message {
                color: var(--color-danger);
                font-size: var(--font-size-small);
                margin-top: 0.25rem;
                min-height: 1em;
            }
        </style>
        <div class="form-group">
            <label for="system-name-input">System Name:</label>
            <input type="text" id="system-name-input" name="systemName" required placeholder="e.g., Kepler-186">
            <div class="error-message" id="name-error"></div>
        </div>
    `;
    modal.setContent(formContent);

    const nameInput = formContent.querySelector(
      "#system-name-input",
    ) as HTMLInputElement;
    const errorDiv = formContent.querySelector("#name-error") as HTMLElement;

    const validateName = () => {
      const name = nameInput.value.trim();
      if (!name) {
        errorDiv.textContent = "System name cannot be empty.";
        nameInput.focus();
        return false;
      }
      errorDiv.textContent = "";
      return true;
    };

    nameInput.addEventListener("input", validateName);
    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (validateName()) {
          modal.shadowRoot
            ?.querySelector<HTMLElement>(".confirm-button")
            ?.click();
        }
      }
    });

    let isSubmitting = false;
    modal.setConfirmHandler(async () => {
      if (isSubmitting || !validateName()) {
        return;
      }
      isSubmitting = true;
      const systemName = nameInput.value.trim();
      this.setProcessing(true);
      const createButton = modal.shadowRoot?.querySelector(
        ".confirm-button span",
      ) as HTMLElement;
      try {
        console.log(
          `Modal confirmed. Calling createNewNamedSystem with name: "${systemName}"`,
        );
        const result = await SystemActions.createNewNamedSystem(systemName);
        if (result.success) {
          if (createButton)
            this.showFeedback(
              createButton.parentElement!,
              result.symbol,
              !result.success,
              1000,
            );
          setTimeout(() => this._closeActiveModal(), 500);
        } else {
          errorDiv.textContent = result.message || "Failed to create system.";
          if (createButton)
            this.showFeedback(
              createButton.parentElement!,
              result.symbol,
              true,
              2000,
            );
          this.setProcessing(false);
          isSubmitting = false;
        }
      } catch (err) {
        console.error("Error calling createNewNamedSystem:", err);
        errorDiv.textContent = "An unexpected error occurred.";
        if (createButton)
          this.showFeedback(createButton.parentElement!, "❌", true, 2000);
        this.setProcessing(false);
        isSubmitting = false;
      }
    });

    modal.setCloseHandler(() => {
      console.log("Modal closed by user.");
      this._closeActiveModal();
    });

    document.body.appendChild(modal);
    this.activeModal = modal;
    setTimeout(() => nameInput.focus(), 50);
  }

  /** @private Handles the 'copy-seed' action. */
  private async _handleCopySeed(): Promise<SystemActions.ActionResult> {
    const seed = currentSeed.get();
    const result = await SystemActions.copySystemSeed(seed);
    const copyButton = this.shadowRoot?.querySelector(
      '[data-action="copy-seed"] span',
    ) as HTMLElement;
    if (copyButton)
      this.showFeedback(
        copyButton.parentElement!,
        result.symbol,
        !result.success,
      );
    return result;
  }

  // --- End Private Action Handlers ---

  /**
   * Closes and removes the currently active modal, if any.
   * @private
   */
  private _closeActiveModal(): void {
    if (this.activeModal) {
      this.activeModal.remove();
      this.activeModal = null;
      console.log("Active modal closed and removed.");
      if (this._isProcessing) {
        this.setProcessing(false);
      }
    }
  }

  /**
   * Sets the processing state of the component, updating the UI accordingly.
   * @param {boolean} isProcessing - True if the component should be in a loading state, false otherwise.
   * @private
   */
  private setProcessing(isProcessing: boolean) {
    if (this._isProcessing === isProcessing) return;
    this._isProcessing = isProcessing;
    this.updateDisplay(
      celestialObjectsStore.get(),
      currentSeed.get(),
      systemNameStore.get(),
    );
  }

  /**
   * Displays temporary feedback (a symbol) within a target element (usually a button).
   * Replaces the element's content temporarily and restores it after a duration.
   * @param {HTMLElement} element - The HTML element to display feedback within (should be the button itself).
   * @param {string} symbol - The feedback symbol/text to display.
   * @param {boolean} [isError=false] - If true, applies an 'error' class for styling.
   * @param {number} [duration=1500] - The duration in milliseconds to show the feedback.
   * @private
   */
  private showFeedback(
    element: HTMLElement,
    symbol: string,
    isError: boolean = false,
    duration: number = 1500,
  ) {
    if (!element) return;
    if (
      element instanceof HTMLButtonElement ||
      element.getAttribute("role") === "button"
    ) {
      (element as HTMLButtonElement).disabled = true;
    }

    const targetElement = element;
    const originalContentHTML = targetElement.innerHTML;

    const feedback = document.createElement("span");
    feedback.className = `feedback ${isError ? "error" : ""}`;
    feedback.textContent = symbol;
    feedback.style.display = "inline-block";
    feedback.style.width = "100%";
    feedback.style.textAlign = "center";

    targetElement.innerHTML = "";
    targetElement.appendChild(feedback);

    setTimeout(() => {
      targetElement.innerHTML = originalContentHTML;
      if (
        targetElement instanceof HTMLButtonElement ||
        targetElement.getAttribute("role") === "button"
      ) {
        (targetElement as HTMLButtonElement).disabled = false;
      }
    }, duration);
  }

  /** Public getter for the mobile state. */
  public isMobile(): boolean {
    return this._isMobile;
  }

  /** Public getter for the processing state. */
  public isProcessing(): boolean {
    return this._isProcessing;
  }

  /** Public getter for the container element (used by UI handler). */
  public getContainer(): HTMLElement | null {
    return this.container;
  }

  /** Public getter for the empty state element (used by UI handler). */
  public getEmptyState(): HTMLElement | null {
    return this.emptyState;
  }

  /** Public getter for the loaded state element (used by UI handler). */
  public getLoadedState(): HTMLElement | null {
    return this.loadedState;
  }

  /** Public getter for the system identifier element (used by UI handler). */
  public getSystemIdentifierEl(): HTMLElement | null {
    return this.systemIdentifierEl;
  }

  /** Public getter for the celestial count element (used by UI handler). */
  public getCelestialCountEl(): HTMLElement | null {
    return this.celestialCountEl;
  }

  /** Public getter for the seed input element (used by UI handler). */
  public getSeedInput(): HTMLInputElement | null {
    return this.seedInput;
  }

  /** Public getter for the loading overlay element (used by UI handler). */
  public getLoadingOverlay(): HTMLElement | null {
    return this.loadingOverlay;
  }

  /** Public getter for the buttons NodeList (used by UI handler). */
  public getButtons(): NodeListOf<HTMLElement> | null {
    return this.buttons;
  }
}

customElements.define("system-controls", SystemControls);

// Export for potential external usage or typing
export { SystemControls };
