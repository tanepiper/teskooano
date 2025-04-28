import type { AddPanelOptions, DockviewApi } from "dockview-core";
import "../../components/toolbar/SimulationControls.js"; // Import for side effect (registers element)
import "../../components/toolbar/SystemControls.js"; // ADDED BACK
import type { SystemControls } from "../../components/toolbar/SystemControls.js"; // ADDED BACK
import { DockviewController } from "../dockview/DockviewController.js";
import { TourController } from "../tourController.js";
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
   * The TourController for managing app tours.
   */
  private _tourController: TourController | null = null;
  /**
   * A counter specifically for engine views.
   */
  private _compositePanelCounter = 0;
  /**
   * Define a constant logical name for the engine group
   */
  private readonly ENGINE_GROUP_NAME = "engine_views";

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

  // Define a constant for the settings panel ID
  private readonly SETTINGS_PANEL_ID = "app_settings_panel";
  // GitHub repository URL
  private readonly GITHUB_REPO_URL = "https://github.com/tanepiper/teskooano";

  /**
   * Constructor for the ToolbarController.
   * @param element - The DOM element that the toolbar will be added to.
   * @param dockviewController - The DockviewController that the toolbar will use to add panels.
   * @param tourController - Optional TourController for managing app tours
   */
  constructor(
    element: HTMLElement,
    dockviewController: DockviewController,
    tourController?: TourController,
  ) {
    this._element = element;
    this._dockviewController = dockviewController;
    this._tourController = tourController || null;

    // Detect initial mobile state
    this._isMobileDevice = this.detectMobileDevice();

    // Create handlers directly using the updated signature
    this._handlers = createToolbarHandlers(
      this, // Pass the controller instance
      this._tourController, // Pass the tour controller instance (can be null)
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
   * Set the tour controller after initialization and re-render toolbar
   */
  public setTourController(tourController: TourController): void {
    this._tourController = tourController;
    this.createToolbar(); // Re-render to add/update tour button
  }

  /**
   * Public method to create the very first engine/UI panel group on initialization.
   */
  public initializeFirstEngineView(): void {
    // Ensure we only add the *first* view this way
    if (this._compositePanelCounter === 0) {
      // No need to explicitly ensure group exists here, addPanelToNamedGroup handles it
      this.addCompositeEnginePanel();
    } else {
      console.warn(
        "initializeFirstEngineView called but engine panels already exist.",
      );
    }
  }

  /**
   * Adds a new composite engine panel to the dedicated engine group.
   * PUBLIC: Called by the add view button handler.
   */
  public addCompositeEnginePanel(): void {
    // Use the logical group name directly
    const groupName = this.ENGINE_GROUP_NAME;

    this._compositePanelCounter++;
    const counter = this._compositePanelCounter;
    const compositeViewId = `composite_engine_view_${counter}`;
    const compositeViewTitle = `Teskooano ${counter}`;

    // Use the new controller method to add the panel to the named group
    const panelOptions: AddPanelOptions = {
      id: compositeViewId,
      component: "composite_engine_view", // New component type
      title: compositeViewTitle,
      params: {
        title: compositeViewTitle,
        dockviewController: this._dockviewController,
      },
    };

    try {
      // Create the composite engine panel using the controller method
      const compositePanel = this._dockviewController.addPanelToNamedGroup(
        groupName,
        panelOptions,
      );

      if (!compositePanel) {
        throw new Error(
          `Failed to add panel '${compositeViewId}' to group '${groupName}'`,
        );
      }

      // Activate the newly added panel (panel is already active by default)
      // compositePanel.api.setActive(); // Usually not needed if added via controller
    } catch (error) {
      console.error(
        `Failed to create engine window panels for counter ${counter}:`,
        error,
      );
    }
  }

  /**
   * Toggles the visibility of the floating settings panel.
   * PUBLIC: Called by the settings button handler.
   */
  public toggleSettingsPanel(): void {
    const existingPanel = this._dockviewController.api.panels.find(
      (p) => p.id === this.SETTINGS_PANEL_ID,
    );

    const panelWidth = 650;
    const panelHeight = 500;

    const centerWidth = window.innerWidth / 2 - panelWidth / 2;
    const centerHeight = window.innerHeight / 2 - panelHeight / 2;

    if (existingPanel) {
      existingPanel.api.close();
    } else {
      const settingsPanelOptions: AddPanelOptions = {
        id: this.SETTINGS_PANEL_ID,
        component: "settings_view", // Placeholder component name
        title: "Settings",
        floating: {
          position: { top: centerHeight, left: centerWidth },
          width: panelWidth,
          height: panelHeight,
        },
        params: {},
        // Consider making it non-closable via header x button if toggled only via toolbar
        // isClosable: false
      };
      try {
        this._dockviewController.api.addPanel(settingsPanelOptions);
      } catch (error) {
        console.error(
          `Failed to add settings panel ${this.SETTINGS_PANEL_ID}:`,
          error,
        );
      }
    }
  }

  /**
   * Opens the GitHub repository in a new window/tab
   * PUBLIC: Called by the github button handler.
   */
  public openGitHubRepo(): void {
    window.open(this.GITHUB_REPO_URL, "_blank");
  }

  /**
   * Starts or restarts the application tour.
   * PUBLIC: Called by the tour button handler.
   */
  public startTour(): void {
    if (this._tourController) {
      this._tourController.restartTour();
    } else {
      console.warn("Tour button clicked but TourController is not available.");
    }
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
      hasTourController: !!this._tourController,
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
}
