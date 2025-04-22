import {
  createDockview,
  GroupPanelPartInitParameters,
  IContentRenderer,
  IDockviewPanel,
  DockviewApi,
  AddGroupOptions,
  AddPanelOptions,
} from "dockview-core";
import { CompositeEnginePanel } from "../components/engine/CompositeEnginePanel";
import { SettingsPanel } from "../components/settings/SettingsPanel";
// import { CelestialInfoPanel } from "../components/ui-controls/CelestialInfoPanel"; // REMOVE - Incorrect Class/File

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

// --- Dockview Controller ---
export class DockviewController {
  private _api: DockviewApi;
  // Registry for dynamically added components
  private _registeredComponents = new Map<string, new () => IContentRenderer>();
  // Map to store logical group names to their runtime Dockview group IDs
  private _groupNameToIdMap: Map<string, string> = new Map();
  // Map to cache group references
  private _groupCache: Map<string, DockviewGroup> = new Map();

  constructor(element: HTMLElement) {
    // Register components needed at initialization time internally first
    // this._registeredComponents.set("engine_view", EnginePanel);
    // this._registeredComponents.set("ui_view", UiPanel);
    this._registeredComponents.set(
      "composite_engine_view",
      CompositeEnginePanel,
    );
    // this._registeredComponents.set("celestial_info", CelestialInfoPanel); // REMOVE - Incorrect Class/File
    this._registeredComponents.set("settings", SettingsPanel);
    // Remove pre-registration for dynamically added panels
    // this._registeredComponents.set('progress_view', ProgressPanel);

    this._api = createDockview(element, {
      className: "dockview-theme-abyss",
      createComponent: (options) => {
        console.log(`DockviewController: Creating component for name: '${options.name}'`);
        // Check the registry first
        const RegisteredComponent = this._registeredComponents.get(
          options.name,
        );
        if (RegisteredComponent) {
          console.log(`DockviewController: Found registered component: ${RegisteredComponent.name}`);
          try {
             return new RegisteredComponent();
          } catch (err) {
             console.error(`DockviewController: Error instantiating registered component '${options.name}':`, err);
             const errorPanel = new Panel();
             // Check if err is an Error object before accessing message
             const errorMessage = err instanceof Error ? err.message : String(err);
             errorPanel.updateContent(`Error creating component: ${errorMessage}`);
             return errorPanel;
          }
        }

        // Fallback for default or unknown (or if we chose not to pre-register above)
        console.log(`DockviewController: Component '${options.name}' not in registry, using fallback.`);
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
      disableFloatingGroups: true,
    });

    // Handle panel activation changes
    this._api.onDidActivePanelChange(
      (activePanel: IDockviewPanel | undefined) => {
        // this.activePanelApiStore.set(activePanelApi?.api ?? null); // REMOVE - Property doesn't exist
      },
    );
  }

  /**
   * Public method to register component constructors dynamically.
   * Note: Components needed at init time are now pre-registered in the constructor.
   * This method can be used for components added truly dynamically later,
   * or if you prefer explicit external registration for all.
   */
  public registerComponent(
    name: string,
    constructor: new () => IContentRenderer,
  ): void {
    if (this._registeredComponents.has(name)) {
      console.warn(
        `DockviewController: Component '${name}' is already registered. Overwriting.`,
      );
    }
    this._registeredComponents.set(name, constructor);
    console.log(`DockviewController: Registered component '${name}'`);
  }

  /**
   * Public method to add a new panel to the Dockview instance.
   * This ensures the component is registered before adding.
   *
   * @param options Options for adding the panel (Dockview AddPanelParameters)
   * @returns The newly added panel (IDockviewPanel)
   */
  public addPanel(options: Parameters<DockviewApi['addPanel']>[0]): IDockviewPanel {
    // Ensure the component type is registered if it's a string name
    if (typeof options.component === 'string' && !this._registeredComponents.has(options.component)) {
      console.warn(`DockviewController: Component '${options.component}' not pre-registered. Panel may fail to render.`);
      // Optionally, we could throw an error or provide a default component here.
    }
    
    // We can add more logic here later, like checking for existing IDs, etc.
    return this._api.addPanel(options);
  }

  /**
   * Creates a new group or returns an existing one with the provided name.
   * @param groupName Logical name for the group
   * @param options Optional configuration for the new group
   * @returns The group object or null if creation failed
   */
  public createOrGetGroup(
    groupName: string, 
    options?: AddGroupOptions
  ): DockviewGroup | null {
    // Check if we already have the group cached
    if (this._groupNameToIdMap.has(groupName)) {
      const groupId = this._groupNameToIdMap.get(groupName)!;
      const cachedGroup = this._groupCache.get(groupId) || this._api.getGroup(groupId);
      
      if (cachedGroup) {
        this._groupCache.set(groupId, cachedGroup);
        return cachedGroup;
      }
      
      // Group no longer exists, remove from cache
      this._groupNameToIdMap.delete(groupName);
      this._groupCache.delete(groupId);
    }
    
    // Create a new group
    try {
      const newGroup = this._api.addGroup(options);
      const newId = newGroup.id;
      
      // Store mappings
      this._groupNameToIdMap.set(groupName, newId);
      this._groupCache.set(newId, newGroup);
      
      console.log(`DockviewController: Created new group '${groupName}' with ID: ${newId}`);
      return newGroup;
    } catch (error) {
      console.error(`DockviewController: Failed to create group '${groupName}':`, error);
      return null;
    }
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
    panelOptions: AddPanelOptions
  ): IDockviewPanel | null {
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
        error
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
        `DockviewController: Cannot add panel '${panelOptions.id}' because group '${groupName}' could not be created.`
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
      console.error(`DockviewController: Cannot maximize group '${groupName}' because it doesn't exist.`);
      return false;
    }
    
    try {
      this._api.maximizeGroup(group);
      return true;
    } catch (error) {
      console.error(`DockviewController: Failed to maximize group '${groupName}':`, error);
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
      console.error(`DockviewController: Failed to exit maximized group:`, error);
    }
  }

  // Expose the raw Dockview API
  public get api(): DockviewApi {
    return this._api;
  }
}
