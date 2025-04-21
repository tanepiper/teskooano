import "../shared/Button.ts";
import {
  actions,
  celestialObjectsStore,
  currentSeed,
} from "@teskooano/core-state";
import { CelestialType, type CelestialObject } from "@teskooano/data-types";
import { generateStar } from "@teskooano/procedural-generation";
import { DockviewApi } from "dockview-core";
import { OSVector3 } from "@teskooano/core-math";
import { generateAndLoadSystem } from "../../systems/system-generator.js";
import { SystemControlsTemplate } from "./SystemControls.template";

function createDefaultStar(): CelestialObject {
  return generateStar(Math.random);
}

interface SystemImportData {
  seed: string;
  objects: CelestialObject[];
}

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

  public tourRandomSeed() {
    const randomSeed = Math.random().toString(36).substring(2, 10); // Simple random seed
    console.log("Generating random system with seed:", randomSeed);
    this.handleSeedSubmit({ preventDefault: () => {} } as Event);
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

    // --- Export Action ---
    if (action === "export") {
      try {
        this.setGenerating(true); // Indicate activity
        const seed = currentSeed.get();
        const objectsMap = celestialObjectsStore.get();
        const objectsArray = Object.values(objectsMap);

        if (objectsArray.length === 0) {
          console.warn("Nothing to export.");
          this.showFeedback(button, "🤷", false, 2000); // Maybe a "nothing to export" icon?
          return; // Exit early
        }

        const exportData: SystemImportData = {
          seed: seed || "", // Ensure seed is a string
          objects: objectsArray,
        };

        const jsonString = JSON.stringify(exportData, null, 2); // Pretty print JSON
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `teskooano-system-${seed || Date.now()}.json`; // Filename with seed or timestamp
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log("System exported successfully.");
        this.showFeedback(button, "💾"); // Export icon
      } catch (error) {
        console.error("Error exporting system:", error);
        this.showFeedback(button, "❌", true);
      } finally {
        this.setGenerating(false);
      }
      return; // Handled
    }

    // --- Import Action ---
    if (action === "import") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.style.display = "none"; // Keep it hidden

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          console.log("No file selected.");
          // No explicit feedback needed if user cancels dialog
          return;
        }

        this.setGenerating(true); // Show loading state
        const reader = new FileReader();

        reader.onload = async (event) => {
          try {
            const fileContent = event.target?.result as string;
            if (!fileContent) throw new Error("File content is empty.");

            const parsedData = JSON.parse(fileContent) as SystemImportData;

            // --- Basic Validation ---
            if (
              !parsedData ||
              typeof parsedData !== "object" ||
              typeof parsedData.seed !== "string" ||
              !Array.isArray(parsedData.objects)
            ) {
              throw new Error(
                "Invalid file format. Expected { seed: string, objects: CelestialObject[] }.",
              );
            }

            // --- Hydrate Physics State Vectors ---
            const hydratedObjects = parsedData.objects.map((obj) => {
              if (obj.physicsStateReal) {
                // Ensure position_m is an OSVector3 instance
                if (
                  obj.physicsStateReal.position_m &&
                  !(obj.physicsStateReal.position_m instanceof OSVector3)
                ) {
                  // Use 'as any' to access properties on the plain JS object
                  const pos = obj.physicsStateReal.position_m as any;
                  obj.physicsStateReal.position_m = new OSVector3(
                    pos.x,
                    pos.y,
                    pos.z,
                  );
                }
                // Ensure velocity_mps is an OSVector3 instance
                if (
                  obj.physicsStateReal.velocity_mps &&
                  !(obj.physicsStateReal.velocity_mps instanceof OSVector3)
                ) {
                  // Use 'as any' to access properties on the plain JS object
                  const vel = obj.physicsStateReal.velocity_mps as any;
                  obj.physicsStateReal.velocity_mps = new OSVector3(
                    vel.x,
                    vel.y,
                    vel.z,
                  );
                }
              }
              return obj;
            });
            // --- End Hydration ---

            console.log(
              `Importing system with seed "${parsedData.seed}" and ${hydratedObjects.length} objects...`,
            );

            // 1. Clear existing state
            actions.clearState({
              resetCamera: false, // Keep camera position for now
              resetTime: true,
              resetSelection: true,
            });
            actions.resetTime(); // Ensure time resets

            // 2. Set the seed (REMOVED - Assuming createSolarSystem handles this)
            // actions.setSeed(parsedData.seed);

            // 3. Load the objects (using hydratedObjects)
            // No batch action available, load individually.
            console.warn(
              "No batch load action found, attempting manual load (may be slow/incomplete).",
            );
            // Find the star first for createSolarSystem
            const star = hydratedObjects.find(
              (obj) => obj.type === CelestialType.STAR && obj.parentId == null,
            ); // Basic check for primary star

            if (!star) {
              throw new Error(
                "Could not find a primary star in imported data.",
              );
            }

            // Load the primary star (this might set the seed indirectly)
            actions.createSolarSystem(star);

            // Load remaining objects
            hydratedObjects.forEach((obj) => {
              if (obj.id !== star.id) {
                // Check if addCelestialObject exists (based on previous linter hint)
                if (typeof actions.addCelestialObject === "function") {
                  actions.addCelestialObject(obj); // Add others
                } else {
                  // Fallback if addCelestialObject also doesn't exist
                  console.error(
                    `Cannot add object ${obj.name} (ID: ${obj.id}) - actions.addCelestialObject missing.`,
                  );
                  // Optionally throw an error here or continue processing others
                }
              }
            });

            console.log("System imported successfully.");
            this.showFeedback(button, "✅"); // Success icon

            // Dispatch event to reset the simulation loop's internal timer
            window.dispatchEvent(new CustomEvent("resetSimulationTime"));
            console.log("Dispatched resetSimulationTime event.");
          } catch (error) {
            console.error("Error importing system:", error);
            this.showFeedback(
              button,
              "❌",
              true,
              3000, // Show error longer
            );
          } finally {
            this.setGenerating(false); // Hide loading state
            document.body.removeChild(input); // Clean up the input element
          }
        };

        reader.onerror = (error) => {
          console.error("Error reading file:", error);
          this.showFeedback(button, "❌", true, 3000);
          this.setGenerating(false);
          document.body.removeChild(input);
        };

        reader.readAsText(file); // Start reading the file
      };

      // Add to body, click, and set up removal in the callbacks
      document.body.appendChild(input);
      input.click();
      // Cleanup is handled within the onload/onerror callbacks now

      return; // Handled
    }

    // --- End Import Action ---

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
      return;
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
      return;
    }

    console.warn(`Unhandled action: ${action}`);
  };

  private setGenerating(isGenerating: boolean) {
    if (this._isGenerating === isGenerating) return; // No change
    this._isGenerating = isGenerating;
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
      targetElement.innerHTML = originalContentHTML;
    }, duration);
  }
}

customElements.define("system-controls", SystemControls);

// Export for potential external usage or typing
export { SystemControls };
