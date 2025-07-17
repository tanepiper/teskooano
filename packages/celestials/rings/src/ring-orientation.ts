import { OSVector3, OSQuaternion } from "@teskooano/core-math";
import type { RenderableCelestialObject } from "@teskooano/data-types";

/**
 * Astronomical constants
 */
const JULIAN_YEAR_SECONDS = 365.25 * 24 * 3600; // seconds
const DEG_TO_RAD = Math.PI / 180;

/**
 * Calculates a planet's ring orientation based on its orbital position and axial tilt.
 * 
 * For planets with significant axial tilt, rings will appear edge-on twice per orbital
 * period when the planet's rotational axis is perpendicular to the planet-star line.
 * The viewing angle varies sinusoidally over the orbital period.
 * 
 * @param planetObject - The planet object with orbital parameters and axial tilt
 * @param currentTime - Current simulation time in seconds
 * @param starPosition - Position of the primary star
 * @param orbitalPeriod - Planet's orbital period in seconds (optional, calculated if not provided)
 * @returns Quaternion representing the ring system orientation
 */
export function calculatePlanetRingOrientation(
  planetObject: RenderableCelestialObject,
  currentTime: number,
  starPosition: OSVector3,
  orbitalPeriod?: number
): OSQuaternion {
  // Calculate planet's orbital position relative to the star
  const planetToStar = new OSVector3()
    .copy(starPosition)
    .subtract(planetObject.position);
  
  // Normalize to get the direction vector from planet to star
  const starDirection = planetToStar.normalize();
  
  // Get orbital period - use provided value or try to extract from object
  let periodSeconds = orbitalPeriod;
  if (!periodSeconds) {
    // Try to get period from the object's orbit data
    const orbitData = (planetObject as any).orbit;
    if (orbitData?.period_s) {
      periodSeconds = orbitData.period_s;
    } else {
      console.warn(`[RingOrientation] No orbital period available for ${planetObject.celestialObjectId}, using default orientation`);
      return new OSQuaternion(0, 0, 0, 1); // Identity quaternion
    }
  }
  
  // Calculate the time in the planet's orbital cycle
  const cycleTime = (currentTime % periodSeconds) / periodSeconds;
  
  // Get axial tilt information
  let axialTiltRad = 0;
  const orbitData = (planetObject as any).orbit;
  
  if (orbitData?.axialTilt) {
    if (orbitData.axialTilt instanceof OSVector3) {
      // If axial tilt is a vector, calculate the angle from the default Y-axis
      const defaultUp = new OSVector3(0, 1, 0);
      const tiltVector = orbitData.axialTilt.clone().normalize();
      axialTiltRad = Math.acos(Math.max(-1, Math.min(1, defaultUp.dot(tiltVector))));
    } else if (typeof orbitData.axialTilt === 'number') {
      axialTiltRad = orbitData.axialTilt * DEG_TO_RAD;
    }
  }
  
  // If there's no significant axial tilt, return default orientation
  if (Math.abs(axialTiltRad) < 0.01) { // Less than ~0.6 degrees
    return new OSQuaternion(0, 0, 0, 1);
  }
  
  // Handle orbital eccentricity for more accurate timing
  let eccentricity = 0;
  if (orbitData?.eccentricity) {
    eccentricity = orbitData.eccentricity;
  }
  
  // For highly eccentric orbits, adjust the timing to account for unequal periods
  let adjustedCycleTime = cycleTime;
  if (eccentricity > 0.1) { // Only for significantly eccentric orbits
    // Simple approximation: vary the cycle timing based on eccentricity
    // This creates unequal periods between equinoxes, similar to Saturn
    const eccentricityFactor = 1 + eccentricity * Math.sin(cycleTime * 2 * Math.PI);
    adjustedCycleTime = cycleTime * eccentricityFactor;
    adjustedCycleTime = adjustedCycleTime % 1; // Keep in [0, 1] range
  }
  
  // Calculate the viewing angle based on orbital position
  // At equinoxes (cycle time 0, 0.5), rings appear edge-on
  // At solstices (cycle time 0.25, 0.75), rings appear most tilted
  const equinoxPhase = adjustedCycleTime * 2 * Math.PI;
  
  // Planet's apparent axial tilt as seen from the star's perspective
  const apparentAxialTilt = Math.sin(equinoxPhase) * axialTiltRad;
  
  // Calculate the orbital plane normal (simplified: assume ecliptic plane)
  const orbitalNormal = new OSVector3(0, 1, 0);
  
  // Create a vector perpendicular to both the star direction and orbital normal
  const sideVector = new OSVector3().crossVectors(starDirection, orbitalNormal).normalize();
  
  // Calculate the actual tilt vector accounting for orbital position
  const currentTiltVector = new OSVector3()
    .copy(orbitalNormal)
    .multiplyScalar(Math.cos(apparentAxialTilt))
    .add(sideVector.clone().multiplyScalar(Math.sin(apparentAxialTilt)))
    .normalize();
  
  // Create quaternion to rotate from the default ring orientation (XY plane)
  // to the current ring orientation based on the planet's axial tilt and orbital position
  const ringOrientation = new OSQuaternion();
  
  // Default ring normal is Z-axis (0, 0, 1)
  const defaultRingNormal = new OSVector3(0, 0, 1);
  
  // Calculate rotation from default orientation to current orientation
  const rotationAxis = new OSVector3().crossVectors(defaultRingNormal, currentTiltVector);
  
  if (rotationAxis.length() > 0.001) {
    // Normal case: calculate rotation angle and axis
    rotationAxis.normalize();
    const rotationAngle = Math.acos(Math.max(-1, Math.min(1, defaultRingNormal.dot(currentTiltVector))));
    ringOrientation.setFromAxisAngle(rotationAxis, rotationAngle);
  } else {
    // Edge case: vectors are parallel or anti-parallel
    if (defaultRingNormal.dot(currentTiltVector) < 0) {
      // Anti-parallel: 180-degree rotation around any perpendicular axis
      ringOrientation.setFromAxisAngle(new OSVector3(1, 0, 0), Math.PI);
    } else {
      // Parallel: no rotation needed
      ringOrientation.set(0, 0, 0, 1);
    }
  }
  
  return ringOrientation;
}

