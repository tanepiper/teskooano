import {
  PlanetProperties,
  PlanetType,
  ProceduralSurfaceProperties,
  SurfaceType,
} from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import { ProceduralPlanetMaterial } from "../materials/procedural-planet.material";

/**
 * Service responsible for creating planet materials and determining base colors.
 */
export class PlanetMaterialService {
  /**
   * Creates a procedural planet material based on object properties.
   */
  createMaterial(object: RenderableCelestialObject): ProceduralPlanetMaterial {
    if (!object.celestialObjectId) {
      throw new Error(
        "[PlanetMaterialService.createMaterial] CelestialObject must have an id.",
      );
    }

    const specificSurfaceProps = (object.properties as PlanetProperties)
      ?.surface as ProceduralSurfaceProperties | undefined;
    const planetProps = object.properties as PlanetProperties | undefined;
    const planetType = planetProps?.planetType ?? (object as any).planetType; // Consider a safer way to get planetType if needed

    let simplePalette = {
      color1: "#5179B5",
      color2: "#4C9341",
      color3: "#836F27",
      color4: "#A0A0A0",
      color6: "#FFFFFF",
    };

    if (planetType) {
      switch (planetType) {
        case PlanetType.LAVA:
          simplePalette = {
            color1: "#3B0B00",
            color2: "#801800",
            color3: "#D44000",
            color4: "#FF6B00",
            color6: "#FFA500",
          };
          break;
        case PlanetType.ICE:
          simplePalette = {
            color1: "#A0D2DB",
            color2: "#C0ECF1",
            color3: "#E1FEFF",
            color4: "#FFFFFF",
            color6: "#F0FFFF",
          };
          break;
        case PlanetType.DESERT:
          simplePalette = {
            color1: "#A0522D",
            color2: "#D2B48C",
            color3: "#E0C9A6",
            color4: "#F5E6CA",
            color6: "#FFF8DC",
          };
          break;
        case PlanetType.TERRESTRIAL:
          simplePalette = {
            color1: "#5179B5",
            color2: "#4C9341",
            color3: "#836F27",
            color4: "#A0A0A0",
            color6: "#FFFFFF",
          };
          break;
        case PlanetType.ROCKY:
          simplePalette = {
            color1: "#5A4D41",
            color2: "#8B7D6B",
            color3: "#A9A9A9",
            color4: "#D3CFC5",
            color6: "#F5F5F5",
          };
          break;
        case PlanetType.BARREN:
          simplePalette = {
            color1: "#583C3C",
            color2: "#544A59",
            color3: "#733217",
            color4: "#756C61",
            color6: "#8B8589",
          };
          break;
        case PlanetType.OCEAN:
          simplePalette = {
            color1: "#003366",
            color2: "#0055A4",
            color3: "#4169E1",
            color4: "#ADD8E6",
            color6: "#F0F8FF",
          };
          break;
      }
    }

    const finalProps: ProceduralSurfaceProperties = {
      // Procedural properties
      persistence: specificSurfaceProps?.persistence ?? 0.5,
      lacunarity: specificSurfaceProps?.lacunarity ?? 2.0,
      octaves: specificSurfaceProps?.octaves ?? 6,
      simplePeriod: specificSurfaceProps?.simplePeriod ?? 4.0,
      bumpScale: (specificSurfaceProps as any)?.bumpScale ?? 3,

      // Color ramp properties
      color1: specificSurfaceProps?.color1 ?? simplePalette.color1,
      color2: specificSurfaceProps?.color2 ?? simplePalette.color2,
      color3: specificSurfaceProps?.color3 ?? simplePalette.color3,
      color4: specificSurfaceProps?.color4 ?? simplePalette.color4,
      color5: specificSurfaceProps?.color5 ?? simplePalette.color6,

      height1: specificSurfaceProps?.height1 ?? 0.1,
      height2: specificSurfaceProps?.height2 ?? 0.2,
      height3: specificSurfaceProps?.height3 ?? 0.4,
      height4: specificSurfaceProps?.height4 ?? 0.6,
      height5: specificSurfaceProps?.height5 ?? 0.8,
    };

    const material = new ProceduralPlanetMaterial(finalProps);
    material.needsUpdate = true; // Ensure uniforms are updated initially

    return material;
  }

  /**
   * Gets a representative base color for the planet (used for simpler LOD levels).
   */
  getBaseColor(object: RenderableCelestialObject): THREE.Color {
    const planetProps = object.properties as PlanetProperties | undefined;
    const planetType = planetProps?.planetType ?? (object as any).planetType;
    const specificSurfaceProps = planetProps?.surface as
      | ProceduralSurfaceProperties
      | undefined;

    // Prioritize color1 if defined in properties
    if (specificSurfaceProps?.color1) {
      return new THREE.Color(specificSurfaceProps.color1);
    }

    // Fallback based on planet type
    if (planetType) {
      switch (planetType) {
        case PlanetType.LAVA:
          return new THREE.Color("#801800"); // Darker red/brown for lava base
        case PlanetType.ICE:
          return new THREE.Color("#C0ECF1"); // Light blue/cyan for ice base
        case PlanetType.DESERT:
          return new THREE.Color("#D2B48C"); // Tan/beige for desert base
        case PlanetType.TERRESTRIAL:
          return new THREE.Color("#4C9341"); // Green for terrestrial base
        case PlanetType.ROCKY:
        case PlanetType.BARREN:
          return new THREE.Color("#606060"); // Medium gray for rocky/barren base
      }
    }

    // Default fallback color
    return new THREE.Color("#808080"); // Neutral gray
  }
}
