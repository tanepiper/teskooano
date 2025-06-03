import { CelestialType, CelestialTypes } from "@teskooano/celestial-object";
import type { CelestialObjectConstructorParams } from "@teskooano/celestial-object";
import {
  StarPhysicalProperties,
  MainSequenceStarConstructorParams,
} from "../types/star.types";
import { MainSequenceStarCelestial } from "../base/star-celestial";
import { MainSequenceStarRenderer } from "../base/star-renderer";
import { ClassFRenderer, ClassFRendererOptions } from "./renderer";
import * as THREE from "three";

/**
 * Constructor parameters for ClassFCelestial.
 */
export interface ClassFCelestialParams
  extends Omit<MainSequenceStarConstructorParams, "rendererOptions"> {
  rendererOptions?: ClassFRendererOptions;
}

/**
 * Represents an F-type main-sequence star (Yellow-White Dwarf).
 * These stars are hotter and more luminous than G-type stars, with surface temperatures between 6,000 and 7,500 K.
 * They appear white or yellowish-white.
 *
 * Known examples:
 * - Procyon A
 * - Polaris (though a supergiant, F-type is relevant)
 */
export class ClassFCelestial extends MainSequenceStarCelestial {
  constructor(params: ClassFCelestialParams) {
    if (!isStarPhysicalProperties(params.physicalProperties)) {
      throw new Error("ClassFCelestial requires StarPhysicalProperties");
    }
    const physicalProperties: StarPhysicalProperties = {
      ...params.physicalProperties,
    };
    if (
      !physicalProperties.spectralClass ||
      !physicalProperties.spectralClass.startsWith("F")
    ) {
      physicalProperties.spectralClass = "F5V"; // Default F-type
    }
    applyClassFDefaults(physicalProperties, physicalProperties.spectralClass);
    const { rendererOptions, ...otherParams } = params;
    super({
      ...otherParams,
      physicalProperties,
    });
    this.setupClassFRenderer(rendererOptions);
  }

  private setupClassFRenderer(options?: ClassFRendererOptions): void {
    if (
      !this.renderer ||
      !(this.renderer instanceof MainSequenceStarRenderer)
    ) {
      this.renderer = new ClassFRenderer(this, options);
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
 * Apply F-type star default values based on spectral subclass.
 * Data primarily from Wikipedia: https://en.wikipedia.org/wiki/F-type_main-sequence_star
 * Values are approximate and represent typical main-sequence (V) stars.
 */
function applyClassFDefaults(
  props: StarPhysicalProperties,
  spectralClass: string,
): void {
  const subclassMatch = spectralClass.match(/F(\d)V/i);
  const subclass = subclassMatch ? parseInt(subclassMatch[1], 10) : 5; // Default to F5V

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
      mass: 1.62,
      radius: 1.58,
      luminosity: 7.24,
      temperature: 7220,
      colorIndex: 0.3,
    }, // F0V
    1: {
      mass: 1.55,
      radius: 1.52,
      luminosity: 6.17,
      temperature: 7050,
      colorIndex: 0.33,
    }, // F1V
    2: {
      mass: 1.5,
      radius: 1.46,
      luminosity: 5.13,
      temperature: 6890,
      colorIndex: 0.36,
    }, // F2V
    3: {
      mass: 1.46,
      radius: 1.4,
      luminosity: 4.37,
      temperature: 6750,
      colorIndex: 0.39,
    }, // F3V
    4: {
      mass: 1.4,
      radius: 1.35,
      luminosity: 3.63,
      temperature: 6600,
      colorIndex: 0.42,
    }, // F4V
    5: {
      mass: 1.33,
      radius: 1.3,
      luminosity: 2.95,
      temperature: 6410,
      colorIndex: 0.45,
    }, // F5V
    6: {
      mass: 1.25,
      radius: 1.24,
      luminosity: 2.4,
      temperature: 6250,
      colorIndex: 0.49,
    }, // F6V
    7: {
      mass: 1.21,
      radius: 1.19,
      luminosity: 2.0,
      temperature: 6180,
      colorIndex: 0.52,
    }, // F7V
    8: {
      mass: 1.16,
      radius: 1.15,
      luminosity: 1.66,
      temperature: 6050,
      colorIndex: 0.55,
    }, // F8V
    9: {
      mass: 1.1,
      radius: 1.1,
      luminosity: 1.41,
      temperature: 5950,
      colorIndex: 0.58,
    }, // F9V
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
    // Habitable zone shifts outwards for more luminous stars
    props.habitableZoneMin_AU = 0.9 * luminosityFactor;
    props.habitableZoneMax_AU = 2.0 * luminosityFactor;
  }
}
