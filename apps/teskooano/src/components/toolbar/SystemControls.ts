import { celestialObjectsStore, currentSeed } from "@teskooano/core-state";
import { type CelestialObject } from "@teskooano/data-types";
import { DockviewApi } from "dockview-core";
import { generateAndLoadSystem } from "../../systems/system-generator.js";
import "../shared/Button.ts";
import { SystemControlsTemplate } from "./SystemControls.template";
import * as SystemActions from "./system-controls.actions.js"; // Import the new actions
import * as SystemControlsUI from "./system-controls.ui.js"; // Import the new UI handlers

/**
 * @element system-controls
 * @description
 * A custom element that provides UI controls for managing the star system generation,
 * loading, saving, and clearing within the Teskooano application.
 * It interacts with the core state stores (`celestialObjectsStore`, `currentSeed`)
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
  /** @internal The element displaying the current system seed. */
  private systemSeedEl: HTMLElement | null = null;
  /** @internal The element displaying the number of celestial objects. */
  private celestialCountEl: HTMLElement | null = null;
  /** @internal A collection of all action buttons within the component. */
  private buttons: NodeListOf<HTMLElement> | null = null;
  /** @internal The overlay shown during loading/generation states. */
  private loadingOverlay: HTMLElement | null = null;

  // State & Properties
  /** @internal Flag indicating if the mobile layout is active. Controlled by the `mobile` attribute. */
  private _isMobile: boolean = false;
  /** @internal Flag indicating if a system generation/import/export process is currently running. */
  private _isGenerating: boolean = false;
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
    this.systemSeedEl = this.shadowRoot?.querySelector(".system-seed") || null;
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
    this.updateDisplay(celestialObjectsStore.get(), currentSeed.get());
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
      this.updateDisplay(celestialObjectsStore.get(), currentSeed.get());
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
        // Subscribe to correct store
        // REMOVED: console.log("SystemControls: celestialObjectsStore updated", objects);
        // TODO: Still need systemName source
        this.updateDisplay(objects, currentSeed.get()); // Pass objects map
      },
    );
    this.unsubscribers.push(unsubObjects);

    // Current Seed subscription remains the same
    const unsubSeed = currentSeed.subscribe((seed: string) => {
      console.log("SystemControls: currentSeed updated", seed);
      // REMOVED: Don't force input value on every seed store change
      // if (this.seedInput && this.seedInput.value !== seed) {
      //   this.seedInput.value = seed;
      // }
      // Update display using current objects store value
      // TODO: Still need systemName source
      this.updateDisplay(celestialObjectsStore.get(), seed);
    });
    this.unsubscribers.push(unsubSeed);
  }

  /**
   * Generates a system using a random seed. Typically used for tours or demonstrations.
   * @public
   */
  public tourRandomSeed() {
    const randomSeed = Math.random().toString(36).substring(2, 10); // Simple random seed
    console.log("Generating random system with seed:", randomSeed);
    this.handleSeedSubmit({ preventDefault: () => {} } as Event);
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
   * Updates the component's display based on the current system state (objects and seed).
   * Calls the external UI handler.
   * @param {Record<string, CelestialObject>} objects - The current map of celestial objects.
   * @param {string} seed - The current system seed.
   * @private
   */
  private updateDisplay(
    objects: Record<string, CelestialObject>,
    seed: string,
  ): void {
    SystemControlsUI.updateDisplayUI(this, objects, seed);
  }

  /**
   * Adds event listeners to the interactive elements within the component.
   * @private
   */
  private addEventListeners() {
    // Remove the listener from the form's submit event
    // this.seedForm?.addEventListener('submit', this.handleSeedSubmit);

    // Find the specific submit button within the form
    const submitButton = this.seedForm?.querySelector(
      'teskooano-button[type="submit"]',
    );
    // Add a click listener DIRECTLY to the submit button
    submitButton?.addEventListener("click", this.handleSeedSubmit);

    this.buttons?.forEach((button) => {
      // This loop already skips the submit button, which is fine.
      // We keep the listeners for the other action buttons (random, clear, etc.)
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
    // Remove the listener from the form's submit event (if it was ever added)
    // this.seedForm?.removeEventListener('submit', this.handleSeedSubmit);

    // Find the specific submit button again
    const submitButton = this.seedForm?.querySelector(
      'teskooano-button[type="submit"]',
    );
    // Remove the click listener DIRECTLY from the submit button
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
    event.preventDefault(); // Keep this!
    console.log("handleSeedSubmit triggered via BUTTON CLICK."); // Updated log message

    if (this._isGenerating) {
      console.log("Submit prevented: _isGenerating is true.");
      return;
    }

    const seed = this.seedInput?.value.trim() ?? ""; // Use empty string if null/undefined
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
        'teskooano-button[type="submit"]',
      );
      if (submitButton)
        this.showFeedback(submitButton as HTMLElement, "⚠️", true);

      setTimeout(() => {
        this.seedInput?.classList.remove("error");
        this.seedInput?.setAttribute("placeholder", "Enter seed...");
      }, 2000);
      return;
    }

    console.log(`Validation passed. Proceeding with seed: "${seed}"`);
    this.setGenerating(true);

    try {
      console.log("Calling generateAndLoadSystem...");
      const success = await generateAndLoadSystem(seed, this.dockviewApi);
      // Feedback is now implicitly handled by store updates triggering updateDisplay
      if (!success) {
        console.error("System generation failed.");
        const submitButton = this.seedForm?.querySelector(
          'teskooano-button[type="submit"]',
        );
        if (submitButton)
          this.showFeedback(submitButton as HTMLElement, "❌", true, 3000);
      }
      console.log(`generateAndLoadSystem returned: ${success}`);
    } catch (error) {
      console.error("Error during generateAndLoadSystem call:", error);
      const submitButton = this.seedForm?.querySelector(
        'teskooano-button[type="submit"]',
      );
      if (submitButton)
        this.showFeedback(submitButton as HTMLElement, "❌", true, 3000);
    } finally {
      console.log("Resetting generating state.");
      this.setGenerating(false);
    }
  };

  /**
   * Handles clicks on buttons with `data-action` attributes.
   * Dispatches calls to specific handler methods based on the action.
   * @param {Event} event - The click event object.
   * @private
   */
  private handleActionClick = async (event: Event) => {
    if (this._isGenerating) return;

    const button = event.currentTarget as HTMLElement;
    const action = button.dataset.action;

    if (!action) return;
    console.log("Action clicked:", action);

    this.setGenerating(true);
    let result: SystemActions.ActionResult | null = null;

    try {
      switch (action) {
        case "export":
          result = await this._handleExport();
          break;
        case "import":
          result = await this._handleImport();
          break;
        case "random":
          result = await this._handleRandom();
          break;
        case "clear":
          result = await this._handleClear();
          break;
        case "create-blank":
          result = await this._handleCreateBlank();
          break;
        case "copy-seed":
          result = await this._handleCopySeed();
          break;
        default:
          console.warn(`Unhandled action: ${action}`);
          // Keep generating false if action is unhandled
          this.setGenerating(false);
          return; // Exit early for unhandled actions
      }

      // Show feedback based on the result from the action handlers
      if (result) {
        this.showFeedback(button, result.symbol, !result.success);
      } else {
        // Handle cases where the action handler didn't return a result (e.g., import cancelled)
        console.log(`Action '${action}' completed without explicit feedback.`);
      }
    } catch (error) {
      // Catch errors from the action handlers themselves (e.g., file dialog rejection)
      console.error(`Error during action '${action}':`, error);
      const message = error instanceof Error ? error.message : "Unknown error";
      // Show generic error feedback if the action handler failed unexpectedly
      // unless it's a cancellation error we want to ignore visually.
      if (message !== "File selection cancelled.") {
        this.showFeedback(button, "❌", true);
      }
    } finally {
      // Always reset generating state unless it was already reset (e.g., for unhandled action)
      if (this._isGenerating) {
        this.setGenerating(false);
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
      // Trigger the dialog first
      const file = await SystemActions.triggerImportDialog();
      // If the promise resolved, a file was selected
      return await SystemActions.importSystem(file, this.dockviewApi);
    } catch (error) {
      // Handle cancellation (triggerImportDialog rejects on cancel)
      if (
        error instanceof Error &&
        error.message === "File selection cancelled."
      ) {
        console.log("Import cancelled by user.");
        return null; // Indicate cancellation, no feedback needed
      } else {
        // Handle other errors during file selection/dialog
        console.error("Error triggering import dialog:", error);
        throw error; // Re-throw to be caught by handleActionClick
      }
    }
  }

  /** @private Handles the 'random' action. */
  private async _handleRandom(): Promise<SystemActions.ActionResult> {
    return await SystemActions.generateRandomSystem(this.dockviewApi);
  }

  /** @private Handles the 'clear' action. */
  private async _handleClear(): Promise<SystemActions.ActionResult> {
    if (
      !confirm(
        "Are you sure you want to clear the current system? This cannot be undone.",
      )
    ) {
      // If user cancels confirmation, return a 'cancelled' state
      return { success: false, symbol: "🚫", message: "Clear cancelled." };
    }
    return await SystemActions.clearSystem();
  }

  /** @private Handles the 'create-blank' action. */
  private async _handleCreateBlank(): Promise<SystemActions.ActionResult> {
    return await SystemActions.createBlankSystem();
  }

  /** @private Handles the 'copy-seed' action. */
  private async _handleCopySeed(): Promise<SystemActions.ActionResult> {
    const seed = currentSeed.get();
    return await SystemActions.copySystemSeed(seed);
  }

  // --- End Private Action Handlers ---

  /**
   * Sets the generating state of the component, updating the UI accordingly.
   * @param {boolean} isGenerating - True if the component should be in a loading state, false otherwise.
   * @private
   */
  private setGenerating(isGenerating: boolean) {
    if (this._isGenerating === isGenerating) return; // No change
    this._isGenerating = isGenerating;
    this.updateDisplay(celestialObjectsStore.get(), currentSeed.get());
  }

  /**
   * Displays temporary feedback (a symbol) within a target element (usually a button).
   * Replaces the element's content temporarily and restores it after a duration.
   * @param {HTMLElement} element - The HTML element to display feedback within.
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
    // Find the icon span within the button if possible
    const targetElement = element; // The button itself
    const originalContentHTML = targetElement.innerHTML; // Store original SVG etc.

    // Create feedback span
    const feedback = document.createElement("span");
    feedback.className = `feedback ${isError ? "error" : ""}`;
    feedback.textContent = symbol;
    feedback.style.display = "inline-block"; // Ensure it's visible

    // Temporarily replace or append
    targetElement.innerHTML = ""; // Clear original content (SVG)
    targetElement.appendChild(feedback);

    setTimeout(() => {
      targetElement.innerHTML = originalContentHTML;
    }, duration);
  }

  /** Public getter for the mobile state. */
  public isMobile(): boolean {
    return this._isMobile;
  }

  /** Public getter for the generating state. */
  public isGenerating(): boolean {
    return this._isGenerating;
  }
}

customElements.define("system-controls", SystemControls);

// Export for potential external usage or typing
export { SystemControls };
