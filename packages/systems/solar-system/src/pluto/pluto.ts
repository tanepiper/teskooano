import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  CelestialStatus,
  PhysicsStateReal,
  type PlanetProperties,
} from "@teskooano/data-types";

const PLUTO_MASS_KG = 1.303e22; // Verified correct
const PLUTO_RADIUS_M = 1188300; // Verified correct
const PLUTO_TEMP_K = 44; // Verified correct
const PLUTO_ALBEDO = 0.58; // Verified correct
const PLUTO_SMA_AU = 39.482; // Verified correct
const PLUTO_ECC = 0.2488; // Verified correct
const PLUTO_INC_DEG = 17.16; // Verified correct
const PLUTO_LAN_DEG = 110.3; // Verified correct
const PLUTO_AOP_DEG = 113.834; // Corrected argument of periapsis
const PLUTO_MA_DEG = 19.045; // Corrected mean anomaly
const PLUTO_ORBITAL_PERIOD_S = 7.824e9; // Verified correct
const PLUTO_SIDEREAL_ROTATION_PERIOD_S = -551855.0; // Verified correct (retrograde)
const PLUTO_AXIAL_TILT_DEG = 119.59; // Verified correct

/**
 * Initializes Pluto using accurate data.
 * @returns The ID of the Pluto object.
 */
export function initializePlutoDwarfPlanet(parentId: string): string {
  const plutoId = "pluto";
  const plutoAxialTiltRad = PLUTO_AXIAL_TILT_DEG * DEG_TO_RAD;

  actions.addCelestial({
    id: plutoId,
    name: "Pluto",
    seed: "pluto",
    type: CelestialType.DWARF_PLANET,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: PLUTO_MASS_KG,
    realRadius_m: PLUTO_RADIUS_M,
    temperature: PLUTO_TEMP_K,
    albedo: PLUTO_ALBEDO,
    siderealRotationPeriod_s: PLUTO_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(plutoAxialTiltRad),
      Math.sin(plutoAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: PLUTO_SMA_AU * AU,
      eccentricity: PLUTO_ECC,
      inclination: PLUTO_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: PLUTO_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: PLUTO_AOP_DEG * DEG_TO_RAD, // Corrected calculation
      meanAnomaly: PLUTO_MA_DEG * DEG_TO_RAD,
      period_s: PLUTO_ORBITAL_PERIOD_S,
    },
    physicsStateReal: {
      id: plutoId,
      mass_kg: PLUTO_MASS_KG,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },
    properties: {
      type: CelestialType.DWARF_PLANET,
      classType: PlanetType.BARREN,
      isMoon: false,
      composition: [
        "nitrogen ice",
        "water ice crust",
        "methane ice",
        "carbon monoxide ice",
        "rocky core",
        "tholins",
      ],
      atmosphere: {
        glowColor: "#E0FFFF",
        intensity: 0.1,
        power: 1.2,
        thickness: 0.05,
      },
      surface: {
        type: SurfaceType.ICE_FLATS,
        color: "#F5E8D1",
        roughness: 0.4,
        classType: PlanetType.BARREN,
        persistence: 0.53,
        lacunarity: 2.15,
        simplePeriod: 0.86,
        octaves: 8,
        bumpScale: 10,
        color1: "#F5E8D1",
        color2: "#DEB887",
        color3: "#A0522D",
        color4: "#F0F8FF",
        color5: "#FFFAFA",
        height1: 0.088,
        height2: 0.41,
        height3: 0.4,
        height4: 0.43,
        height5: 0.43,
        shininess: 23,
        specularStrength: 0.47,
        ambientLightIntensity: 0.0,
        undulation: 0.1,
        terrainType: 3,
        terrainAmplitude: 0.2,
        terrainSharpness: 1.3,
        terrainOffset: 0.25,
      },
    } as PlanetProperties,
  });
  return plutoId;
}
