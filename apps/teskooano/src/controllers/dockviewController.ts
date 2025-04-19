import { activePanelApi } from "@teskooano/core-state";
import {
  createDockview,
  DockviewPanelApi,
  GroupPanelPartInitParameters,
  IContentRenderer,
} from "dockview-core";
import { CompositeEnginePanel } from "../components/engine/CompositeEnginePanel";

// --- State --- (Removed counter)

// --- Panel Component ---
class Panel implements IContentRenderer {
  private readonly _element: HTMLElement;
  // Correctly type the params property
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
  private _api: ReturnType<typeof createDockview>;
  // Registry for dynamically added components
  private _registeredComponents = new Map<string, new () => IContentRenderer>();

  constructor(element: HTMLElement) {
    // Register components needed at initialization time internally first
    // this._registeredComponents.set("engine_view", EnginePanel);
    // this._registeredComponents.set("ui_view", UiPanel);
    this._registeredComponents.set(
      "composite_engine_view",
      CompositeEnginePanel,
    );
    // Remove pre-registration for dynamically added panels
    // this._registeredComponents.set('progress_view', ProgressPanel);
    // this._registeredComponents.set('settings_view', SettingsPanel);

    this._api = createDockview(element, {
      className: "dockview-theme-abyss",
      createComponent: (options) => {
        // Check the registry first
        const RegisteredComponent = this._registeredComponents.get(
          options.name,
        );
        if (RegisteredComponent) {
          return new RegisteredComponent();
        }

        // Fallback for default or unknown (or if we chose not to pre-register above)
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

    // Example: Log panel close events
    // TODO: Add this back in to handle forcing unsubscription of the active panel API
    // this._api.onDidRemovePanel(event => {
    //   //console.log(`Panel removed: ${event.id}`);
    // });

    // Example: Log panel active events and update state
    this._api.onDidActivePanelChange((event) => {
      if (event && event.api.component === "composite_engine_view") {
        // Check if it's an EnginePanel
        activePanelApi.set(event.api); // Update the store with the active panel API
      } else {
        // If a non-engine panel is activated, or focus is lost,
        // set the active panel store to null
        activePanelApi.set(null);
      }
    });
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
  }

  // Expose the raw Dockview API
  public get api() {
    return this._api;
  }
}
