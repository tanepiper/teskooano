import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  CometProperties,
  OrbitalParameters,
  CelestialObject,
  CometClass,
  METERS_TO_SCENE_UNITS,
  SCALE,
} from "@teskooano/data-types";
import { CONVERSION } from "@teskooano/core-physics";

// TODO: These types are duplicated from the solar system initializer.
// They should be moved to a shared location.
interface SystemBody {
  id: string;
  name: string;
  type: CelestialType;
  radius: number;
  mass: number;
  albedo: number;
  properties: CometProperties;
  orbit: OrbitalParameters;
}

const HALLEY_NUCLEUS_RADIUS_M = 5.5 * CONVERSION.KM_TO_M;
const HALLEY_MASS_KG = 2.2e14;
const HALLEY_ALBEDO = 0.04;

const HALEBOPP_NUCLEUS_RADIUS_M = 30 * CONVERSION.KM_TO_M;
const HALEBOPP_MASS_KG = 2.2e15; // Estimate
const HALEBOPP_ALBEDO = 0.04;

const ENCKE_NUCLEUS_RADIUS_M = 2.4 * CONVERSION.KM_TO_M;
const ENCKE_MASS_KG = 2e13; // Estimate
const ENCKE_ALBEDO = 0.047;

const comets: SystemBody[] = [
  {
    id: "halley",
    name: "1P/Halley",
    type: CelestialType.COMET,
    radius: HALLEY_NUCLEUS_RADIUS_M,
    mass: HALLEY_MASS_KG,
    albedo: HALLEY_ALBEDO,
    properties: {
      type: CelestialType.COMET,
      classType: CometClass.ACTIVE,
      activity: 0.7,
      composition: ["water ice", "dust"],
      visualComaRadius: 75000 * METERS_TO_SCENE_UNITS * 0.5, // Approx 75,000 km, scaled down
      visualComaColor: "#ADD8E6", // Light blue
      visualMaxTailLength: 0.2 * SCALE.RENDER_SCALE_AU, // 0.2 AU
      visualTailColor: "#ADD8E6",
    },
    orbit: {
      realSemiMajorAxis_m: 2.667e12, // 17.834 AU
      eccentricity: 0.967,
      inclination: 2.831, // 162.26 deg
      longitudeOfAscendingNode: 1.019, // 58.42 deg
      argumentOfPeriapsis: 1.943, // 111.33 deg
      meanAnomaly: 0,
      period_s: 2.376e9, // 75.32 years
    },
  },
  {
    id: "hale-bopp",
    name: "C/1995 O1 (Hale-Bopp)",
    type: CelestialType.COMET,
    radius: HALEBOPP_NUCLEUS_RADIUS_M,
    mass: HALEBOPP_MASS_KG,
    albedo: HALEBOPP_ALBEDO,
    properties: {
      type: CelestialType.COMET,
      classType: CometClass.ACTIVE,
      activity: 0.9,
      composition: ["water ice", "dust"],
      visualComaRadius: 150000 * METERS_TO_SCENE_UNITS * 0.5, // Approx 150,000 km, scaled down
      visualComaColor: "#FFFFE0", // Light yellow
      visualMaxTailLength: 1.0 * SCALE.RENDER_SCALE_AU, // 1 AU at peak
      visualTailColor: "#FFFFE0",
    },
    orbit: {
      realSemiMajorAxis_m: 2.755e13, // 184.2 AU
      eccentricity: 0.995,
      inclination: 1.56, // 89.4 deg
      longitudeOfAscendingNode: 4.93, // 282.47 deg
      argumentOfPeriapsis: 2.279, // 130.59 deg
      meanAnomaly: 0,
      period_s: 7.992e10, // 2533 years
    },
  },
  {
    id: "encke",
    name: "2P/Encke",
    type: CelestialType.COMET,
    radius: ENCKE_NUCLEUS_RADIUS_M,
    mass: ENCKE_MASS_KG,
    albedo: ENCKE_ALBEDO,
    properties: {
      type: CelestialType.COMET,
      classType: CometClass.ACTIVE,
      composition: ["carbon", "dust"],
      activity: 0.4,
      visualComaRadius: 50000 * METERS_TO_SCENE_UNITS * 0.5, // Approx 50,000 km, scaled down
      visualComaColor: "#F0F8FF", // Alice blue
      visualMaxTailLength: 0.1 * SCALE.RENDER_SCALE_AU, // 0.1 AU
      visualTailColor: "#F0F8FF",
    },
    orbit: {
      realSemiMajorAxis_m: 3.318e11, // 2.218 AU
      eccentricity: 0.848,
      inclination: 0.205, // 11.76 deg
      longitudeOfAscendingNode: 5.835, // 334.33 deg
      argumentOfPeriapsis: 3.256, // 186.54 deg
      meanAnomaly: 0,
      period_s: 1.041e8, // 3.30 years
    },
  },
];

export const initializeComets = (parentId: string) => {
  comets.forEach((comet) => {
    actions.addCelestial({
      id: comet.id,
      name: comet.name,
      type: comet.type,
      realRadius_m: comet.radius,
      realMass_kg: comet.mass,
      albedo: comet.albedo,
      properties: comet.properties,
      parentId: parentId,
      orbit: comet.orbit,
    });
  });
};
