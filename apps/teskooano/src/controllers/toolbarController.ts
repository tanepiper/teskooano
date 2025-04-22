import { PopoverAPI } from "@teskooano/web-apis";
import type { AddGroupOptions, AddPanelOptions } from "dockview-core";
import "../components/shared/Button.js";
import "../components/toolbar/SimulationControls"; // Import for side effect (registers element)
import { SystemControls } from "../components/toolbar/SystemControls"; // Import the class directly
import { layoutOrientationStore, Orientation } from "../stores/layoutStore";
import { DockviewController } from "./dockviewController";
import { TourController } from "./tourController";

/**
 * ToolbarController is responsible for managing the toolbar and adding engine views.
 * It is initialized with a DOM element and a DockviewController.
 * It also has a counter for the number of engine views.
 * It renders the toolbar and adds the simulation controls.
 * It also adds the engine views and the corresponding engine UI panels.
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
  private _compositePanelCounter = 0; // Renamed
  /**
   * Define a constant logical name for the engine group
   */
  private readonly ENGINE_GROUP_NAME = "engine_views";
  /**
   * Store the ID of the initially created engine panel for potential reference.
   */
  private _firstEngineViewId: string | null = null;

  /**
   * Track if we're on a mobile device
   */
  private _isMobileDevice: boolean = false;

  // Cache toolbar elements to avoid repeated queries
  private _githubButton: HTMLElement | null = null;
  private _settingsButton: HTMLElement | null = null;
  private _tourButton: HTMLElement | null = null;
  private _addButton: HTMLElement | null = null;
  private _simControls: HTMLElement | null = null;
  private _systemControls: SystemControls | null = null; // Use the class type

  // Define a constant for the settings panel ID
  private readonly SETTINGS_PANEL_ID = "app_settings_panel";
  // GitHub repository URL
  private readonly GITHUB_REPO_URL = "https://github.com/tanepiper/teskooano";
  // Define the standard UI sections for reuse
  private readonly DEFAULT_UI_SECTIONS = [
    {
      id: `focus-section-{{COUNTER}}`,
      class: "focus-section",
      title: "Focus Control",
      componentTag: "focus-control",
      startClosed: false,
    },
    {
      id: `celestial-info-section-{{COUNTER}}`,
      class: "celestial-info-section",
      title: "Selected Object",
      componentTag: "celestial-info",
      startClosed: false,
    },
    {
      id: `renderer-info-section-{{COUNTER}}`,
      class: "renderer-info-section",
      title: "Renderer Info",
      componentTag: "renderer-info-display",
      startClosed: false,
    },
    {
      id: `engine-settings-section-{{COUNTER}}`,
      class: "engine-settings-section",
      title: "View Settings",
      componentTag: "engine-ui-settings-panel",
      startClosed: false,
    },
  ];

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

    // Detect mobile device
    this._isMobileDevice = this.detectMobileDevice();

    // Set up a resize listener to update mobile detection on window resize
    window.addEventListener("resize", this.handleResize);

    this.createToolbar();
  }

  /**
   * Handle window resize events to update mobile detection
   */
  private handleResize = (): void => {
    const wasMobile = this._isMobileDevice;
    this._isMobileDevice = this.detectMobileDevice();

    // Only update if the mobile state actually changed
    if (wasMobile !== this._isMobileDevice) {
      this.updateToolbarForMobileState();
    }
  };

  /**
   * Detect if the current device is a mobile device
   * Uses a combination of screen width and user agent detection
   */
  private detectMobileDevice(): boolean {
    // Check screen width - consider anything under 768px as mobile
    const isMobileWidth = window.innerWidth < 768;

    // Also check user agent for mobile devices
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent,
      );

    // Consider it mobile if either condition is true
    return isMobileWidth || isMobileDevice;
  }

  /**
   * Cleanup event listeners when controller is destroyed
   */
  public destroy(): void {
    window.removeEventListener("resize", this.handleResize);
  }

  /**
   * Set the tour controller after initialization
   */
  public setTourController(tourController: TourController): void {
    this._tourController = tourController;
    // TODO: If render created the tour button, we need a way to
    // add/remove just that button or update its state if it exists.
    // For now, recreating might be acceptable if this only happens once.
    this.createToolbar(); // Re-render to add tour button if needed
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
   */
  private addCompositeEnginePanel(): void {
    // Use the logical group name directly
    const groupName = this.ENGINE_GROUP_NAME;

    this._compositePanelCounter++;
    const counter = this._compositePanelCounter;
    const compositeViewId = `composite_engine_view_${counter}`;
    const compositeViewTitle = `Teskooano ${counter}`;

    // Prepare UI sections with the current counter
    const uiSections = this.DEFAULT_UI_SECTIONS.map((section) => ({
      ...section,
      id: section.id.replace("{{COUNTER}}", counter.toString()),
    }));

    // Use the new controller method to add the panel to the named group
    const panelOptions: AddPanelOptions = {
      id: compositeViewId,
      component: "composite_engine_view", // New component type
      title: compositeViewTitle,
      params: {
        title: compositeViewTitle,
        // sections: uiSections, // No longer needed
        dockviewController: this._dockviewController, // Pass the controller instance
      },
      // position is handled internally by addPanelToNamedGroup
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

      // Store the first engine view ID if it's the first one
      if (counter === 1) {
        this._firstEngineViewId = compositeViewId;
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
   */
  private toggleSettingsPanel(): void {
    const existingPanel = this._dockviewController.api.panels.find(
      (p) => p.id === this.SETTINGS_PANEL_ID,
    );

    if (existingPanel) {
      existingPanel.api.close();
    } else {
      const settingsPanelOptions: AddPanelOptions = {
        id: this.SETTINGS_PANEL_ID,
        component: "settings_view", // Placeholder component name
        title: "Settings",
        floating: {
          position: { top: 80, left: 80 },
          width: 450,
          height: 500,
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
   */
  private openGitHubRepo(): void {
    window.open(this.GITHUB_REPO_URL, "_blank");
  }

  /**
   * Updates the toolbar elements based on the current mobile state.
   */
  private updateToolbarForMobileState(): void {
    // Update gap
    this._element.style.gap = this._isMobileDevice
      ? "var(--space-xs, 4px)"
      : "var(--space-md, 12px)";

    // Toggle mobile attribute on relevant components
    this._tourButton?.toggleAttribute("mobile", this._isMobileDevice);
    this._addButton?.toggleAttribute("mobile", this._isMobileDevice);
    this._simControls?.toggleAttribute("mobile", this._isMobileDevice);
    this._systemControls?.toggleAttribute("mobile", this._isMobileDevice); // Add toggle for new component
  }

  // --- Toolbar Creation Methods ---

  /**
   * Sets up the main toolbar container styles.
   */
  private _setupToolbarContainer(): void {
    this._element.innerHTML = ""; // Clear existing content
    this._element.classList.add("toolbar-cosmic-background"); // Apply CSS class for background
    this._element.style.padding = "var(--space-sm, 8px)";
    this._element.style.display = "flex";
    this._element.style.alignItems = "center";
    this._element.style.gap = this._isMobileDevice
      ? "var(--space-xs, 4px)"
      : "var(--space-md, 12px)";
  }

  /**
   * Creates the application icon element.
   * @returns The created img element.
   */
  private _createAppIcon(): HTMLAnchorElement {
    const appIcon = document.createElement("img");
    appIcon.src = `${window.location.origin}/assets/icon.png`; // Use origin for robustness
    appIcon.alt = "Teskooano App Icon";
    appIcon.style.height = "100%";
    appIcon.style.width = "auto";
    appIcon.style.verticalAlign = "middle";
    appIcon.className = "app-logo";
    appIcon.id = "app-logo";

    const link = document.createElement("a");
    link.href = window.location.origin;
    link.appendChild(appIcon);
    return link;
  }

  /**
   * Creates the GitHub button with icon and popover.
   * @returns The created button element.
   */
  private _createGitHubButton(): HTMLElement {
    const githubButton = document.createElement("teskooano-button");
    githubButton.id = "github-button";

    // Add GitHub Icon
    const githubIcon = document.createElement("span");
    githubIcon.slot = "icon";
    githubIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
    </svg>`;
    githubButton.appendChild(githubIcon);

    // Add Popover for GitHub button
    const githubPopoverId = "github-popover";
    const githubPopover = this._createPopover(
      githubPopoverId,
      "View Source on GitHub",
    );
    this._element.appendChild(githubPopover); // Append popover to toolbar

    // Link button to popover
    githubButton.setAttribute("popovertarget", githubPopoverId);
    githubButton.setAttribute(
      "popovertargetaction",
      PopoverAPI.PopoverTargetActions.TOGGLE,
    );
    githubButton.setAttribute("aria-describedby", githubPopoverId);

    githubButton.addEventListener("click", () => {
      // Only open GitHub if popover isn't already open (prevents immediate navigation)
      if (!githubPopover.matches(":popover-open")) {
        this.openGitHubRepo();
      }
    });

    return githubButton;
  }

  /**
   * Creates the Settings button with icon and popover.
   * @returns The created button element.
   */
  private _createSettingsButton(): HTMLElement {
    const settingsButton = document.createElement("teskooano-button");
    settingsButton.id = "settings-button";
    // Add Gear Icon
    const gearIcon = document.createElement("span");
    gearIcon.slot = "icon";
    gearIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/>
        <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zM8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1"/>
    </svg>`;
    settingsButton.appendChild(gearIcon);

    // Add Popover for Settings button
    const settingsPopoverId = "settings-popover";
    const settingsPopover = this._createPopover(
      settingsPopoverId,
      "Application Settings",
    );
    this._element.appendChild(settingsPopover); // Append popover to toolbar

    // Link button to popover
    settingsButton.setAttribute("popovertarget", settingsPopoverId);
    settingsButton.setAttribute(
      "popovertargetaction",
      PopoverAPI.PopoverTargetActions.TOGGLE,
    );
    settingsButton.setAttribute("aria-describedby", settingsPopoverId);

    settingsButton.addEventListener(
      "click",
      this.toggleSettingsPanel.bind(this),
    );
    return settingsButton;
  }

  /**
   * Creates the Tour button if a TourController is available.
   * @returns The created button element, or null if no TourController exists.
   */
  private _createTourButton(): HTMLElement | null {
    if (!this._tourController) {
      return null;
    }

    const tourButton = document.createElement("teskooano-button");
    tourButton.id = "tour-button";

    // Add Question Icon
    const helpIcon = document.createElement("span");
    helpIcon.slot = "icon";
    helpIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
        <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94"/>
    </svg>`;
    tourButton.appendChild(helpIcon);

    // ALWAYS add text span
    const textSpanTour = document.createElement("span");
    textSpanTour.textContent = "Take Tour";
    tourButton.appendChild(textSpanTour);

    // Add Popover for Tour button
    const tourPopoverId = "tour-popover";
    const tourPopover = this._createPopover(
      tourPopoverId,
      "Take a tour of the application",
    );
    this._element.appendChild(tourPopover); // Append popover to toolbar

    // Link button to popover
    tourButton.setAttribute("popovertarget", tourPopoverId);
    tourButton.setAttribute(
      "popovertargetaction",
      PopoverAPI.PopoverTargetActions.TOGGLE,
    );
    tourButton.setAttribute("aria-describedby", tourPopoverId);

    // Add mobile attribute if needed
    if (this._isMobileDevice) {
      tourButton.setAttribute("mobile", "");
    }

    tourButton.addEventListener("click", () => {
      if (this._tourController) {
        this._tourController.restartTour();
      }
    });

    return tourButton;
  }

  /**
   * Creates the "Add Engine View" button with icon and popover.
   * @returns The created button element.
   */
  private _createAddViewButton(): HTMLElement {
    const addButton = document.createElement("teskooano-button");
    addButton.textContent = "+ Add View";
    addButton.setAttribute("title", "Add a new engine view");
    addButton.setAttribute("aria-label", "Add new engine view");
    addButton.addEventListener("click", () => {
      // Always call addCompositeEnginePanel, which now adds to the group
      this.addCompositeEnginePanel();
    });
    return addButton;
  }

  /**
   * Creates a vertical separator element.
   * @returns The created div element.
   */
  private _createSeparator(): HTMLDivElement {
    const separator = document.createElement("div");
    separator.style.width = "1px";
    separator.style.height = "calc(var(--toolbar-height, 50px) * 0.6)";
    separator.style.backgroundColor = "var(--color-border, #50506a)";
    separator.style.margin = "0 var(--space-xs, 4px)";
    return separator;
  }

  /**
   * Creates the simulation controls element.
   * @returns The created custom element.
   */
  private _createSimulationControls(): HTMLElement {
    const simControls = document.createElement("toolbar-simulation-controls");
    if (this._isMobileDevice) {
      simControls.setAttribute("mobile", "");
    }
    return simControls;
  }

  /**
   * Creates the system controls element and sets up its API and listeners.
   * @returns The created custom element.
   */
  private _createSystemControls(): SystemControls {
    const systemControls = document.createElement(
      "system-controls",
    ) as SystemControls;
    systemControls.id = "system-controls";

    if (this._isMobileDevice) {
      systemControls.setAttribute("mobile", "");
    }

    // Pass the Dockview API
    const dockviewApi = this._dockviewController.api;
    if (dockviewApi && systemControls instanceof SystemControls) {
      systemControls.setDockviewApi(dockviewApi);
      console.log("ToolbarController: Dockview API passed to SystemControls.");
    } else {
      console.error(
        "ToolbarController: Failed to get Dockview API or systemControls element!",
      );
    }

    return systemControls;
  }

  /**
   * Creates a popover element.
   * @param id The ID for the popover.
   * @param textContent The text content for the popover.
   * @returns The created div element.
   */
  private _createPopover(id: string, textContent: string): HTMLDivElement {
    const popover = document.createElement("div");
    popover.id = id;
    popover.setAttribute("popover", PopoverAPI.PopoverStates.AUTO);
    popover.textContent = textContent;
    popover.classList.add("tooltip-popover");
    return popover;
  }

  /**
   * Creates the initial toolbar structure and elements by calling helper methods.
   */
  private createToolbar(): void {
    this._setupToolbarContainer();

    // Add App Icon
    this._element.appendChild(this._createAppIcon());

    const otherButtonsWrapper = document.createElement("div");
    otherButtonsWrapper.style.display = "flex";
    otherButtonsWrapper.style.alignItems = "center";
    otherButtonsWrapper.style.justifyContent = "space-between";
    otherButtonsWrapper.style.gap = "var(--space-xs, 4px)";

    // Add GitHub Button
    this._githubButton = this._createGitHubButton();
    otherButtonsWrapper.appendChild(this._githubButton);

    // Add Settings Button
    this._settingsButton = this._createSettingsButton();
    otherButtonsWrapper.appendChild(this._settingsButton);

    // Add Tour Button (if applicable)
    this._tourButton = this._createTourButton();
    if (this._tourButton) {
      otherButtonsWrapper.appendChild(this._tourButton);
    }

    // Add "Add View" Button
    this._addButton = this._createAddViewButton();
    otherButtonsWrapper.appendChild(this._addButton);

    this._element.appendChild(otherButtonsWrapper);

    // Add Separator 1
    this._element.appendChild(this._createSeparator());

    // Add Simulation Controls
    this._simControls = this._createSimulationControls();
    this._element.appendChild(this._simControls);

    // Add Separator 2
    this._element.appendChild(this._createSeparator());

    // Add System Controls
    // Wrap system controls for better layout flexibility if needed
    const systemControlsWrapper = document.createElement("div");
    systemControlsWrapper.style.display = "flex";
    systemControlsWrapper.style.alignItems = "center";
    // systemControlsWrapper.style.flex = '1'; // Allow it to take space if desired
    this._systemControls = this._createSystemControls();
    systemControlsWrapper.appendChild(this._systemControls);
    this._element.appendChild(systemControlsWrapper);

    // Optionally restore state after elements are created
    // this.restoreSystemState();
  }
  // --- End Toolbar Creation Methods ---
}
