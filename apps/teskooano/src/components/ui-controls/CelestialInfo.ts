import {
  type CelestialObject, // Import CelestialType enum
  CelestialStatus,
  CelestialType,
} from "@teskooano/data-types";
// Import necessary stores and registry from core-state
import { celestialObjectsStore } from "@teskooano/core-state";
// Import the EnginePanel type (adjust path if necessary)
import { map } from "nanostores";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
// import { EnginePanel } from "../engine/EnginePanel";

// Import component types
import { CelestialInfoComponent } from "./utils/CelestialInfoInterface";

// Import all celestial info components
import { AsteroidFieldInfoComponent } from "./celestial-components/AsteroidFieldInfo";
import { GasGiantInfoComponent } from "./celestial-components/GasGiantInfo";
import { GenericCelestialInfoComponent } from "./celestial-components/GenericCelestialInfo";
import { MoonInfoComponent } from "./celestial-components/MoonInfo";
import { PlanetInfoComponent } from "./celestial-components/PlanetInfo";
import { StarInfoComponent } from "./celestial-components/StarInfo";
import { OortCloudInfoComponent } from "./celestial-components/OortCloudInfo";

// Constants for formatters
const AU_IN_METERS = 149597870700;
const SECONDS_PER_DAY = 86400;
const SECONDS_PER_YEAR = SECONDS_PER_DAY * 365.25;

// Shared formatter utility class
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

// --- MAIN CELESTIAL INFO COMPONENT ---
export class CelestialInfo extends HTMLElement {
  private shadow: ShadowRoot;
  // REMOVED _engineViewId and linking properties
  // private _engineViewId: string | null = null;

  // Store references
  // private linkedEnginePanel: EnginePanel | null = null;
  // private unsubscribePanelState: (() => void) | null = null;
  private unsubscribeObjectsStore: (() => void) | null = null;
  // private _linkCheckInterval: number | null = null;
  private _renderer: ModularSpaceRenderer | null = null; // Store renderer instance

  private currentSelectedId: string | null = null;

  // References to sub-components
  private starInfoComponent: StarInfoComponent;
  private planetInfoComponent: PlanetInfoComponent;
  private moonInfoComponent: MoonInfoComponent;
  private gasGiantInfoComponent: GasGiantInfoComponent;
  private asteroidFieldInfoComponent: AsteroidFieldInfoComponent;
  private genericInfoComponent: GenericCelestialInfoComponent;
  private oortCloudInfoComponent: OortCloudInfoComponent;

