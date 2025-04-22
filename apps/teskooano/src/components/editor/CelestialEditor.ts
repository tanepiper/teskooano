import {
    type CelestialObject, // Import CelestialType enum
    CelestialStatus
} from "@teskooano/data-types";
// Import necessary stores and registry from core-state
import { celestialObjectsStore } from "@teskooano/core-state";
// Import Dockview interface
import {
    DockviewPanelApi,
    GroupPanelPartInitParameters,
    IContentRenderer,
} from "dockview-core";
// TODO: Might need a specific parent type for editor panels if different from engine
import {
    PanelToolbarButtonConfig
} from "../../stores/toolbarStore"; // Import toolbar types
import { CompositeEnginePanel } from "../engine/CompositeEnginePanel"; // Import parent type

// Constants for formatters
const AU_IN_METERS = 149597870700;
const SECONDS_PER_DAY = 86400;
const SECONDS_PER_YEAR = SECONDS_PER_DAY * 365.25;

// Import Fluent UI Icons
// TODO: Change Icon to an appropriate Editor icon
import EditIcon from "@fluentui/svg-icons/icons/edit_24_regular.svg?raw";

// Shared formatter utility class (Keep for now, might be useful)
export class FormatUtils {
  static formatExp(val: number | undefined | null, digits = 3): string {
    return val != null && Number.isFinite(val)
      ? val.toExponential(digits)
      : "N/A";
  }

  static formatFix(val: number | undefined | null, digits = 1): string {
    return val != null && Number.isFinite(val) ? val.toFixed(digits) : "N/A";
  }

  static formatDistanceKm(
    meters: number | undefined | null,
    digits = 0,
  ): string {
    return meters != null && Number.isFinite(meters)
      ? (meters / 1000).toFixed(digits) + " km"
      : "N/A";
  }

  static formatDistanceAU(
    meters: number | undefined | null,
    digits = 3,
  ): string {
    return meters != null && Number.isFinite(meters)
      ? (meters / AU_IN_METERS).toFixed(digits) + " AU"
      : "N/A";
  }

  static formatDegrees(radians: number | undefined | null, digits = 1): string {
    return radians != null && Number.isFinite(radians)
      ? ((radians * 180) / Math.PI).toFixed(digits) + "°"
      : "N/A";
  }

  static formatPeriod(seconds: number | undefined | null): string {
    if (seconds == null || !Number.isFinite(seconds)) return "N/A";
    if (seconds > SECONDS_PER_YEAR * 1.5) {
      // Use years for long periods
      return (seconds / SECONDS_PER_YEAR).toFixed(2) + " yrs";
    } else if (seconds > SECONDS_PER_DAY * 1.5) {
      // Use days
      return (seconds / SECONDS_PER_DAY).toFixed(1) + " days";
    } else {
      // Use seconds for short periods
      return seconds.toFixed(0) + " s";
    }
  }

  // Function to map star color hex codes to descriptive names
  static getStarColorName(hexColor: string | undefined | null): string {
    if (!hexColor) return "Unknown";

    // Map of star colors to descriptive names based on spectral classes
    const colorMap: Record<string, string> = {
      // O-type stars (blue)
      "#9bb0ff": "Blue",
      "#a2b5ff": "Blue",
      "#aabfff": "Blue",

      // B-type stars (blue-white)
      "#cad7ff": "Blue-White",
      "#cadfff": "Blue-White",
      "#f6f3ff": "Blue-White",

      // A-type stars (white)
      "#f8f7ff": "White",
      "#ffffff": "White",

      // F-type stars (yellow-white)
      "#fff4ea": "Yellow-White",
      "#fffcdf": "Yellow-White",

      // G-type stars (yellow)
      "#ffff9d": "Yellow",
      "#fffadc": "Yellow",

      // K-type stars (orange)
      "#ffd2a1": "Orange",
      "#ffcc6f": "Orange",

      // M-type stars (red)
      "#ffb56c": "Red-Orange",
      "#ff9b6c": "Red",
      "#ff8080": "Red",
    };

    // Try exact match first
    const lowerHex = hexColor.toLowerCase();
    if (lowerHex in colorMap) {
      return colorMap[lowerHex];
    }

    // If no exact match, use a simple approximation based on color code
    if (hexColor.startsWith("#ff")) {
      if (hexColor.includes("8") || hexColor.includes("9")) {
        return "Reddish";
      } else {
        return "Yellowish";
      }
    } else if (
      hexColor.startsWith("#ca") ||
      hexColor.startsWith("#9b") ||
      hexColor.startsWith("#a")
    ) {
      return "Bluish";
    } else if (hexColor.startsWith("#ff")) {
      return "Yellowish";
    }

    return "Unknown";
  }
}

