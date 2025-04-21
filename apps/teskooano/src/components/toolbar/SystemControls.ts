import "../shared/Button.ts"; // Import the custom button component
// Import state management and the new generator
import {
  actions,
  celestialObjectsStore,
  currentSeed,
} from "@teskooano/core-state";
import type { CelestialObject } from "@teskooano/data-types"; // Import type for store
import { generateStar } from "@teskooano/procedural-generation";
import { DockviewApi } from "dockview-core";
import { generateAndLoadSystem } from "../../systems/system-generator.js";
import { SystemControlsTemplate } from "./SystemControls.template";

// --- Helper Function for Default Star ---
function createDefaultStar(): CelestialObject {
  return generateStar(Math.random);
}
// --- End Helper Function ---

class SystemControls extends HTMLElement {
  // DOM elements
  private container: HTMLElement | null = null;
  private emptyState: HTMLElement | null = null;
  private loadedState: HTMLElement | null = null;
  private seedInput: HTMLInputElement | null = null;
  private seedForm: HTMLFormElement | null = null;
  private systemSeedEl: HTMLElement | null = null;
  private celestialCountEl: HTMLElement | null = null;
  private buttons: NodeListOf<HTMLElement> | null = null;
  private loadingOverlay: HTMLElement | null = null;

  // State & Properties
  private _isMobile: boolean = false;
  private _isGenerating: boolean = false;
  private dockviewApi: DockviewApi | null = null;

  // Store Unsubscribers
  private unsubscribers: (() => void)[] = [];

  static get observedAttributes() {
    // Only observe mobile, other state comes from store
    return ["mobile"];
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(SystemControlsTemplate.content.cloneNode(true));
  }

