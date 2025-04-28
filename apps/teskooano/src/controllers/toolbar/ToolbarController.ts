import type { DockviewController } from "../dockview/DockviewController.js";
// Custom elements are registered globally in main.ts now
// import "../../components/engine/main-toolbar/simulation-controls/SimulationControls.ts";
// import "../../components/engine/main-toolbar/system-controls/SystemControls.ts";
// import type { SystemControls } from "../../components/engine/main-toolbar/system-controls/SystemControls.ts";
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
// We no longer use the static template renderer
// import {
//   renderToolbarTemplate,
//   type ToolbarTemplateData,
// } from "./ToolbarController.template.js";

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

    // --- Render Static Elements (Example - Adapt based on ToolbarController.template.js) ---
    // You'll need to recreate the structure and attach handlers for non-plugin items

    // Example: GitHub Button
    this._githubButton = document.createElement("teskooano-button");
    this._githubButton.id = "toolbar-github";
    this._githubButton.title = "View on GitHub";
    this._githubButton.setAttribute("variant", "icon");
    this._githubButton.setAttribute("size", "medium");
    this._githubButton.innerHTML = `<span slot="icon">/* SVG for GitHub */</span>`;
    this._githubButton.addEventListener(
      "click",
      this._handlers.handleGitHubClick,
    );
    this._element.appendChild(this._githubButton);

    // --- Render Dynamic Widgets from Plugins ---
    try {
      // Fetch and sort widgets registered for the 'main-toolbar'
      // NOTE: getToolbarWidgetsForTarget must exist in the ui-plugin package
      const widgets: ToolbarWidgetConfig[] =
        getToolbarWidgetsForTarget("main-toolbar");

      widgets.forEach((widgetConfig) => {
        try {
          const widgetElement = document.createElement(
            widgetConfig.componentName,
          );
          widgetElement.classList.add("toolbar-widget");

          // Apply params as attributes (simple example, might need refinement)
          if (widgetConfig.params) {
            Object.entries(widgetConfig.params).forEach(([key, value]) => {
              // Basic attribute setting, handle complex objects if needed
              if (
                typeof value === "string" ||
                typeof value === "number" ||
                typeof value === "boolean"
              ) {
                widgetElement.setAttribute(key, String(value));
              } else {
                // Maybe set as property? element[key] = value;
                console.warn(
                  `Cannot set complex param '${key}' as attribute on ${widgetConfig.componentName}`,
                );
              }
            });
          }

          this._element.appendChild(widgetElement);
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
      // Render fallback or error message?
      const errorEl = document.createElement("div");
      errorEl.textContent = "Error loading toolbar widgets.";
      errorEl.style.color = "red";
      this._element.appendChild(errorEl);
    }

    // --- Render other Static Elements (Add, Tour, Settings) ---
    // Example: Add Button
    this._addButton = document.createElement("teskooano-button");
    this._addButton.id = "toolbar-add-panel";
    this._addButton.title = "Add Engine View";
    this._addButton.setAttribute("variant", "icon");
    this._addButton.setAttribute("size", "medium");
    this._addButton.innerHTML = `<span slot="icon">/* SVG for Add */</span>`;
    this._addButton.addEventListener(
      "click",
      this._handlers.handleAddViewClick,
    );
    this._element.appendChild(this._addButton);

    // Example: Tour Button
    this._tourButton = document.createElement("teskooano-button");
    this._tourButton.id = "toolbar-tour";
    this._tourButton.title = "Start Tour";
    this._tourButton.setAttribute("variant", "icon");
    this._tourButton.setAttribute("size", "medium");
    this._tourButton.innerHTML = `<span slot="icon">/* SVG for Tour */</span>`;
    this._tourButton.addEventListener("click", this._handlers.handleTourClick);
    this._element.appendChild(this._tourButton);

    // Example: Settings Button
    this._settingsButton = document.createElement("teskooano-button");
    this._settingsButton.id = "toolbar-settings";
    this._settingsButton.title = "Settings";
    this._settingsButton.setAttribute("variant", "icon");
    this._settingsButton.setAttribute("size", "medium");
    this._settingsButton.innerHTML = `<span slot="icon">/* SVG for Settings */</span>`;
    this._settingsButton.addEventListener(
      "click",
      this._handlers.handleSettingsClick,
    );
    this._element.appendChild(this._settingsButton);

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
