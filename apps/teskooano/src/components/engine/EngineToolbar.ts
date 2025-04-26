import { DockviewController } from "../../controllers/dockview/DockviewController";
import {
  FunctionToolbarButtonConfig,
  PanelToolbarButtonConfig,
  registerToolbarButton,
  unregisterToolbarButton
} from "../../stores/toolbarStore";
import { CompositeEnginePanel } from "./CompositeEnginePanel"; // Import parent panel type

import BoxMultipleArrowLeftFilled from "@fluentui/svg-icons/icons/box_multiple_arrow_left_24_regular.svg?raw";
import BoxMultipleArrowRightFilled from "@fluentui/svg-icons/icons/box_multiple_arrow_right_24_filled.svg?raw";

// --- Import from ui-plugin --- //
import {
  FunctionToolbarItemConfig // Specific type for casting
  ,
  getFunctionConfig,
  getToolbarItemsForTarget,
  PanelToolbarItemConfig,
  ToolbarItemConfig
} from "@teskooano/ui-plugin";

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

    // Fetch and render buttons from plugin system
    this.populateButtonsFromPlugins();

    // Listen only for panel removals and expansion state (if needed)
    this.listenForPanelRemovals();
    this.listenForExpansionChanges(); // Add back listener for expansion state
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
        overflow: visible; /* Allow content overflow */
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
        transition: max-width 0.3s ease-in-out, opacity 0.3s ease-in-out;
        white-space: nowrap; /* Prevent wrapping during transition */
        opacity: 0; /* Start hidden */
        visibility: hidden; /* Start hidden */
      }

      .toolbar-collapsible-buttons.expanded {
        max-width: 500px; /* Adjust as needed */
        opacity: 1;
        visibility: visible;
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

    // --- TODO: Re-integrate expansion state management --- //
    const isInitiallyExpanded = false; // Default to collapsed for now

    // 1. Create Toggle Button
    const toggleButton = document.createElement("teskooano-button");
    toggleButton.id = `engine-toolbar-toggle-${this._apiId}`;
    toggleButton.classList.add("toolbar-toggle-button");
    toggleButton.setAttribute("variant", "icon");
    toggleButton.setAttribute("size", "lg");
    toggleButton.title = isInitiallyExpanded ? "Hide Tools" : "Show Tools";
    // toggleButton.style.display = 'none'; // Keep toggle visible

    const iconSpan = document.createElement("span");
    iconSpan.slot = "icon";
    iconSpan.innerHTML = isInitiallyExpanded ? BoxMultipleArrowLeftFilled : BoxMultipleArrowRightFilled;
    toggleButton.appendChild(iconSpan);

    toggleButton.addEventListener("click", () => {
      // --- TODO: Implement toggle logic using a state management solution --- //
      console.warn(`[EngineToolbar ${this._apiId}] Toggle button clicked - expansion state management not implemented.`);
      // Example using hypothetical toggle function:
      // toggleExpansionState(this._apiId);
    });

    this._element.appendChild(toggleButton);
    this._toggleButton = toggleButton; // Store reference

    // 2. Create Collapsible Container
    const collapsibleContainer = document.createElement("div");
    collapsibleContainer.classList.add("toolbar-collapsible-buttons");
    if (isInitiallyExpanded) {
      collapsibleContainer.classList.add("expanded");
    }

    this._element.appendChild(collapsibleContainer);
    this._collapsibleContainer = collapsibleContainer; // Store reference
  }

  /** Fetches buttons from the plugin manager and renders them */
  private populateButtonsFromPlugins(): void {
    console.log(`[EngineToolbar ${this._apiId}] Fetching items for target 'engine-toolbar'`);
    const buttonConfigs = getToolbarItemsForTarget('engine-toolbar');
    console.log(`[EngineToolbar ${this._apiId}] Found ${buttonConfigs.length} items.`);
    this.renderDynamicButtons(buttonConfigs);
  }

  /** Listen only for panel removals to clean up internal tracking */
  private listenForPanelRemovals(): void {
    this._dockviewController.onPanelRemoved$.subscribe((removedPanelId) => {
      if (this._activeFloatingPanels.has(removedPanelId)) {
        console.log(
          `[EngineToolbar ${this._apiId}] Detected removal of tracked floating panel '${removedPanelId}'. Removing from active map.`
        );
        this._activeFloatingPanels.delete(removedPanelId);
      }
    });
  }

  /** Listen for expansion state changes to update UI */
  private listenForExpansionChanges(): void {
    // --- TODO: Re-subscribe to expansion state changes --- //
    console.warn(`[EngineToolbar ${this._apiId}] Expansion state listening not implemented.`);
    // Example using hypothetical store:
    // this._expandedStoreUnsubscribe = $toolbarExpansionStates.subscribe((allStates) => {
    //     const isExpanded = allStates[this._apiId] ?? false; // Default to collapsed
    //     console.log(`Toolbar expanded state changed for ${this._apiId}: ${isExpanded}`);
    //     if (this._collapsibleContainer) {
    //         this._collapsibleContainer.classList.toggle("expanded", isExpanded);
    //     }
    //     if (this._toggleButton) {
    //         const iconSpan = this._toggleButton.querySelector("span[slot='icon']");
    //         if (iconSpan) {
    //             iconSpan.innerHTML = isExpanded
    //                 ? BoxMultipleArrowLeftFilled
    //                 : BoxMultipleArrowRightFilled;
    //         }
    //         this._toggleButton.title = isExpanded ? "Hide Tools" : "Show Tools";
    //     }
    // });
  }

  /** Clears and re-renders buttons in the collapsible container */
  private renderDynamicButtons(
    buttons: ToolbarItemConfig[],
  ): void {
    if (!this._collapsibleContainer) return;

    this._collapsibleContainer.innerHTML = ""; // Clear existing buttons

    buttons.forEach((config) => {
      const button = document.createElement("teskooano-button");
      // Use config.id directly (plugin system ensures uniqueness per target)
      button.id = `engine-toolbar-button-${config.id}`;
      button.title = config.title;
      button.setAttribute("variant", "icon");
      button.setAttribute("size", "small");

      const iconSpan = document.createElement("span");
      iconSpan.slot = "icon";
      iconSpan.innerHTML = config.iconSvg;
      button.appendChild(iconSpan);

      button.addEventListener("click", async () => {
        if (config.type === "panel") {
          this.handlePanelButtonClick(config as PanelToolbarItemConfig);
        } else if (config.type === "function") {
          this.handleFunctionButtonClick(config as FunctionToolbarItemConfig);
        }
      });

      this._collapsibleContainer?.appendChild(button);
    });
  }

  /** Handles clicks for buttons configured as 'panel' type */
  private handlePanelButtonClick(config: PanelToolbarItemConfig): void {
    const panelId = `${config.componentName}_${this._apiId}_float`;
    const behaviour = config.behaviour ?? "toggle";

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
      `[EngineToolbar ${this._apiId}] Handling panel button click for: ${config.id}, panelId: ${panelId}, component: ${config.componentName}, behaviour: ${behaviour}`
    );

    // --- Toggle Behaviour ---
    if (behaviour === "toggle") {
      const existingPanel = this._dockviewController.api.getPanel(panelId);
      if (existingPanel?.api.isVisible) {
        console.log(
          `[EngineToolbar ${this._apiId}] Panel ${panelId} exists and is visible, removing (toggle off).`
        );
        try {
          this._dockviewController.api.removePanel(existingPanel);
          // Let the subscription handle _activeFloatingPanels cleanup
        } catch (error) {
          console.error(`[EngineToolbar ${this._apiId}] Error removing panel ${panelId}:`, error);
        }
      } else {
        const position = calculatePosition();
        console.log(`[EngineToolbar ${this._apiId}] Calculated position:`, JSON.stringify(position));
        if (existingPanel) {
          console.log(`[EngineToolbar ${this._apiId}] Panel ${panelId} exists but is hidden. Activating and setting size.`);
          try {
            existingPanel.api.setSize(position);
            const newTitle = config.panelTitle ?? config.title;
            if (existingPanel.api.title !== newTitle) {
              existingPanel.api.updateParameters({ title: newTitle });
            }
            existingPanel.api.setActive();
            // Re-track just in case removal listener didn't fire/was missed
            this._activeFloatingPanels.set(panelId, config.componentName);
          } catch (e) {
            console.error(`[EngineToolbar ${this._apiId}] Error setting size/activating existing panel ${panelId}:`, e);
          }
        } else {
          console.log(`[EngineToolbar ${this._apiId}] Panel ${panelId} does not exist. Creating new panel.`);
          const panelApi = this._dockviewController.addFloatingPanel(
            {
              id: panelId, // Use derived ID for toggle
              component: config.componentName,
              title: config.panelTitle ?? config.title,
              params: {
                title: config.panelTitle ?? config.title,
                parentInstance: this._parentEngine, // CRITICAL
              },
            },
            position
          );
          if (panelApi) {
            this._activeFloatingPanels.set(panelId, config.componentName);
            panelApi.setActive?.();
          } else {
            console.error(`[EngineToolbar ${this._apiId}] Failed to create floating panel ${panelId}`);
          }
        }
      }
    }
    // --- Create Behaviour ---
    else if (behaviour === "create") {
      console.log(
        `[EngineToolbar ${this._apiId}] Creating new panel instance for ${config.componentName} (behaviour: create).`,
      );
      const newPanelId = `${config.componentName}_${this._apiId}_float_${Date.now()}`;
      const position = calculatePosition();
      console.log(`[EngineToolbar ${this._apiId}] Calculated position for new panel ${newPanelId}:`, position);
      const panelApi = this._dockviewController.addFloatingPanel(
        {
          id: newPanelId,
          component: config.componentName,
          title: config.panelTitle ?? config.title,
          params: {
            title: config.panelTitle ?? config.title,
            parentInstance: this._parentEngine, // CRITICAL
          },
        },
        position
      );
      if (panelApi) {
        this._activeFloatingPanels.set(newPanelId, config.componentName);
        panelApi.setActive?.();
      } else {
        console.error(`[EngineToolbar ${this._apiId}] Failed to create floating panel ${newPanelId}`);
      }
    }
  }

  /** Handles clicks for buttons configured as 'function' type */
  private async handleFunctionButtonClick(config: FunctionToolbarItemConfig): Promise<void> {
    console.log(`[EngineToolbar ${this._apiId}] Handling function button click for: ${config.id}, functionId: ${config.functionId}`);
    const funcConfig = getFunctionConfig(config.functionId);
    if (funcConfig && typeof funcConfig.execute === 'function') {
      try {
        // Pass the apiId or parentEngine if the function needs context?
        // For now, pass nothing.
        await funcConfig.execute(/* pass args if needed */);
      } catch (error) {
        console.error(
          `[EngineToolbar ${this._apiId}] Error executing function '${config.functionId}' for button '${config.id}':`,
          error
        );
      }
    } else {
      console.warn(
        `[EngineToolbar ${this._apiId}] Function configuration or execute method not found for functionId: ${config.functionId}`
      );
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

    // Remove the element from the DOM
    this._element.remove();

    // Clear internal references
    this._toggleButton = null;
    this._collapsibleContainer = null;
    this._activeFloatingPanels.clear();

    // NOTE: We may need to explicitly unsubscribe from the dockviewController.onPanelRemoved$ subject
    // if the DockviewController doesn't handle observable cleanup itself when this toolbar is disposed.
    // For now, assume DockviewController manages its observables or is longer-lived.

    console.log(`[EngineToolbar ${this._apiId}] disposed.`);
  }
}