  // Track which component is currently active
  private activeComponent: CelestialInfoComponent | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });

    // Create sub-components
    this.starInfoComponent = new StarInfoComponent();
    this.planetInfoComponent = new PlanetInfoComponent();
    this.moonInfoComponent = new MoonInfoComponent();
    this.gasGiantInfoComponent = new GasGiantInfoComponent();
    this.asteroidFieldInfoComponent = new AsteroidFieldInfoComponent();
    this.genericInfoComponent = new GenericCelestialInfoComponent();
    this.oortCloudInfoComponent = new OortCloudInfoComponent();

    // Start with generic component shown
    this.activeComponent = this.genericInfoComponent;

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
        <div class="placeholder">Select a celestial object...</div>
      </div>
    `;

    // Append all sub-components to shadow DOM (initially hidden)
    const container = this.shadow.querySelector(".container") as HTMLElement;
    if (container) {
      container.appendChild(this.starInfoComponent);
      container.appendChild(this.planetInfoComponent);
      container.appendChild(this.moonInfoComponent);
      container.appendChild(this.gasGiantInfoComponent);
      container.appendChild(this.asteroidFieldInfoComponent);
      container.appendChild(this.genericInfoComponent);
      container.appendChild(this.oortCloudInfoComponent);

      // Hide all components
      this.starInfoComponent.style.display = "none";
      this.planetInfoComponent.style.display = "none";
      this.moonInfoComponent.style.display = "none";
      this.gasGiantInfoComponent.style.display = "none";
      this.asteroidFieldInfoComponent.style.display = "none";
      this.genericInfoComponent.style.display = "none";
      this.oortCloudInfoComponent.style.display = "none";
    }
  }

  connectedCallback() {
    // REMOVED attribute reading and link attempt
    // this._engineViewId = this.getAttribute("engine-view-id");
    // this.attemptLinkToEnginePanel();
    this.setupObjectListener();

    // ADD LISTENER FOR FOCUS CHANGES *FROM* THE RENDERER/CONTROLS
    // Assuming the same event name as used in FocusControl
    document.addEventListener('renderer-focus-changed', this.handleRendererFocusChange);
  }

  disconnectedCallback() {
    // REMOVED panel state unsubscribe and interval clear
    // this.unsubscribePanelState?.();
    // if (this._linkCheckInterval) clearInterval(this._linkCheckInterval);
    // this.unsubscribePanelState = null;
    // this.linkedEnginePanel = null;
    // this._linkCheckInterval = null;

    this.unsubscribeObjectsStore?.();
    this.unsubscribeObjectsStore = null;

    document.removeEventListener('renderer-focus-changed', this.handleRendererFocusChange);
  }

  /**
   * Public method for the parent component (CompositeEnginePanel)
   * to provide the renderer instance.
   */
  public setRenderer(renderer: ModularSpaceRenderer): void {
    console.log("[CelestialInfo] Renderer set.");
    this._renderer = renderer;
    // If renderer has a way to get current focus, update immediately
    // Otherwise, rely on the event listener
    // Example: this.handleSelectionChange(this._renderer.getCurrentFocusId());
  }

  // Event handler for focus changes from the renderer
  private handleRendererFocusChange = (event: Event): void => {
    const customEvent = event as CustomEvent<{ focusedObjectId: string | null }>;
    if (customEvent.detail) {
      this.handleSelectionChange(customEvent.detail.focusedObjectId);
    }
  };

  private setupObjectListener() {
    // No changes needed here, still listens to the global store
    this.unsubscribeObjectsStore = celestialObjectsStore.subscribe(
      (allCelestials) => {
        if (this.currentSelectedId) {
          const currentObject = allCelestials[this.currentSelectedId];
          if (currentObject) {
            this.renderInfo(currentObject);
          }
        }
      },
    );
  }

  private handleSelectionChange(selectedId: string | null) {
    if (selectedId === this.currentSelectedId) return;

    this.currentSelectedId = selectedId;

    if (!selectedId) {
      this.showPlaceholder("Select a celestial object...");
      return;
    }

    const storeData = celestialObjectsStore.get();
    const objectMap = new Map(Object.entries(storeData));
    const celestialData = selectedId ? objectMap.get(selectedId) : null;

    if (celestialData) {
      if (celestialData.status === CelestialStatus.DESTROYED) {
        this.showPlaceholder(
          `Object '${celestialData.name}' has been destroyed.`,
        );
      } else {
        this.renderInfo(celestialData);
      }
    } else {
      this.showPlaceholder("Selected object data not found.");
    }
  }

  private showPlaceholder(message: string) {
    // Hide all components
    this.starInfoComponent.style.display = "none";
    this.planetInfoComponent.style.display = "none";
    this.moonInfoComponent.style.display = "none";
    this.gasGiantInfoComponent.style.display = "none";
    this.asteroidFieldInfoComponent.style.display = "none";
    this.genericInfoComponent.style.display = "none";
    this.oortCloudInfoComponent.style.display = "none";

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

  private renderInfo(celestial: CelestialObject) {
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

    // Select the appropriate component based on celestial type
    let newActiveComponent: CelestialInfoComponent;

    switch (celestial.type) {
      case CelestialType.STAR:
        newActiveComponent = this.starInfoComponent;
        break;
      case CelestialType.PLANET:
      case CelestialType.DWARF_PLANET:
        newActiveComponent = this.planetInfoComponent;
        break;
      case CelestialType.MOON:
        newActiveComponent = this.moonInfoComponent;
        break;
      case CelestialType.GAS_GIANT:
        newActiveComponent = this.gasGiantInfoComponent;
        break;
      case CelestialType.ASTEROID_FIELD:
        newActiveComponent = this.asteroidFieldInfoComponent;
        break;
      case CelestialType.OORT_CLOUD:
        newActiveComponent = this.oortCloudInfoComponent;
        break;
      default:
        newActiveComponent = this.genericInfoComponent;
        break;
    }

    // Update and show the selected component
    newActiveComponent.updateData(celestial);
    newActiveComponent.style.display = "block";

    this.activeComponent = newActiveComponent;
  }
}

// Define the main custom element
customElements.define("celestial-info", CelestialInfo);
