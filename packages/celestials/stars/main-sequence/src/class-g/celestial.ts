import { CelestialType, CelestialTypes } from "@teskooano/celestial-object";
import type { CelestialObjectConstructorParams } from "@teskooano/celestial-object";
import {
  StarPhysicalProperties,
  MainSequenceStarConstructorParams,
} from "../types/star.types";
import { MainSequenceStarCelestial } from "../base/star-celestial";
import { MainSequenceStarRenderer } from "../base/star-renderer";
import { ClassGRenderer, ClassGRendererOptions } from "./renderer";
import * as THREE from "three";

/**
 * Constructor parameters for ClassGCelestial.
 * This extends MainSequenceStarConstructorParams but uses a separate gRendererOptions property
 * instead of the base rendererOptions to avoid type conflicts.
 */
export interface ClassGCelestialParams
  extends Omit<MainSequenceStarConstructorParams, "rendererOptions"> {
  /**
   * Optional renderer customization options specific to G-type stars.
   * If not provided, default G-type star rendering will be used.
   */
  rendererOptions?: ClassGRendererOptions;
}

/**
 * Represents a G-type main-sequence star.
 * G-type stars are yellow-white stars with surface temperatures around 5,300-6,000 K.
 * They have a mass of about 0.9 to 1.1 solar masses.
 * The Sun is a G-type star (specifically G2V).
 *
 * Known examples:
 * - The Sun (G2V)
 * - Alpha Centauri (G2V)
 * - Tau Ceti (G8V)
 * - 61 Virginis (G5V)
 */
export class ClassGCelestial extends MainSequenceStarCelestial {
  constructor(params: ClassGCelestialParams) {
    // Ensure we're using star physical properties
    if (!isStarPhysicalProperties(params.physicalProperties)) {
      throw new Error("ClassGCelestial requires StarPhysicalProperties");
    }

    // Ensure spectral class is a G-type and set a default if not specified
    const physicalProperties: StarPhysicalProperties = {
      ...params.physicalProperties,
    };

    // If no spectral class is provided or if it's not a G-type, set default G2V
    if (
      !physicalProperties.spectralClass ||
      !physicalProperties.spectralClass.startsWith("G")
    ) {
      physicalProperties.spectralClass = "G2V";
    }

    // Apply G-type star defaults based on spectral class
    applyGTypeDefaults(physicalProperties, physicalProperties.spectralClass);

    // Extract the G-specific renderer options before passing to super
    const { rendererOptions, ...otherParams } = params;

    // Call the parent constructor
    super({
      ...otherParams,
      physicalProperties,
    });

    // Set up custom renderer for G-type star if not already provided by MainSequenceStarCelestial
    this.setupGTypeRenderer(rendererOptions);
  }

  /**
   * Creates and configures a renderer specific to G-type stars
   * This follows the architectural pattern where each celestial type
   * is responsible for providing its own specialized renderer
   */
  private setupGTypeRenderer(options?: ClassGRendererOptions): void {
    // Only set up a new renderer if one wasn't already created by the parent class
    // or if the existing one isn't a MainSequenceStarRenderer
    if (
      !this.renderer ||
      !(this.renderer instanceof MainSequenceStarRenderer)
    ) {
      // Create a G-type specific renderer
      // The renderer will extract properties directly from this celestial object
      this.renderer = new ClassGRenderer(this, options);
    }
  }

  /**
   * Get the appropriate color for this G-type star based on its spectral subclass
   * Note: This is no longer needed directly for renderer creation, but kept as a utility method
   */
  private getGTypeStarColor(): THREE.Color {
    // Extract the subclass from the spectral class (e.g., 2 from "G2V")
    const subclassMatch = this.spectralClass.match(/G(\d)V/i);
    const subclass = subclassMatch ? parseInt(subclassMatch[1], 10) : 2; // Default to G2

    // Color mapping for G subclasses (from whiter/hotter G0 to more yellow/cooler G9)
    const gTypeColorMap: Record<number, number> = {
      0: 0xfffbf5, // G0 - Whiter
      1: 0xfff9f0,
      2: 0xfff4e0, // G2 - Sun-like
      3: 0xfff1d5,
      4: 0xffedca,
      5: 0xffe9c0,
      6: 0xffe5b5,
      7: 0xffe0aa,
      8: 0xffdba0,
      9: 0xffd696, // G9 - More yellow/orange
    };

    // Use the color corresponding to the subclass, or default to G2 (Sun-like)
    const colorHex = gTypeColorMap[subclass] || gTypeColorMap[2];
    return new THREE.Color(colorHex);
  }

