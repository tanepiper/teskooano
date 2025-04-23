import {
  createDockview,
  GroupPanelPartInitParameters,
  IContentRenderer,
  IDockviewPanel,
  DockviewApi,
  AddGroupOptions,
  AddPanelOptions,
  DockviewPanelApi,
  DockviewGroupPanel,
} from "dockview-core";
// Import Overlay specifically
import { Overlay } from "dockview-core/dist/esm/overlay/overlay";
import { CompositeEnginePanel } from "../components/engine/CompositeEnginePanel";
import { SettingsPanel } from "../components/settings/SettingsPanel";
import { EngineUISettingsPanel } from "../components/ui-controls/EngineUISettingsPanel";
import { FocusControl } from "../components/ui-controls/focus/FocusControl";
import { RendererInfoDisplay } from "../components/ui-controls/RendererInfoDisplay";
import { CelestialInfo } from "../components/ui-controls/CelestialInfo";
// import { CelestialInfoPanel } from "../components/ui-controls/CelestialInfoPanel"; // REMOVE - Incorrect Class/File
import { Subject, Observable } from "rxjs"; // Import RxJS classes
import {
  PanelToolbarButtonConfig,
  ToolbarButtonType,
} from "../stores/toolbarStore"; // Import toolbar type

// We'll use any here because the exact type from dockview is complex and private
type DockviewGroup = any;

// --- State --- (Removed counter)

// --- Panel Component (Basic Fallback) ---
class Panel implements IContentRenderer {
  private readonly _element: HTMLElement;
  private _params:
    | (GroupPanelPartInitParameters & { params?: { title?: string } })
    | undefined;
  // private _api: DockviewPanelApi | undefined;

  get element(): HTMLElement {
    return this._element;
  }

  constructor() {
    this._element = document.createElement("div");
    this._element.style.color = "var(--color-text)"; // Use CSS variable
    this._element.style.padding = "10px";
    this._element.style.height = "100%"; // Ensure content can fill panel
    this._element.style.boxSizing = "border-box";
    this._element.textContent = "Panel Content Initializing..."; // Initial text
  }

  init(parameters: GroupPanelPartInitParameters): void {
    this._params = parameters as GroupPanelPartInitParameters & {
      params?: { title?: string };
    };
    // this._api = parameters.api;

    // Simplify title access - rely only on params we pass
    const title = this._params?.params?.title ?? "Untitled Panel";
    this._element.textContent = `Content for: ${title}`;
  }

  // Example method to update content
  updateContent(newText: string): void {
    this._element.textContent = newText;
  }
}

// Add a type for overlay options for clarity
interface OverlayOptions {
  width: number;
  height: number;
}

// Add a type for storing overlay info
interface ActiveOverlay {
  overlay: Overlay;
  element: HTMLElement;
  resolve: (result: ModalResult) => void; // For the promise
}

// Type for component constructor with potential static toolbar config method
// Need to define the static side separately
interface ComponentWithStaticConfig extends IContentRenderer {
  // No instance-side changes needed here usually
}
interface ComponentConstructorWithStaticConfig {
  new (): ComponentWithStaticConfig;
  componentName?: string; // Allow static name
  registerToolbarButtonConfig?: () => PanelToolbarButtonConfig;
}

// Type for the value stored in the component registry
interface RegisteredComponentInfo {
  constructor: new () => IContentRenderer; // Keep original constructor type here
  toolbarConfig?: PanelToolbarButtonConfig; // Store static config if available
}

// --- Dockview Controller ---
export class DockviewController {
  private _api: DockviewApi;
  // Updated registry to store constructor AND static toolbar config
  private _registeredComponents = new Map<string, RegisteredComponentInfo>();
  // Map to store logical group names to their runtime Dockview group IDs
  private _groupNameToIdMap: Map<string, string> = new Map();
  // Map to cache group references
  private _groupCache: Map<string, DockviewGroup> = new Map();
  private _overlayContainer: HTMLElement; // Need the root element for overlay bounds
  private _activeOverlays: Map<string, ActiveOverlay> = new Map();

