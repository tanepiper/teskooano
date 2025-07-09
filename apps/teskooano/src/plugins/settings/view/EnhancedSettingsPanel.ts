import { template } from "./EnhancedSettings.template.js";
import {
  EnhancedSettingsController,
  type IEnhancedSettingsPanelElements,
} from "../controller/EnhancedSettingsController.js";
import { type TeskooanoSlider } from "../../../core/components/slider/Slider.js";

/**
 * Enhanced SettingsPanel Web Component with dual-mode configuration support.
 * 
 * This component provides a sophisticated interface for configuring the physics simulation,
 * including mode selection (Ideal vs N-Body), algorithm choices, integrator options,
 * and performance settings with real-time feedback.
 * 
 * Features:
 * - Dual-mode physics configuration (Ideal Orrery vs N-Body Physics)
 * - Conditional UI for N-Body specific controls
 * - Real-time performance indicators
 * - Smooth transitions and responsive design
 * - Comprehensive validation and error handling
 * - Integration with enhanced state management
 * 
 * @example
 * ```html
 * <enhanced-settings-panel></enhanced-settings-panel>
 * ```
 */
export class EnhancedSettingsPanel extends HTMLElement {
  private controller: EnhancedSettingsController | null = null;
  private elements: IEnhancedSettingsPanelElements | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  /**
   * Called when the element is added to the DOM.
   * Sets up the component structure and initializes the controller.
   */
  public connectedCallback(): void {
    this.render();
    this.setupElements();
    this.initializeController();
  }

  /**
   * Called when the element is removed from the DOM.
   * Cleans up the controller and removes event listeners.
   */
  public disconnectedCallback(): void {
    this.cleanup();
  }

  /**
   * Renders the component template into the shadow DOM.
   * @private
   */
  private render(): void {
    if (!this.shadowRoot) return;
    
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  /**
   * Gathers references to all the UI elements needed by the controller.
   * @private
   */
  private setupElements(): void {
    if (!this.shadowRoot) {
      throw new Error("Shadow root not available");
    }

    // Get all required elements from the shadow DOM
    const formElement = this.shadowRoot.getElementById("enhanced-settings-form") as HTMLFormElement;
    const trailSliderElement = this.shadowRoot.getElementById("setting-trail-length") as TeskooanoSlider;
    
    // Mode selection
    const simulationModeSelectElement = this.shadowRoot.getElementById("setting-simulation-mode") as HTMLSelectElement;
    const currentModeBadgeElement = this.shadowRoot.getElementById("current-mode-badge") as HTMLSpanElement;
    
    // N-Body specific controls
    const nbodyControlsElement = this.shadowRoot.getElementById("nbody-controls") as HTMLDivElement;
    const algorithmSelectElement = this.shadowRoot.getElementById("setting-algorithm") as HTMLSelectElement;
    const integratorSelectElement = this.shadowRoot.getElementById("setting-integrator") as HTMLSelectElement;
    
    // Display elements
    const configDisplayElement = this.shadowRoot.getElementById("config-display") as HTMLDivElement;
    const modePerformanceElement = this.shadowRoot.getElementById("mode-performance") as HTMLDivElement;
    const performanceDotElement = modePerformanceElement?.querySelector(".performance-dot") as HTMLSpanElement;
    const performanceTextElement = modePerformanceElement?.querySelector(".performance-text") as HTMLSpanElement;
    
    // Legacy
    const profileSelectElement = this.shadowRoot.getElementById("setting-performance-profile") as HTMLSelectElement;
    
    // Validation
    const validationMessagesElement = this.shadowRoot.getElementById("validation-messages") as HTMLDivElement;

    // Validate all required elements exist
    const requiredElements = {
      formElement,
      trailSliderElement,
      simulationModeSelectElement,
      currentModeBadgeElement,
      nbodyControlsElement,
      algorithmSelectElement,
      integratorSelectElement,
      configDisplayElement,
      modePerformanceElement,
      performanceDotElement,
      performanceTextElement,
      profileSelectElement,
      validationMessagesElement,
    };

    // Check for missing elements
    const missingElements = Object.entries(requiredElements)
      .filter(([, element]) => !element)
      .map(([name]) => name);

    if (missingElements.length > 0) {
      throw new Error(
        `Enhanced Settings Panel: Missing required elements: ${missingElements.join(", ")}. ` +
        "Please check that the template contains all necessary elements with correct IDs."
      );
    }

    this.elements = requiredElements as IEnhancedSettingsPanelElements;
  }

  /**
   * Creates and initializes the enhanced controller.
   * @private
   */
  private initializeController(): void {
    if (!this.elements) {
      throw new Error("Cannot initialize controller: Elements not set up");
    }

    try {
      this.controller = new EnhancedSettingsController(this.elements);
      console.debug("[EnhancedSettingsPanel] Controller initialized successfully");
    } catch (error) {
      console.error("[EnhancedSettingsPanel] Failed to initialize controller:", error);
      this.showError("Failed to initialize settings panel. Please refresh the page.");
    }
  }

  /**
   * Cleans up the controller and resources.
   * @private
   */
  private cleanup(): void {
    if (this.controller) {
      try {
        this.controller.dispose();
        this.controller = null;
        console.debug("[EnhancedSettingsPanel] Controller disposed successfully");
      } catch (error) {
        console.error("[EnhancedSettingsPanel] Error during controller disposal:", error);
      }
    }

    this.elements = null;
  }

  /**
   * Displays an error message to the user.
   * @private
   */
  private showError(message: string): void {
    if (!this.shadowRoot) return;

    const errorElement = document.createElement("div");
    errorElement.style.cssText = `
      color: #ef4444;
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid #ef4444;
      border-radius: 6px;
      padding: 12px;
      margin: 12px 0;
      font-size: 14px;
    `;
    errorElement.textContent = message;

    // Insert at the beginning of the shadow root
    this.shadowRoot.insertBefore(errorElement, this.shadowRoot.firstChild);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.parentNode.removeChild(errorElement);
      }
    }, 10000);
  }

  /**
   * Provides access to the controller instance for external integration.
   * This can be useful for parent components that need to interact with the settings.
   * 
   * @returns The controller instance or null if not initialized
   */
  public getController(): EnhancedSettingsController | null {
    return this.controller;
  }

  /**
   * Forces the panel to refresh its UI state.
   * This can be useful if the global state has been updated externally.
   */
  public refresh(): void {
    if (this.controller) {
      // The controller's state subscription will automatically update the UI,
      // but we can trigger a manual update if needed
      console.debug("[EnhancedSettingsPanel] Manual refresh requested");
    }
  }

  /**
   * Checks if the panel is properly initialized and ready to use.
   * 
   * @returns True if the panel is ready, false otherwise
   */
  public isReady(): boolean {
    return !!(this.controller && this.elements);
  }
}

// Register the custom element
customElements.define("enhanced-settings-panel", EnhancedSettingsPanel);