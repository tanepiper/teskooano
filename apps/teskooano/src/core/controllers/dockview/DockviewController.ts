import {
  AddGroupOptions,
  AddPanelOptions,
  createDockview,
  DockviewApi,
  DockviewPanelApi,
  IContentRenderer,
  IDockviewPanel,
} from "dockview-core";

import { Observable, Subject } from "rxjs";
import { CompositeEnginePanel } from "../../../plugins/engine/panels/CompositeEnginePanel";
import { SettingsPanel } from "../../../plugins/settings/SettingsPanel";
import { CelestialInfo } from "../../../plugins/ui-controls/celestial-info/CelestialInfo";
import { EngineUISettingsPanel } from "../../../plugins/engine/engine-toolbar/engine-settings/EngineSettings";
import { FocusControl } from "../../../plugins/ui-controls/focus/FocusControl";
import { RendererInfoDisplay } from "../../../plugins/engine/engine-toolbar/engine-info/engine-info";
import { PanelToolbarButtonConfig } from "../../../plugins/engine/engine-toolbar/EngineToolbar.store";

// Import types and fallback panel
import { FallbackPanel } from "./FallbackPanel";
import { GroupManager } from "./GroupManager";
import { OverlayManager } from "./OverlayManager";
import {
  ComponentConstructorWithStaticConfig,
  DockviewGroup,
  ModalResult,
  OverlayOptions,
  RegisteredComponentInfo,
} from "./types";

/**
 * Controller class for managing a Dockview instance.
 * Handles component registration, panel/group management, overlays,
 * and interactions with the core Dockview API.
 * Delegates specific tasks to OverlayManager and GroupManager.
 */
export class DockviewController {
  private _api: DockviewApi;
  /** @internal Component registry mapping names to constructors and config */
  private _registeredComponents = new Map<string, RegisteredComponentInfo>();
  private _overlayManager: OverlayManager; // Add OverlayManager instance
  private _groupManager: GroupManager; // Add GroupManager instance

  // --- RxJS Subject for Panel Removal ---
  /** @internal Subject to emit panel IDs when they are removed */
  private _removedPanelSubject = new Subject<string>();
  /** Observable that emits the ID of a panel when it is removed from the Dockview instance. */
  public readonly onPanelRemoved$: Observable<string> =
    this._removedPanelSubject.asObservable();
  // --- End RxJS Subject ---

  /**
   * Creates an instance of DockviewController.
   * Initializes Dockview, managers, registers default components, and sets up listeners.
   * @param element - The root HTML element to host the Dockview instance.
   */
  constructor(element: HTMLElement) {
    // Register components needed at initialization time internally first
    this.registerComponent("composite_engine_view", CompositeEnginePanel);
    this.registerComponent(
      EngineUISettingsPanel.componentName,
      EngineUISettingsPanel,
    );
    this.registerComponent(FocusControl.componentName, FocusControl);
    this.registerComponent(
      RendererInfoDisplay.componentName,
      RendererInfoDisplay,
    );
    this.registerComponent(CelestialInfo.componentName, CelestialInfo);
    this.registerComponent("settings", SettingsPanel);
    // Remove pre-registration for dynamically added panels
    // this._registeredComponents.set('progress_view', ProgressPanel);

    this._api = createDockview(element, {
      className: "dockview-theme-abyss",
      createComponent: (options) => {
        console.log(
          `DockviewController: Creating component for name: '${options.name}'`,
        );
        // Check the registry first
        const componentInfo = this._registeredComponents.get(options.name);
        if (componentInfo) {
          console.log(
            `DockviewController: Found registered component info for: ${options.name}`,
          );
          try {
            // Instantiate using the stored constructor
            return new componentInfo.constructor();
          } catch (err) {
            console.error(
              `DockviewController: Error instantiating registered component '${options.name}':`,
              err,
            );
            const errorPanel = new FallbackPanel();
            // Check if err is an Error object before accessing message
            const errorMessage =
              err instanceof Error ? err.message : String(err);
            errorPanel.updateContent(
              `Error creating component: ${errorMessage}`,
            );
            return errorPanel;
          }
        }

        // Fallback for default or unknown (or if we chose not to pre-register above)
        console.log(
          `DockviewController: Component '${options.name}' not in registry, using fallback.`,
        );
        switch (options.name) {
          /* Cases for components not pre-registered could go here */
          /* e.g., if we didn't pre-register settings_view: 
          case 'settings_view':
            return new SettingsPanel(); 
          */
          case "default":
            return new FallbackPanel(); // Use FallbackPanel
          default:
            console.warn(
              `Unknown component requested or not registered: ${options.name}`,
            );
            const errorPanel = new FallbackPanel(); // Use FallbackPanel
            errorPanel.updateContent(
              `Error: Unknown/unregistered component '${options.name}'`,
            );
            return errorPanel;
        }
      },
      disableFloatingGroups: false,
    });

    // Instantiate Managers
    this._overlayManager = new OverlayManager(element);
    this._groupManager = new GroupManager(this._api); // Instantiate GroupManager

    // Handle panel activation changes
    this._api.onDidActivePanelChange(
      (activePanel: IDockviewPanel | undefined) => {
        // this.activePanelApiStore.set(activePanelApi?.api ?? null); // REMOVE - Property doesn't exist
      },
    );

    // --- Add Event Listener for Panel Removal ---
    this._api.onDidRemovePanel((panel: IDockviewPanel) => {
      this.handlePanelRemoval(panel);
    });
    // --- End Event Listener ---
  }

