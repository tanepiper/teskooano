import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  GasGiantClass,
  PlanetType,
  SurfaceType,
  type IceSurfaceProperties
} from "@teskooano/data-types";

// --- Neptune Constants ---
const NEPTUNE_AXIAL_TILT_DEG = 28.32;
const NEPTUNE_SIDEREAL_DAY_S = 16.11 * 3600; // ~16.11 hours

// --- Triton Constants ---
const TRITON_SMA_M = 354759 * KM;

// --- Nereid Constants ---
const NEREID_SMA_M = 5513800 * KM;

/**
 * Initializes Neptune and its major moons using accurate data.
 */
export function initializeNeptune(parentId: string): void {
    const neptuneId = 'neptune';
    const sma_au = 30.07;

    // --- Initialize Neptune ---
    actions.addCelestial({
        id: neptuneId,
        name: 'Neptune',
        seed: 'neptune_seed_164',
        type: CelestialType.GAS_GIANT,
        parentId: parentId,
        realMass_kg: 1.024e26,
        realRadius_m: 24622000,
        visualScaleRadius: 3.88,
        orbit: {
            realSemiMajorAxis_m: sma_au * AU,
            eccentricity: 0.008678,
            inclination: 1.769 * DEG_TO_RAD,
            longitudeOfAscendingNode: 131.783 * DEG_TO_RAD,
            argumentOfPeriapsis: 273.187 * DEG_TO_RAD,
            meanAnomaly: 256.328 * DEG_TO_RAD,
            period_s: 5.199e9,
        },
        temperature: 72,
        albedo: 0.41,
        properties: {
            type: CelestialType.GAS_GIANT,
            gasGiantClass: GasGiantClass.CLASS_III,
            atmosphereColor: "#3F51B5",
            cloudColor: "#FFFFFF",
            cloudSpeed: 0.03,
            stormColor: "#2F3E8E",
            stormSpeed: 0.01,
        },
        siderealRotationPeriod_s: NEPTUNE_SIDEREAL_DAY_S,
        axialTilt: new OSVector3(
            0,
            Math.cos(NEPTUNE_AXIAL_TILT_DEG * DEG_TO_RAD),
            Math.sin(NEPTUNE_AXIAL_TILT_DEG * DEG_TO_RAD)
        ).normalize(),
    });

    // --- Initialize Triton ---
    const sma_m_triton = TRITON_SMA_M;
    actions.addCelestial({
        id: 'triton',
        name: 'Triton',
        seed: 'triton_seed_5877',
        type: CelestialType.MOON,
        parentId: neptuneId,
        realMass_kg: 2.139e22,
        realRadius_m: 1353400,
        visualScaleRadius: 0.21,
        orbit: {
            realSemiMajorAxis_m: sma_m_triton,
            eccentricity: 0.000016,
            inclination: 156.885 * DEG_TO_RAD, // Retrograde
            longitudeOfAscendingNode: 0, // Simplified for near-circular/equatorial
            argumentOfPeriapsis: 0, // Simplified
            meanAnomaly: Math.random() * 2 * Math.PI,
            period_s: 5.877 * 24 * 3600 * -1, // Retrograde period
        },
        temperature: 38,
        albedo: 0.76,
        atmosphere: {
            composition: ["N2", "CH4"],
            pressure: 1.4e-5,
            color: "#F0FFF0",
        },
        surface: {
            type: SurfaceType.ICE_FLATS,
            planetType: PlanetType.ICE,
            color: '#FFFAFA', // Snow white
            secondaryColor: '#FFB6C1', // Pinkish nitrogen ice areas
            roughness: 0.4,
            // Optional procedural details
            color1: '#A0522D', color2: '#FFB6C1', color3: '#FFFAFA',
            color4: '#FFFFFF', color5: '#FFFFFF',
            transition2: 0.3, transition3: 0.5, transition4: 0.7, transition5: 0.9,
            blend12: 0.1, blend23: 0.1, blend34: 0.1, blend45: 0.1,
        } as IceSurfaceProperties,
        properties: {
            type: CelestialType.MOON,
            isMoon: true,
            parentPlanet: neptuneId,
            composition: ["nitrogen ice", "water ice", "rocky core"],
        },
        siderealRotationPeriod_s: -507744, // Tidally locked, synchronous retrograde
        axialTilt: new OSVector3(0, 1, 0), // Assume negligible tilt relative to orbit
    });

    // --- Initialize Nereid ---
    const sma_m_nereid = NEREID_SMA_M;
    actions.addCelestial({
        id: 'nereid',
        name: 'Nereid',
        seed: 'nereid_seed_360',
        type: CelestialType.MOON,
        parentId: neptuneId,
        realMass_kg: 3.1e19,
        realRadius_m: 170000, // Approx radius
        siderealRotationPeriod_s: 3.114e7, // Placeholder, likely chaotic rotation
        axialTilt: new OSVector3(0, 1, 0).normalize(), // Assume simple tilt
        visualScaleRadius: 0.03,
        orbit: {
            realSemiMajorAxis_m: sma_m_nereid,
            eccentricity: 0.7507, // Very high eccentricity
            inclination: 7.232 * DEG_TO_RAD, // Inclination relative to Neptune's orbit
            longitudeOfAscendingNode: 0, // Simplified
            argumentOfPeriapsis: 0, // Simplified
            meanAnomaly: Math.random() * 360 * DEG_TO_RAD,
            period_s: 3.114e7, // approx 360 days
        },
        temperature: 50, // K
        albedo: 0.14,
        atmosphere: { composition: [], pressure: 0, color: "#444444" },
        surface: { type: SurfaceType.CRATERED, color: "#B0B0B0", roughness: 0.7 } as IceSurfaceProperties, // Assumed icy/rocky
        properties: {
            type: CelestialType.MOON,
            planetType: PlanetType.ICE,
            isMoon: true,
            parentPlanet: neptuneId,
            composition: ["water ice", "rock"],
        },
    });
}
