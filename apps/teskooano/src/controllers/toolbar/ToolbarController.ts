import type { AddPanelOptions, DockviewApi } from "dockview-core";
import "../../components/toolbar/SimulationControls.js"; // Import for side effect (registers element)
import "../../components/toolbar/SystemControls.js"; // ADDED BACK
import type { SystemControls } from "../../components/toolbar/SystemControls.js"; // ADDED BACK
import { DockviewController } from "../dockview/DockviewController.js";
import {
  createToolbarHandlers,
  type ToolbarTemplateHandlers, // Use the correct handler type
} from "./ToolbarController.handlers.js"; // Import the correct handler type
import {
  renderToolbarTemplate,
  type ToolbarTemplateData,
  // type ToolbarTemplateHandlers as TemplateHandlers, // REMOVE incorrect import alias
} from "./ToolbarController.template.js";

/**
 * ToolbarController is responsible for managing the toolbar and adding engine views.
 * It orchestrates the creation of the toolbar UI via a template and manages
 * interactions with Dockview and other controllers.
 */
export class ToolbarController {
  /**
   * The DOM element that the toolbar will be added to.
   */
  private _element: HTMLElement;
  /**
   * The DockviewController that the toolbar will use to add panels.
   */
  private _dockviewController: DockviewController;
  /**
   * Track if we're on a mobile device
   */
  private _isMobileDevice: boolean = false;

  // Cache toolbar elements populated by the template
  private _githubButton: HTMLElement | null = null;
  private _settingsButton: HTMLElement | null = null;
  private _tourButton: HTMLElement | null = null;
  private _addButton: HTMLElement | null = null;
  private _simControls: HTMLElement | null = null;
  private _systemControls: SystemControls | null = null; // ADDED BACK

  // Handlers
  // Use the specific type returned by createToolbarHandlers
  private _handlers: ToolbarTemplateHandlers;

  // GitHub repository URL - CORRECTED back to original
  private readonly GITHUB_REPO_URL = "https://github.com/tanepiper/teskooano";

  /**
   * Constructor for the ToolbarController.
   * @param element - The DOM element that the toolbar will be added to.
   * @param dockviewController - The DockviewController that the toolbar will use to add panels.
   */
  constructor(element: HTMLElement, dockviewController: DockviewController) {
    this._element = element;
    this._dockviewController = dockviewController;

    // Detect initial mobile state
    this._isMobileDevice = this.detectMobileDevice();

    // Create handlers directly using the updated signature
    // Pass the bound methods needed by the handlers
    this._handlers = createToolbarHandlers(
      this, // Pass the controller instance
    );

    // Set up resize listener - We need a separate handler for this
    window.addEventListener("resize", this.handleResize);

    // Initial render
    this.createToolbar();
  }

  // --- Resize Handler --- // ADDED BACK
  /**
   * Handle window resize events to update mobile detection and UI
   */
  private handleResize = () => {
    const wasMobile = this._isMobileDevice;
    const isNowMobile = this.detectMobileDevice();
    // Only update if the mobile state actually changed
    if (wasMobile !== isNowMobile) {
      this.updateToolbarForMobileState();
    }
  };
  // --- End Resize Handler ---

  /**
   * Detect if the current device is a mobile device
   */
  public detectMobileDevice(): boolean {
    // Check screen width - consider anything under 768px as mobile
    const isMobileWidth = window.innerWidth < 768;
    // Also check user agent for mobile devices
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent,
      );
    // Update internal state
    this._isMobileDevice = isMobileWidth || isMobileDevice;
    return this._isMobileDevice;
  }

  /**
   * Cleanup event listeners when controller is destroyed
   */
  public destroy(): void {
    // Remove the resize listener
    window.removeEventListener("resize", this.handleResize);
  }

  /**
   * Updates the toolbar elements based on the current mobile state.
   * PUBLIC: Called by the resize handler.
   */
  public updateToolbarForMobileState(): void {
    // Update gap
    this._element.style.gap = this._isMobileDevice
      ? "var(--space-xs, 4px)"
      : "var(--space-md, 12px)";

    // Toggle mobile attribute on cached elements
    this._tourButton?.toggleAttribute("mobile", this._isMobileDevice);
    this._addButton?.toggleAttribute("mobile", this._isMobileDevice);
    this._simControls?.toggleAttribute("mobile", this._isMobileDevice);
  }

  // --- Private Methods ---

  /**
   * Creates/re-creates the toolbar using the template and attaches handlers.
   */
  private createToolbar(): void {
    const templateData: ToolbarTemplateData = {
      isMobile: this._isMobileDevice,
    };

    // Ensure the handlers object exists before accessing its properties
    if (!this._handlers) {
      console.error(
        "ToolbarController: Handlers not initialized before createToolbar call.",
      );
      return; // Avoid errors if constructor logic changes
    }

    // Pass the handler functions directly to the template renderer
    // No type casting needed as _handlers should match ToolbarTemplateHandlers
    const templateHandlers: ToolbarTemplateHandlers = this._handlers;

    // Render the template, passing the container, handlers, and data
    const elements = renderToolbarTemplate(
      this._element,
      templateHandlers,
      templateData,
    );

    // Cache the created elements
    this._githubButton = elements.githubButton;
    this._settingsButton = elements.settingsButton;
    this._tourButton = elements.tourButton;
    this._addButton = elements.addButton;
    this._simControls = elements.simControls;
    this._systemControls = elements.systemControls as SystemControls; // ADDED BACK

    // Pass Dockview API to SystemControls after it's defined - ADDED BACK
    this.passApiToSystemControlsWhenDefined();

    // Apply initial mobile state visuals
    this.updateToolbarForMobileState(); // Ensure initial state is applied
  }

  // --- ADDED BACK: Method to pass API to SystemControls ---
  /**
   * Passes the Dockview API to the SystemControls component *after* ensuring
   * the custom element is defined.
   */
  private passApiToSystemControlsWhenDefined(): void {
    const systemControlsElement = this._systemControls;
    const dockviewApi = this._dockviewController.api;

    if (systemControlsElement && dockviewApi) {
      customElements
        .whenDefined("system-controls")
        .then(() => {
          console.log(
            "ToolbarController: system-controls defined. Attempting to set Dockview API.",
          );
          if (typeof systemControlsElement.setDockviewApi === "function") {
            systemControlsElement.setDockviewApi(dockviewApi);
            console.log(
              "ToolbarController: Dockview API successfully passed to SystemControls.",
            );
          } else {
            console.error(
              "ToolbarController: SystemControls defined, but setDockviewApi method not found!",
            );
          }
        })
        .catch((error) => {
          console.error(
            "ToolbarController: Error waiting for system-controls definition:",
            error,
          );
        });
    } else if (!systemControlsElement) {
      console.error(
        "ToolbarController: Cannot pass API, systemControls element not found.",
      );
    } else {
      console.error(
        "ToolbarController: Cannot pass API, Dockview API is not available.",
      );
    }
  }
  // --- END ADDED BACK ---

  /**
   * Opens the GitHub repository in a new window/tab
   * PUBLIC: Called by the github button handler.
   */
  public openGitHubRepo(): void {
    window.open(this.GITHUB_REPO_URL, "_blank");
  }
}