  /**
   * Dynamically registers a component constructor with the controller.
   * Allows adding components after initial setup.
   * Also extracts and stores static toolbar configuration if provided by the component.
   * @param name - The unique name to register the component under.
   * @param componentConstructor - The constructor function of the component.
   */
  public registerComponent(
    name: string,
    // Use the constructor type that might have static methods
    componentConstructor: ComponentConstructorWithStaticConfig,
  ): void {
    if (this._registeredComponents.has(name)) {
      console.warn(
        `DockviewController: Component '${name}' is already registered. Overwriting.`,
      );
    }

    // Check if the component has the static config method
    let toolbarConfig: PanelToolbarButtonConfig | undefined = undefined;
    if (
      typeof componentConstructor.registerToolbarButtonConfig === "function"
    ) {
      try {
        toolbarConfig = componentConstructor.registerToolbarButtonConfig();
        console.log(
          `DockviewController: Found toolbar config for component '${name}'`,
        );
      } catch (err) {
        console.error(
          `DockviewController: Error calling registerToolbarButtonConfig for '${name}':`,
          err,
        );
      }
    }

    // Store both constructor and config
    this._registeredComponents.set(name, {
      constructor: componentConstructor as new () => IContentRenderer, // Cast back for map
      toolbarConfig,
    });
    console.log(
      `DockviewController: Registered component '${name}' ${toolbarConfig ? "with" : "without"} toolbar config.`,
    );
  }

  /**
   * Adds a new panel to the Dockview instance using the core API.
   * It's recommended to use more specific methods like `addPanelToNamedGroup` or `addFloatingPanel`
   * unless direct API interaction is needed.
   * @param options - Options for adding the panel (Dockview AddPanelOptions).
   * @param options.component - The name of the registered component to render.
   * @returns The newly added panel API (IDockviewPanel).
   */
  public addPanel(
    options: Parameters<DockviewApi["addPanel"]>[0],
  ): IDockviewPanel {
    // Ensure the component type is registered if it's a string name
    if (
      typeof options.component === "string" &&
      !this._registeredComponents.has(options.component) &&
      options.component !== "default" // Don't warn for the default fallback
    ) {
      console.warn(
        `DockviewController: Component '${options.component}' not pre-registered. Panel may fail to render.`,
      );
      // Optionally, we could throw an error or provide a default component here.
    }

    // We can add more logic here later, like checking for existing IDs, etc.
    return this._api.addPanel(options);
  }

  /**
   * Creates a new group or returns an existing one with the provided name.
   * Delegates to GroupManager.
   * @param groupName Logical name for the group
   * @param options Optional configuration for the new group
   * @returns The group object or null if creation failed or group not found
   */
  public createOrGetGroup(
    groupName: string,
    options?: AddGroupOptions,
  ): DockviewGroup | null {
    return this._groupManager.createOrGetGroup(groupName, options);
  }