  // --- RxJS Subject for Panel Removal ---
  private _removedPanelSubject = new Subject<string>();
  public readonly onPanelRemoved$: Observable<string> =
    this._removedPanelSubject.asObservable();
  // --- End RxJS Subject ---

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
            const errorPanel = new Panel();
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
            return new Panel(); // Basic fallback panel
          default:
            console.warn(
              `Unknown component requested or not registered: ${options.name}`,
            );
            const errorPanel = new Panel();
            errorPanel.updateContent(
              `Error: Unknown/unregistered component '${options.name}'`,
            );
            return errorPanel;
        }
      },
      disableFloatingGroups: false,
    });

    // Handle panel activation changes
    this._api.onDidActivePanelChange(
      (activePanel: IDockviewPanel | undefined) => {
        // this.activePanelApiStore.set(activePanelApi?.api ?? null); // REMOVE - Property doesn't exist
      },
    );

    this._overlayContainer = element; // Store the root element

    // --- Add Event Listener for Panel Removal ---
    this._api.onDidRemovePanel((panel: IDockviewPanel) => {
      this.handlePanelRemoval(panel);
    });
    // --- End Event Listener ---
  }

  /**
   * Public method to register component constructors dynamically.
   * Note: Components needed at init time are now pre-registered in the constructor.
   * This method can be used for components added truly dynamically later,
   * or if you prefer explicit external registration for all.
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
   * Public method to add a new panel to the Dockview instance.
   * This ensures the component is registered before adding.
   *
   * @param options Options for adding the panel (Dockview AddPanelParameters)
   * @returns The newly added panel (IDockviewPanel)
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
   * Handles cases where the group might have been closed by the user.
   * @param groupName Logical name for the group
   * @param options Optional configuration for the new group
   * @returns The group object or null if creation failed or group not found
   */
  public createOrGetGroup(
    groupName: string,
    options?: AddGroupOptions,
  ): DockviewGroup | null {
    let group: DockviewGroup | null = null;
    const groupId = this._groupNameToIdMap.get(groupName);

    // 1. Check if we have a known ID for this group name
    if (groupId) {
      // 2. Try getting the group from the cache or API
      group = this._groupCache.get(groupId) || this._api.getGroup(groupId);

      // 3. Validate if the retrieved group actually exists in the Dockview instance
      if (group && this._api.getGroup(groupId)) {
        // Group exists and is valid, update cache and return
        this._groupCache.set(groupId, group);
        console.log(
          `DockviewController: Found existing group '${groupName}' with ID: ${groupId}`,
        );
        return group;
      } else {
        // Group ID was mapped, but group no longer exists (closed by user)
        console.warn(
          `DockviewController: Group '${groupName}' (ID: ${groupId}) not found or invalid. Removing stale entry.`,
        );
        this._groupNameToIdMap.delete(groupName);
        if (groupId) this._groupCache.delete(groupId); // Clear cache for the old ID
        group = null; // Ensure we proceed to create a new one
      }
    }

    // 4. If no valid group was found, create a new one
    if (!group) {
      console.log(
        `DockviewController: Creating new group for '${groupName}'...`,
      );
      try {
        const newGroup = this._api.addGroup(options);
        const newId = newGroup.id;

        // Store new mappings
        this._groupNameToIdMap.set(groupName, newId);
        this._groupCache.set(newId, newGroup);

        console.log(
          `DockviewController: Created new group '${groupName}' with ID: ${newId}`,
        );
        return newGroup;
      } catch (error) {
        console.error(
          `DockviewController: Failed to create group '${groupName}':`,
          error,
        );
        return null;
      }
    }

    // Should technically not be reached, but satisfies TS
    return group;
  }

  /**
   * Get a group by its logical name
   */
  public getGroupByName(groupName: string): DockviewGroup | null {
    const groupId = this._groupNameToIdMap.get(groupName);
    if (!groupId) return null;

    return this._api.getGroup(groupId) || null;
  }

  /**
   * Adds a panel to a specified group using the group's ID
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
   * Adds a panel to a named group, creating the group if it doesn't exist
   */
  public addPanelToNamedGroup(
    groupName: string,
    panelOptions: AddPanelOptions,
    groupOptions?: AddGroupOptions,
  ): IDockviewPanel | null {
    // Get or create the group
    const group = this.createOrGetGroup(groupName, groupOptions);

    if (!group) {
      console.error(
        `DockviewController: Cannot add panel '${panelOptions.id}' because group '${groupName}' could not be created.`,
      );
      return null;
    }

    return this.addPanelToGroup(group, panelOptions);
  }

  /**
   * Maximize a group by its logical name
   */
  public maximizeGroupByName(groupName: string): boolean {
    const group = this.getGroupByName(groupName);
    if (!group) {
      console.error(
        `DockviewController: Cannot maximize group '${groupName}' because it doesn't exist.`,
      );
      return false;
    }

    try {
      this._api.maximizeGroup(group);
      return true;
    } catch (error) {
      console.error(
        `DockviewController: Failed to maximize group '${groupName}':`,
        error,
      );
      return false;
    }
  }

  /**
   * Exit maximized state for any maximized group
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
   * @param componentName The name the component was registered under.
   * @returns The static PanelToolbarButtonConfig or undefined if not found or not applicable.
   */
  public getToolbarButtonConfig(
    componentName: string,
  ): PanelToolbarButtonConfig | undefined {
    const componentInfo = this._registeredComponents.get(componentName);
    return componentInfo?.toolbarConfig;
  }

  // Expose the raw Dockview API
  public get api(): DockviewApi {
    return this._api;
  }

  // --- NEW OVERLAY METHODS ---

  /**
   * Shows a modal-like overlay centered in the Dockview container.
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
    return new Promise((resolve) => {
      if (this._activeOverlays.has(id)) {
        console.warn(
          `DockviewController: Overlay with ID ${id} already shown.`,
        );
        // Potentially bring existing overlay to front?
        // For now, let's just resolve the promise as dismissed to avoid issues
        resolve("dismissed");
        return;
      }

      // --- Calculate Centered Bounds ---
      const containerRect = this._overlayContainer.getBoundingClientRect();
      const width = options.width;
      const height = options.height;
      const top = Math.max(
        0,
        containerRect.top + containerRect.height / 2 - height / 2,
      );
      const left = Math.max(
        0,
        containerRect.left + containerRect.width / 2 - width / 2,
      );

      console.log(
        `DockviewController: Creating overlay ${id} at top: ${top}, left: ${left}, width: ${width}, height: ${height}`,
      );

      try {
        // TODO: Replace with actual Dockview Overlay creation/API call
        // This is a conceptual placeholder - NOW IMPLEMENTED
        // Create the overlay instance
        const overlayInstance = new Overlay({
          // Provide required options based on overlay.d.ts
          container: this._overlayContainer,
          content: element, // The modal element passed in
          // Pass bounds directly if Overlay constructor accepts them
          // Or set them via setBounds later
          top: top,
          left: left,
          width: width,
          height: height,
          // Add minimumInViewportWidth/Height if needed
        });

        const overlayElement = overlayInstance.element as HTMLElement;

        // Style and append content - Overlay likely handles its own element structure
        // The overlay should handle its own placement within the container,
        // but we might need to ensure the container allows absolute positioning.
        this._overlayContainer.style.position = "relative"; // Ensure container is a positioning context

        // --- Setup Dockview Overlay ---
        // Bounds might be set in constructor, or confirm setBounds is needed
        // overlayInstance.setBounds({ top, left, width, height });
        overlayInstance.setVisible(true);
        overlayInstance.bringToFront(); // Ensure it's on top

        // Overlay constructor likely handles adding its element to the container

        // TODO: Add listeners if overlay provides close events

        // Store the overlay info
        this._activeOverlays.set(id, {
          overlay: overlayInstance,
          element: overlayElement, // Store the overlay's root element
          resolve,
        });
      } catch (error) {
        console.error(
          `DockviewController: Failed to create overlay ${id}:`,
          error,
        );
        resolve("dismissed"); // Resolve as dismissed on error
      }
    });
  }

  /**
   * Hides and cleans up a specific overlay.
   * @param id The ID of the overlay to hide.
   * @param result The reason the overlay is being hidden (e.g., 'confirm', 'close').
   */
  public hideOverlay(id: string, result: ModalResult): void {
    const overlayData = this._activeOverlays.get(id);
    if (!overlayData) {
      console.warn(
        `DockviewController: No active overlay found with ID ${id} to hide.`,
      );
      return;
    }

    console.log(
      `DockviewController: Hiding overlay ${id} with result: ${result}`,
    );

    try {
      // TODO: Replace with actual Dockview Overlay API calls
      overlayData.overlay.setVisible(false);
      // Optionally remove the element from DOM
      // Overlay dispose should handle removing its element
      // Dispose overlay and listeners
      overlayData.overlay.dispose();
    } catch (error) {
      console.error(
        `DockviewController: Error during overlay cleanup for ${id}:`,
        error,
      );
    }

    // Resolve the promise associated with this overlay
    overlayData.resolve(result);

    // Remove from active map
    this._activeOverlays.delete(id);
  }

  // Method to clean up all overlays on controller disposal
  public disposeOverlays(): void {
    this._activeOverlays.forEach((_, id) => {
      this.hideOverlay(id, "dismissed");
    });
  }

  // --- Ensure dispose calls the new cleanup ---
  public dispose(): void {
    // Dispose the main Dockview API instance first
    // This should implicitly handle cleanup of internal listeners,
    // but explicit removal is safer if the API allows it.
    // Note: DockviewApi doesn't expose a specific method to remove listeners added with 'onDid...',
    // so disposing the api instance itself is the primary cleanup mechanism.
    try {
      this._api.dispose();
      console.log("DockviewController: Dockview API disposed.");
    } catch (error) {
      console.error("DockviewController: Error disposing Dockview API:", error);
    }

    // --- Complete the Subject ---
    this._removedPanelSubject.complete();
    // --- End Complete Subject ---

    // Clear our internal caches/maps
    this._registeredComponents.clear();
    this._groupNameToIdMap.clear();
    this._groupCache.clear();
    console.log("DockviewController: Internal caches cleared.");

    // Dispose any active overlays
    this.disposeOverlays(); // Already handles logging
  }

  /**
   * Adds a new panel within its own new floating group.
   * @param panelOptions Options for the panel to add.
   * @param position Optional absolute position and size for the floating group.
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

  // --- UPDATED METHOD TO HANDLE PANEL REMOVAL ---
  private handlePanelRemoval(panel: IDockviewPanel): void {
    const groupId = panel.group?.id; // Use optional chaining
    const panelId = panel.id;

    console.log(
      `DockviewController: handlePanelRemoval called for panel '${panelId}' in group '${groupId ?? "none"}'`,
    );

    // --- Notify Subscribers ---
    this._removedPanelSubject.next(panelId);
    // --- End Notify ---

    const group = panel.group; // Get the group the panel belonged to

    // Check if the group is now empty AND if it's still tracked in our map
    if (group && group.panels.length === 0) {
      let groupNameToRemove: string | null = null;
      for (const [name, id] of this._groupNameToIdMap.entries()) {
        if (id === group.id) {
          groupNameToRemove = name;
          break;
        }
      }

      if (groupNameToRemove) {
        console.log(
          `DockviewController: Panel removed from group '${groupNameToRemove}' (ID: ${group.id}). Group is now empty, removing mapping.`,
        );
        this._groupNameToIdMap.delete(groupNameToRemove);
        this._groupCache.delete(group.id);
      } else {
        console.log(
          `DockviewController: Panel '${panelId}' removed from empty group (ID: ${group.id}) that wasn't tracked by logical name (e.g., floating or closed group). No mapping cleanup needed.`,
        );
      }
    } else if (group) {
      // Log panel removal without group cleanup if group is not empty
      console.log(
        `DockviewController: Panel '${panelId}' removed from group ID: ${group.id}. Group still contains panels.`,
      );
    } else {
      // This case might happen if the panel was already detached from its group
      // before the removal event fired, or for floating panels initially.
      console.warn(
        `DockviewController: Removed panel '${panelId}' did not have an associated group at the time of removal event.`,
      );
    }
  }
  // --- END UPDATED METHOD ---
}

// --- Add ModalResult type if not already imported/defined ---
export type ModalResult = "confirm" | "close" | "secondary" | "dismissed";