// --- MAIN CELESTIAL EDITOR COMPONENT ---
export class CelestialEditor extends HTMLElement implements IContentRenderer {
  private shadow: ShadowRoot;
  private _element: HTMLElement;
  private _api: DockviewPanelApi | undefined;
  private _parentInstance: CompositeEnginePanel | undefined;
  private _contentDiv: HTMLElement | undefined;
  private _parentStateUnsubscribe: (() => void) | undefined;

  // Store references
  private unsubscribeObjectsStore: (() => void) | null = null;
  private currentSelectedId: string | null = null;

  // TODO: References to EDITOR sub-components
  // private starEditorComponent: StarEditorComponent;
  // private planetEditorComponent: PlanetEditorComponent;
  // ... etc
  // private genericEditorComponent: GenericCelestialEditorComponent;

  // Track which component is currently active
  // TODO: Update type to CelestialEditorComponent when interface exists
  private activeComponent: any | null = null; 

  // --- Static Configuration ---
  public static readonly componentName = "celestial-editor"; // Updated

  public static registerToolbarButtonConfig(): PanelToolbarButtonConfig {
    return {
      id: "celestial_editor", // Updated Base ID
      iconSvg: EditIcon, // Updated Icon
      title: "Celestial Editor", // Updated Title
      type: "panel",
      componentName: this.componentName,
      panelTitle: "Celestial Editor", // Updated Panel Title
      behaviour: "toggle",
    };
  }
  // --- End Static Configuration ---

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this._element = this; // Initialize _element to the instance itself

    // TODO: Create EDITOR sub-components
    // this.starEditorComponent = new StarEditorComponent();
    // ... etc
    // this.genericEditorComponent = new GenericCelestialEditorComponent();