  /**
   * Get a group by its logical name.
   * Delegates to GroupManager.
   */
  public getGroupByName(groupName: string): DockviewGroup | null {
    return this._groupManager.getGroupByName(groupName);
  }

  /**
   * Adds a panel directly to a specific group using the group's reference.
   * This method interacts directly with the Dockview API.
   * @param group - The target Dockview group object.
   * @param panelOptions - Options for the panel to add (must include `id` and `component`).
   * @returns The API of the newly added panel, or null if creation failed.
   */
  public addPanelToGroup(
    group: DockviewGroup,
    panelOptions: AddPanelOptions,
  ): IDockviewPanel | null {
    // Log the group ID we are attempting to add to
    console.log(
      `DockviewController: Attempting to add panel '${panelOptions.id}' to group ID: ${group.id}`,
    );
    try {
      // Create panel using the main API but target the specific group
      const panelWithPosition = {
        ...panelOptions,
      };

      // Add position targeting if not already specified
      if (!panelWithPosition.position) {
        panelWithPosition.position = {
          referenceGroup: group.id,
        };
      }

      // Add the panel using the main API
      const panel = this._api.addPanel(panelWithPosition);

      // Activate the panel
      panel.api.setActive();
      return panel;
    } catch (error) {
      console.error(
        `DockviewController: Failed to add panel '${panelOptions.id}' to group ID '${group.id}':`,
        error,
      );
      return null;
    }
  }

  /**
   * Adds a panel to a named group, creating the group if it doesn't exist.
   * Uses GroupManager to get/create the group.
   */
  public addPanelToNamedGroup(
    groupName: string,
    panelOptions: AddPanelOptions,
    groupOptions?: AddGroupOptions,
  ): IDockviewPanel | null {
    // Use GroupManager to get or create the group
    const group = this._groupManager.createOrGetGroup(groupName, groupOptions);

    if (!group) {
      console.error(
        `DockviewController: Cannot add panel '${panelOptions.id}' because group '${groupName}' could not be created or retrieved.`,
      );
      return null;
    }

    // Use the controller's method to add the panel to the found group
    return this.addPanelToGroup(group, panelOptions);
  }

  /**
   * Maximize a group by its logical name.
   * Delegates to GroupManager.
   */
  public maximizeGroupByName(groupName: string): boolean {
    return this._groupManager.maximizeGroupByName(groupName);
  }

  /**
   * Exits the maximized state if any group is currently maximized.
   * Uses the core Dockview API.
   */
  public exitMaximizedGroup(): void {
    try {
      this._api.exitMaximizedGroup();
    } catch (error) {
      console.error(
        `DockviewController: Failed to exit maximized group:`,
        error,
      );
    }
  }

  /**
   * Retrieves the static toolbar button configuration for a registered component.
   * @param componentName - The name the component was registered under.
   * @returns The static PanelToolbarButtonConfig or undefined if not found.
   */
  public getToolbarButtonConfig(
    componentName: string,
  ): PanelToolbarButtonConfig | undefined {
    const componentInfo = this._registeredComponents.get(componentName);
    return componentInfo?.toolbarConfig;
  }

  /**
   * Exposes the raw Dockview API instance for advanced use cases.
   * @returns The underlying DockviewApi instance.
   */
  public get api(): DockviewApi {
    return this._api;
  }

  // --- OVERLAY METHODS (Delegation) ---

  /**
   * Shows a modal-like overlay centered in the Dockview container.
   * Delegates to OverlayManager.
   * @param id Unique ID for this overlay instance.
   * @param element The HTML element to display within the overlay.
   * @param options Dimensions for the overlay.
   * @returns A promise that resolves with the result when the overlay is hidden.
   */
  public showOverlay(
    id: string,
    element: HTMLElement,
    options: OverlayOptions,
  ): Promise<ModalResult> {
    return this._overlayManager.showOverlay(id, element, options);
  }

  /**
   * Hides and cleans up a specific overlay.
   * Delegates to OverlayManager.
   * @param id The ID of the overlay to hide.
   * @param result The reason the overlay is being hidden (e.g., 'confirm', 'close').
   */
  public hideOverlay(id: string, result: ModalResult): void {
    this._overlayManager.hideOverlay(id, result);
  }

