import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  CometProperties,
  OrbitalParameters,
  CelestialObject,
  CometClass,
  METERS_TO_SCENE_UNITS,
  SCALE,
  CelestialStatus,
  PhysicsStateReal,
} from "@teskooano/data-types";
import { CONVERSION } from "@teskooano/core-physics";
import { OSVector3 } from "@teskooano/core-math";

// Halley's Comet (1P/Halley) constants
const HALLEY_NUCLEUS_RADIUS_M = 5.5 * CONVERSION.KM_TO_M;
const HALLEY_MASS_KG = 2.2e14;
const HALLEY_ALBEDO = 0.04;
const HALLEY_TEMP_K = 100;
const HALLEY_SMA_M = 2.653e12; // 17.737 AU
const HALLEY_ECC = 0.96658;
const HALLEY_INC_RAD = 2.8272; // 161.96 deg
const HALLEY_LAN_RAD = 1.0367; // 59.396 deg
const HALLEY_AOP_RAD = 1.9559; // 112.05 deg
const HALLEY_MA_RAD = 0.001278; // 0.07323 deg
const HALLEY_PERIOD_S = 2.357e9; // 74.7 years
const HALLEY_ACTIVITY = 0.7;
const HALLEY_COMA_RADIUS = 75000 * METERS_TO_SCENE_UNITS * 0.5;
const HALLEY_COMA_COLOR = "#ADD8E6";
const HALLEY_TAIL_LENGTH = 0.2 * SCALE.RENDER_SCALE_AU;
const HALLEY_TAIL_COLOR = "#ADD8E6";

// Hale-Bopp Comet (C/1995 O1) constants
const HALEBOPP_NUCLEUS_RADIUS_M = 30 * CONVERSION.KM_TO_M;
const HALEBOPP_MASS_KG = 2.2e15;
const HALEBOPP_ALBEDO = 0.04;
const HALEBOPP_TEMP_K = 100;
const HALEBOPP_SMA_M = 2.656e13; // 177.43 AU
const HALEBOPP_ECC = 0.99498;
const HALEBOPP_INC_RAD = 1.5583; // 89.287 deg
const HALEBOPP_LAN_RAD = 4.9341; // 282.73 deg
const HALEBOPP_AOP_RAD = 2.2757; // 130.41 deg
const HALEBOPP_MA_RAD = 0;
const HALEBOPP_PERIOD_S = 7.5725e10; // 2399 years
const HALEBOPP_ACTIVITY = 0.9;
const HALEBOPP_COMA_RADIUS = 150000 * METERS_TO_SCENE_UNITS * 0.5;
const HALEBOPP_COMA_COLOR = "#FFFFE0";
const HALEBOPP_TAIL_LENGTH = 1.0 * SCALE.RENDER_SCALE_AU;
const HALEBOPP_TAIL_COLOR = "#FFFFE0";

// Encke's Comet (2P/Encke) constants
const ENCKE_NUCLEUS_RADIUS_M = 2.4 * CONVERSION.KM_TO_M;
const ENCKE_MASS_KG = 2e13;
const ENCKE_ALBEDO = 0.047;
const ENCKE_TEMP_K = 100;
const ENCKE_SMA_M = 3.3197e11; // 2.2187 AU
const ENCKE_ECC = 0.8469;
const ENCKE_INC_RAD = 0.1978; // 11.34 deg
const ENCKE_LAN_RAD = 5.835; // 334.33 deg (not provided in current data)
const ENCKE_AOP_RAD = 3.2695; // 187.3 deg
const ENCKE_MA_RAD = 0;
const ENCKE_PERIOD_S = 1.041e8; // 3.30 years
const ENCKE_ACTIVITY = 0.4;
const ENCKE_COMA_RADIUS = 50000 * METERS_TO_SCENE_UNITS * 0.5;
const ENCKE_COMA_COLOR = "#F0F8FF";
const ENCKE_TAIL_LENGTH = 0.1 * SCALE.RENDER_SCALE_AU;
const ENCKE_TAIL_COLOR = "#F0F8FF";