    // Start with generic component shown (or placeholder)
    // this.activeComponent = this.genericEditorComponent;

    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
        }
        
        .placeholder {
          padding: 10px;
          color: var(--ui-text-color-dim, #888);
          font-style: italic;
        }
        
        .container {
          width: 100%;
          height: 100%;
          overflow: auto;
        }
      </style>
      <div class="container">
        <!-- Placeholder for Editor Content -->
        <div class="placeholder">Select a celestial object to edit...</div> 
      </div>
    `;

    // TODO: Append EDITOR sub-components to shadow DOM (initially hidden)
    // const container = this.shadow.querySelector(".container") as HTMLElement;
    // if (container) {
      // container.appendChild(this.starEditorComponent);
      // ... etc
      // this.starEditorComponent.style.display = "none";
      // ... etc
    // }
  }

  // This method is required for IContentRenderer interface
  init(parameters: GroupPanelPartInitParameters): void {
    console.log("[CelestialEditor] Panel initialized"); // Updated Log

    // If params contains any specific setup instructions, handle them here
    const params = (parameters.params as { focusedObjectId?: string }) || {};
    if (params.focusedObjectId) {
      this.handleSelectionChange(params.focusedObjectId);
    }
  }

  // This getter is required for IContentRenderer interface
  get element(): HTMLElement {
    return this;
  }

  connectedCallback() {
    this.setupObjectListener();

    // Listen for focus changes
    document.addEventListener(
      "renderer-focus-changed",
      this.handleRendererFocusChange,
    );
    document.addEventListener(
      "focus-request-initiated",
      this.handleFocusRequestInitiated, 
    );
  }

  disconnectedCallback() {
    this.unsubscribeObjectsStore?.();
    this.unsubscribeObjectsStore = null;

    document.removeEventListener(
      "renderer-focus-changed",
      this.handleRendererFocusChange,
    );
    document.removeEventListener(
      "focus-request-initiated",
      this.handleFocusRequestInitiated, 
    );
  }

  // Event handler for focus changes confirmed by the renderer
  private handleRendererFocusChange = (event: Event): void => {
    const customEvent = event as CustomEvent<{
      focusedObjectId: string | null;
    }>;
    if (customEvent.detail) {
      if (this.currentSelectedId !== customEvent.detail.focusedObjectId) {
        this.handleSelectionChange(customEvent.detail.focusedObjectId);
      }
    }
  };

  // Event handler for focus requests initiated by UI
  private handleFocusRequestInitiated = (event: Event): void => {
    const customEvent = event as CustomEvent<{ objectId: string | null }>;
    if (customEvent.detail && customEvent.detail.objectId) {
      if (this.currentSelectedId !== customEvent.detail.objectId) {
        this.handleSelectionChange(customEvent.detail.objectId);
      }
    } else {
      console.warn("[CelestialEditor] Received focus request with no objectId."); // Updated Log
    }
  };

  private setupObjectListener() {
    this.unsubscribeObjectsStore = celestialObjectsStore.subscribe(
      (allCelestials) => {
        if (this.currentSelectedId) {
          const currentObject = allCelestials[this.currentSelectedId];
          if (currentObject) {
            this.renderEditor(currentObject); // Changed to renderEditor
          }
        }
      },
    );
  }

  private handleSelectionChange(selectedId: string | null) {
    if (selectedId === this.currentSelectedId) return;

    this.currentSelectedId = selectedId;

    if (!selectedId) {
      this.showPlaceholder("Select a celestial object to edit..."); // Updated placeholder text
      return;
    }

    const storeData = celestialObjectsStore.get();
    const objectMap = new Map(Object.entries(storeData));
    const celestialData = selectedId ? objectMap.get(selectedId) : null;

    if (celestialData) {
      if (celestialData.status === CelestialStatus.DESTROYED) {
        this.showPlaceholder(
          `Object '${celestialData.name}' has been destroyed. Cannot edit.`, // Updated placeholder text
        );
      } else {
        this.renderEditor(celestialData); // Changed to renderEditor
      }
    } else {
      this.showPlaceholder("Selected object data not found.");
    }
  }

  private showPlaceholder(message: string) {
    // TODO: Hide all EDITOR components
    // this.starEditorComponent.style.display = "none";
    // ... etc

    // Show placeholder
    const placeholder = this.shadow.querySelector(
      ".placeholder",
    ) as HTMLElement;
    if (placeholder) {
      placeholder.style.display = "block";
      placeholder.textContent = message;
    }

    this.activeComponent = null;
  }

  // Changed from renderInfo to renderEditor
  private renderEditor(celestial: CelestialObject) {
    // Hide placeholder
    const placeholder = this.shadow.querySelector(
      ".placeholder",
    ) as HTMLElement;
    if (placeholder) {
      placeholder.style.display = "none";
    }

    // Hide current active component
    if (this.activeComponent) {
      this.activeComponent.style.display = "none";
    }

    // TODO: Select the appropriate EDITOR component based on celestial type
    let newActiveComponent: any; // TODO: Update type to CelestialEditorComponent

    switch (celestial.type) {
      // case CelestialType.STAR:
      //   newActiveComponent = this.starEditorComponent;
      //   break;
      // ... handle other types
      // default:
      //   newActiveComponent = this.genericEditorComponent;
      //   break;
    }
    
    // TEMPORARY: Just show generic info for now until editor components exist
    newActiveComponent = this.shadow.querySelector(".placeholder"); // Re-use placeholder for now
    if (newActiveComponent) {
        newActiveComponent.textContent = `Editing: ${celestial.name} (ID: ${celestial.id}) - Editor UI TBD`;
        newActiveComponent.style.display = "block";
    } else {
        console.error("Placeholder element not found for temporary editor display.");
    }
    this.activeComponent = newActiveComponent;

    /* TODO: When editor components exist:
    // Update and show the selected component
    newActiveComponent.updateData(celestial);
    newActiveComponent.style.display = "block";
    this.activeComponent = newActiveComponent;
    */
  }
}

// Define the main custom element
customElements.define("celestial-editor", CelestialEditor); // Updated definition
