import { celestialObjects$, getCelestialObjects } from "@teskooano/core-state";
import {
  type CelestialObject,
  CelestialStatus,
  CelestialType,
  type PlanetProperties,
  type ProceduralSurfaceProperties,
  type StarProperties,
  StellarType,
} from "@teskooano/data-types";
import {
  GroupPanelPartInitParameters,
  IContentRenderer,
  DockviewPanelApi,
} from "dockview-core";

import { FormatUtils } from "./utils/formatters";

import InfoIcon from "@fluentui/svg-icons/icons/info_24_regular.svg?raw";
import { PanelToolbarItemConfig } from "@teskooano/ui-plugin";

import { BehaviorSubject, Subscription } from "rxjs";
import { template } from "./CelestialUniforms.template";
import { UniformControlUtils } from "./utils/UniformControlUtils";

// Import the star uniform panel
import { MainSequenceStarUniforms } from "./bodies/stars"; // Assuming index.ts exports it

// Import CameraManager types
import type { CameraManager } from "../camera-manager/CameraManager";
import type { CameraManagerState } from "../camera-manager/types";

interface CelestialUniformsPanelParams {
  focusedObjectId?: string;
  cameraManager?: CameraManager; // Expect CameraManager to be passed in params
}

/**
 * Custom Element `celestial-uniforms-editor`.
 *
 * Allows real-time editing of shader uniforms for the selected celestial object.
 * It dynamically generates UI controls based on the object's properties
 * and dispatches actions to update the core state.
 *
 * Implements Dockview `IContentRenderer` to be used as a panel content.
 */
