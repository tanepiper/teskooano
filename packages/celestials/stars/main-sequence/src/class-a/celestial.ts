import { CelestialType, CelestialTypes } from "@teskooano/celestial-object";
import type { CelestialObjectConstructorParams } from "@teskooano/celestial-object";
import {
  StarPhysicalProperties,
  MainSequenceStarConstructorParams,
} from "../types/star.types";
import { MainSequenceStarCelestial } from "../base/star-celestial";
import { MainSequenceStarRenderer } from "../base/star-renderer";
import { ClassARenderer, ClassARendererOptions } from "./renderer";
import * as THREE from "three";

/**
 * Constructor parameters for ClassACelestial.
 */
export interface ClassACelestialParams
  extends Omit<MainSequenceStarConstructorParams, "rendererOptions"> {
  rendererOptions?: ClassARendererOptions;
}

/**
 * Represents an A-type main-sequence star (White or Bluish-White Dwarf).
 * These stars are significantly hotter and more luminous than the Sun, with surface temperatures between 7,500 and 10,000 K.
 * They rotate rapidly and some show peculiar spectra.
 *
 * Known examples:
 * - Sirius A
 * - Vega
 * - Altair
 */
export class ClassACelestial extends MainSequenceStarCelestial {
  constructor(params: ClassACelestialParams) {
    if (!isStarPhysicalProperties(params.physicalProperties)) {
      throw new Error("ClassACelestial requires StarPhysicalProperties");
    }
    const physicalProperties: StarPhysicalProperties = {
      ...params.physicalProperties,
    };
    if (
      !physicalProperties.spectralClass ||
      !physicalProperties.spectralClass.startsWith("A")
    ) {
      physicalProperties.spectralClass = "A5V"; // Default A-type
    }
    applyClassADefaults(physicalProperties, physicalProperties.spectralClass);
    const { rendererOptions, ...otherParams } = params;
    super({
      ...otherParams,
      physicalProperties,
    });
    this.setupClassARenderer(rendererOptions);
  }

  private setupClassARenderer(options?: ClassARendererOptions): void {
    if (
      !this.renderer ||
      !(this.renderer instanceof MainSequenceStarRenderer)
    ) {
      this.renderer = new ClassARenderer(this, options);
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
 * Apply A-type star default values based on spectral subclass.
 * Data primarily from Wikipedia: https://en.wikipedia.org/wiki/A-type_main-sequence_star
 * Values are approximate and represent typical main-sequence (V) stars.
 */
function applyClassADefaults(
  props: StarPhysicalProperties,
  spectralClass: string,
): void {
  const subclassMatch = spectralClass.match(/A(\d)V/i);
  const subclass = subclassMatch ? parseInt(subclassMatch[1], 10) : 5; // Default to A5V

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
      mass: 2.14,
      radius: 1.87,
      luminosity: 38.0,
      temperature: 9700,
      colorIndex: 0.0,
    }, // A0V (e.g., Vega)
    1: {
      mass: 2.05,
      radius: 1.83,
      luminosity: 30.0,
      temperature: 9300,
      colorIndex: 0.03,
    }, // A1V
    2: {
      mass: 1.98,
      radius: 1.78,
      luminosity: 23.0,
      temperature: 8900,
      colorIndex: 0.07,
    }, // A2V
    3: {
      mass: 1.9,
      radius: 1.72,
      luminosity: 17.0,
      temperature: 8500,
      colorIndex: 0.1,
    }, // A3V
    4: {
      mass: 1.82,
      radius: 1.68,
      luminosity: 13.0,
      temperature: 8200,
      colorIndex: 0.13,
    }, // A4V
    5: {
      mass: 1.75,
      radius: 1.65,
      luminosity: 10.0,
      temperature: 8000,
      colorIndex: 0.16,
    }, // A5V (e.g., Altair approx)
    6: {
      mass: 1.68,
      radius: 1.6,
      luminosity: 7.9,
      temperature: 7800,
      colorIndex: 0.19,
    }, // A6V
    7: {
      mass: 1.62,
      radius: 1.55,
      luminosity: 6.3,
      temperature: 7600,
      colorIndex: 0.22,
    }, // A7V
    8: {
      mass: 1.58,
      radius: 1.5,
      luminosity: 5.0,
      temperature: 7400,
      colorIndex: 0.25,
    }, // A8V
    9: {
      mass: 1.5,
      radius: 1.45,
      luminosity: 4.0,
      temperature: 7200,
      colorIndex: 0.28,
    }, // A9V
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
    // Habitable zone for A-type stars is further out and wider
    props.habitableZoneMin_AU = 2.0 * luminosityFactor;
    props.habitableZoneMax_AU = 3.5 * luminosityFactor;
  }
}
