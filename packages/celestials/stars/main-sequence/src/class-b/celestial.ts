import { CelestialType, CelestialTypes } from "@teskooano/celestial-object";
import type { CelestialObjectConstructorParams } from "@teskooano/celestial-object";
import {
  StarPhysicalProperties,
  MainSequenceStarConstructorParams,
} from "../types/star.types";
import { MainSequenceStarCelestial } from "../base/star-celestial";
import { MainSequenceStarRenderer } from "../base/star-renderer";
import { ClassBRenderer, ClassBRendererOptions } from "./renderer";
import * as THREE from "three";

/**
 * Constructor parameters for ClassBCelestial.
 */
export interface ClassBCelestialParams
  extends Omit<MainSequenceStarConstructorParams, "rendererOptions"> {
  rendererOptions?: ClassBRendererOptions;
}

/**
 * Represents a B-type main-sequence star (Blue-White).
 * These are very luminous and hot stars, with surface temperatures between 10,000 and 30,000 K.
 * Their light is distinctly blue-white. They have relatively short lifespans.
 *
 * Known examples:
 * - Regulus A
 * - Algol A
 * - Spica
 */
export class ClassBCelestial extends MainSequenceStarCelestial {
  constructor(params: ClassBCelestialParams) {
    if (!isStarPhysicalProperties(params.physicalProperties)) {
      throw new Error("ClassBCelestial requires StarPhysicalProperties");
    }
    const physicalProperties: StarPhysicalProperties = {
      ...params.physicalProperties,
    };
    if (
      !physicalProperties.spectralClass ||
      !physicalProperties.spectralClass.startsWith("B")
    ) {
      physicalProperties.spectralClass = "B5V";
    }
    applyClassBDefaults(physicalProperties, physicalProperties.spectralClass);
    const { rendererOptions, ...otherParams } = params;
    super({
      ...otherParams,
      physicalProperties,
    });
    this.setupClassBRenderer(rendererOptions);
  }

  private setupClassBRenderer(options?: ClassBRendererOptions): void {
    if (
      !this.renderer ||
      !(this.renderer instanceof MainSequenceStarRenderer)
    ) {
      this.renderer = new ClassBRenderer(this, options);
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
 * Apply B-type star default values based on spectral subclass.
 * Data primarily from Wikipedia: https://en.wikipedia.org/wiki/B-type_main-sequence_star
 * and other astronomical resources. Values are approximate for main-sequence (V) stars.
 */
function applyClassBDefaults(
  props: StarPhysicalProperties,
  spectralClass: string,
): void {
  const subclassMatch = spectralClass.match(/B(\d)V/i);
  const subclass = subclassMatch ? parseInt(subclassMatch[1], 10) : 5;

  const defaults: Record<
    number,
    {
      mass: number; // Solar masses
      radius: number; // Solar radii
      luminosity: number; // Solar luminosities (L☉)
      temperature: number; // Kelvin
      colorIndex: number; // B-V
    }
  > = {
    0: {
      mass: 16.0,
      radius: 6.6,
      luminosity: 25000,
      temperature: 30000,
      colorIndex: -0.3,
    },
    1: {
      mass: 10.0,
      radius: 5.4,
      luminosity: 10000,
      temperature: 25000,
      colorIndex: -0.26,
    },
    2: {
      mass: 7.0,
      radius: 4.8,
      luminosity: 3200,
      temperature: 22000,
      colorIndex: -0.22,
    },
    3: {
      mass: 5.4,
      radius: 3.9,
      luminosity: 1000,
      temperature: 18500,
      colorIndex: -0.18,
    },
    4: {
      mass: 4.5,
      radius: 3.5,
      luminosity: 630,
      temperature: 17000,
      colorIndex: -0.16,
    },
    5: {
      mass: 3.8,
      radius: 3.0,
      luminosity: 250,
      temperature: 15500,
      colorIndex: -0.14,
    },
    6: {
      mass: 3.2,
      radius: 2.8,
      luminosity: 160,
      temperature: 14000,
      colorIndex: -0.12,
    },
    7: {
      mass: 2.8,
      radius: 2.5,
      luminosity: 100,
      temperature: 13000,
      colorIndex: -0.1,
    },
    8: {
      mass: 2.5,
      radius: 2.2,
      luminosity: 63,
      temperature: 12000,
      colorIndex: -0.08,
    },
    9: {
      mass: 2.2,
      radius: 1.9,
      luminosity: 40,
      temperature: 11000,
      colorIndex: -0.06,
    },
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
    props.habitableZoneMin_AU = 7.0 * luminosityFactor;
    props.habitableZoneMax_AU = 15.0 * luminosityFactor;
  }
}
