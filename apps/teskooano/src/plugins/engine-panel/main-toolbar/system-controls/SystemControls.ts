import { celestialObjectsStore, currentSeed } from "@teskooano/core-state";
import { type CelestialObject } from "@teskooano/data-types";
import { execute } from "@teskooano/ui-plugin";
import type { TeskooanoButton } from "../../../../core/components/button/Button.js";
import {
  CheckmarkIcon,
  CopyIcon,
  DeleteIcon,
  DocumentAddIcon,
  FolderOpenIcon,
  SaveIcon,
  SparkleIcon,
  SystemControlsTemplate,
} from "./SystemControls.template.js";
import * as SystemControlsUI from "./system-controls.ui.js";

/**
 * @element teskooano-system-controls
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
   * Lifecycle callback executed when the element is connected to the DOM.
   * @internal
   */
  connectedCallback() {
    // Cache DOM elements
    this.container =
      this.shadowRoot?.querySelector(".teskooano-system-controls-container") ||
      null;
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

    // --- Add Tooltips ---
    this.setupTooltips();
  }

  /**
   * Lifecycle callback executed when the element is disconnected from the DOM.
   * @internal
   */
  disconnectedCallback() {
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
        // TODO: Still need systemName source
        this.updateDisplay(objects, currentSeed.get()); // Pass objects map
      },
    );
    this.unsubscribers.push(unsubObjects);

    // Current Seed subscription remains the same
    const unsubSeed = currentSeed.subscribe((seed: string) => {
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

    if (this._isGenerating) {
      return;
    }

    const seed = this.seedInput?.value.trim() ?? ""; // Use empty string if null/undefined

    // Basic validation feedback
    if (!seed && this.seedInput) {
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

    this.setGenerating(true);

    try {
      const result = await execute("system:generate_random", { seed: seed });

      const success = (result as any)?.success;
      // Feedback is now implicitly handled by store updates triggering updateDisplay
      if (success === false) {
        console.error("System generation failed.");
        const submitButton = this.seedForm?.querySelector(
          'teskooano-button[type="submit"]',
        );
        if (submitButton)
          this.showFeedback(submitButton as HTMLElement, "❌", true, 3000);
      }
    } catch (error) {
      console.error("Error during system:generate_random call:", error);
      const submitButton = this.seedForm?.querySelector(
        'teskooano-button[type="submit"]',
      );
      if (submitButton)
        this.showFeedback(submitButton as HTMLElement, "❌", true, 3000);
    } finally {
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

    this.setGenerating(true);
    let result: any | null = null;

    try {
      switch (action) {
        case "export":
          result = await execute("system:export");
          break;
        case "import":
          result = await execute("system:trigger_import_dialog");
          break;
        case "random":
          result = await execute("system:generate_random");
          break;
        case "clear":
          if (
            confirm(
              "Are you sure you want to clear the current system? This cannot be undone.",
            )
          ) {
            result = await execute("system:clear");
          } else {
            result = {
              success: false,
              symbol: "🚫",
              message: "Clear cancelled.",
            };
          }
          break;
        case "create-blank":
          result = await execute("system:create_blank");
          break;
        case "copy-seed":
          result = await execute("system:copy_seed", {
            seed: currentSeed.get(),
          });
          break;
        default:
          console.warn(`Unhandled action: ${action}`);
          this.setGenerating(false);
          return;
      }

      // Show feedback based on the result from the action handlers
      if (result) {
        this.showFeedback(button, result.symbol, !result.success);
      } else {
        // Handle cases where the action handler didn't return a result (e.g., import cancelled)
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

  /**
   * Iterates through buttons and sets tooltip attributes based on action.
   * @private
   */
  private setupTooltips(): void {
    const submitButton = this.seedForm?.querySelector(
      'teskooano-button[type="submit"]',
    ) as TeskooanoButton | null;

    if (submitButton) {
      this.setButtonTooltip(
        submitButton,
        "Generate",
        "Generate system from entered seed",
        CheckmarkIcon,
      );
    }

    this.buttons?.forEach((button) => {
      const actionButton = button as TeskooanoButton; // Cast to specific type
      const action = actionButton.dataset.action;
      switch (action) {
        case "random":
          this.setButtonTooltip(
            actionButton,
            "Random Seed",
            "Generate system using a random seed",
            SparkleIcon,
          );
          break;
        case "clear":
          this.setButtonTooltip(
            actionButton,
            "Clear System",
            "Clear all objects from the current system",
            DeleteIcon,
          );
          break;
        case "export":
          this.setButtonTooltip(
            actionButton,
            "Export System",
            "Export current system objects and seed to a JSON file",
            SaveIcon,
          );
          break;
        case "import":
          this.setButtonTooltip(
            actionButton,
            "Import System",
            "Import system from a JSON file",
            FolderOpenIcon,
          );
          break;
        case "create-blank":
          this.setButtonTooltip(
            actionButton,
            "New Blank",
            "Create a new blank system with just a star",
            DocumentAddIcon,
          );
          break;
        case "copy-seed":
          this.setButtonTooltip(
            actionButton,
            "Copy Seed",
            "Copy the current system seed to the clipboard",
            CopyIcon,
          );
          break;
        // Add cases for other buttons if they exist
      }
    });
  }

  /**
   * Helper to set tooltip attributes on a button.
   * @param button The button element.
   * @param title Tooltip title.
   * @param text Tooltip descriptive text.
   * @param iconSvg Optional SVG string for the tooltip icon.
   * @private
   */
  private setButtonTooltip(
    button: TeskooanoButton | null,
    title: string | null,
    text: string | null,
    iconSvg: string | null,
  ): void {
    if (!button) return;
    // Set attributes - the button component handles native title suppression
    if (title) button.setAttribute("tooltip-title", title);
    else button.removeAttribute("tooltip-title");

    if (text) button.setAttribute("tooltip-text", text);
    else button.removeAttribute("tooltip-text");

    if (iconSvg) button.setAttribute("tooltip-icon-svg", iconSvg);
    else button.removeAttribute("tooltip-icon-svg");
  }
}

// Export for potential external usage or typing
export { SystemControls };
