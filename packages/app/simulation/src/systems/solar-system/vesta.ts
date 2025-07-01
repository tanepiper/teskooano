import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const VESTA_MASS_KG = 2.59e20;
const VESTA_RADIUS_M = 262700;
const VESTA_TEMP_K = 164;
const VESTA_ALBEDO = 0.423;
const VESTA_SMA_AU = 2.362;
const VESTA_ECC = 0.0887;
const VESTA_INC_DEG = 7.134;
const VESTA_LAN_DEG = 103.851;
const VESTA_AOP_DEG = 150.297;
const VESTA_MA_DEG = 307.772;
const VESTA_ORBITAL_PERIOD_S = 1.325e8;
const VESTA_SIDEREAL_ROTATION_PERIOD_S = 5.342 * 3600;
const VESTA_AXIAL_TILT_DEG = 29.0;

/**
 * Initializes Vesta, the second largest asteroid in the main asteroid belt.
 * It's the brightest asteroid visible from Earth and has differentiated structure.
 */
export function initializeVesta(parentId: string): void {
  const vestaId = "vesta";
  const vestaAxialTiltRad = VESTA_AXIAL_TILT_DEG * DEG_TO_RAD;

  actions.addCelestial({
    id: vestaId,
    name: "Vesta",
    seed: "vesta",
    type: CelestialType.DWARF_PLANET,
    parentId: parentId,
    realMass_kg: VESTA_MASS_KG,
    realRadius_m: VESTA_RADIUS_M,
    temperature: VESTA_TEMP_K,
    albedo: VESTA_ALBEDO,
    siderealRotationPeriod_s: VESTA_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(vestaAxialTiltRad),
      Math.sin(vestaAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: VESTA_SMA_AU * AU,
      eccentricity: VESTA_ECC,
      inclination: VESTA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: VESTA_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: VESTA_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: VESTA_MA_DEG * DEG_TO_RAD,
      period_s: VESTA_ORBITAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.DWARF_PLANET,
      planetType: PlanetType.ROCKY,
      isMoon: false,
      composition: [
        "basaltic crust",
        "olivine mantle",
        "iron-nickel core",
        "HED meteorite source",
        "eucrite",
        "diogenite",
      ],
      shapeModel: "asteroid",
      atmosphere: {
        glowColor: "#000000",
        intensity: 0,
        power: 0,
        thickness: 0,
      },
      surface: {
        type: SurfaceType.CRATERED,
        color: "#B8A48C",
        roughness: 0.85,
        planetType: PlanetType.ROCKY,
        persistence: 0.6,
        lacunarity: 2.4,
        simplePeriod: 2.2,
        octaves: 10,
        bumpScale: 4.5,
        color1: "#8B6F47",
        color2: "#A0845C",
        color3: "#B8A48C",
        color4: "#D0C4A8",
        color5: "#E8DCC0",
        height1: 0.05,
        height2: 0.2,
        height3: 0.4,
        height4: 0.7,
        height5: 0.9,
        shininess: 6,
        specularStrength: 0.2,
        ambientLightIntensity: 0.3,
        undulation: 0.45,
        terrainType: 1,
        terrainAmplitude: 1.2,
        terrainSharpness: 2.0,
        terrainOffset: -0.15,
      },
    } as PlanetProperties,
  });
}