  // --- Dispose Method ---
  public dispose(): void {
    try {
      this._api.dispose();
      console.log("DockviewController: Dockview API disposed.");
    } catch (error) {
      console.error("DockviewController: Error disposing Dockview API:", error);
    }

    this._removedPanelSubject.complete();

    // Clear internal caches/maps
    this._registeredComponents.clear();
    console.log(
      "DockviewController: Internal caches cleared (excluding managers).",
    );

    // Dispose managers
    this._overlayManager.dispose();
    this._groupManager.dispose(); // Call GroupManager dispose
  }

  /**
   * Adds a new panel within its own new floating group.
   * @param panelOptions - Options for the panel to add (must include `id` and `component`).
   * @param position - Optional absolute position and size for the floating group.
   * @returns The API of the newly added panel, or null if creation failed.
   */
  public addFloatingPanel(
    panelOptions: AddPanelOptions,
    position?: { top: number; left: number; width: number; height: number },
  ): DockviewPanelApi | null {
    let temporaryPanel: IDockviewPanel | null = null;
    try {
      console.log(
        `DockviewController: Attempting to add floating panel ${panelOptions.id}`,
      );

      // --- REVERTED: Create panel first, then add to floating group ---

      // 1. Create the panel instance *without* position details initially.
      // This might create it detached or in a default location temporarily.
      const initialPanelOptions: AddPanelOptions = {
        ...panelOptions,
        position: undefined, // Explicitly remove position from initial creation
      };
      temporaryPanel = this._api.addPanel(initialPanelOptions);

      if (!temporaryPanel || !temporaryPanel.api) {
        console.error(
          `DockviewController: Failed to create initial panel instance for ${panelOptions.id}.`,
        );
        return null;
      }
      console.log(
        `DockviewController: Initial panel ${panelOptions.id} created. Adding to floating group...`,
      );

      // 2. Add this panel instance to a new floating group, providing position.
      // This relies on addFloatingGroup handling the placement.
      this._api.addFloatingGroup(temporaryPanel, {
        // Pass the position object directly here
        position: position,
      });

      // --- ADD Explicit setSize call ---
      // Force the size again after adding to group, in case defaults overrode it
      if (position && temporaryPanel.api) {
        try {
          console.log(
            `DockviewController: Explicitly setting size for ${panelOptions.id} after addFloatingGroup.`,
          );
          temporaryPanel.api.setSize(position);
        } catch (e) {
          console.error(
            `DockviewController: Error calling setSize after addFloatingGroup for ${panelOptions.id}:`,
            e,
          );
        }
      }
      // --- END ADD ---

      console.log(
        `DockviewController: addFloatingGroup called for panel ${panelOptions.id}.`,
      );

      // Ensure it's active
      temporaryPanel.api.setActive();
      return temporaryPanel.api;
    } catch (error) {
      console.error(
        `DockviewController: Error adding floating panel ${panelOptions.id}:`,
        error,
      );
      // Clean up the temporary panel if it was created but floating failed
      if (temporaryPanel) {
        try {
          this._api.removePanel(temporaryPanel);
        } catch (cleanupError) {
          console.error(
            `DockviewController: Error cleaning up temporary panel ${panelOptions.id}:`,
            cleanupError,
          );
        }
      }
      return null;
    }
  }

  /**
   * Internal handler called when a panel is removed from the Dockview instance.
   * Notifies subscribers via `onPanelRemoved$` and triggers group tracking cleanup.
   * @param panel - The panel that was removed.
   * @internal
   */
  private handlePanelRemoval(panel: IDockviewPanel): void {
    const groupId = panel.group?.id;
    const panelId = panel.id;

    console.log(
      `DockviewController: handlePanelRemoval called for panel '${panelId}' in group '${groupId ?? "none"}'`,
    );

    this._removedPanelSubject.next(panelId);

    const group = panel.group;

    if (group && group.panels.length === 0 && groupId) {
      // Group is empty, tell GroupManager to clean up tracking for this ID
      this._groupManager.cleanupGroupTracking(groupId);
    } else if (group) {
      console.log(
        `DockviewController: Panel '${panelId}' removed from group ID: ${group.id}. Group still contains panels.`,
      );
    } else {
      console.warn(
        `DockviewController: Removed panel '${panelId}' did not have an associated group.`,
      );
    }
  }
  // --- END UPDATED METHOD ---
}