  // Method to inject Dockview API
  public setDockviewApi(api: DockviewApi): void {
    this.dockviewApi = api;
    console.log("SystemControls: Dockview API set.");
  }

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
    this.updateButtonSizes(); // Apply initial mobile state if present
    // Set initial seed input value
    if (this.seedInput) {
      this.seedInput.value = currentSeed.get() || "";
    }
  }

  disconnectedCallback() {
    console.log("SystemControls disconnected");
    this.removeEventListeners();
    // Unsubscribe from all stores
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
  }

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

  private subscribeToStores() {
    // Subscribe to celestialObjectsStore
    const unsubObjects = celestialObjectsStore.subscribe(
      (objects: Record<string, CelestialObject>) => {
        // Subscribe to correct store
        console.log("SystemControls: celestialObjectsStore updated", objects);
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

  private updateButtonSizes() {
    const size = this._isMobile ? "sm" : ""; // Use 'sm' for mobile, default otherwise
    this.buttons?.forEach((button) => {
      // Only apply if size makes sense (don't remove size from primary submit?)
      // Let's apply size="sm" to all buttons on mobile for consistency
      if (this._isMobile) {
        button.setAttribute("size", "sm");
      } else {
        // Remove 'sm' size if not mobile, revert to potential default
        if (button.getAttribute("size") === "sm") {
          // Check if it's the primary submit button, maybe keep its default size?
          // For simplicity, let's remove 'sm' from all for now.
          // We can refine this if needed.
          button.removeAttribute("size");
        }
      }

      // Special handling for seed form submit button text based on mobile
      const submitButton = this.seedForm?.querySelector(
        'teskooano-button[type="submit"]',
      );
      const submitText = submitButton?.querySelector('span:not([slot="icon"])');
      if (submitText) {
        (submitText as HTMLElement).style.display = this._isMobile
          ? "none"
          : "";
      }
      const submitIcon = submitButton?.querySelector('span[slot="icon"]');
      if (submitIcon) {
        (submitIcon as HTMLElement).style.marginRight = this._isMobile
          ? "0"
          : "";
      }
    });
  }

  private updateDisplay(
    objects: Record<string, CelestialObject>,
    seed: string,
  ) {
    const objectCount = Object.keys(objects).length;
    const systemLoaded = objectCount > 0;

    // Update visibility based on system state
    if (this.emptyState && this.loadedState) {
      this.emptyState.style.display = systemLoaded ? "none" : "";
      this.loadedState.style.display = systemLoaded ? "" : "none";
    }

    // Update system info when loaded
    if (systemLoaded) {
      const count = objectCount;
      const currentSystemSeed = seed || "---------";
      if (this.systemSeedEl) {
        this.systemSeedEl.textContent = currentSystemSeed;
        this.systemSeedEl.title = `Seed: ${currentSystemSeed}`;
      }
      if (this.celestialCountEl) {
        this.celestialCountEl.textContent = `${count} Celestial${count !== 1 ? "s" : ""}`;
      }
    } else {
      // Ensure seed input is updated when in empty state
      // REMOVED: Don't force input value during general UI updates
      // if (this.seedInput && this.seedInput.value !== seed) {
      //   this.seedInput.value = seed;
      // }
    }

    // Toggle loading overlay
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = this._isGenerating ? "flex" : "none";
    }

    // Ensure buttons are enabled/disabled correctly based on generating state
    this.buttons?.forEach((button) => {
      (button as HTMLButtonElement).disabled = this._isGenerating;
    });

    // Re-apply mobile styles after potential state changes
    this.updateButtonSizes();
  }

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
    ); // Log seed value

    // Basic validation feedback
    if (!seed && this.seedInput) {
      console.log("Validation failed: Seed is empty after trimming."); // Log validation failure
      console.warn("Seed input is empty");
      this.seedInput.classList.add("error");
      this.seedInput.setAttribute("placeholder", "Seed cannot be empty!");
      // Use showFeedback on the button instead of timeout
      const submitButton = this.seedForm?.querySelector(
        'teskooano-button[type="submit"]',
      );
      if (submitButton)
        this.showFeedback(submitButton as HTMLElement, "⚠️", true);

      // Remove error state after a delay
      setTimeout(() => {
        this.seedInput?.classList.remove("error");
        this.seedInput?.setAttribute("placeholder", "Enter seed...");
      }, 2000);
      return; // Stop if seed is empty
    }

    console.log(`Validation passed. Proceeding with seed: "${seed}"`);
    this.setGenerating(true);

    try {
      console.log("Calling generateAndLoadSystem..."); // Log before call
      const success = await generateAndLoadSystem(seed, this.dockviewApi);
      // Feedback is handled by store updates triggering updateDisplay
      if (!success) {
        console.error("System generation failed.");
        // Optionally show an error feedback message
        const submitButton = this.seedForm?.querySelector(
          'teskooano-button[type="submit"]',
        );
        if (submitButton)
          this.showFeedback(submitButton as HTMLElement, "❌", true, 3000);
      }
      console.log(`generateAndLoadSystem returned: ${success}`); // Log result
    } catch (error) {
      console.error("Error during generateAndLoadSystem call:", error);
      // Optionally show an error feedback message
      const submitButton = this.seedForm?.querySelector(
        'teskooano-button[type="submit"]',
      );
      if (submitButton)
        this.showFeedback(submitButton as HTMLElement, "❌", true, 3000);
    } finally {
      console.log("Resetting generating state."); // Log before resetting state
      this.setGenerating(false);
    }
  };

  private handleActionClick = async (event: Event) => {
    if (this._isGenerating) return;

    const button = event.currentTarget as HTMLElement;
    const action = button.dataset.action;

    if (!action) return;
    console.log("Action clicked:", action);

    // Actions that trigger generation
    if (action === "random") {
      this.setGenerating(true);
      const randomSeed = Math.random().toString(36).substring(2, 10); // Simple random seed
      console.log("Generating random system with seed:", randomSeed);
      try {
        await generateAndLoadSystem(randomSeed, this.dockviewApi);
        this.showFeedback(button, "🎲"); // Feedback on the random button
      } catch (error) {
        console.error("Error during random generation:", error);
        this.showFeedback(button, "❌", true);
      } finally {
        this.setGenerating(false);
      }
      return; // Handled
    }

    // Actions that modify state directly or need confirmation
    if (action === "clear") {
      if (
        !confirm(
          "Are you sure you want to clear the current system? This cannot be undone.",
        )
      ) {
        return; // Abort if user cancels
      }
      console.log("Clearing system via action...");
      // Use clearState action directly
      actions.clearState({
        resetCamera: false,
        resetTime: true,
        resetSelection: true,
      });
      actions.resetTime(); // Ensure time resets
      // No need to dispatch system-action if handled here
      this.showFeedback(button, "🗑️");
      return; // Handled
    }

    if (action === "create-blank") {
      console.log("Creating blank system with default star...");
      // 1. Clear existing state
      actions.clearState({
        resetCamera: false,
        resetTime: true,
        resetSelection: true,
      });
      actions.resetTime();

      // 2. Create the default star object
      const defaultStar = createDefaultStar();

      // 3. Add the default star using createSolarSystem
      try {
        actions.createSolarSystem(defaultStar);
        console.log(`Default star "${defaultStar.name}" added to the system.`);
        // TODO: Still need a way to set the overall system name, e.g., "New System"
        console.warn(
          "[SystemControls] TODO: Need correct action/store to set systemName for blank system.",
        );
      } catch (error) {
        console.error("Error creating default solar system:", error);
        // Show error feedback maybe?
        this.showFeedback(button, "❌", true);
        return; // Stop if star creation failed
      }

      // 4. Show success feedback
      this.showFeedback(button, "📝");
      return; // Handled
    }

    // Actions handled via events or clipboard
    if (action === "copy-seed") {
      const seed = currentSeed.get(); // Get seed from store
      if (seed) {
        navigator.clipboard
          .writeText(seed)
          .then(() => {
            console.log("Seed copied to clipboard:", seed);
            this.showFeedback(button, "✓");
          })
          .catch((err) => {
            console.error("Failed to copy seed: ", err);
            this.showFeedback(button, "⚠️", true);
          });
      } else {
        console.warn("No seed available to copy.");
        this.showFeedback(button, "⚠️", true);
      }
      return; // Handled
    }

    // --- Actions dispatched as events for parent/app to handle ---
    if (action === "import" || action === "export") {
      console.log(`Dispatching system-action event: ${action}`);
      this.dispatchEvent(
        new CustomEvent("system-action", {
          detail: { action },
          bubbles: true,
          composed: true,
        }),
      );
      // Show temporary feedback maybe?
      // this.showFeedback(button, '...');
      return; // Handled by dispatching
    }

    // Fallback for unhandled actions
    console.warn(`Unhandled action: ${action}`);
  };

  private setGenerating(isGenerating: boolean) {
    if (this._isGenerating === isGenerating) return; // No change
    this._isGenerating = isGenerating;
    // Update UI immediately
    this.updateDisplay(celestialObjectsStore.get(), currentSeed.get());
  }

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
      // Restore original content
      targetElement.innerHTML = originalContentHTML; // Restore original SVG etc.
      // Ensure feedback element is removed if it wasn't replaced correctly (shouldn't happen now)
      // if (feedback.parentNode === targetElement) {
      //   targetElement.removeChild(feedback);
      // }
    }, duration);
  }
}

customElements.define("system-controls", SystemControls);

// Export for potential external usage or typing
export { SystemControls };
