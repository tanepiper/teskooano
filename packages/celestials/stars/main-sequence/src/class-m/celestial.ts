import { CelestialType, CelestialTypes } from "@teskooano/celestial-object";
import type { CelestialObjectConstructorParams } from "@teskooano/celestial-object";
import {
  StarPhysicalProperties,
  MainSequenceStarConstructorParams,
} from "../types/star.types";
import { MainSequenceStarCelestial } from "../base/star-celestial";
import { MainSequenceStarRenderer } from "../base/star-renderer";
import { ClassMRenderer, ClassMRendererOptions } from "./renderer";
import * as THREE from "three";

/**
 * Constructor parameters for ClassMCelestial.
 * This extends MainSequenceStarConstructorParams but uses a separate rendererOptions property
 * instead of the base rendererOptions to avoid type conflicts.
 */
export interface ClassMCelestialParams
  extends Omit<MainSequenceStarConstructorParams, "rendererOptions"> {
  /**
   * Optional renderer customization options specific to this spectral type.
   * If not provided, default rendering will be used.
   */
  rendererOptions?: ClassMRendererOptions;
}

/**
 * Represents a M-type main-sequence star (Red Dwarf).
 * These are the smallest, coolest, and most common type of star, with surface temperatures between 2,400 and 3,700 K.
 * They burn their fuel very slowly and have extremely long lifespans.
 *
 * Known examples:
 * - Proxima Centauri
 * - TRAPPIST-1
 */
export class ClassMCelestial extends MainSequenceStarCelestial {
  constructor(params: ClassMCelestialParams) {
    // Ensure we're using star physical properties
    if (!isStarPhysicalProperties(params.physicalProperties)) {
      throw new Error("ClassMCelestial requires StarPhysicalProperties");
    }

    // Ensure spectral class is the correct type and set a default if not specified
    const physicalProperties: StarPhysicalProperties = {
      ...params.physicalProperties,
    };

    // If no spectral class is provided or if it's not the correct type, set default
    if (
      !physicalProperties.spectralClass ||
      !physicalProperties.spectralClass.startsWith("M")
    ) {
      physicalProperties.spectralClass = "M5V";
    }

    // Apply star defaults based on spectral class
    applySpectralClassDefaults(
      physicalProperties,
      physicalProperties.spectralClass,
    );

    // Extract the renderer options before passing to super
    const { rendererOptions, ...otherParams } = params;

    // Call the parent constructor
    super({
      ...otherParams,
      physicalProperties,
    });

    // Set up custom renderer if not already provided by MainSequenceStarCelestial
    this.setupClassMRenderer(rendererOptions);
  }

  /**
   * Creates and configures a renderer specific to this star type
   */
  private setupClassMRenderer(options?: ClassMRendererOptions): void {
    // Only set up a new renderer if one wasn't already created by the parent class
    // or if the existing one isn't a MainSequenceStarRenderer
    if (
      !this.renderer ||
      !(this.renderer instanceof MainSequenceStarRenderer)
    ) {
      // Create a specific renderer
      this.renderer = new ClassMRenderer(this, options);
    }
  }

  /**
   * Updates the physics of the star.
   * @param deltaTime - The time step for the physics update (in seconds).
   */
  public override updatePhysics(deltaTime: number): void {
    // Star specific physics can be implemented here

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
 * Apply star type default values based on spectral subclass
 * Data from: https://en.wikipedia.org/wiki/M-type_main-sequence_star and other astronomical resources.
 * These are representative values and can vary significantly.
 */
function applySpectralClassDefaults(
  props: StarPhysicalProperties,
  spectralClass: string,
): void {
  // Only apply defaults if values aren't already set

  // Extract subclass (e.g., M0V through M9V)
  const subclassMatch = spectralClass.match(/M(\d)V/i);
  const subclass = subclassMatch ? parseInt(subclassMatch[1], 10) : 5; // Default to mid-range M5V

  // Default values based on the subclass for M-type stars
  // Masses (Solar masses), Radii (Solar radii), Luminosities (Solar luminosities), Temperatures (K)
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
      mass: 0.51,
      radius: 0.49,
      luminosity: 0.072,
      temperature: 3850,
      colorIndex: 1.4,
    }, // M0V
    1: {
      mass: 0.44,
      radius: 0.43,
      luminosity: 0.045,
      temperature: 3650,
      colorIndex: 1.43,
    }, // M1V
    2: {
      mass: 0.38,
      radius: 0.37,
      luminosity: 0.028,
      temperature: 3450,
      colorIndex: 1.46,
    }, // M2V
    3: {
      mass: 0.3,
      radius: 0.31,
      luminosity: 0.016,
      temperature: 3250,
      colorIndex: 1.49,
    }, // M3V
    4: {
      mass: 0.21,
      radius: 0.24,
      luminosity: 0.0072,
      temperature: 3050,
      colorIndex: 1.54,
    }, // M4V
    5: {
      mass: 0.15,
      radius: 0.18,
      luminosity: 0.0035,
      temperature: 2800,
      colorIndex: 1.64,
    }, // M5V
    6: {
      mass: 0.1,
      radius: 0.13,
      luminosity: 0.0012,
      temperature: 2600,
      colorIndex: 1.73,
    }, // M6V
    7: {
      mass: 0.09,
      radius: 0.11,
      luminosity: 0.0007,
      temperature: 2500,
      colorIndex: 1.8,
    }, // M7V
    8: {
      mass: 0.08,
      radius: 0.1,
      luminosity: 0.0004,
      temperature: 2400,
      colorIndex: 1.86,
    }, // M8V
    9: {
      mass: 0.075,
      radius: 0.09,
      luminosity: 0.0003,
      temperature: 2300,
      colorIndex: 1.9,
    }, // M9V (approx)
  };

  // Get defaults for this subclass
  const subclassDefaults = defaults[subclass] || defaults[5]; // Default to M5V if not found

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

  // Calculate habitable zone if not specified
  if (!props.habitableZoneMin_AU || !props.habitableZoneMax_AU) {
    // Simple estimate based on stellar luminosity
    const luminosityFactor = Math.sqrt(subclassDefaults.luminosity);
    props.habitableZoneMin_AU = 0.75 * luminosityFactor; // Inner edge
    props.habitableZoneMax_AU = 1.8 * luminosityFactor; // Outer edge
  }
}