export class CelestialUniformsEditor
  extends HTMLElement
  implements IContentRenderer
{
  private shadow: ShadowRoot;
  private unsubscribeObjectsStore: Subscription | null = null;
  private currentSelectedId: string | null = null;
  private activeInputSubscriptions: Subscription[] = [];

  private _lastRenderedObjectId: string | null = null;
  // private _lastRenderedPropertiesSignature: string = ""; // No longer primary guard for re-render

  // TODO: This will be refactored for dynamic UI generation
  // private components: Map<CelestialType | "generic", CelestialInfoComponent> =
  //   new Map();
  // private activeComponent: CelestialInfoComponent | null = null;

  private cameraManager: CameraManager | null = null;
  private cameraStateSubscription: Subscription | null = null;
  private cameraState$: BehaviorSubject<CameraManagerState> | null = null;
  // private isPanelActive: boolean = false; // Removed direct usage of Dockview focus events for now
  private dockviewPanelApi: DockviewPanelApi | undefined;

  /**
   * Unique identifier for the custom element.
   */
  public static readonly componentName = "celestial-uniforms-editor";

  /**
   * Generates the configuration required to register this panel as a toolbar button.
   *
   * @returns {PanelToolbarItemConfig} Configuration object for the UI plugin manager.
   */
  public static registerToolbarButtonConfig(): PanelToolbarItemConfig {
    return {
      id: "celestial_uniforms_editor",
      target: "engine-toolbar",
      iconSvg: InfoIcon, // TODO: Consider a more 'edit'-like icon
      title: "Celestial Uniforms Editor",
      type: "panel",
      componentName: this.componentName,
      panelTitle: "Celestial Uniforms Editor",
      behaviour: "toggle",
    };
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });

    this.shadow.appendChild(template.content.cloneNode(true));

    // CameraManager will be initialized via init() params
  }

  init(parameters: GroupPanelPartInitParameters): void {
    this.dockviewPanelApi = parameters.api;
    const panelParams =
      (parameters.params as CelestialUniformsPanelParams) || {};

    if (panelParams.cameraManager) {
      this.cameraManager = panelParams.cameraManager;
      this.cameraState$ = this.cameraManager.getCameraState$();
    } else {
      console.warn(
        "[CelestialUniformsEditor] CameraManager instance not provided in init params. Automatic focus on followed object will not work.",
      );
    }

    // Removed onDidFocus/onDidBlur handling from dockviewPanelApi due to linter errors.
    // Panel active state will be inferred by isConnected for cameraState$ subscription.

    let initialObjectIdToFocus: string | null =
      panelParams.focusedObjectId || null;

    if (!initialObjectIdToFocus && this.cameraState$) {
      const currentCameraState = this.cameraState$.getValue();
      if (currentCameraState.followedObjectId) {
        initialObjectIdToFocus = currentCameraState.followedObjectId;
        console.log(
          `[CelestialUniformsEditor] Init: No explicit focusId, using followed object: ${initialObjectIdToFocus}`,
        );
      }
    }

    this.handleSelectionChange(initialObjectIdToFocus);

    // if (this.dockviewPanelApi?.isFocused) { // isFocused also caused linter errors
    //   this.isPanelActive = this.dockviewPanelApi.isFocused;
    // }
  }

  get element(): HTMLElement {
    return this;
  }

  connectedCallback() {
    this.setupObjectListener();

    document.addEventListener(
      "renderer-focus-changed",
      this.handleRendererFocusChange,
    );

    document.addEventListener(
      "focus-request-initiated",
      this.handleFocusRequestInitiated,
    );

    if (this.cameraState$) {
      this.cameraStateSubscription = this.cameraState$.subscribe(
        (cameraState) => {
          // If panel is not connected to DOM, don't react.
          if (!this.element.isConnected) return;

          const currentFollowedId = cameraState.followedObjectId;

          if (
            currentFollowedId &&
            this.currentSelectedId !== currentFollowedId
          ) {
            if (this._lastRenderedObjectId !== currentFollowedId) {
              console.log(
                `[CelestialUniformsEditor] Panel reacting to camera follow change: ${currentFollowedId}`,
              );
              this.handleSelectionChange(currentFollowedId);
            }
          } else if (
            currentFollowedId === null &&
            this.currentSelectedId !== null &&
            this.currentSelectedId === this._lastRenderedObjectId
          ) {
            const previousCameraState = this.cameraState$?.value;
            if (
              previousCameraState &&
              this.currentSelectedId === previousCameraState.followedObjectId
            ) {
              console.log(
                `[CelestialUniformsEditor] Panel reacting to camera follow cleared. Was showing: ${this.currentSelectedId}`,
              );
              this.handleSelectionChange(null);
            }
          }
        },
      );
    }
  }

  disconnectedCallback() {
    this._cleanupSubscriptions();
    this.unsubscribeObjectsStore?.unsubscribe();
    this.unsubscribeObjectsStore = null;

    this.cameraStateSubscription?.unsubscribe();
    this.cameraStateSubscription = null;

    document.removeEventListener(
      "renderer-focus-changed",
      this.handleRendererFocusChange,
    );

    document.removeEventListener(
      "focus-request-initiated",
      this.handleFocusRequestInitiated,
    );
    // No need to operate on dockviewPanelApi listeners here as they are tied to the panel instance life
  }

  private _cleanupSubscriptions() {
    this.activeInputSubscriptions.forEach((sub) => sub.unsubscribe());
    this.activeInputSubscriptions = [];
  }

  private handleRendererFocusChange = (event: Event): void => {
    const customEvent = event as CustomEvent<{
      focusedObjectId: string | null;
    }>;
    if (
      customEvent.detail &&
      this.currentSelectedId !== customEvent.detail.focusedObjectId
    ) {
      this.handleSelectionChange(customEvent.detail.focusedObjectId);
    }
  };

  private handleFocusRequestInitiated = (event: Event): void => {
    const customEvent = event as CustomEvent<{ objectId: string | null }>;
    if (
      customEvent.detail &&
      customEvent.detail.objectId &&
      this.currentSelectedId !== customEvent.detail.objectId
    ) {
      this.handleSelectionChange(customEvent.detail.objectId);
    }
  };

  private setupObjectListener() {
    this.unsubscribeObjectsStore = celestialObjects$.subscribe(
      (allCelestials) => {
        if (this.currentSelectedId) {
          const celestialData = allCelestials[this.currentSelectedId];

          if (!celestialData) {
            console.warn(
              `[CelestialUniformsEditor] Previously selected object ${this.currentSelectedId} not found in latest state. Triggering deselection.`,
            );
            this.handleSelectionChange(null);
          } else if (celestialData.status === CelestialStatus.DESTROYED) {
            console.warn(
              `[CelestialUniformsEditor] Selected object ${this.currentSelectedId} (${celestialData.name}) is now destroyed. Triggering deselection.`,
            );
            this.handleSelectionChange(null, celestialData);
          }
        }
      },
    );
  }

  private handleSelectionChange(
    selectedId: string | null,
    potentiallyDestroyedObject?: CelestialObject,
  ) {
    if (
      selectedId === this.currentSelectedId &&
      selectedId === this._lastRenderedObjectId &&
      selectedId !== null
    ) {
      // No change, and already rendered this ID, so no need to proceed.
      // This prevents re-rendering if focus events re-trigger with the same ID.
      return;
    }

    // If selection is cleared, but was already clear, do nothing.
    if (
      selectedId === null &&
      this.currentSelectedId === null &&
      this._lastRenderedObjectId === null
    ) {
      return;
    }

    const oldSelectedId = this.currentSelectedId;
    this.currentSelectedId = selectedId;

    this._cleanupSubscriptions();
    const container = this.shadow.querySelector(".container") as HTMLElement;
    if (container) container.innerHTML = ""; // Clear previous content

    const titleEl = this.shadow.querySelector("#uniforms-title") as HTMLElement;

    if (!selectedId) {
      this._lastRenderedObjectId = null; // Clear last rendered ID
      let message = "Select a celestial object...";
      if (
        potentiallyDestroyedObject &&
        potentiallyDestroyedObject.status === CelestialStatus.DESTROYED
      ) {
        message = `Object '${potentiallyDestroyedObject.name}' has been destroyed.`;
      }
      // Removed redundant check for oldSelectedId as it's covered by initial placeholder
      this.showPlaceholder(message);
      if (titleEl) titleEl.textContent = "Celestial Uniforms Editor";
      return;
    }

    const celestialData = getCelestialObjects()[selectedId];

    if (celestialData) {
      if (celestialData.status === CelestialStatus.DESTROYED) {
        this.showPlaceholder(
          `Object '${celestialData.name}' has been destroyed.`,
        );
        if (titleEl) titleEl.textContent = "Celestial Uniforms Editor";
        this._lastRenderedObjectId = null; // Clear last rendered ID
      } else {
        if (titleEl)
          titleEl.textContent = `Editing: ${celestialData.name} (${celestialData.type})`;
        this.renderUniformsUI(celestialData);
        this._lastRenderedObjectId = celestialData.id; // Set last rendered ID
      }
    } else {
      this.showPlaceholder(
        `Selected object data not found for ID: ${selectedId}.`,
      );
      if (titleEl) titleEl.textContent = "Celestial Uniforms Editor";
      this._lastRenderedObjectId = null; // Clear last rendered ID
    }
  }

  private showPlaceholder(message: string) {
    const container = this.shadow.querySelector(".container") as HTMLElement;
    if (container) {
      container.innerHTML = "";
      container.style.display = "none";
    }

    const placeholder = this.shadow.querySelector(
      ".placeholder",
    ) as HTMLElement;
    if (placeholder) {
      placeholder.style.display = "block";
      placeholder.textContent = message;
    }
  }

  private renderUniformsUI(celestial: CelestialObject) {
    const placeholder = this.shadow.querySelector(
      ".placeholder",
    ) as HTMLElement;
    if (placeholder) {
      placeholder.style.display = "none";
    }

    const container = this.shadow.querySelector(".container") as HTMLElement;
    if (!container) {
      console.error(
        "[CelestialUniformsEditor] Container not found for rendering UI.",
      );
      this.showPlaceholder("Critical error: UI container missing.");
      this._lastRenderedObjectId = null;
      return;
    }
    container.innerHTML = ""; // Clear previous content before rendering new UI
    container.style.display = "block";

    if (!celestial.properties) {
      this.showPlaceholder(
        "Selected object does not have editable properties.",
      );
      this._lastRenderedObjectId = celestial.id;
      return;
    }

    switch (celestial.type) {
      case CelestialType.STAR:
        const starProps = celestial.properties as StarProperties;
        if (starProps && starProps.stellarType) {
          switch (starProps.stellarType) {
            case StellarType.MAIN_SEQUENCE:
              const mainSequencePanel = new MainSequenceStarUniforms();
              if (
                typeof (mainSequencePanel as any).updateStarData === "function"
              ) {
                (mainSequencePanel as any).updateStarData(celestial);
              } else {
                console.warn(
                  "MainSequenceStarUniforms panel is missing updateStarData method.",
                );
              }
              container.appendChild(mainSequencePanel);
              break;
            // Add cases for other stellar types here later
            // e.g., PreMainSequenceStarUniforms, BlackHoleUniforms etc.
            default:
              this.showPlaceholder(
                `No specific uniform editor for star type: ${starProps.stellarType}`,
              );
              break;
          }
        } else {
          this.showPlaceholder(
            `Star ${celestial.name} has no stellarType property defined for uniform editing.`,
          );
        }
        break;
      case CelestialType.PLANET:
      case CelestialType.MOON:
      case CelestialType.DWARF_PLANET:
        const planetProps = celestial.properties as PlanetProperties;
        if (
          planetProps &&
          planetProps.surface &&
          planetProps.surface.proceduralData
        ) {
          // Procedural data exists, pass it to the controls renderer
          this._renderProceduralSurfaceControls(
            container,
            celestial, // Pass the whole celestial object for context
            planetProps.surface.proceduralData, // Pass the proceduralData directly
          );
        } else if (planetProps && planetProps.surface) {
          // Surface exists but no proceduralData
          this.showPlaceholder(
            `Planet ${celestial.name} has surface properties, but no editable procedural data.`,
          );
        } else {
          // No surface properties at all
          this.showPlaceholder(
            `Planet ${celestial.name} has no surface properties defined for editing.`,
          );
        }
        break;
      default:
        this.showPlaceholder(
          `No specific uniform editor for type: ${celestial.type}`,
        );
    }
    this._lastRenderedObjectId = celestial.id;
  }

  // --- Start of Helper Methods ---

  private _renderProceduralSurfaceControls(
    container: HTMLElement,
    celestialObject: CelestialObject, // Keep celestialObject for ID and full properties access
    proceduralSurfaceData: ProceduralSurfaceProperties, // Now receives ProceduralSurfaceProperties directly
  ) {
    const { id: celestialId } = celestialObject;
    // We don't need 'properties' from celestialObject directly here anymore for the paths,
    // as proceduralSurfaceData is already the specific part we need for UI values.
    // However, UniformControlUtils will need the full celestialObject to construct update paths.

    // Keep track of subscriptions specific to these procedural controls
    // const proceduralControlSubscriptions: Subscription[] = []; // This seems unused, consider removing if not needed later

    const addControl = (
      label: string,
      path: string[],
      type: "color" | "number",
      options?: {
        min?: string; // Changed to string for consistency with teskooano-slider attributes
        max?: string;
        step?: string;
        initialValue?: number | string; // Allow string for color, number for numeric
      },
    ) => {
      let controlElement: HTMLElement | undefined;
      let inputSubscription: Subscription | undefined;

      if (type === "color") {
        const { element, subscription } = UniformControlUtils.createColorInput(
          label,
          celestialId,
          celestialObject,
          path,
          options?.initialValue as string | undefined, // Pass initialValue if provided
        );
        controlElement = element;
        inputSubscription = subscription;
      } else if (type === "number") {
        const { element, subscription } =
          UniformControlUtils.createNumericInput(
            label,
            celestialId,
            celestialObject,
            path,
            {
              min: options?.min,
              max: options?.max,
              step: options?.step,
              initialValue: options?.initialValue as number | undefined,
            },
          );
        controlElement = element;
        inputSubscription = subscription;
      }

      if (controlElement && inputSubscription) {
        container.appendChild(controlElement);
        // Add to the main activeInputSubscriptions array managed by the class
        this.activeInputSubscriptions.push(inputSubscription);
      }
    };

    // Add a section header for terrain generation
    const terrainHeader = document.createElement("h3");
    terrainHeader.textContent = "Terrain Generation";
    container.appendChild(terrainHeader);

    addControl(
      "Terrain Type:",
      ["surface", "proceduralData", "terrainType"],
      "number",
      {
        min: "1",
        max: "3",
        step: "1",
        initialValue: proceduralSurfaceData.terrainType,
      },
    );
    addControl(
      "Terrain Amplitude:",
      ["surface", "proceduralData", "terrainAmplitude"],
      "number",
      {
        min: "0.1",
        max: "2.0",
        step: "0.1",
        initialValue: proceduralSurfaceData.terrainAmplitude,
      },
    );
    addControl(
      "Terrain Sharpness:",
      ["surface", "proceduralData", "terrainSharpness"],
      "number",
      {
        min: "0.1",
        max: "2.0",
        step: "0.1",
        initialValue: proceduralSurfaceData.terrainSharpness,
      },
    );
    addControl(
      "Terrain Offset:",
      ["surface", "proceduralData", "terrainOffset"],
      "number",
      {
        min: "-0.5",
        max: "0.5",
        step: "0.05",
        initialValue: proceduralSurfaceData.terrainOffset,
      },
    );
    addControl(
      "Undulation:",
      ["surface", "proceduralData", "undulation"],
      "number",
      {
        min: "0",
        max: "1",
        step: "0.05",
        initialValue: proceduralSurfaceData.undulation,
      },
    );

    // Add a section header for noise parameters
    const noiseHeader = document.createElement("h3");
    noiseHeader.textContent = "Noise Parameters";
    container.appendChild(noiseHeader);

    addControl(
      "Persistence:",
      ["surface", "proceduralData", "persistence"],
      "number",
      {
        min: "0",
        max: "1",
        step: "0.01",
        initialValue: proceduralSurfaceData.persistence,
      },
    );
    addControl(
      "Lacunarity:",
      ["surface", "proceduralData", "lacunarity"],
      "number",
      {
        min: "0",
        max: "10",
        step: "0.1",
        initialValue: proceduralSurfaceData.lacunarity,
      },
    );
    addControl(
      "Period:",
      ["surface", "proceduralData", "simplePeriod"],
      "number",
      {
        min: "0.1",
        max: "20",
        step: "0.1",
        initialValue: proceduralSurfaceData.simplePeriod,
      },
    );
    addControl("Octaves:", ["surface", "proceduralData", "octaves"], "number", {
      min: "1",
      max: "10",
      step: "1",
      initialValue: proceduralSurfaceData.octaves,
    });
    addControl(
      "Bump Scale:",
      ["surface", "proceduralData", "bumpScale"],
      "number",
      {
        min: "0",
        max: "5",
        step: "0.1",
        initialValue: proceduralSurfaceData.bumpScale,
      },
    );

    // Add a section header for colors
    const colorHeader = document.createElement("h3");
    colorHeader.textContent = "Color Ramp";
    container.appendChild(colorHeader);

    addControl(
      "Color 1 (Lowest):",
      ["surface", "proceduralData", "color1"],
      "color",
      { initialValue: proceduralSurfaceData.color1 },
    );
    addControl("Color 2:", ["surface", "proceduralData", "color2"], "color", {
      initialValue: proceduralSurfaceData.color2,
    });
    addControl("Color 3:", ["surface", "proceduralData", "color3"], "color", {
      initialValue: proceduralSurfaceData.color3,
    });
    addControl("Color 4:", ["surface", "proceduralData", "color4"], "color", {
      initialValue: proceduralSurfaceData.color4,
    });
    addControl(
      "Color 5 (Highest):",
      ["surface", "proceduralData", "color5"],
      "color",
      { initialValue: proceduralSurfaceData.color5 },
    );

    // Add a section header for height controls
    const heightHeader = document.createElement("h3");
    heightHeader.textContent = "Height Controls";
    container.appendChild(heightHeader);

    addControl(
      "Height Level 1:",
      ["surface", "proceduralData", "height1"],
      "number",
      {
        min: "0",
        max: "1",
        step: "0.01",
        initialValue: proceduralSurfaceData.height1,
      },
    );
    addControl(
      "Height Level 2:",
      ["surface", "proceduralData", "height2"],
      "number",
      {
        min: "0",
        max: "1",
        step: "0.01",
        initialValue: proceduralSurfaceData.height2,
      },
    );
    addControl(
      "Height Level 3:",
      ["surface", "proceduralData", "height3"],
      "number",
      {
        min: "0",
        max: "1",
        step: "0.01",
        initialValue: proceduralSurfaceData.height3,
      },
    );
    addControl(
      "Height Level 4:",
      ["surface", "proceduralData", "height4"],
      "number",
      {
        min: "0",
        max: "1",
        step: "0.01",
        initialValue: proceduralSurfaceData.height4,
      },
    );
    addControl(
      "Height Level 5:",
      ["surface", "proceduralData", "height5"],
      "number",
      {
        min: "0",
        max: "1",
        step: "0.01",
        initialValue: proceduralSurfaceData.height5,
      },
    );

    // Add a section header for material properties
    const materialHeader = document.createElement("h3");
    materialHeader.textContent = "Material Properties";
    container.appendChild(materialHeader);

    addControl(
      "Shininess:",
      ["surface", "proceduralData", "shininess"],
      "number",
      {
        min: "1",
        max: "64", // Shininess might actually be 0-1 in some contexts, or higher for Phong. Check material. Max 64 for typical Phong. Let's assume 0-100 or similar based on typical sliders.
        step: "1",
        initialValue: proceduralSurfaceData.shininess,
      },
    );
    addControl(
      "Specular Strength:",
      ["surface", "proceduralData", "specularStrength"],
      "number",
      {
        min: "0",
        max: "1",
        step: "0.01",
        initialValue: proceduralSurfaceData.specularStrength,
      }, // Max typically 1
    );
    addControl(
      "Roughness:",
      ["surface", "proceduralData", "roughness"],
      "number",
      {
        min: "0",
        max: "1",
        step: "0.01",
        initialValue: proceduralSurfaceData.roughness,
      },
    );

    // Add a section header for lighting properties
    const lightingHeader = document.createElement("h3");
    lightingHeader.textContent = "Lighting Properties";
    container.appendChild(lightingHeader);

    addControl(
      "Ambient Light Intensity:",
      ["surface", "proceduralData", "ambientLightIntensity"],
      "number",
      {
        min: "0",
        max: "1",
        step: "0.01",
        initialValue: proceduralSurfaceData.ambientLightIntensity,
      }, // Max typically 1
    );
  }

  // --- End of Helper Methods ---
}

// customElements.define("celestial-uniforms-editor", CelestialUniformsEditor);

export { FormatUtils };
