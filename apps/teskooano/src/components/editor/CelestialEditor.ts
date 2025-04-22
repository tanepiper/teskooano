import {
    type CelestialObject, // Import CelestialType enum
    CelestialStatus,
    CelestialType,
    StellarType,
    SpectralClass,
    SpecialSpectralClass,
    LuminosityClass,
    ExoticStellarType,
    type StarProperties,
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
  // Track previous data for comparison
  private previousDataForSelected: CelestialObject | null = null; 

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
          overflow: hidden; /* Prevent host scroll */
        }
        
        .placeholder {
          padding: var(--space-3); /* Use token */
          color: var(--color-text-secondary); /* Use token */
          font-style: italic;
          text-align: center;
        }
        
        .container {
          width: 100%;
          height: 100%;
          overflow-y: auto; /* Allow vertical scroll */
          padding: var(--space-3); /* Use token */
          box-sizing: border-box;
        }

        /* Form Styles */
        .editor-form {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: var(--space-3) var(--space-4); /* Use tokens */
          align-items: center;
        }

        .editor-form label {
          font-weight: var(--font-weight-medium); /* Use token */
          color: var(--color-text-secondary); /* Use token */
          justify-self: end;
        }

        .editor-form input[type="text"],
        .editor-form select {
          width: 100%;
          padding: var(--space-2); /* Use token */
          border: 1px solid var(--color-border); /* Use token */
          background-color: var(--color-surface-1); /* Use token */
          color: var(--color-text-primary); /* Use token */
          border-radius: var(--radius-sm); /* Use token */
          font-size: var(--font-size-base); /* Use token */
          box-sizing: border-box;
        }
        
        .editor-form input[type="text"]:disabled,
        .editor-form select:disabled {
            background-color: var(--color-surface-disabled); /* Use token */
            color: var(--color-text-disabled); /* Use token */
            cursor: not-allowed;
        }


        .editor-form input[type="text"]:focus,
        .editor-form select:focus {
          outline: none;
          border-color: var(--color-primary); /* Use token */
          box-shadow: 0 0 0 2px var(--color-primary-emphasis); /* Use token */
        }
        
        .editor-form button {
          grid-column: 2 / 3; /* Span across the second column */
          justify-self: start; /* Align button to the start of the grid cell */
          /* Assuming teskooano-button exists and is styled */
          margin-top: var(--space-4); /* Use token */
        }
        
        .form-divider {
            grid-column: 1 / -1; /* Span full width */
            height: 1px;
            background-color: var(--color-border); /* Use token */
            margin: var(--space-4) 0; /* Use tokens */
            border: none;
        }
        
        h3 {
            grid-column: 1 / -1; /* Span full width */
            margin: 0 0 var(--space-1) 0; /* Use tokens */
            color: var(--color-text-primary); /* Use token */
            font-size: var(--font-size-large); /* Use token */
            font-weight: var(--font-weight-semibold); /* Use token */
            border-bottom: 1px solid var(--color-border-subtle); /* Use token */
            padding-bottom: var(--space-2); /* Use token */
        }

      </style>
      <div class="container">
        <!-- Placeholder for Editor Content -->
        <div class="placeholder">Select a celestial object to edit...</div> 
        <!-- Editor Form Area -->
        <form id="celestial-editor-form" class="editor-form" style="display: none;"></form>
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
    this.previousDataForSelected = null; // Clear tracked data on disconnect

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
          
          // Simple JSON string comparison to detect changes in the selected object's data
          // This is potentially expensive for very large objects but avoids complex deep comparison logic for now.
          const currentDataString = currentObject ? JSON.stringify(currentObject) : null;
          const previousDataString = this.previousDataForSelected ? JSON.stringify(this.previousDataForSelected) : null;

          if (currentDataString !== previousDataString) {
            if (currentObject) {
              console.log(`[CelestialEditor] Data changed for selected object ${this.currentSelectedId}, re-rendering editor.`);
              this.renderEditor(currentObject);
              // Update tracked data after rendering
              try {
                this.previousDataForSelected = JSON.parse(currentDataString!); // Store deep copy
              } catch (e) {
                  console.error("Failed to parse current celestial data for tracking:", e);
                  this.previousDataForSelected = null;
              }
            } else {
              // Selected object was removed from the store
              console.log(`[CelestialEditor] Selected object ${this.currentSelectedId} removed from store.`);
              this.showPlaceholder(`Object ${this.currentSelectedId} no longer exists.`);
              // Clear selection and tracked data handled by showPlaceholder/handleSelectionChange if needed
              // Resetting selection state here might be redundant if called from elsewhere
              // Let's clear tracked data directly
              this.currentSelectedId = null;
              this.previousDataForSelected = null;
            }
          } // else: No change in selected object data, do nothing.
          
        } else {
             // Nothing is selected, ensure previous data is cleared
             this.previousDataForSelected = null;
        }
      },
    );
  }

  private handleSelectionChange(selectedId: string | null) {
    if (selectedId === this.currentSelectedId) return;

    this.currentSelectedId = selectedId;
    const form = this.shadow.querySelector<HTMLFormElement>("#celestial-editor-form");
    const placeholder = this.shadow.querySelector<HTMLElement>(".placeholder");

    // Clear previous tracked data on any selection change
    this.previousDataForSelected = null;

    if (!form || !placeholder) {
        console.error("Editor internal elements not found!");
        return;
    }

    // Hide form and show placeholder initially
    form.style.display = "none";
    form.innerHTML = ""; // Clear previous form content
    placeholder.style.display = "block";


    if (!selectedId) {
      this.showPlaceholder("Select a celestial object to edit..."); // Updated placeholder text
      return;
    }

    const storeData = celestialObjectsStore.get();
    // const objectMap = new Map(Object.entries(storeData)); // No need for map if accessing by ID
    const celestialData = selectedId ? storeData[selectedId] : null;

    if (celestialData) {
      if (celestialData.status === CelestialStatus.DESTROYED) {
        this.showPlaceholder(
          `Object '${celestialData.name}' has been destroyed. Cannot edit.`, // Updated placeholder text
        );
      } else {
        this.renderEditor(celestialData); // Changed to renderEditor
        // Store initial data for comparison after rendering
        try {
          this.previousDataForSelected = JSON.parse(JSON.stringify(celestialData));
        } catch(e) {
            console.error("Failed to stringify/parse initial celestial data for tracking:", e);
            this.previousDataForSelected = null;
        }
      }
    } else {
      this.showPlaceholder("Selected object data not found.");
      this.previousDataForSelected = null; // Ensure cleared if object not found
    }
  }

  private showPlaceholder(message: string) {
    const placeholder = this.shadow.querySelector<HTMLElement>(".placeholder");
    const form = this.shadow.querySelector<HTMLFormElement>("#celestial-editor-form");
    
    // Also clear tracked data when showing placeholder
    this.previousDataForSelected = null; 

    if (form) {
        form.style.display = 'none';
        form.innerHTML = ''; // Clear form
    }
    if (placeholder) {
      placeholder.style.display = "block";
      placeholder.textContent = message;
    }

    this.activeComponent = null; // No active editor component when showing placeholder
  }

  // Changed from renderInfo to renderEditor
  private renderEditor(celestial: CelestialObject) {
    const placeholder = this.shadow.querySelector<HTMLElement>(".placeholder");
    const formContainer = this.shadow.querySelector<HTMLFormElement>("#celestial-editor-form");

    if (!formContainer || !placeholder) {
      console.error("Cannot render editor, container or placeholder not found.");
      return;
    }

    // Hide placeholder, show and clear form container
    placeholder.style.display = "none";
    formContainer.innerHTML = ""; // Clear previous content
    formContainer.style.display = "grid"; // Use grid layout defined in styles

    // Remove previous listeners if any (important!)
    formContainer.replaceWith(formContainer.cloneNode(true)); // Simple way to remove all listeners
    const newFormContainer = this.shadow.querySelector<HTMLFormElement>("#celestial-editor-form")!; // Re-select the new node
    newFormContainer.addEventListener('submit', this.handleSave); // Add submit listener


    // Select the appropriate EDITOR component based on celestial type
    switch (celestial.type) {
       case CelestialType.STAR:
         this.renderStarEditor(celestial, newFormContainer);
         break;
      // ... handle other types
      // default:
      //   this.renderGenericEditor(celestial, newFormContainer); // Example
      //   break;
    }
    
    // TEMPORARY: Fallback if no specific editor matches
    if (newFormContainer.innerHTML === '') {
        this.showPlaceholder(`Editing for type '${celestial.type}' not yet implemented.`);
    }

  }

  // --- Specific Editor Rendering Functions ---

  private renderStarEditor(celestial: CelestialObject, container: HTMLElement) {
      const properties = celestial.properties as StarProperties | undefined; // Type assertion
      if (!properties || celestial.type !== CelestialType.STAR) {
          console.error("Invalid data for Star editor:", celestial);
          this.showPlaceholder("Error: Invalid data for selected star.");
          return;
      }

      // Helper to create select options
      const createOptions = (enumObject: object, selectedValue?: string | null) => {
          let options = '<option value="">-- Select --</option>'; // Default empty option
          for (const [key, value] of Object.entries(enumObject)) {
              const isSelected = value === selectedValue ? ' selected' : '';
              options += `<option value="${value}"${isSelected}>${key} (${value})</option>`;
          }
          return options;
      };

      container.innerHTML = `
          <h3>General Properties</h3>
          
          <label for="editor-name">Name:</label>
          <input type="text" id="editor-name" name="name" value="${celestial.name}" required>

          <label for="editor-type">Type:</label>
          <input type="text" id="editor-type" name="type" value="${celestial.type}" disabled>
          
          <hr class="form-divider">
          <h3>Stellar Classification</h3>

          <label for="editor-stellar-type">Stellar Type:</label>
          <select id="editor-stellar-type" name="stellarType">
              ${createOptions(StellarType, properties.stellarType)}
          </select>

          <label for="editor-spectral-class">Spectral Class:</label>
          <select id="editor-spectral-class" name="mainSpectralClass">
              ${createOptions(SpectralClass, properties.mainSpectralClass)}
          </select>
          
          <label for="editor-special-spectral-class">Special Spectral:</label>
          <select id="editor-special-spectral-class" name="specialSpectralClass">
              ${createOptions(SpecialSpectralClass, properties.specialSpectralClass)}
          </select>

          <label for="editor-luminosity-class">Luminosity Class:</label>
          <select id="editor-luminosity-class" name="luminosityClass">
              ${createOptions(LuminosityClass, properties.luminosityClass)}
          </select>
          
          <label for="editor-exotic-type">Exotic Type:</label>
          <select id="editor-exotic-type" name="exoticType">
              ${createOptions(ExoticStellarType, properties.exoticType)}
          </select>

          <button type="submit">Save Changes</button> 
          <!-- <teskooano-button type="submit" variant="primary">Save Changes</teskooano-button> -->
      `;
  }

  // --- Save Handler ---
  private handleSave = (event: SubmitEvent) => {
      event.preventDefault();
      console.log("Save changes triggered for ID:", this.currentSelectedId);
      if (!this.currentSelectedId) return;

      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);
      const updatedData: Partial<CelestialObject> = {};
      const updatedProperties: Partial<StarProperties> = {}; // Assuming Star for now

      formData.forEach((value, key) => {
          const stringValue = value as string;
          // Handle general properties
          if (key === 'name') {
              updatedData.name = stringValue;
          }
          // Handle specific properties (nested under 'properties')
          else if (key === 'stellarType' || key === 'mainSpectralClass' || key === 'specialSpectralClass' || key === 'luminosityClass' || key === 'exoticType') {
               // Store null if '-- Select --' was chosen, otherwise the value
              updatedProperties[key as keyof StarProperties] = stringValue === "" ? null : stringValue as any;
          }
      });

      // Get current object data
      const currentObjects = { ...celestialObjectsStore.get() }; // Clone current state
      const currentObject = currentObjects[this.currentSelectedId];

      if (!currentObject) {
          console.error("Cannot save, object not found in store:", this.currentSelectedId);
          return;
      }

      // Merge changes
      const newObjectData: CelestialObject = {
          ...currentObject,
          ...updatedData,
          properties: {
              ...currentObject.properties,
              ...updatedProperties,
          } as StarProperties, // Ensure properties are typed correctly
      };
      
      // Update the specific object within the cloned state
      currentObjects[this.currentSelectedId] = newObjectData;

      // Update the store
      celestialObjectsStore.set(currentObjects); // Set the entire updated state

      console.log("Object updated in store:", this.currentSelectedId, newObjectData);

      // TODO: Add visual feedback (e.g., temporary message or button state change)
      const saveButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (saveButton) {
          const originalText = saveButton.textContent;
          saveButton.textContent = 'Saved!';
          saveButton.disabled = true;
          setTimeout(() => {
              saveButton.textContent = originalText;
              saveButton.disabled = false;
          }, 1500);
      }
  };

}

// Define the main custom element
customElements.define("celestial-editor", CelestialEditor); // Updated definition
