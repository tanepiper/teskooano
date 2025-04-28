import type { DockviewController } from "../dockview/DockviewController.js";
import "./ToolbarController.css";
// Import plugin types and functions (assuming they exist in the updated package)
import {
  getToolbarWidgetsForTarget, // Assuming this function is added to the plugin package
  type ToolbarWidgetConfig, // Assuming this type is added
} from "@teskooano/ui-plugin";

import {
  createToolbarHandlers,
  type ToolbarTemplateHandlers,
} from "./ToolbarController.handlers.js";

// Remove GitHubIcon import, use direct SVG below
// import GitHubIcon from "@fluentui/svg-icons/icons/github_24_regular.svg?raw";
import AddIcon from "@fluentui/svg-icons/icons/add_24_regular.svg?raw";
import TourIcon from "@fluentui/svg-icons/icons/compass_northwest_24_regular.svg?raw";
import SettingsIcon from "@fluentui/svg-icons/icons/settings_24_regular.svg?raw";
// REMOVED: Import the logo icon
// import LogoIcon from "../../assets/icon.png";

/**
 * ToolbarController is responsible for managing the toolbar and adding engine views.
 * It dynamically renders toolbar content based on plugin registrations.
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

  // Cache STATIC elements
  private _githubButton: HTMLElement | null = null;
  private _settingsButton: HTMLElement | null = null;
  private _tourButton: HTMLElement | null = null;
  private _addButton: HTMLElement | null = null;
  // REMOVED: Caching for dynamically added plugin widgets
  // private _simControls: HTMLElement | null = null;
  // private _systemControls: SystemControls | null = null;

  // Handlers
  // Use the specific type returned by createToolbarHandlers
  private _handlers: ToolbarTemplateHandlers;

  // GitHub repository URL - CORRECTED back to original
  private readonly GITHUB_REPO_URL = "https://github.com/tanepiper/teskooano";
  // Website URL
  private readonly WEBSITE_URL = "https://teskooano.space";

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
    this._handlers = createToolbarHandlers(this);

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
      // Update gap and static buttons
      this.updateToolbarForMobileState();
      // Potentially re-render dynamic widgets if their appearance depends on mobile state?
      // For now, assume widgets handle their own mobile styling.
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

    // Toggle mobile attribute ONLY on static cached elements
    this._tourButton?.toggleAttribute("mobile", this._isMobileDevice);
    this._addButton?.toggleAttribute("mobile", this._isMobileDevice);
    // REMOVED: Toggling attributes on dynamic widgets
    // this._simControls?.toggleAttribute("mobile", this._isMobileDevice);
  }

  // --- Private Methods ---

  /**
   * Creates/re-creates the toolbar using the template and attaches handlers.
   */
  private createToolbar(): void {
    // Clear existing content
    this._element.innerHTML = "";
    this._element.classList.add("toolbar-container"); // Add class for main container styling

    // --- Create distinct areas --- //
    const leftButtonGroup = document.createElement("div");
    leftButtonGroup.classList.add("toolbar-section", "left-button-group");

    const widgetArea = document.createElement("div");
    widgetArea.classList.add("toolbar-section", "widget-area");

    // --- Render Static Elements into the left group --- //
    // --- NEW: Logo Button ---
    const logoButton = document.createElement("teskooano-button");
    logoButton.id = "toolbar-logo";
    logoButton.title = "Visit Teskooano Website";
    logoButton.setAttribute("variant", "image");
    logoButton.setAttribute("size", "medium");
    // Use an img tag for the PNG logo, explicitly setting size
    logoButton.innerHTML = `<span slot="icon"><img src="/assets/icon.png" alt="Teskooano Logo" style="width: 45px; height: 45px; object-fit: contain;"></span>`;
    logoButton.addEventListener("click", () => {
      window.open(this.WEBSITE_URL, "_blank");
    });
    leftButtonGroup.appendChild(logoButton); // Append FIRST

    // Example: GitHub Button
    this._githubButton = document.createElement("teskooano-button");
    this._githubButton.id = "toolbar-github";
    this._githubButton.title = "View on GitHub";
    this._githubButton.setAttribute("variant", "icon");
    this._githubButton.setAttribute("size", "medium");
    // --- Embed your actual GitHub SVG here --- //
    this._githubButton.innerHTML = `<span slot="icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.341-3.369-1.341-.455-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.004.07 1.532 1.03 1.532 1.03.891 1.529 2.341 1.088 2.91.832.092-.647.348-1.088.635-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.446-1.27.098-2.64 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.82c.85.004 1.705.115 2.504.336 1.91-1.294 2.748-1.025 2.748-1.025.546 1.37.201 2.387.099 2.64.64.698 1.03 1.591 1.03 2.682 0 3.841-2.337 4.688-4.566 4.935.359.309.678.92.678 1.852 0 1.338-.012 2.419-.012 2.748 0 .267.18.577.688.48C19.137 20.166 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg></span>`;
    this._githubButton.addEventListener(
      "click",
      this._handlers.handleGitHubClick,
    );
    leftButtonGroup.appendChild(this._githubButton); // Append to left group

    // Example: Add Button
    this._addButton = document.createElement("teskooano-button");
    this._addButton.id = "toolbar-add-panel";
    this._addButton.title = "Add Engine View";
    this._addButton.setAttribute("variant", "icon");
    this._addButton.setAttribute("size", "medium");
    this._addButton.innerHTML = `<span slot="icon">${AddIcon}</span>`;
    this._addButton.addEventListener(
      "click",
      this._handlers.handleAddViewClick,
    );
    leftButtonGroup.appendChild(this._addButton); // Append to left group

    // Example: Tour Button
    this._tourButton = document.createElement("teskooano-button");
    this._tourButton.id = "toolbar-tour";
    this._tourButton.title = "Start Tour";
    this._tourButton.setAttribute("variant", "icon");
    this._tourButton.setAttribute("size", "medium");
    this._tourButton.innerHTML = `<span slot="icon">${TourIcon}</span>`;
    this._tourButton.addEventListener("click", this._handlers.handleTourClick);
    leftButtonGroup.appendChild(this._tourButton); // Append to left group

    // Example: Settings Button
    this._settingsButton = document.createElement("teskooano-button");
    this._settingsButton.id = "toolbar-settings";
    this._settingsButton.title = "Settings";
    this._settingsButton.setAttribute("variant", "icon");
    this._settingsButton.setAttribute("size", "medium");
    this._settingsButton.innerHTML = `<span slot="icon">${SettingsIcon}</span>`;
    this._settingsButton.addEventListener(
      "click",
      this._handlers.handleSettingsClick,
    );
    leftButtonGroup.appendChild(this._settingsButton); // Append to left group

    // --- Render Dynamic Widgets into the widget area --- //
    try {
      const widgets: ToolbarWidgetConfig[] =
        getToolbarWidgetsForTarget("main-toolbar");

      widgets.forEach((widgetConfig) => {
        try {
          const widgetElement = document.createElement(
            widgetConfig.componentName,
          );
          widgetElement.classList.add("toolbar-widget");
          // Apply params logic...
          if (widgetConfig.params) {
            Object.entries(widgetConfig.params).forEach(([key, value]) => {
              if (
                typeof value === "string" ||
                typeof value === "number" ||
                typeof value === "boolean"
              ) {
                widgetElement.setAttribute(key, String(value));
              } else {
                console.warn(
                  `Cannot set complex param '${key}' as attribute on ${widgetConfig.componentName}`,
                );
              }
            });
          }
          widgetArea.appendChild(widgetElement); // Append to widget area
          console.log(
            `[ToolbarController] Added widget: ${widgetConfig.componentName}`,
          );
        } catch (widgetError) {
          console.error(
            `[ToolbarController] Error creating widget '${widgetConfig.componentName}' (ID: ${widgetConfig.id}):`,
            widgetError,
          );
        }
      });
    } catch (pluginError) {
      console.error(
        "[ToolbarController] Error fetching or processing toolbar widgets:",
        pluginError,
      );
      const errorEl = document.createElement("div");
      errorEl.textContent = "Error loading toolbar widgets.";
      errorEl.style.color = "red";
      widgetArea.appendChild(errorEl); // Append error to widget area
    }

    // --- Append areas to the main element --- //
    this._element.appendChild(leftButtonGroup);
    this._element.appendChild(widgetArea);

    // Apply initial mobile state visuals to static elements
    this.updateToolbarForMobileState();
  }

  /**
   * Opens the GitHub repository in a new window/tab
   * PUBLIC: Called by the github button handler.
   */
  public openGitHubRepo(): void {
    window.open(this.GITHUB_REPO_URL, "_blank");
  }
}
