import { celestialObjects$, getCelestialObjects } from "@teskooano/core-state";
import {
  type CelestialObject,
  CelestialStatus,
  CelestialType,
  type PlanetProperties,
  type ProceduralSurfaceProperties,
  type StarProperties,
} from "@teskooano/data-types";
import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";

import { FormatUtils } from "./utils/formatters";

import InfoIcon from "@fluentui/svg-icons/icons/info_24_regular.svg?raw";
import { PanelToolbarItemConfig } from "@teskooano/ui-plugin";

import { celestialActions } from "@teskooano/core-state";
import { Subscription, fromEvent, merge } from "rxjs";
import { map, distinctUntilChanged, tap, filter } from "rxjs/operators";
import { template } from "./CelestialUniforms.template";

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

    // TODO: Remove or repurpose this section.
    // Old InfoComponent instantiations are removed.
    // New UI generation logic will replace this.
    // this.components.set(CelestialType.STAR, new StarInfoComponent());
    // this.components.set(CelestialType.PLANET, new PlanetInfoComponent());
    // this.components.set(CelestialType.DWARF_PLANET, new PlanetInfoComponent());
    // this.components.set(CelestialType.MOON, new MoonInfoComponent());
    // this.components.set(CelestialType.GAS_GIANT, new GasGiantInfoComponent());
    // this.components.set(
    //   CelestialType.ASTEROID_FIELD,
    //   new AsteroidFieldInfoComponent(),
    // );
    // this.components.set(CelestialType.OORT_CLOUD, new OortCloudInfoComponent());
    // this.components.set("generic", new GenericCelestialInfoComponent());

    // this.activeComponent = this.components.get("generic")!;

    const container = this.shadow.querySelector(".container") as HTMLElement;
    if (container) {
      // Clear out any old component display logic if present
      // this.components.forEach((component) => {
      //   component.style.display = "none";
      //   container.appendChild(component);
      // });
    }
  }

  init(parameters: GroupPanelPartInitParameters): void {
    const params = (parameters.params as { focusedObjectId?: string }) || {};
    if (params.focusedObjectId) {
      this.handleSelectionChange(params.focusedObjectId);
    }
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
  }

  disconnectedCallback() {
    this._cleanupSubscriptions();
    this.unsubscribeObjectsStore?.unsubscribe();
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

  private _cleanupSubscriptions() {
    this.activeInputSubscriptions.forEach((sub) => sub.unsubscribe());
    this.activeInputSubscriptions = [];
  }

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

  private handleFocusRequestInitiated = (event: Event): void => {
    const customEvent = event as CustomEvent<{ objectId: string | null }>;
    if (customEvent.detail && customEvent.detail.objectId) {
      if (this.currentSelectedId !== customEvent.detail.objectId) {
        this.handleSelectionChange(customEvent.detail.objectId);
      }
    } else {
      console.warn("[CelestialInfo] Received focus request with no objectId.");
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
      return;
    }

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
    if (container) container.innerHTML = "";

    const titleEl = this.shadow.querySelector("#uniforms-title") as HTMLElement;

    if (!selectedId) {
      this._lastRenderedObjectId = null;
      let message = "Select a celestial object...";
      if (
        potentiallyDestroyedObject &&
        potentiallyDestroyedObject.status === CelestialStatus.DESTROYED
      ) {
        message = `Object '${potentiallyDestroyedObject.name}' has been destroyed.`;
      } else if (oldSelectedId && !potentiallyDestroyedObject) {
        const allCelestials = getCelestialObjects();
        const oldObjectData = allCelestials[oldSelectedId];
        if (!oldObjectData) {
          message = `Object previously selected (${oldSelectedId}) is no longer available.`;
        }
      }
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
        this._lastRenderedObjectId = null;
      } else {
        if (titleEl)
          titleEl.textContent = `Editing: ${celestialData.name} (${celestialData.type})`;
        this.renderUniformsUI(celestialData);
      }
    } else {
      this.showPlaceholder(
        `Selected object data not found for ID: ${selectedId}.`,
      );
      if (titleEl) titleEl.textContent = "Celestial Uniforms Editor";
      this._lastRenderedObjectId = null;
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
        if (celestial.properties.type === CelestialType.STAR) {
          const { element, subscription } = this._createColorInput(
            "Star Color:",
            celestial.id,
            celestial,
            ["color"],
          );
          container.appendChild(element);
          this.activeInputSubscriptions.push(subscription);
        }
        break;
      case CelestialType.PLANET:
      case CelestialType.MOON:
      case CelestialType.DWARF_PLANET:
        const planetProps = celestial.properties as PlanetProperties;
        if (planetProps && planetProps.surface) {
          const surface = planetProps.surface as ProceduralSurfaceProperties;
          this._renderProceduralSurfaceControls(container, celestial, surface);
        } else {
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

  private _deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this._deepClone(item)) as any;
    }
    const clonedObj = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = this._deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  private _updatePropertyPath(obj: any, path: string[], value: any): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (typeof current[key] !== "object" || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }
    current[path[path.length - 1]] = value;
  }

  private _createNumericInput(
    labelText: string,
    celestialId: string,
    currentCelestialObject: CelestialObject,
    propertyPathToUniform: string[],
  ): { element: HTMLElement; subscription: Subscription } {
    const wrapper = document.createElement("div");
    wrapper.className = "uniform-control";
    const label = document.createElement("label");
    label.textContent = labelText;
    const input = document.createElement("input");
    input.type = "number";
    input.min = "-100";
    input.max = "100";
    input.step = "0.01";

    let initialValueForInput: any = currentCelestialObject.properties;
    try {
      for (const key of propertyPathToUniform) {
        initialValueForInput = initialValueForInput[key];
      }
    } catch (e) {
      console.warn(
        `Could not resolve path ${propertyPathToUniform.join(".")} for ${labelText}. Defaulting to 0.`,
      );
      initialValueForInput = "0";
    }
    input.value = String(initialValueForInput ?? "0");

    const typedChange$ = fromEvent(input, "change").pipe(
      map((event) => parseFloat((event.target as HTMLInputElement).value)),
    );

    const arrowKey$ = fromEvent<KeyboardEvent>(input, "keydown").pipe(
      filter((event) => event.key === "ArrowUp" || event.key === "ArrowDown"),
      tap((event) => event.preventDefault()),
      map((event) => {
        const currentValue = parseFloat(input.value);
        const step = parseFloat(input.step);
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);
        let newValue = currentValue;

        if (event.key === "ArrowUp") {
          newValue = isNaN(currentValue)
            ? step
            : Math.min(max, currentValue + step);
        } else {
          newValue = isNaN(currentValue)
            ? -step
            : Math.max(min, currentValue - step);
        }
        const decimalPlaces = (String(step).split(".")[1] || "").length;
        input.value = newValue.toFixed(decimalPlaces);
        return newValue;
      }),
    );

    const combinedUpdates$ = merge(typedChange$, arrowKey$);

    const subscription = combinedUpdates$
      .pipe(
        distinctUntilChanged((prev, curr) => prev === curr && !isNaN(prev)),
        tap((newValue) => {
          console.log(
            `[Uniform Editor] Numeric Input Committed via RxJS: ${labelText}, New Value: ${newValue}, Path: ${propertyPathToUniform.join(".")}`,
          );
          const latestCelestial = getCelestialObjects()[celestialId];
          if (latestCelestial && latestCelestial.properties) {
            const clonedProperties = this._deepClone(
              latestCelestial.properties,
            );
            this._updatePropertyPath(
              clonedProperties,
              propertyPathToUniform,
              newValue,
            );
            celestialActions.updateCelestialObject(celestialId, {
              properties: clonedProperties,
            });
          } else {
            console.warn(
              `[Uniform Editor] Could not find celestial object ${celestialId} or its properties for update.`,
            );
          }
        }),
      )
      .subscribe();

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return { element: wrapper, subscription };
  }

  private _createColorInput(
    labelText: string,
    celestialId: string,
    currentCelestialObject: CelestialObject,
    propertyPathToUniform: string[],
  ): { element: HTMLElement; subscription: Subscription } {
    const wrapper = document.createElement("div");
    wrapper.className = "uniform-control";
    const label = document.createElement("label");
    label.textContent = labelText;
    const input = document.createElement("input");
    input.type = "color";

    let initialValueForInput: any = currentCelestialObject.properties;
    try {
      for (const key of propertyPathToUniform) {
        initialValueForInput = initialValueForInput[key];
      }
    } catch (e) {
      console.warn(
        `Could not resolve path ${propertyPathToUniform.join(".")} for ${labelText}. Defaulting to #000000.`,
      );
      initialValueForInput = "#000000";
    }
    input.value = String(initialValueForInput ?? "#000000");

    const subscription = fromEvent(input, "change")
      .pipe(
        map((event) => (event.target as HTMLInputElement).value),
        distinctUntilChanged(),
        tap((newColor) => {
          console.log(
            `[Uniform Editor] Color Input Committed via RxJS: ${labelText}, New Value: ${newColor}, Path: ${propertyPathToUniform.join(".")}`,
          );
          const latestCelestial = getCelestialObjects()[celestialId];
          if (latestCelestial && latestCelestial.properties) {
            const clonedProperties = this._deepClone(
              latestCelestial.properties,
            );
            this._updatePropertyPath(
              clonedProperties,
              propertyPathToUniform,
              newColor,
            );
            celestialActions.updateCelestialObject(celestialId, {
              properties: clonedProperties,
            });
          } else {
            console.warn(
              `[Uniform Editor] Could not find celestial object ${celestialId} or its properties for update.`,
            );
          }
        }),
      )
      .subscribe();

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return { element: wrapper, subscription };
  }

  private _renderProceduralSurfaceControls(
    container: HTMLElement,
    celestialObject: CelestialObject,
    surfaceProps: ProceduralSurfaceProperties,
  ) {
    const { id: celestialId, properties } = celestialObject;
    if (!properties) return;

    const addControl = (
      label: string,
      path: string[],
      type: "color" | "number",
      options?: {
        min?: number;
        max?: number;
        step?: number;
      },
    ) => {
      let controlElement: HTMLElement | undefined;
      let inputSubscription: Subscription | undefined;

      if (type === "color") {
        const { element, subscription } = this._createColorInput(
          label,
          celestialId,
          celestialObject,
          path,
        );
        controlElement = element;
        inputSubscription = subscription;
      } else if (type === "number") {
        const { element, subscription } = this._createNumericInput(
          label,
          celestialId,
          celestialObject,
          path,
        );
        const input = element.querySelector("input") as HTMLInputElement;
        if (input && options) {
          if (options.min !== undefined) input.min = String(options.min);
          if (options.max !== undefined) input.max = String(options.max);
          if (options.step !== undefined) input.step = String(options.step);
        }
        controlElement = element;
        inputSubscription = subscription;
      }

      if (controlElement && inputSubscription) {
        container.appendChild(controlElement);
        this.activeInputSubscriptions.push(inputSubscription);
      }
    };

    // Add a section header for noise parameters
    const noiseHeader = document.createElement("h3");
    noiseHeader.textContent = "Noise Parameters";
    container.appendChild(noiseHeader);

    addControl("Persistence:", ["surface", "persistence"], "number", {
      min: 0,
      max: 1,
      step: 0.01,
    });
    addControl("Lacunarity:", ["surface", "lacunarity"], "number", {
      min: 0,
      max: 10,
      step: 0.1,
    });
    addControl("Period:", ["surface", "simplePeriod"], "number", {
      min: 0.1,
      max: 20,
      step: 0.1,
    });
    addControl("Octaves:", ["surface", "octaves"], "number", {
      min: 1,
      max: 10,
      step: 1,
    });
    addControl("Bump Scale:", ["surface", "bumpScale"], "number", {
      min: 0,
      max: 5,
      step: 0.1,
    });

    // Add a section header for colors
    const colorHeader = document.createElement("h3");
    colorHeader.textContent = "Color Ramp";
    container.appendChild(colorHeader);

    addControl("Color 1 (Lowest):", ["surface", "color1"], "color");
    addControl("Color 2:", ["surface", "color2"], "color");
    addControl("Color 3:", ["surface", "color3"], "color");
    addControl("Color 4:", ["surface", "color4"], "color");
    addControl("Color 5 (Highest):", ["surface", "color5"], "color");

    // Add a section header for height controls
    const heightHeader = document.createElement("h3");
    heightHeader.textContent = "Height Controls";
    container.appendChild(heightHeader);

    addControl("Height Level 1:", ["surface", "height1"], "number", {
      min: 0,
      max: 1,
      step: 0.01,
    });
    addControl("Height Level 2:", ["surface", "height2"], "number", {
      min: 0,
      max: 1,
      step: 0.01,
    });
    addControl("Height Level 3:", ["surface", "height3"], "number", {
      min: 0,
      max: 1,
      step: 0.01,
    });
    addControl("Height Level 4:", ["surface", "height4"], "number", {
      min: 0,
      max: 1,
      step: 0.01,
    });
    addControl("Height Level 5:", ["surface", "height5"], "number", {
      min: 0,
      max: 1,
      step: 0.01,
    });

    // Add a section header for material properties
    const materialHeader = document.createElement("h3");
    materialHeader.textContent = "Material Properties";
    container.appendChild(materialHeader);

    addControl("Shininess:", ["surface", "shininess"], "number", {
      min: 1,
      max: 512,
      step: 1,
    });
    addControl(
      "Specular Strength:",
      ["surface", "specularStrength"],
      "number",
      { min: 0, max: 1, step: 0.01 },
    );
    addControl("Roughness:", ["surface", "roughness"], "number", {
      min: 0,
      max: 1,
      step: 0.01,
    });

    // Add a section header for lighting properties
    const lightingHeader = document.createElement("h3");
    lightingHeader.textContent = "Lighting Properties";
    container.appendChild(lightingHeader);

    addControl(
      "Ambient Light Intensity:",
      ["surface", "ambientLightIntensity"],
      "number",
      { min: 0, max: 2, step: 0.1 },
    );
  }

  // --- End of Helper Methods ---
}

customElements.define("celestial-uniforms-editor", CelestialUniformsEditor);

export { FormatUtils };
