import { CelestialType, CelestialTypes } from "@teskooano/celestial-object";
import type { CelestialObjectConstructorParams } from "@teskooano/celestial-object";
import {
  StarPhysicalProperties,
  MainSequenceStarConstructorParams,
} from "../types/star.types";
import { MainSequenceStarCelestial } from "../base/star-celestial";
import { MainSequenceStarRenderer } from "../base/star-renderer";
import { ClassORenderer, ClassORendererOptions } from "./renderer";
import * as THREE from "three";

/**
 * Constructor parameters for ClassOCelestial.
 */
export interface ClassOCelestialParams
  extends Omit<MainSequenceStarConstructorParams, "rendererOptions"> {
  rendererOptions?: ClassORendererOptions;
}

/**
 * Represents an O-type main-sequence star (Blue Supergiant/Giant on MS, or Blue Dwarf).
 * These are the hottest, most massive, and most luminous main-sequence stars, with surface temperatures exceeding 30,000 K.
 * They emit strongly in the ultraviolet and appear intensely blue. Their lifespans are very short (a few million years).
 * O-type stars are rare.
 *
 * Known examples:
 * - Zeta Puppis (Naos)
 * - Theta1 Orionis C
 * - Alpha Camelopardalis
 */
export class ClassOCelestial extends MainSequenceStarCelestial {
  constructor(params: ClassOCelestialParams) {
    if (!isStarPhysicalProperties(params.physicalProperties)) {
      throw new Error("ClassOCelestial requires StarPhysicalProperties");
    }
    const physicalProperties: StarPhysicalProperties = {
      ...params.physicalProperties,
    };
    if (
      !physicalProperties.spectralClass ||
      !physicalProperties.spectralClass.startsWith("O")
    ) {
      physicalProperties.spectralClass = "O5V";
    }
    applyClassODefaults(physicalProperties, physicalProperties.spectralClass);
    const { rendererOptions, ...otherParams } = params;
    super({
      ...otherParams,
      physicalProperties,
    });
    this.setupClassORenderer(rendererOptions);
  }

  private setupClassORenderer(options?: ClassORendererOptions): void {
    if (
      !this.renderer ||
      !(this.renderer instanceof MainSequenceStarRenderer)
    ) {
      this.renderer = new ClassORenderer(this, options);
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
 * Apply O-type star default values based on spectral subclass.
 * Data primarily from Wikipedia: https://en.wikipedia.org/wiki/O-type_star
 * and other astronomical resources. Values are approximate for main-sequence (V) stars.
 * O-type stars have a smaller range of subclasses (typically O3-O9.5).
 */
function applyClassODefaults(
  props: StarPhysicalProperties,
  spectralClass: string,
): void {
  const subclassMatch = spectralClass.match(/O(\d(?:\.\d)?)V/i);
  let subclass = 5;
  if (subclassMatch && subclassMatch[1]) {
    const parsedSubclass = parseFloat(subclassMatch[1]);
    subclass = Math.max(
      0,
      Math.min(9, Math.round((parsedSubclass - 3) * (9 / 6.5))),
    );
  }

  const defaults: Record<
    number,
    {
      mass: number; // Solar masses
      radius: number; // Solar radii
      luminosity: number; // Solar luminosities (L☉)
      temperature: number; // Kelvin
      colorIndex: number; // B-V (typically very negative)
    }
  > = {
    0: {
      mass: 60.0,
      radius: 15.0,
      luminosity: 1400000,
      temperature: 45000,
      colorIndex: -0.33,
    },
    1: {
      mass: 40.0,
      radius: 12.0,
      luminosity: 800000,
      temperature: 42000,
      colorIndex: -0.32,
    },
    2: {
      mass: 25.0,
      radius: 10.0,
      luminosity: 500000,
      temperature: 39000,
      colorIndex: -0.32,
    },
    3: {
      mass: 20.0,
      radius: 8.5,
      luminosity: 250000,
      temperature: 36000,
      colorIndex: -0.31,
    },
    4: {
      mass: 18.0,
      radius: 7.5,
      luminosity: 150000,
      temperature: 34000,
      colorIndex: -0.31,
    },
    5: {
      mass: 16.0,
      radius: 7.0,
      luminosity: 90000,
      temperature: 32000,
      colorIndex: -0.3,
    },
    6: {
      mass: 15.0,
      radius: 6.8,
      luminosity: 60000,
      temperature: 31000,
      colorIndex: -0.29,
    },
    7: {
      mass: 14.5,
      radius: 6.5,
      luminosity: 50000,
      temperature: 30500,
      colorIndex: -0.28,
    },
    8: {
      mass: 14.5,
      radius: 6.5,
      luminosity: 50000,
      temperature: 30500,
      colorIndex: -0.28,
    },
    9: {
      mass: 14.5,
      radius: 6.5,
      luminosity: 50000,
      temperature: 30500,
      colorIndex: -0.28,
    },
  };

  const subclassDefaults = defaults[subclass] || defaults[2];

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
    props.habitableZoneMin_AU = 50.0 * luminosityFactor;
    props.habitableZoneMax_AU = 100.0 * luminosityFactor;
  }
}
