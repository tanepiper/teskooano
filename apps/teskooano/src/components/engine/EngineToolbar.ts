import { DockviewController } from "../../controllers/dockviewController";
import {
    $toolbarButtonConfigs,
    $toolbarExpansionStates,
    cleanupToolbarState,
    FunctionToolbarButtonConfig,
    getToolbarExpandedState,
    PanelToolbarButtonConfig,
    registerToolbarButton,
    toggleToolbar,
    ToolbarButtonType,
    unregisterToolbarButton
} from "../../stores/toolbarStore";
import { CompositeEnginePanel } from "./CompositeEnginePanel"; // Import parent panel type

import BoxMultipleArrowRightFilled from "@fluentui/svg-icons/icons/box_multiple_arrow_right_24_filled.svg?raw";
import BoxMultipleArrowLeftFilled from "@fluentui/svg-icons/icons/box_multiple_arrow_left_24_regular.svg?raw";

export class EngineToolbar {
  private readonly _element: HTMLElement;
  private _toggleButton: HTMLElement | null = null; // Reference to the toggle button
  private _collapsibleContainer: HTMLElement | null = null; // Container for dynamic buttons
  private _dockviewController: DockviewController; // Reference to the controller
  private _apiId: string; // Keep for potential unique ID needs
  private _parentEngine: CompositeEnginePanel; // Store reference to parent engine

  private _buttonStoreUnsubscribe: (() => void) | null = null;
  private _expandedStoreUnsubscribe: (() => void) | null = null;
  private _activeFloatingPanels: Map<string, string> = new Map(); // Track panelId -> componentName

  // --- List of default buttons to register ---
  private readonly _defaultButtonComponentNames = [
    "focus-control",
    "celestial-info",
    "engine-ui-settings-panel", 
    "renderer-info-display",
  ];

  /**
   * The root HTML element for the toolbar.
   */
  get element(): HTMLElement {
    return this._element;
  }

  constructor(
    apiId: string,
    dockviewController: DockviewController,
    parentEngine: CompositeEnginePanel,
  ) {
    this._apiId = apiId;
    this._dockviewController = dockviewController;
    this._parentEngine = parentEngine; // Store parent engine reference

    this._element = document.createElement("div");
    this._element.classList.add("engine-overlay-toolbar-container"); // Main container class

    this.injectStyles(); // Inject styles first
    this.createBaseStructure(); // Create toggle button and collapsible area
    this.listenToStores(); // Start listening for state changes for THIS instance

    // Register default buttons associated with this toolbar instance
    this.registerDefaultButtons();
  }

  /** Inject CSS for toolbar structure, icons, and animation */
  private injectStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      .engine-overlay-toolbar-container {
        position: absolute;
        top: 0px;
        left: 0px;
        z-index: 9999;
        display: inline-flex;
        align-items: center; /* Align items vertically */
        background-color: rgba(40, 40, 60, 0.7);
        border-radius: 4px;
        padding: 4px;
        gap: 4px;
        overflow: hidden; /* Prevents content overflow during transition */
        color: white; /* Default text/icon color */
      }

      .engine-overlay-toolbar-container teskooano-button {
        flex-shrink: 0; /* Prevent buttons from shrinking */
        color: inherit; /* Inherit color from container */
      }

      .engine-overlay-toolbar-container teskooano-button svg {
        width: 18px;
        height: 18px;
      }

      teskooano-button.toolbar-toggle-button svg {
        fill: rgba(191, 237, 9, 0.85);
      }

      .engine-overlay-toolbar-container teskooano-button:not(.toolbar-toggle-button):hover svg{
        fill: rgba(191, 237, 9, 0.85);
      }

      .toolbar-collapsible-buttons {
        display: flex;
        gap: 4px;
        max-width: 0; /* Initially hidden */
        overflow: hidden;
        transition: max-width 0.3s ease-in-out;
        white-space: nowrap; /* Prevent wrapping during transition */
      }

