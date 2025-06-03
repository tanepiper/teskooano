import { CelestialType, CelestialTypes } from "@teskooano/celestial-object";
import type { CelestialObjectConstructorParams } from "@teskooano/celestial-object";
import {
  StarPhysicalProperties,
  MainSequenceStarConstructorParams,
} from "../../types/star.types";
import { MainSequenceStarCelestial } from "../../base/star-celestial";
import { MainSequenceStarRenderer } from "../../base/star-renderer";
import {
  SpectralClassRenderer,
  SpectralClassRendererOptions,
} from "./renderer";
import * as THREE from "three";

/**
 * Constructor parameters for SpectralClassCelestial.
 * This extends MainSequenceStarConstructorParams but uses a separate rendererOptions property
 * instead of the base rendererOptions to avoid type conflicts.
 */
export interface SpectralClassCelestialParams
  extends Omit<MainSequenceStarConstructorParams, "rendererOptions"> {
  /**
   * Optional renderer customization options specific to this spectral type.
   * If not provided, default rendering will be used.
   */
  rendererOptions?: SpectralClassRendererOptions;
}

/**
 * Represents a [SPECTRAL-CLASS]-type main-sequence star.
 * [Add description of this spectral type here]
 *
 * Known examples:
 * - [Example star 1]
 * - [Example star 2]
 */
export class SpectralClassCelestial extends MainSequenceStarCelestial {
  constructor(params: SpectralClassCelestialParams) {
    // Ensure we're using star physical properties
    if (!isStarPhysicalProperties(params.physicalProperties)) {
      throw new Error("SpectralClassCelestial requires StarPhysicalProperties");
    }

    // Ensure spectral class is the correct type and set a default if not specified
    const physicalProperties: StarPhysicalProperties = {
      ...params.physicalProperties,
    };

    // If no spectral class is provided or if it's not the correct type, set default
    if (
      !physicalProperties.spectralClass ||
      !physicalProperties.spectralClass.startsWith("[CLASS]")
    ) {
      physicalProperties.spectralClass = "[CLASS]5V";
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
    this.setupSpectralClassRenderer(rendererOptions);
  }

  /**
   * Creates and configures a renderer specific to this star type
   */
  private setupSpectralClassRenderer(
    options?: SpectralClassRendererOptions,
  ): void {
    // Only set up a new renderer if one wasn't already created by the parent class
    // or if the existing one isn't a MainSequenceStarRenderer
    if (
      !this.renderer ||
      !(this.renderer instanceof MainSequenceStarRenderer)
    ) {
      // Create a specific renderer
      this.renderer = new SpectralClassRenderer(this, options);
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
 * Data from: [Add reference link here]
 */
function applySpectralClassDefaults(
  props: StarPhysicalProperties,
  spectralClass: string,
): void {
  // Only apply defaults if values aren't already set

  // Extract subclass (e.g., [CLASS]0V through [CLASS]9V)
  const subclassMatch = spectralClass.match(/[CLASS](\d)V/i);
  const subclass = subclassMatch ? parseInt(subclassMatch[1], 10) : 5; // Default to mid-range

  // Default values based on the subclass
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
      mass: 0.0,
      radius: 0.0,
      luminosity: 0.0,
      temperature: 0,
      colorIndex: 0.0,
    },
    1: {
      mass: 0.0,
      radius: 0.0,
      luminosity: 0.0,
      temperature: 0,
      colorIndex: 0.0,
    },
    2: {
      mass: 0.0,
      radius: 0.0,
      luminosity: 0.0,
      temperature: 0,
      colorIndex: 0.0,
    },
    3: {
      mass: 0.0,
      radius: 0.0,
      luminosity: 0.0,
      temperature: 0,
      colorIndex: 0.0,
    },
    4: {
      mass: 0.0,
      radius: 0.0,
      luminosity: 0.0,
      temperature: 0,
      colorIndex: 0.0,
    },
    5: {
      mass: 0.0,
      radius: 0.0,
      luminosity: 0.0,
      temperature: 0,
      colorIndex: 0.0,
    },
    6: {
      mass: 0.0,
      radius: 0.0,
      luminosity: 0.0,
      temperature: 0,
      colorIndex: 0.0,
    },
    7: {
      mass: 0.0,
      radius: 0.0,
      luminosity: 0.0,
      temperature: 0,
      colorIndex: 0.0,
    },
    8: {
      mass: 0.0,
      radius: 0.0,
      luminosity: 0.0,
      temperature: 0,
      colorIndex: 0.0,
    },
    9: {
      mass: 0.0,
      radius: 0.0,
      luminosity: 0.0,
      temperature: 0,
      colorIndex: 0.0,
    },
  };

  // Get defaults for this subclass
  const subclassDefaults = defaults[subclass] || defaults[5]; // Default to mid-range if not found

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