const comets: Partial<CelestialObject>[] = [
  {
    id: "halley",
    name: "1P/Halley",
    type: CelestialType.COMET,
    realRadius_m: HALLEY_NUCLEUS_RADIUS_M,
    realMass_kg: HALLEY_MASS_KG,
    albedo: HALLEY_ALBEDO,
    temperature: HALLEY_TEMP_K,
    properties: {
      type: CelestialType.COMET,
      classType: CometClass.ACTIVE,
      activity: HALLEY_ACTIVITY,
      composition: ["water ice", "dust"],
      visualComaRadius: HALLEY_COMA_RADIUS,
      visualComaColor: HALLEY_COMA_COLOR,
      visualMaxTailLength: HALLEY_TAIL_LENGTH,
      visualTailColor: HALLEY_TAIL_COLOR,
    },
    orbit: {
      realSemiMajorAxis_m: HALLEY_SMA_M,
      eccentricity: HALLEY_ECC,
      inclination: HALLEY_INC_RAD,
      longitudeOfAscendingNode: HALLEY_LAN_RAD,
      argumentOfPeriapsis: HALLEY_AOP_RAD,
      meanAnomaly: HALLEY_MA_RAD,
      period_s: HALLEY_PERIOD_S,
    },
  },
  {
    id: "hale-bopp",
    name: "C/1995 O1 (Hale-Bopp)",
    type: CelestialType.COMET,
    realRadius_m: HALEBOPP_NUCLEUS_RADIUS_M,
    realMass_kg: HALEBOPP_MASS_KG,
    albedo: HALEBOPP_ALBEDO,
    temperature: HALEBOPP_TEMP_K,
    properties: {
      type: CelestialType.COMET,
      classType: CometClass.ACTIVE,
      activity: HALEBOPP_ACTIVITY,
      composition: ["water ice", "dust"],
      visualComaRadius: HALEBOPP_COMA_RADIUS,
      visualComaColor: HALEBOPP_COMA_COLOR,
      visualMaxTailLength: HALEBOPP_TAIL_LENGTH,
      visualTailColor: HALEBOPP_TAIL_COLOR,
    },
    orbit: {
      realSemiMajorAxis_m: HALEBOPP_SMA_M,
      eccentricity: HALEBOPP_ECC,
      inclination: HALEBOPP_INC_RAD,
      longitudeOfAscendingNode: HALEBOPP_LAN_RAD,
      argumentOfPeriapsis: HALEBOPP_AOP_RAD,
      meanAnomaly: HALEBOPP_MA_RAD,
      period_s: HALEBOPP_PERIOD_S,
    },
  },
  {
    id: "encke",
    name: "2P/Encke",
    type: CelestialType.COMET,
    realRadius_m: ENCKE_NUCLEUS_RADIUS_M,
    realMass_kg: ENCKE_MASS_KG,
    albedo: ENCKE_ALBEDO,
    temperature: ENCKE_TEMP_K,
    properties: {
      type: CelestialType.COMET,
      classType: CometClass.ACTIVE,
      composition: ["carbon", "dust"],
      activity: ENCKE_ACTIVITY,
      visualComaRadius: ENCKE_COMA_RADIUS,
      visualComaColor: ENCKE_COMA_COLOR,
      visualMaxTailLength: ENCKE_TAIL_LENGTH,
      visualTailColor: ENCKE_TAIL_COLOR,
    },
    orbit: {
      realSemiMajorAxis_m: ENCKE_SMA_M,
      eccentricity: ENCKE_ECC,
      inclination: ENCKE_INC_RAD,
      longitudeOfAscendingNode: ENCKE_LAN_RAD,
      argumentOfPeriapsis: ENCKE_AOP_RAD,
      meanAnomaly: ENCKE_MA_RAD,
      period_s: ENCKE_PERIOD_S,
    },
  },
];

export const initializeComets = (parentId: string) => {
  comets.forEach((comet) => {
    if (!comet.id || !comet.realMass_kg) {
      console.error("Comet missing required properties:", comet);
      return;
    }

    actions.addCelestial({
      ...comet,
      status: CelestialStatus.ACTIVE,
      parentId: parentId,
      physicsStateReal: {
        id: comet.id,
        mass_kg: comet.realMass_kg,
        position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
        velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
      },
    } as CelestialObject);
  });
};