  /**
   * Updates the physics of the G-type star.
   * @param deltaTime - The time step for the physics update (in seconds).
   */
  public override updatePhysics(deltaTime: number): void {
    // G-type star specific physics can be implemented here

    // Call the parent class's update method
    super.updatePhysics(deltaTime);
  }
}

/**
 * Type guard to check if physical properties are StarPhysicalProperties
 */
function isStarPhysicalProperties(props: any): props is StarPhysicalProperties {
  return (
    props &&
    typeof props.spectralClass === "string" &&
    typeof props.luminosity_Watts === "number" &&
    typeof props.stellarMass_kg === "number"
  );
}

/**
 * Apply G-type star default values based on spectral subclass
 * Data from: https://en.wikipedia.org/wiki/G-type_main-sequence_star
 */
function applyGTypeDefaults(
  props: StarPhysicalProperties,
  spectralClass: string,
): void {
  // Only apply defaults if values aren't already set

  // Extract G subclass (G0V through G9V)
  const subclassMatch = spectralClass.match(/G(\d)V/i);
  const subclass = subclassMatch ? parseInt(subclassMatch[1], 10) : 2; // Default to G2 (Sun-like)

  // Default values based on the Wikipedia table for G-type stars
  const defaults: Record<
    number,
    {
      mass: number; // In solar masses
      radius: number; // In solar radii
      luminosity: number; // In solar luminosities
      temperature: number; // In Kelvin
      colorIndex: number; // B-V color index
    }
  > = {
    0: {
      mass: 1.06,
      radius: 1.1,
      luminosity: 1.35,
      temperature: 5930,
      colorIndex: 0.6,
    },
    1: {
      mass: 1.03,
      radius: 1.06,
      luminosity: 1.2,
      temperature: 5860,
      colorIndex: 0.62,
    },
    2: {
      mass: 1.0,
      radius: 1.012,
      luminosity: 1.02,
      temperature: 5770,
      colorIndex: 0.65,
    }, // Sun (G2V)
    3: {
      mass: 0.99,
      radius: 1.002,
      luminosity: 0.98,
      temperature: 5720,
      colorIndex: 0.66,
    },
    4: {
      mass: 0.985,
      radius: 0.991,
      luminosity: 0.91,
      temperature: 5680,
      colorIndex: 0.67,
    },
    5: {
      mass: 0.98,
      radius: 0.977,
      luminosity: 0.89,
      temperature: 5660,
      colorIndex: 0.68,
    },
    6: {
      mass: 0.97,
      radius: 0.949,
      luminosity: 0.79,
      temperature: 5600,
      colorIndex: 0.7,
    },
    7: {
      mass: 0.95,
      radius: 0.927,
      luminosity: 0.74,
      temperature: 5550,
      colorIndex: 0.71,
    },
    8: {
      mass: 0.94,
      radius: 0.914,
      luminosity: 0.68,
      temperature: 5480,
      colorIndex: 0.73,
    },
    9: {
      mass: 0.9,
      radius: 0.853,
      luminosity: 0.55,
      temperature: 5380,
      colorIndex: 0.78,
    },
  };

  // Get defaults for this subclass
  const subclassDefaults = defaults[subclass] || defaults[2]; // Default to G2 if not found

  // Constants for conversion
  const SOLAR_MASS_KG = 1.989e30; // Solar mass in kg
  const SOLAR_RADIUS_M = 6.957e8; // Solar radius in meters
  const SOLAR_LUMINOSITY_W = 3.828e26; // Solar luminosity in watts

  // Set default values if not already specified
  if (!props.stellarMass_kg || props.stellarMass_kg === 0) {
    props.stellarMass_kg = subclassDefaults.mass * SOLAR_MASS_KG;
  }

  if (!props.radius || props.radius === 0) {
    props.radius = subclassDefaults.radius * SOLAR_RADIUS_M;
  }

  if (!props.luminosity_Watts || props.luminosity_Watts === 0) {
    props.luminosity_Watts = subclassDefaults.luminosity * SOLAR_LUMINOSITY_W;
  }

  if (!props.temperature_k || props.temperature_k === 0) {
    props.temperature_k = subclassDefaults.temperature;
  }

  if (!props.colorIndex) {
    props.colorIndex = subclassDefaults.colorIndex;
  }

  // Calculate habitable zone if not specified (basic approximation)
  if (!props.habitableZoneMin_AU || !props.habitableZoneMax_AU) {
    // Simple estimate based on stellar luminosity
    const luminosityFactor = Math.sqrt(subclassDefaults.luminosity);
    props.habitableZoneMin_AU = 0.75 * luminosityFactor; // Inner edge
    props.habitableZoneMax_AU = 1.8 * luminosityFactor; // Outer edge
  }
}