/**
 * Determines if a planet's rings are currently in an edge-on viewing period.
 * 
 * @param planetObject - The planet object with ring system
 * @param currentTime - Current simulation time in seconds
 * @param orbitalPeriod - Planet's orbital period in seconds (optional)
 * @returns Object containing edge-on status and viewing angle information
 */
export function getPlanetRingViewingInfo(
  planetObject: RenderableCelestialObject,
  currentTime: number,
  orbitalPeriod?: number
): {
  isNearEdgeOn: boolean;
  viewingAngle: number; // degrees from edge-on (0° = edge-on, 90° = face-on)
  axialTiltDeg: number; // planet's axial tilt in degrees
  orbitalPhase: number; // 0-1, where 0 and 0.5 are equinoxes
  hasSignificantTilt: boolean;
} {
  // Get orbital period
  let periodSeconds = orbitalPeriod;
  if (!periodSeconds) {
    const orbitData = (planetObject as any).orbit;
    if (orbitData?.period_s) {
      periodSeconds = orbitData.period_s;
    } else {
      return {
        isNearEdgeOn: false,
        viewingAngle: 0,
        axialTiltDeg: 0,
        orbitalPhase: 0,
        hasSignificantTilt: false
      };
    }
  }
  
  const cycleTime = (currentTime % periodSeconds) / periodSeconds;
  
  // Get axial tilt information
  let axialTiltRad = 0;
  const orbitData = (planetObject as any).orbit;
  
  if (orbitData?.axialTilt) {
    if (orbitData.axialTilt instanceof OSVector3) {
      const defaultUp = new OSVector3(0, 1, 0);
      const tiltVector = orbitData.axialTilt.clone().normalize();
      axialTiltRad = Math.acos(Math.max(-1, Math.min(1, defaultUp.dot(tiltVector))));
    } else if (typeof orbitData.axialTilt === 'number') {
      axialTiltRad = orbitData.axialTilt * DEG_TO_RAD;
    }
  }
  
  const axialTiltDeg = axialTiltRad / DEG_TO_RAD;
  const hasSignificantTilt = Math.abs(axialTiltRad) > 0.01; // > ~0.6 degrees
  
  if (!hasSignificantTilt) {
    return {
      isNearEdgeOn: false,
      viewingAngle: 0,
      axialTiltDeg,
      orbitalPhase: cycleTime,
      hasSignificantTilt: false
    };
  }
  
  // Handle orbital eccentricity
  let adjustedCycleTime = cycleTime;
  if (orbitData?.eccentricity && orbitData.eccentricity > 0.1) {
    const eccentricityFactor = 1 + orbitData.eccentricity * Math.sin(cycleTime * 2 * Math.PI);
    adjustedCycleTime = (cycleTime * eccentricityFactor) % 1;
  }
  
  const equinoxPhase = adjustedCycleTime * 2 * Math.PI;
  const viewingAngle = Math.abs(Math.sin(equinoxPhase) * axialTiltDeg);
  
  // Consider "near edge-on" if within 5 degrees of edge-on
  const isNearEdgeOn = viewingAngle < 5.0;
  
  return {
    isNearEdgeOn,
    viewingAngle,
    axialTiltDeg,
    orbitalPhase: adjustedCycleTime,
    hasSignificantTilt: true
  };
}

