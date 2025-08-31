import type { OrbitalParameters } from "@teskooano/data-types";

/**
 * Mean Motion Resonance (MMR) types and their characteristics
 */
export enum ResonanceType {
  INTERNAL = "internal", // Object orbits inside the planet's orbit
  EXTERNAL = "external", // Object orbits outside the planet's orbit
}

/**
 * Libration modes for resonant objects
 */
export enum LibrationMode {
  SYMMETRIC = "symmetric",     // Libration around 180°
  ASYMMETRIC_LEADING = "asymmetric_leading",   // Libration around 90°
  ASYMMETRIC_TRAILING = "asymmetric_trailing", // Libration around 270°
  ZERO_CENTER = "zero_center", // Novel libration around 0° (high inclination)
}

/**
 * Resonance configuration for a specific MMR
 */
export interface ResonanceConfig {
  planetId: string;
  ratio: { p: number; q: number }; // p:q resonance ratio
  type: ResonanceType;
  semiMajorAxisCenter: number; // AU
  width: number; // AU - resonance width
  librationModes: LibrationMode[];
  stabilityCriteria: {
    maxEccentricity: number;
    maxInclination: number;
    minPerihelionDistance: number;
  };
}

/**
 * Resonant angle calculation for n:1 resonances
 * φ = nλ_TNO - λ_planet - (n-1)ϖ_TNO
 */
export function calculateResonantAngle(
  tnoElements: OrbitalParameters,
  planetElements: OrbitalParameters,
  resonanceRatio: { p: number; q: number }
): number {
  const n = resonanceRatio.p / resonanceRatio.q;
  // Mean longitudes (radians)
  const lambdaTNO =
    tnoElements.meanAnomaly +
    tnoElements.argumentOfPeriapsis +
    tnoElements.longitudeOfAscendingNode;
  const lambdaPlanet =
    planetElements.meanAnomaly +
    planetElements.argumentOfPeriapsis +
    planetElements.longitudeOfAscendingNode;
  const varpiTNO =
    tnoElements.argumentOfPeriapsis + tnoElements.longitudeOfAscendingNode;

  const phiRad = n * lambdaTNO - lambdaPlanet - (n - 1) * varpiTNO;
  // Normalize to [0, 2π) then convert to degrees for mode logic
  const twoPi = Math.PI * 2;
  const phiNorm = ((phiRad % twoPi) + twoPi) % twoPi;
  return (phiNorm * 180) / Math.PI;
}

/**
 * Determine libration mode based on resonant angle evolution
 */
export function determineLibrationMode(
  resonantAngles: number[],
  tolerance: number = 10
): LibrationMode {
  const meanAngle = resonantAngles.reduce((sum, angle) => sum + angle, 0) / resonantAngles.length;
  const amplitude = Math.max(...resonantAngles) - Math.min(...resonantAngles);
  
  // Check for libration around 0° (novel mode from LiDO discovery)
  if (Math.abs(meanAngle) < tolerance && amplitude < 180) {
    return LibrationMode.ZERO_CENTER;
  }
  
  // Check for symmetric libration around 180°
  if (Math.abs(meanAngle - 180) < tolerance) {
    return LibrationMode.SYMMETRIC;
  }
  
  // Check for asymmetric libration around 90°
  if (Math.abs(meanAngle - 90) < tolerance) {
    return LibrationMode.ASYMMETRIC_LEADING;
  }
  
  // Check for asymmetric libration around 270°
  if (Math.abs(meanAngle - 270) < tolerance) {
    return LibrationMode.ASYMMETRIC_TRAILING;
  }
  
  // Default to symmetric if unclear
  return LibrationMode.SYMMETRIC;
}

/**
 * Check if an object is in resonance with a planet
 */
export function isInResonance(
  tnoElements: OrbitalParameters,
  planetElements: OrbitalParameters,
  resonanceRatio: { p: number; q: number },
  tolerance: number = 0.1
): boolean {
  const tnoPeriod = tnoElements.period_s;
  const planetPeriod = planetElements.period_s;
  const expectedRatio = resonanceRatio.p / resonanceRatio.q;
  const actualRatio = planetPeriod / tnoPeriod;
  
  return Math.abs(actualRatio - expectedRatio) < tolerance;
}

