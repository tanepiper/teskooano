import { CelestialType, CelestialTypes } from "@teskooano/celestial-object";
import type { CelestialObjectConstructorParams } from "@teskooano/celestial-object";
import {
  StarPhysicalProperties,
  MainSequenceStarConstructorParams,
} from "../types/star.types";
import { MainSequenceStarCelestial } from "../base/star-celestial";
import { MainSequenceStarRenderer } from "../base/star-renderer";
import { ClassKRenderer, ClassKRendererOptions } from "./renderer";
import * as THREE from "three";

/**
 * Constructor parameters for ClassKCelestial.
 */
export interface ClassKCelestialParams
  extends Omit<MainSequenceStarConstructorParams, "rendererOptions"> {
  rendererOptions?: ClassKRendererOptions;
}

/**
 * Represents a K-type main-sequence star (Orange Dwarf).
 * These stars are cooler and less luminous than G-type stars like the Sun, with surface temperatures between 3,700 and 5,200 K.
 * They have longer lifespans than G-type stars.
 *
 * Known examples:
 * - Epsilon Eridani
 * - Alpha Centauri B
 */
export class ClassKCelestial extends MainSequenceStarCelestial {
  constructor(params: ClassKCelestialParams) {
    if (!isStarPhysicalProperties(params.physicalProperties)) {
      throw new Error("ClassKCelestial requires StarPhysicalProperties");
    }
    const physicalProperties: StarPhysicalProperties = {
      ...params.physicalProperties,
    };
    if (
      !physicalProperties.spectralClass ||
      !physicalProperties.spectralClass.startsWith("K")
    ) {
      physicalProperties.spectralClass = "K5V"; // Default K-type
    }
    applyClassKDefaults(physicalProperties, physicalProperties.spectralClass);
    const { rendererOptions, ...otherParams } = params;
    super({
      ...otherParams,
      physicalProperties,
    });
    this.setupClassKRenderer(rendererOptions);
  }

  private setupClassKRenderer(options?: ClassKRendererOptions): void {
    if (
      !this.renderer ||
      !(this.renderer instanceof MainSequenceStarRenderer)
    ) {
      this.renderer = new ClassKRenderer(this, options);
    }
  }

  public override updatePhysics(deltaTime: number): void {
    super.updatePhysics(deltaTime);
  }
}

function isStarPhysicalProperties(props: any): props is StarPhysicalProperties {
  return (
    props &&
    typeof props.spectralClass === "string" &&
    typeof props.luminosity_Watts === "number" &&
    typeof props.stellarMass_kg === "number"
  );
}

/**
 * Apply K-type star default values based on spectral subclass.
 * Data primarily from Wikipedia: https://en.wikipedia.org/wiki/K-type_main-sequence_star
 * Values are approximate and represent typical main-sequence (V) stars.
 */
function applyClassKDefaults(
  props: StarPhysicalProperties,
  spectralClass: string,
): void {
  const subclassMatch = spectralClass.match(/K(\d)V/i);
  const subclass = subclassMatch ? parseInt(subclassMatch[1], 10) : 5; // Default to K5V

  const defaults: Record<
    number,
    {
      mass: number; // Solar masses
      radius: number; // Solar radii
      luminosity: number; // Solar luminosities
      temperature: number; // Kelvin
      colorIndex: number; // B-V
    }
  > = {
    0: {
      mass: 0.88,
      radius: 0.81,
      luminosity: 0.46,
      temperature: 5270,
      colorIndex: 0.82,
    }, // K0V
    1: {
      mass: 0.86,
      radius: 0.79,
      luminosity: 0.4,
      temperature: 5170,
      colorIndex: 0.86,
    }, // K1V
    2: {
      mass: 0.82,
      radius: 0.78,
      luminosity: 0.33,
      temperature: 5020,
      colorIndex: 0.89,
    }, // K2V
    3: {
      mass: 0.78,
      radius: 0.74,
      luminosity: 0.26,
      temperature: 4830,
      colorIndex: 0.96,
    }, // K3V
    4: {
      mass: 0.73,
      radius: 0.71,
      luminosity: 0.2,
      temperature: 4600,
      colorIndex: 1.05,
    }, // K4V
    5: {
      mass: 0.69,
      radius: 0.67,
      luminosity: 0.17,
      temperature: 4350,
      colorIndex: 1.15,
    }, // K5V
    6: {
      mass: 0.64,
      radius: 0.63,
      luminosity: 0.11,
      temperature: 4060,
      colorIndex: 1.3,
    }, // K6V
    7: {
      mass: 0.59,
      radius: 0.6,
      luminosity: 0.09,
      temperature: 3880,
      colorIndex: 1.34,
    }, // K7V
    // K8V and K9V are less well-defined and overlap with M-type, providing approximate values
    8: {
      mass: 0.55,
      radius: 0.57,
      luminosity: 0.07,
      temperature: 3750,
      colorIndex: 1.38,
    }, // K8V (approx)
    9: {
      mass: 0.5,
      radius: 0.53,
      luminosity: 0.05,
      temperature: 3650,
      colorIndex: 1.4,
    }, // K9V (approx)
  };

  const subclassDefaults = defaults[subclass] || defaults[5];

  const SOLAR_MASS_KG = 1.989e30;
  const SOLAR_RADIUS_M = 6.957e8;
  const SOLAR_LUMINOSITY_W = 3.828e26;

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
  if (!props.habitableZoneMin_AU || !props.habitableZoneMax_AU) {
    const luminosityFactor = Math.sqrt(subclassDefaults.luminosity);
    props.habitableZoneMin_AU = 0.5 * luminosityFactor; // Adjusted for K-type (cooler)
    props.habitableZoneMax_AU = 1.2 * luminosityFactor; // Adjusted for K-type
  }
}