/**
 * Gets a descriptive string for the current ring viewing phase
 * 
 * @param planetObject - The planet object with ring system
 * @param currentTime - Current simulation time in seconds
 * @param orbitalPeriod - Planet's orbital period in seconds (optional)
 * @returns Human-readable description of the current viewing phase
 */
export function getPlanetRingPhaseDescription(
  planetObject: RenderableCelestialObject,
  currentTime: number,
  orbitalPeriod?: number
): string {
  const info = getPlanetRingViewingInfo(planetObject, currentTime, orbitalPeriod);
  
  if (!info.hasSignificantTilt) {
    return `No significant axial tilt (${info.axialTiltDeg.toFixed(1)}°)`;
  }
  
  if (info.isNearEdgeOn) {
    return `Edge-on viewing period (${info.viewingAngle.toFixed(1)}° from edge)`;
  } else if (info.viewingAngle > info.axialTiltDeg * 0.8) {
    return `Near maximum tilt (${info.viewingAngle.toFixed(1)}° from edge)`;
  } else {
    return `Moderate tilt (${info.viewingAngle.toFixed(1)}° from edge)`;
  }
}

/**
 * Checks if a celestial object has a ring system that would benefit from dynamic orientation
 * 
 * @param celestialObject - The celestial object to check
 * @returns True if the object has rings and significant axial tilt
 */
export function shouldUseDynamicRingOrientation(celestialObject: RenderableCelestialObject): boolean {
  // Check if object has ring properties
  const properties = celestialObject.properties as any;
  if (!properties?.rings || !Array.isArray(properties.rings) || properties.rings.length === 0) {
    return false;
  }
  
  // Check if object has significant axial tilt
  const orbitData = (celestialObject as any).orbit;
  if (!orbitData?.axialTilt) {
    return false;
  }
  
  let axialTiltRad = 0;
  if (orbitData.axialTilt instanceof OSVector3) {
    const defaultUp = new OSVector3(0, 1, 0);
    const tiltVector = orbitData.axialTilt.clone().normalize();
    axialTiltRad = Math.abs(Math.acos(Math.max(-1, Math.min(1, defaultUp.dot(tiltVector)))));
  } else if (typeof orbitData.axialTilt === 'number') {
    axialTiltRad = Math.abs(orbitData.axialTilt * DEG_TO_RAD);
  }
  
  // Only use dynamic orientation for objects with significant tilt (> ~3 degrees)
  return axialTiltRad > 0.05;
}

/**
 * Gets orbital period from a celestial object
 * 
 * @param celestialObject - The celestial object
 * @returns Orbital period in seconds, or undefined if not available
 */
export function getOrbitalPeriod(celestialObject: RenderableCelestialObject): number | undefined {
  const orbitData = (celestialObject as any).orbit;
  return orbitData?.period_s;
}