/**
 * Calculate resonance stability based on LiDO paper findings
 */
export function calculateResonanceStability(
  tnoElements: OrbitalParameters,
  planetElements: OrbitalParameters,
  resonanceRatio: { p: number; q: number }
): {
  isStable: boolean;
  stabilityScore: number;
  librationMode: LibrationMode;
  librationAmplitude: number;
} {
  const resonantAngles: number[] = [];
  
  // Simulate resonant angle evolution over multiple periods
  // This is a simplified version - full implementation would use n-body integration
  for (let i = 0; i < 100; i++) {
    const angle = calculateResonantAngle(
      tnoElements,
      planetElements,
      resonanceRatio,
    );
    resonantAngles.push(angle);
  }
  
  const librationMode = determineLibrationMode(resonantAngles);
  const librationAmplitude = Math.max(...resonantAngles) - Math.min(...resonantAngles);
  
  // Stability criteria based on LiDO paper
  const isStable = 
    tnoElements.eccentricity < 0.8 && // High eccentricity reduces stability
    // Convert inclination to degrees for threshold comparison
    (tnoElements.inclination * (180 / Math.PI)) < 45 && // Very high inclination can destabilize
    librationAmplitude < 300; // Large libration amplitude indicates instability
  
  // Stability score (0-1, higher is more stable)
  const stabilityScore = Math.max(0, 1 - (librationAmplitude / 360));
  
  return {
    isStable,
    stabilityScore,
    librationMode,
    librationAmplitude,
  };
}

/**
 * Neptune's known resonances based on current discoveries
 */
export const NEPTUNE_RESONANCES: Record<string, ResonanceConfig> = {
  "2:1": {
    planetId: "neptune",
    ratio: { p: 2, q: 1 },
    type: ResonanceType.EXTERNAL,
    semiMajorAxisCenter: 47.7,
    width: 0.5,
    librationModes: [LibrationMode.SYMMETRIC, LibrationMode.ASYMMETRIC_LEADING, LibrationMode.ASYMMETRIC_TRAILING],
    stabilityCriteria: {
      maxEccentricity: 0.3,
      maxInclination: 20,
      minPerihelionDistance: 30,
    },
  },
  "3:2": {
    planetId: "neptune",
    ratio: { p: 3, q: 2 },
    type: ResonanceType.EXTERNAL,
    semiMajorAxisCenter: 39.4,
    width: 0.3,
    librationModes: [LibrationMode.SYMMETRIC, LibrationMode.ASYMMETRIC_LEADING, LibrationMode.ASYMMETRIC_TRAILING],
    stabilityCriteria: {
      maxEccentricity: 0.25,
      maxInclination: 15,
      minPerihelionDistance: 29,
    },
  },
  "5:1": {
    planetId: "neptune",
    ratio: { p: 5, q: 1 },
    type: ResonanceType.EXTERNAL,
    semiMajorAxisCenter: 88.0,
    width: 0.8,
    librationModes: [LibrationMode.SYMMETRIC, LibrationMode.ASYMMETRIC_LEADING, LibrationMode.ASYMMETRIC_TRAILING],
    stabilityCriteria: {
      maxEccentricity: 0.7,
      maxInclination: 30,
      minPerihelionDistance: 35,
    },
  },
  "10:1": {
    planetId: "neptune",
    ratio: { p: 10, q: 1 },
    type: ResonanceType.EXTERNAL,
    semiMajorAxisCenter: 139.5,
    width: 1.0,
    librationModes: [
      LibrationMode.SYMMETRIC, 
      LibrationMode.ASYMMETRIC_LEADING, 
      LibrationMode.ASYMMETRIC_TRAILING,
      LibrationMode.ZERO_CENTER // Novel mode from LiDO discovery
    ],
    stabilityCriteria: {
      maxEccentricity: 0.8,
      maxInclination: 45,
      minPerihelionDistance: 35,
    },
  },
};