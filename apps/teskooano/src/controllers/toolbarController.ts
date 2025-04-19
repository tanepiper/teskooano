import { AddPanelOptions } from "dockview-core";
import "../components/shared/Button.js";
import "../components/toolbar/SeedForm"; // Import the new ToolbarSeedForm
import { ToolbarSeedForm } from "../components/toolbar/SeedForm";
import "../components/toolbar/SimulationControls"; // Import for side effect (registers element)
import { DockviewController } from "./dockviewController";
import { TourController } from "./tourController";
import { layoutOrientationStore, Orientation } from "../stores/layoutStore";
import { PopoverAPI } from "@teskooano/web-apis";

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
  private _enginePanelCounter = 0; // Counter specifically for engine views
  /**
   * Store the ID of the last added engine panel for positioning the next one.
   */
  private _lastEngineViewId: string | null = null;
  /**
   * Track if we're on a mobile device
   */
  private _isMobileDevice: boolean = false;
  /**
   * Store orientation state and unsubscribe function
   */
  private _currentOrientation: Orientation | null = null;
  private _layoutUnsubscribe: (() => void) | null = null;

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

    // Subscribe to layout orientation changes
    this._layoutUnsubscribe = layoutOrientationStore.subscribe(
      (orientation) => {
        this.handleOrientationChange(orientation);
      },
    );
    // Get initial orientation
    this._currentOrientation = layoutOrientationStore.get();
    // Apply initial layout based on orientation (optional, could be deferred)
    // this.handleOrientationChange(this._currentOrientation);

    // Detect mobile device
    this._isMobileDevice = this.detectMobileDevice();

    // Set up a resize listener to update mobile detection on window resize
    window.addEventListener("resize", this.handleResize);

    this.render();
  }

  /**
   * Handle window resize events to update mobile detection
   */
  private handleResize = (): void => {
    const wasMobile = this._isMobileDevice;
    this._isMobileDevice = this.detectMobileDevice();
    this.render();

    // If device type changed (mobile → desktop or desktop → mobile)
    // we could potentially re-create the layout here if needed
    if (wasMobile !== this._isMobileDevice) {
      console.log(
        `Device type changed to: ${this._isMobileDevice ? "mobile" : "desktop"}`,
      );
      // Future enhancement: recreate panels with new layout
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
    // Unsubscribe from layout changes on destroy
    if (this._layoutUnsubscribe) {
      this._layoutUnsubscribe();
      this._layoutUnsubscribe = null;
    }
  }

  /**
   * Set the tour controller after initialization
   */
  public setTourController(tourController: TourController): void {
    this._tourController = tourController;
    this.render(); // Re-render to add tour button if needed
  }

  /**
   * Public method to create the very first engine/UI panel group on initialization.
   */
  public initializeFirstEngineView(): void {
    // Ensure we only add the *first* view this way
    if (this._enginePanelCounter === 0) {
      this.addEnginePanels();
    } else {
      console.warn(
        "initializeFirstEngineView called but engine panels already exist.",
      );
    }
  }

  /**
   * Adds the engine views and the corresponding engine UI panels.
   */
  private addEnginePanels(): void {
    this._enginePanelCounter++;
    const counter = this._enginePanelCounter;
    const compositeViewId = `composite_engine_view_${counter}`;
    const compositeViewTitle = `Teskooano ${counter}`;

    // Prepare UI sections with the current counter
    const uiSections = this.DEFAULT_UI_SECTIONS.map((section) => ({
      ...section,
      id: section.id.replace("{{COUNTER}}", counter.toString()),
    }));

    try {
      // Determine where to position the new engine view
      let positionOptions: AddPanelOptions["position"] = undefined;

      if (this._lastEngineViewId) {
        // Find the previous engine panel
        const previousPanel = this._dockviewController.api.panels.find(
          (p) => p.id === this._lastEngineViewId,
        );

        if (previousPanel && previousPanel.group) {
          // Position new panel below the GROUP of the previous panel
          // This ensures we take the full width of the previous engine+UI
          console.log(
            `Positioning new panel below group: ${previousPanel.group.id}`,
          );
          positionOptions = {
            referenceGroup: previousPanel.group,
            direction: "below",
          };
        } else {
          console.warn(
            `Previous engine ${this._lastEngineViewId} or its group not found, using default positioning.`,
          );
        }
      } else {
        console.log("Positioning first engine view (default).");
      }

      // Create the composite engine panel
      console.log(`Adding composite engine panel: ${compositeViewId}`);
      const compositePanel = this._dockviewController.api.addPanel({
        id: compositeViewId,
        component: "composite_engine_view", // New component type
        title: compositeViewTitle,
        params: {
          title: compositeViewTitle,
          sections: uiSections, // Pass UI sections config
        },
        position: positionOptions,
      });

      // Store the composite ID for positioning the next one
      this._lastEngineViewId = compositeViewId;

      // Activate the composite panel
      compositePanel.api.setActive();
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
      console.log(`Closing existing settings panel: ${this.SETTINGS_PANEL_ID}`);
      existingPanel.api.close();
    } else {
      console.log(`Adding settings panel: ${this.SETTINGS_PANEL_ID}`);
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

  private render(): void {
    // Clear existing content
    this._element.innerHTML = "";
    // Apply cosmic theme styles
    this._element.classList.add("toolbar-cosmic-background"); // Apply CSS class for background
    this._element.style.padding = "var(--space-sm, 8px)"; // Add some padding
    this._element.style.display = "flex"; // Use flexbox
    this._element.style.alignItems = "center"; // Center items vertically
    // Adjust gap based on device type
    this._element.style.gap = this._isMobileDevice
      ? "var(--space-xs, 4px)"
      : "var(--space-md, 12px)";

    // Add Application Icon
    const appIcon = document.createElement("img");
    appIcon.src = `${window.location.href}assets/icon.png`; // *** Adjust this path if needed ***
    appIcon.alt = "Teskooano App Icon";
    appIcon.style.height = "calc(var(--toolbar-height, 50px) * 0.7)"; // ~70% of toolbar height
    appIcon.style.width = "auto"; // Maintain aspect ratio
    appIcon.style.verticalAlign = "middle"; // Helps alignment
    appIcon.className = "app-logo"; // Add class for tour targeting
    appIcon.id = "app-logo"; // Add ID for tour targeting
    this._element.appendChild(appIcon); // Add icon first

    // --- Add GitHub Button ---
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
    const githubPopover = document.createElement("div");
    githubPopover.id = githubPopoverId;
    githubPopover.setAttribute("popover", PopoverAPI.PopoverStates.AUTO);
    githubPopover.textContent = "View Source on GitHub";
    githubPopover.classList.add("tooltip-popover");
    this._element.appendChild(githubPopover);

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

    this._element.appendChild(githubButton);
    // --- End GitHub Button ---

    // --- Add Settings Button ---
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
    const settingsPopover = document.createElement("div");
    settingsPopover.id = settingsPopoverId;
    settingsPopover.setAttribute("popover", PopoverAPI.PopoverStates.AUTO);
    settingsPopover.textContent = "Application Settings";
    settingsPopover.classList.add("tooltip-popover");
    this._element.appendChild(settingsPopover);

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
    this._element.appendChild(settingsButton);
    // --- End Settings Button ---

    // --- Add Tour Button if tour controller is available ---
    if (this._tourController) {
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
      const tourPopover = document.createElement("div");
      tourPopover.id = tourPopoverId;
      tourPopover.setAttribute("popover", PopoverAPI.PopoverStates.AUTO);
      tourPopover.textContent = "Take a tour of the application";
      tourPopover.classList.add("tooltip-popover");
      this._element.appendChild(tourPopover);

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

      this._element.appendChild(tourButton);
    }
    // --- End Tour Button ---

    // Add "Add View" button
    const addButton = document.createElement("teskooano-button");
    addButton.id = "add-view-button";
    // Create icon element
    const iconSpan = document.createElement("span");
    iconSpan.setAttribute("slot", "icon");
    iconSpan.textContent = "🔭"; // Simple plus icon
    iconSpan.style.fontWeight = "bold"; // Make icon slightly bolder

    // Append icon to the button
    addButton.appendChild(iconSpan);

    // ALWAYS add text span
    const textSpanAdd = document.createElement("span");
    textSpanAdd.textContent = "Add Engine View";
    addButton.appendChild(textSpanAdd); // Always add text

    // Add Popover for Add View button
    const addViewPopoverId = "add-view-popover";
    const addViewPopover = document.createElement("div");
    addViewPopover.id = addViewPopoverId;
    addViewPopover.setAttribute("popover", PopoverAPI.PopoverStates.AUTO);
    addViewPopover.textContent = "Add a new engine view";
    addViewPopover.classList.add("tooltip-popover");
    this._element.appendChild(addViewPopover);

    // Link button to popover
    addButton.setAttribute("popovertarget", addViewPopoverId);
    addButton.setAttribute(
      "popovertargetaction",
      PopoverAPI.PopoverTargetActions.TOGGLE,
    );
    addButton.setAttribute("aria-describedby", addViewPopoverId);

    // Add mobile attribute if needed
    if (this._isMobileDevice) {
      addButton.setAttribute("mobile", "");
    }

    addButton.addEventListener("click", () => {
      this.addEnginePanels();
    });

    this._element.appendChild(addButton);

    // Add Separator
    const separator1 = document.createElement("div");
    separator1.style.width = "1px";
    separator1.style.height = "calc(var(--toolbar-height, 50px) * 0.6)"; // Adjust height relative to toolbar
    separator1.style.backgroundColor = "var(--color-border, #50506a)";
    separator1.style.margin = "0 var(--space-xs, 4px)"; // Small horizontal margin
    this._element.appendChild(separator1);

    // Add the simulation controls
    const simControls = document.createElement("toolbar-simulation-controls");
    if (this._isMobileDevice) {
      simControls.setAttribute("mobile", "");
    }
    this._element.appendChild(simControls);

    // Add Separator before seed form
    const separator2 = document.createElement("div");
    separator2.style.width = "1px";
    separator2.style.height = "calc(var(--toolbar-height, 50px) * 0.6)";
    separator2.style.backgroundColor = "var(--color-border, #50506a)";
    separator2.style.margin = "0 var(--space-xs, 4px)";
    this._element.appendChild(separator2);

    // Add the seed form
    const seedForm = document.createElement(
      "toolbar-seed-form",
    ) as ToolbarSeedForm;
    if (this._isMobileDevice) {
      seedForm.setAttribute("mobile", "");
    }
    ToolbarSeedForm.setDockviewApi(this._dockviewController.api);
    this._element.appendChild(seedForm);
  }

  // --- New method to handle orientation changes for Dockview layout ---
  private handleOrientationChange(orientation: Orientation): void {
    if (this._currentOrientation === orientation) {
      return; // No change
    }
    this._currentOrientation = orientation;
    console.log(`ToolbarController: Orientation changed to ${orientation}`);

    // Get the Dockview API
    const dockviewApi = this._dockviewController.api;

    // Find the main composite panel (assuming only one for now)
    // TODO: Handle multiple engine views if needed
    const mainPanelId = `composite_engine_view_1`;
    const mainPanel = dockviewApi.panels.find((p) => p.id === mainPanelId);

    if (!mainPanel) {
      console.warn(
        `Main panel ${mainPanelId} not found for orientation change.`,
      );
      return;
    }

    // The CompositeEnginePanel component *itself* should handle the internal
    // layout split (engine vs UI) using CSS and the layout-internal-* classes
    // driven by the layoutOrientationStore.
    // Dockview's job here is mainly to ensure the panel/group has the right dimensions.

    // We might not need to *move* panels with Dockview API if the CompositeEnginePanel
    // correctly uses flexbox internally based on the store.
    // Let's ensure the Dockview container allows flex layout to work.

    // It's possible the parent group needs resizing or constraints adjusted,
    // but let's rely on the CompositeEnginePanel's internal CSS first.
    // For now, we just log, as the change might already be handled visually
    // by the CompositeEnginePanel reacting to the store change.

    console.log(
      `Relying on CompositeEnginePanel (${mainPanelId}) internal CSS for layout change.`,
    );

    // --- Potential future Dockview API adjustments (if internal CSS isn't enough) ---
    /*
    if (orientation === 'landscape') {
      // Example: Force a resize or ensure the group isn't constrained vertically
      mainPanel.group.api.setSize({ height: mainPanel.group.height, width: mainPanel.group.width }); // Trigger reflow?
    } else {
      // Portrait adjustments if needed
    }
    */
    // --- End potential adjustments ---
  }
  // --- End orientation change handler ---
}
