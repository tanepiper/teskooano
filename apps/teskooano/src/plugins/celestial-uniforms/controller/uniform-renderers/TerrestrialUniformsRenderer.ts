import type {
  CelestialObject,
  PlanetProperties,
  ProceduralSurfaceProperties,
} from "@teskooano/data-types";
import type { Subscription } from "rxjs";
import { BaseUniformsRenderer } from "./BaseUniformsRenderer";

/**
 * Renders the complex set of UI controls for terrestrial objects
 * with procedural surfaces.
 */
export class TerrestrialUniformsRenderer extends BaseUniformsRenderer {
  public render(
    container: HTMLElement,
    celestial: CelestialObject,
  ): Subscription[] {
    const planetProps = celestial.properties as PlanetProperties;
    if (planetProps && planetProps.surface) {
      return this._renderProceduralSurfaceControls(
        container,
        celestial,
        planetProps.surface as ProceduralSurfaceProperties,
      );
    }
    return [];
  }

  private _renderProceduralSurfaceControls(
    container: HTMLElement,
    celestialObject: CelestialObject,
    surfaceProps: ProceduralSurfaceProperties,
  ): Subscription[] {
    const subscriptions: Subscription[] = [];
    const { id: celestialId, properties } = celestialObject;
    if (!properties) return [];

    const addControl = (
      label: string,
      path: string[],
      type: "color" | "number",
      options?: {
        min?: number;
        max?: number;
        step?: number;
      },
    ): void => {
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
          options,
        );
        controlElement = element;
        inputSubscription = subscription;
      }

      if (controlElement && inputSubscription) {
        container.appendChild(controlElement);
        subscriptions.push(inputSubscription);
      }
    };

    const terrainHeader = document.createElement("h3");
    terrainHeader.textContent = "Terrain Generation";
    container.appendChild(terrainHeader);

    addControl("Terrain Type:", ["surface", "terrainType"], "number", {
      min: 1,
      max: 3,
      step: 1,
    });
    addControl(
      "Terrain Amplitude:",
      ["surface", "terrainAmplitude"],
      "number",
      {
        min: 0.1,
        max: 2.0,
        step: 0.1,
      },
    );
    addControl(
      "Terrain Sharpness:",
      ["surface", "terrainSharpness"],
      "number",
      {
        min: 0.1,
        max: 2.0,
        step: 0.1,
      },
    );
    addControl("Terrain Offset:", ["surface", "terrainOffset"], "number", {
      min: -0.5,
      max: 0.5,
      step: 0.05,
    });
    addControl("Undulation:", ["surface", "undulation"], "number", {
      min: 0,
      max: 1,
      step: 0.05,
    });

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

    const colorHeader = document.createElement("h3");
    colorHeader.textContent = "Color Ramp";
    container.appendChild(colorHeader);

    addControl("Color 1 (Lowest):", ["surface", "color1"], "color");
    addControl("Color 2:", ["surface", "color2"], "color");
    addControl("Color 3:", ["surface", "color3"], "color");
    addControl("Color 4:", ["surface", "color4"], "color");
    addControl("Color 5 (Highest):", ["surface", "color5"], "color");

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

    const materialHeader = document.createElement("h3");
    materialHeader.textContent = "Material Properties";
    container.appendChild(materialHeader);

    addControl("Shininess:", ["surface", "shininess"], "number", {
      min: 1,
      max: 64,
      step: 1,
    });
    addControl(
      "Specular Strength:",
      ["surface", "specularStrength"],
      "number",
      { min: 0, max: 0.5, step: 0.01 },
    );
    addControl("Roughness:", ["surface", "roughness"], "number", {
      min: 0,
      max: 1,
      step: 0.01,
    });

    const lightingHeader = document.createElement("h3");
    lightingHeader.textContent = "Lighting Properties";
    container.appendChild(lightingHeader);

    addControl(
      "Ambient Light Intensity:",
      ["surface", "ambientLightIntensity"],
      "number",
      { min: 0, max: 0.5, step: 0.01 },
    );

    return subscriptions;
  }
}