      .toolbar-collapsible-buttons.expanded {
        /* Calculate max-width dynamically? Or set a large enough value */
        max-width: 500px; /* Adjust as needed, large enough for buttons */
      }
    `;
    // Prepending ensures it's available before elements are created
    // Appending to document head is generally better for global styles
    document.head.appendChild(style);
    // If scoping is needed, append to this._element and use more specific selectors
  }

  /** Creates the main toggle button and the container for dynamic buttons */
  private createBaseStructure(): void {
    this._element.innerHTML = ""; // Clear previous content

    // 1. Create Toggle Button
    const toggleButton = document.createElement("teskooano-button");
    toggleButton.id = `engine-toolbar-toggle-${this._apiId}`;
    toggleButton.classList.add("toolbar-toggle-button");
    toggleButton.setAttribute("variant", "icon");
    toggleButton.setAttribute("size", "lg");
    toggleButton.title = "Toggle Tools";

    const iconSpan = document.createElement("span");
    iconSpan.slot = "icon";
    // Initial icon based on store state (or default to collapsed)
    iconSpan.innerHTML = getToolbarExpandedState(this._apiId)
      ? BoxMultipleArrowLeftFilled
      : BoxMultipleArrowRightFilled;
    toggleButton.appendChild(iconSpan);

    toggleButton.addEventListener("click", () => {
      toggleToolbar(this._apiId); // Use the action for this instance
    });

    this._element.appendChild(toggleButton);
    this._toggleButton = toggleButton; // Store reference

    // 2. Create Collapsible Container
    const collapsibleContainer = document.createElement("div");
    collapsibleContainer.classList.add("toolbar-collapsible-buttons");
    // Set initial class based on store state
    if (getToolbarExpandedState(this._apiId)) {
      collapsibleContainer.classList.add("expanded");
    }

    this._element.appendChild(collapsibleContainer);
    this._collapsibleContainer = collapsibleContainer; // Store reference
  }

  /** Listen to store changes and update UI accordingly */
  private listenToStores(): void {
    // Listen for changes in button registrations
    this._buttonStoreUnsubscribe = $toolbarButtonConfigs.subscribe(
      (allConfigs) => {
        const instanceButtons = allConfigs[this._apiId] ?? {};
        console.log(
          `Toolbar Store updated for ${this._apiId}, re-rendering buttons...`,
        );
        this.renderDynamicButtons(instanceButtons);
      },
    );

    // Listen for changes in the expanded state
    this._expandedStoreUnsubscribe = $toolbarExpansionStates.subscribe(
      (allStates) => {
        const isExpanded = allStates[this._apiId] ?? true; // Default to true if not set
        console.log(
          `Toolbar expanded state changed for ${this._apiId}: ${isExpanded}`,
        );
        if (this._collapsibleContainer) {
          this._collapsibleContainer.classList.toggle("expanded", isExpanded);
        }
        // Update toggle button icon and title
        if (this._toggleButton) {
          const iconSpan =
            this._toggleButton.querySelector("span[slot='icon']");
          if (iconSpan) {
            iconSpan.innerHTML = isExpanded
              ? BoxMultipleArrowLeftFilled
              : BoxMultipleArrowRightFilled;
          }
          this._toggleButton.title = isExpanded ? "Hide Tools" : "Show Tools";
        }
      },
    );

    // Listen for panel removals from DockviewController
    // We need this to clean up our `_activeFloatingPanels` map
    this._dockviewController.onPanelRemoved$.subscribe((removedPanelId) => {
      if (this._activeFloatingPanels.has(removedPanelId)) {
        console.log(
          `EngineToolbar: Detected removal of tracked floating panel '${removedPanelId}'. Removing from active map.`,
        );
        this._activeFloatingPanels.delete(removedPanelId);
      }
    });
  }

  /** Clears and re-renders buttons in the collapsible container */
  private renderDynamicButtons(
    buttons: Record<string, ToolbarButtonType>,
  ): void {
    if (!this._collapsibleContainer) return;

    this._collapsibleContainer.innerHTML = ""; // Clear existing buttons

    Object.values(buttons).forEach((config) => {
      const button = document.createElement("teskooano-button");
      // Use config.id directly, assuming it's unique enough with apiId baked in
      button.id = `engine-toolbar-button-${config.id}`;
      button.title = config.title;
      button.setAttribute("variant", "icon");
      button.setAttribute("size", "small");

      const iconSpan = document.createElement("span");
      iconSpan.slot = "icon";
      iconSpan.innerHTML = config.iconSvg;
      button.appendChild(iconSpan);

      // Get the apiId into the click handler scope
      const currentApiId = this._apiId;
      button.addEventListener("click", async () => {
        // Mark as async
        if (config.type === "panel") {
          this.handlePanelButtonClick(config as PanelToolbarButtonConfig);
        } else if (config.type === "function") {
          try {
            // Pass the apiId to the action
            await (config as FunctionToolbarButtonConfig).action(currentApiId);
          } catch (error) {
            console.error(
              `Error executing toolbar action for '${config.id}':`,
              error,
            );
          }
        }
      });

      this._collapsibleContainer?.appendChild(button);
    });
  }

  /** Handles clicks for buttons configured as 'panel' type */
  private handlePanelButtonClick(config: PanelToolbarButtonConfig): void {
    const panelId =
      config.panelId ?? `${config.componentName}_${this._apiId}_float`; // Generate ID if needed
    const behaviour = config.behaviour ?? "toggle"; // Default to toggle
    // --- ADD Offset Calculation Logic ---
    const calculatePosition = () => {
      if (config.initialPosition) {
        return config.initialPosition; // Use provided position
      }
      // Calculate offset based on existing tracked panels for this toolbar
      const baseOffset = 50; // Initial offset from top/left
      const panelIndex = this._activeFloatingPanels.size; // 0-based index
      const cascadeOffset = panelIndex * 30; // Stagger each new panel
      // --- Adjust default width/height and add specific size for focus-control ---
      let defaultWidth = 500; // Increased default width
      let defaultHeight = 300; // Increased default height

      return {
        top: baseOffset + cascadeOffset,
        left: baseOffset + cascadeOffset,
        width: defaultWidth,
        height: defaultHeight,
      };
      // --- END Adjust ---
    };
    // --- END ADD ---

    console.log(
      `Handling panel button click for: ${config.id}, panelId: ${panelId}, behaviour: ${behaviour}`,
    );

    // --- Toggle Behaviour ---
    if (behaviour === "toggle") {
      const existingPanel = this._dockviewController.api.getPanel(panelId);
      // Check visibility using the isVisible property on the api
      if (existingPanel && existingPanel.api?.isVisible) {
        // Panel exists and is visible, try to remove it (close it)
        console.log(
          `Panel ${panelId} exists and is visible, removing (toggle off).`,
        );
        try {
          this._dockviewController.api.removePanel(existingPanel);
          // No need to manage _activeFloatingPanels here, the subscription handles it
        } catch (error) {
          console.error(`Error removing panel ${panelId}:`, error);
        }
      } else {
        // Panel doesn't exist or is closed, create it OR re-open existing hidden one
        const position = calculatePosition(); // Calculate desired position/size
        console.log(
          `[Toolbar ${this._apiId}] Calculated position:`,
          JSON.stringify(position),
        ); // Log calculated size
        if (existingPanel) {
          // Panel exists but is hidden: Activate and SET SIZE
          console.log(
            `[Toolbar ${this._apiId}] Panel ${panelId} exists but is hidden. Activating and attempting setSize.`,
          );
          try {
            existingPanel.api.setSize(position); // Explicitly set size
            console.log(
              `[Toolbar ${this._apiId}] Called setSize on existing panel ${panelId}.`,
            );
            // --- ADD title update on toggle show ---
            // Also update the title in case it changed in config
            const newTitle = config.panelTitle ?? config.title;
            if (existingPanel.api.title !== newTitle) {
              console.log(
                `[Toolbar ${this._apiId}] Updating title for existing panel ${panelId} to \"${newTitle}\"`,
              );
              existingPanel.api.updateParameters({ title: newTitle }); // Use updateParameters
            }
            // --- END ADD ---
          } catch (e) {
            console.error(
              `[Toolbar ${this._apiId}] Error calling setSize or updateParameters on existing panel ${panelId}:`,
              e,
            );
          }
          existingPanel.api.setActive();
          console.log(
            `[Toolbar ${this._apiId}] Activated existing panel ${panelId}.`,
          );
          // We might need to re-track it if removePanel didn't trigger the cleanup
          this._activeFloatingPanels.set(panelId, config.componentName);
        } else {
          // Panel doesn't exist at all: Create it fresh
          console.log(
            `[Toolbar ${this._apiId}] Panel ${panelId} does not exist. Creating new panel with size.`,
          );
          const panelApi = this._dockviewController.addFloatingPanel(
            {
              id: panelId,
              component: config.componentName,
              title: config.panelTitle ?? config.title,
              params: {
                title: config.panelTitle ?? config.title,
                parentInstance: this._parentEngine, // CRITICAL: Pass parent engine reference
              },
            },
            position, // Pass calculated position
          );
          if (panelApi) {
            this._activeFloatingPanels.set(panelId, config.componentName); // Track it
            panelApi.setActive?.(); // Focus the newly created panel
          } else {
            console.error(`Failed to create floating panel ${panelId}`);
          }
        }
      }
    }
    // --- Create Behaviour ---
    else if (behaviour === "create") {
      console.log(
        `Creating new panel instance for ${config.componentName} (behaviour: create).`,
      );
      // Always add a new floating panel, letting Dockview handle unique IDs if necessary
      // or potentially adding a counter/timestamp if panelId wasn't provided
      const newPanelId = `${config.componentName}_${this._apiId}_float_${Date.now()}`; // Ensure uniqueness for 'create'
      // --- MODIFY to use calculated position ---
      const position = calculatePosition();
      console.log(`Calculated position for new panel ${newPanelId}:`, position);
      const panelApi = this._dockviewController.addFloatingPanel(
        {
          id: newPanelId, // Use generated unique ID
          component: config.componentName,
          title: config.panelTitle ?? config.title,
          params: {
            title: config.panelTitle ?? config.title,
            parentInstance: this._parentEngine, // CRITICAL: Pass parent engine reference
          },
        },
        position, // Pass calculated position
      );
      // --- END MODIFY ---
      if (panelApi) {
        this._activeFloatingPanels.set(newPanelId, config.componentName); // Track it
        panelApi.setActive?.();
      } else {
        console.error(`Failed to create floating panel ${newPanelId}`);
      }
    }
  }

  /** Registers the default set of toolbar buttons based on component names */
  private registerDefaultButtons(): void {
    this._defaultButtonComponentNames.forEach((componentName) => {
      this.addRegisteredButton(componentName);
    });

    // Example: Add a function button programmatically if needed
    // this.addFunctionButton({
    //     id: `log_action_${this._apiId}`,
    //     iconSvg: InfoIcon,
    //     title: "Log Action",
    //     type: 'function',
    //     action: async () => {
    //       console.log("Executing dynamic async action!");
    //       await new Promise(resolve => setTimeout(resolve, 500));
    //       console.log("Dynamic action finished.");
    //     }
    // });
  }

  /** Unregisters the default set of toolbar buttons */
  private unregisterDefaultButtons(): void {
    this._defaultButtonComponentNames.forEach((componentName) => {
      this.removeRegisteredButton(componentName);
    });
    // Also remove any programmatically added function buttons
    // unregisterToolbarButton(`log_action_${this._apiId}`);
  }

  /**
   * Fetches static config for a component and registers an instance-specific button.
   * @param componentName The registered name of the component.
   */
  public addRegisteredButton(componentName: string): void {
    const staticConfig =
      this._dockviewController.getToolbarButtonConfig(componentName);

    if (!staticConfig) {
      console.warn(
        `EngineToolbar: No static toolbar config found for component '${componentName}'. Cannot add button.`,
      );
      return;
    }

    // Create instance-specific config
    const instanceConfig: PanelToolbarButtonConfig = {
      ...staticConfig,
      // Ensure unique ID using the toolbar's apiId
      id: `${staticConfig.id}_${this._apiId}`,
      // Optionally create instance-specific panel ID if needed
      panelId: staticConfig.panelId
        ? `${staticConfig.panelId}_${this._apiId}`
        : `${componentName}_${this._apiId}_float`,
    };

    registerToolbarButton(this._apiId, instanceConfig); // Pass apiId
    console.log(
      `EngineToolbar: Registered button for '${componentName}' with instance ID '${instanceConfig.id}'`,
    );
  }

  /**
   * Removes the instance-specific button associated with a component name.
   * @param componentName The registered name of the component.
   */
  public removeRegisteredButton(componentName: string): void {
    const staticConfig =
      this._dockviewController.getToolbarButtonConfig(componentName);
    if (staticConfig) {
      const instanceId = `${staticConfig.id}_${this._apiId}`;
      unregisterToolbarButton(this._apiId, instanceId); // Pass apiId
      console.log(
        `EngineToolbar: Unregistered button with instance ID '${instanceId}' for toolbar ${this._apiId}`,
      );
    } else {
      console.warn(
        `EngineToolbar: Could not find static config for '${componentName}' during unregistration.`,
      );
    }
  }

  /**
   * Allows adding a function button programmatically.
   * (Could be used if a button doesn't have a corresponding panel component)
   */
  public addFunctionButton(config: FunctionToolbarButtonConfig): void {
    registerToolbarButton(this._apiId, config);
  }

  /** Clean up listeners when the toolbar is destroyed */
  public dispose(): void {
    console.log(`Disposing EngineToolbar for ${this._apiId}...`);
    // Unsubscribe from stores
    this._buttonStoreUnsubscribe?.();
    this._expandedStoreUnsubscribe?.();
    this._buttonStoreUnsubscribe = null;
    this._expandedStoreUnsubscribe = null;

    // --- Unregister default buttons --- (This already uses the correct unregisterToolbarButton with apiId)
    // this.unregisterDefaultButtons();

    // --- Clean up state for this specific toolbar instance ---
    cleanupToolbarState(this._apiId);

    // Remove the element from the DOM if it's still attached
    this._element.remove();

    // Clear internal references
    this._toggleButton = null;
    this._collapsibleContainer = null;
    this._activeFloatingPanels.clear();

    console.log(`EngineToolbar for ${this._apiId} disposed.`);
    // Note: We don't dispose the DockviewController here, it's owned elsewhere.
  }
}
