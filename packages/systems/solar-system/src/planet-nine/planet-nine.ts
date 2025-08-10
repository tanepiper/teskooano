import {
  J2000_EPOCH,
  createOrbitalElements,
  kmToM,
} from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  GasGiantClass,
  type GasGiantProperties,
} from "@teskooano/data-types";

/**
 * Planet Nine configuration object based on Batygin & Brown (2016) analysis.
 *
 * This hypothetical planet is proposed to explain the clustering of distant
 * Kuiper Belt Objects' orbital elements. Key parameters from the paper:
 * - Mass: ~10 Earth masses (Neptune-like ice giant)
 * - Semi-major axis: ~700 AU (range 400-1500 AU)
 * - Eccentricity: ~0.6 (highly eccentric orbit)
 * - Inclination: ~30° (moderately inclined)
 * - Argument of perihelion: ~150° (anti-aligned with KBOs)
 *
 * The planet's orbit explains:
 * - Clustering of distant KBO perihelia
 * - Existence of Sedna-like objects
 * - High-inclination outer solar system objects
 *
 * Reference: "Evidence for a Distant Giant Planet in the Solar System"
 * Konstantin Batygin and Michael E. Brown, Astronomical Journal 151:22 (2016)
 */
export const planetNine: CelestialObject<GasGiantProperties> = {
  id: "planet-nine",
  name: "Planet Nine",
  seed: "planet-nine",
  type: CelestialType.GAS_GIANT,
  status: CelestialStatus.ACTIVE, // Note: This is the hypothetical Planet Nine
  parentId: "sun",
  // Mass: ~10 Earth masses = ~6.0 × 10^25 kg
  realMass_kg: 6.0e25,
  // Radius: Estimated similar to Neptune but potentially smaller due to distance/cooling
  // Using ~3.5 Earth radii = ~22,300 km
  realRadius_m: kmToM(22300),
  // Temperature: Very cold due to extreme distance from Sun
  // Estimated ~40-50 K based on distance and internal heat
  temperature: 45,
  // Albedo: Assumed similar to other ice giants
  albedo: 0.3,
  orbit: createOrbitalElements({
    // Semi-major axis from paper: ~700 AU (range 400-1500 AU)
    semiMajorAxisAU: 700,
    // High eccentricity from paper: ~0.6 (range 0.4-0.8)
    eccentricity: 0.6,
    // Moderate inclination from paper: ~30°
    inclinationDeg: 30,
    // Longitude of ascending node: estimated from KBO clustering analysis
    longitudeOfAscendingNodeDeg: 113,
    // Argument of periapsis from paper: ~150° (anti-aligned with KBOs)
    argumentOfPeriapsisDeg: 150,
    // Mean anomaly: arbitrary starting position
    meanAnomalyDeg: 180,
    // Orbital period: ~10,000-20,000 years based on semi-major axis
    // Using Kepler's third law: P² ∝ a³
    // For a = 700 AU, P ≈ 18,500 years ≈ 5.8 × 10^11 seconds
    period_s: 5.8e11,
    // Rotation period: estimated similar to other ice giants (~16-17 hours)
    siderealRotationPeriod_s: 6.1e4,
    // Axial tilt: estimated moderate tilt
    axialTiltDeg: 25,
    epoch: J2000_EPOCH,
  }),
  properties: {
    type: CelestialType.GAS_GIANT,
    // Class III ice giant like Uranus and Neptune
    classType: GasGiantClass.CLASS_III,
    // Dark, cold ice giant appearance
    atmosphereColor: "#1e3a5f",
    cloudColor: "#2d4a6b",
    cloudSpeed: 50, // Slower due to distance and cold
    stormSpeed: 30,
    emissiveColor: "#1e3a5f20",
    emissiveIntensity: 0.02, // Very low due to distance from Sun
    // No ring system defined in the paper, but could potentially have one
    // Leaving rings undefined for now until observational evidence
  },
};
