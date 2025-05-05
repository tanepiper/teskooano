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
      low: "#5179B5",
      mid1: "#4C9341",
      mid2: "#836F27",
      high: "#A0A0A0",
    };

    if (planetType) {
      switch (planetType) {
        case PlanetType.LAVA:
          simplePalette = {
            low: "#3B0B00",
            mid1: "#801800",
            mid2: "#D44000",
            high: "#FF6B00",
          };
          break;
        case PlanetType.ICE:
          simplePalette = {
            low: "#A0D2DB",
            mid1: "#C0ECF1",
            mid2: "#E1FEFF",
            high: "#FFFFFF",
          };
          break;
        case PlanetType.DESERT:
          simplePalette = {
            low: "#A0522D",
            mid1: "#D2B48C",
            mid2: "#E0C9A6",
            high: "#F5E6CA",
          };
          break;
        case PlanetType.TERRESTRIAL:
          // Explicitly define Terrestrial palette (matches initial default)
          simplePalette = {
            low: "#5179B5", // Water/Deep Blue
            mid1: "#4C9341", // Land/Green
            mid2: "#836F27", // Mountains/Brownish
            high: "#A0A0A0", // Peaks/Grayish
          };
          break;
        case PlanetType.ROCKY:
          // More varied palette for Rocky
          simplePalette = {
            low: "#5A4D41", // Darker Brownish-Gray
            mid1: "#8B7D6B", // Mid Brownish-Gray
            mid2: "#A9A9A9", // Standard Gray
            high: "#D3CFC5", // Light Gray/Tan
          };
          break;
        case PlanetType.BARREN:
          // Less varied, more muted palette for Barren
          simplePalette = {
            low: "#4A4A4A", // Dark Gray
            mid1: "#686868", // Medium Gray
            mid2: "#828282", // Slightly Lighter Gray
            high: "#9A9A9A", // Light Gray
          };
          break;
        case PlanetType.OCEAN:
          // Add a default palette for Ocean type
          simplePalette = {
            low: "#003366", // Deep Ocean Blue
            mid1: "#0055A4", // Mid Ocean Blue
            mid2: "#4169E1", // Royal Blue (Shallows?)
            high: "#ADD8E6", // Light Blue (Foam/Ice?)
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
      bumpScale: (specificSurfaceProps as any)?.bumpScale ?? 3, // Add bumpScale here, cast needed as TS might not see it in the union

      // Color ramp properties
      colorLow: specificSurfaceProps?.colorLow ?? simplePalette.low,
      colorMid1: specificSurfaceProps?.colorMid1 ?? simplePalette.mid1,
      colorMid2: specificSurfaceProps?.colorMid2 ?? simplePalette.mid2,
      colorHigh: specificSurfaceProps?.colorHigh ?? simplePalette.high,
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

    // Prioritize colorLow if defined in properties
    if (specificSurfaceProps?.colorLow) {
      return new THREE.Color(specificSurfaceProps.colorLow);
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
