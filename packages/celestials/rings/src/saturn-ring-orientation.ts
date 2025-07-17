import { OSVector3, OSQuaternion } from "@teskooano/core-math";
import type { RenderableCelestialObject } from "@teskooano/data-types";

/**
 * Saturn's orbital and rotational parameters
 */
const SATURN_ORBITAL_PERIOD_YEARS = 29.4571; // Julian years
const SATURN_AXIAL_TILT_DEG = 26.73; // degrees
const SATURN_ORBITAL_ECCENTRICITY = 0.0565;

/**
 * Astronomical constants
 */
const JULIAN_YEAR_SECONDS = 365.25 * 24 * 3600; // seconds
const DEG_TO_RAD = Math.PI / 180;

/**
 * Time intervals between Saturn's equinoxes (ring edge-on viewing periods)
 * Based on orbital eccentricity - periods are not equal
 */
const EQUINOX_PERIOD_1_YEARS = 13.7; // shorter interval
const EQUINOX_PERIOD_2_YEARS = 15.7; // longer interval

/**
 * Calculates Saturn's ring orientation based on its orbital position
 * and the astronomical mechanics described in the user requirements.
 * 
 * Saturn's rings appear edge-on twice per Saturnian year (29.4571 years)
 * at the Saturnian equinoxes when Saturn's rotational axis is perpendicular
 * to the barycenter-Saturn line. Due to orbital eccentricity, these periods
 * are unequal: 13.7 years and 15.7 years.
 * 
 * @param saturnObject - The Saturn object with orbital parameters
 * @param currentTime - Current simulation time in seconds
 * @param sunPosition - Position of the Sun (barycenter approximation)
 * @returns Quaternion representing the ring system orientation
 */
export function calculateSaturnRingOrientation(
  saturnObject: RenderableCelestialObject,
  currentTime: number,
  sunPosition: OSVector3
): OSQuaternion {
  // Calculate Saturn's orbital position relative to the Sun
  const saturnToSun = new OSVector3()
    .copy(sunPosition)
    .subtract(saturnObject.position);
  
  // Normalize to get the direction vector from Saturn to Sun
  const sunDirection = saturnToSun.normalize();
  
  // Calculate the time in Saturn's orbital cycle
  const saturnOrbitalPeriodSeconds = SATURN_ORBITAL_PERIOD_YEARS * JULIAN_YEAR_SECONDS;
  const cycleTime = (currentTime % saturnOrbitalPeriodSeconds) / saturnOrbitalPeriodSeconds;
  
  // Determine which part of the unequal equinox cycle we're in
  const totalCycleYears = EQUINOX_PERIOD_1_YEARS + EQUINOX_PERIOD_2_YEARS;
  const normalizedCycleTime = cycleTime * totalCycleYears;
  
  let phaseInCycle: number;
  if (normalizedCycleTime < EQUINOX_PERIOD_1_YEARS) {
    // In first period (13.7 years)
    phaseInCycle = normalizedCycleTime / EQUINOX_PERIOD_1_YEARS;
  } else {
    // In second period (15.7 years)
    phaseInCycle = (normalizedCycleTime - EQUINOX_PERIOD_1_YEARS) / EQUINOX_PERIOD_2_YEARS;
  }
  
  // Calculate the angle of Saturn's rotational axis relative to the orbital plane
  // At equinoxes (phaseInCycle = 0 or 0.5), rings appear edge-on
  // At solstices (phaseInCycle = 0.25 or 0.75), rings appear most tilted
  const equinoxPhase = phaseInCycle * 2 * Math.PI;
  
  // Saturn's axial tilt angle as seen from the Sun's perspective
  // This varies from -26.73° to +26.73° over the orbital cycle
  const apparentAxialTilt = Math.sin(equinoxPhase) * SATURN_AXIAL_TILT_DEG * DEG_TO_RAD;
  
  // Create Saturn's intrinsic axial tilt vector
  // Saturn's rotation axis is tilted 26.73° from the normal to its orbital plane
  const intrinsicTiltAxis = new OSVector3(
    Math.sin(SATURN_AXIAL_TILT_DEG * DEG_TO_RAD),
    Math.cos(SATURN_AXIAL_TILT_DEG * DEG_TO_RAD),
    0
  ).normalize();
  
  // Calculate the orbital plane normal (perpendicular to Saturn-Sun line)
  // We need to account for Saturn's orbital inclination
  const orbitalNormal = new OSVector3(0, 1, 0); // Simplified: assume ecliptic plane
  
  // Create a vector perpendicular to both the Sun direction and orbital normal
  const sideVector = new OSVector3().crossVectors(sunDirection, orbitalNormal).normalize();
  
  // Calculate the actual tilt vector accounting for orbital position
  const currentTiltVector = new OSVector3()
    .copy(orbitalNormal)
    .multiplyScalar(Math.cos(apparentAxialTilt))
    .add(sideVector.clone().multiplyScalar(Math.sin(apparentAxialTilt)))
    .normalize();
  
  // Create quaternion to rotate from the default ring orientation (XY plane)
  // to the current ring orientation based on Saturn's axial tilt and orbital position
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
 * Determines if Saturn's rings are currently in an edge-on viewing period.
 * This occurs approximately once every 13.7-15.7 years, twice per Saturnian orbit.
 * 
 * @param currentTime - Current simulation time in seconds
 * @returns Object containing edge-on status and viewing angle in degrees
 */
export function getSaturnRingViewingInfo(currentTime: number): {
  isNearEdgeOn: boolean;
  viewingAngle: number; // degrees from edge-on (0° = edge-on, 90° = face-on)
  timeSinceLastEdgeOn: number; // years
  timeToNextEdgeOn: number; // years
} {
  const saturnOrbitalPeriodSeconds = SATURN_ORBITAL_PERIOD_YEARS * JULIAN_YEAR_SECONDS;
  const cycleTime = (currentTime % saturnOrbitalPeriodSeconds) / saturnOrbitalPeriodSeconds;
  
  const totalCycleYears = EQUINOX_PERIOD_1_YEARS + EQUINOX_PERIOD_2_YEARS;
  const normalizedCycleTime = cycleTime * totalCycleYears;
  
  // Calculate the viewing angle (0° = edge-on, maximum tilt ≈ 26.73°)
  let phaseInCycle: number;
  if (normalizedCycleTime < EQUINOX_PERIOD_1_YEARS) {
    phaseInCycle = normalizedCycleTime / EQUINOX_PERIOD_1_YEARS;
  } else {
    phaseInCycle = (normalizedCycleTime - EQUINOX_PERIOD_1_YEARS) / EQUINOX_PERIOD_2_YEARS;
  }
  
  const equinoxPhase = phaseInCycle * 2 * Math.PI;
  const viewingAngle = Math.abs(Math.sin(equinoxPhase) * SATURN_AXIAL_TILT_DEG);
  
  // Consider "near edge-on" if within 5 degrees of edge-on
  const isNearEdgeOn = viewingAngle < 5.0;
  
  // Calculate time since last edge-on and time to next edge-on
  let timeSinceLastEdgeOn: number;
  let timeToNextEdgeOn: number;
  
  if (normalizedCycleTime < EQUINOX_PERIOD_1_YEARS / 2) {
    // First half of first period
    timeSinceLastEdgeOn = normalizedCycleTime + EQUINOX_PERIOD_2_YEARS / 2;
    timeToNextEdgeOn = EQUINOX_PERIOD_1_YEARS / 2 - normalizedCycleTime;
  } else if (normalizedCycleTime < EQUINOX_PERIOD_1_YEARS) {
    // Second half of first period
    timeSinceLastEdgeOn = normalizedCycleTime - EQUINOX_PERIOD_1_YEARS / 2;
    timeToNextEdgeOn = EQUINOX_PERIOD_1_YEARS - normalizedCycleTime + EQUINOX_PERIOD_2_YEARS / 2;
  } else if (normalizedCycleTime < EQUINOX_PERIOD_1_YEARS + EQUINOX_PERIOD_2_YEARS / 2) {
    // First half of second period
    timeSinceLastEdgeOn = normalizedCycleTime - EQUINOX_PERIOD_1_YEARS;
    timeToNextEdgeOn = EQUINOX_PERIOD_1_YEARS + EQUINOX_PERIOD_2_YEARS / 2 - normalizedCycleTime;
  } else {
    // Second half of second period
    timeSinceLastEdgeOn = normalizedCycleTime - EQUINOX_PERIOD_1_YEARS - EQUINOX_PERIOD_2_YEARS / 2;
    timeToNextEdgeOn = EQUINOX_PERIOD_1_YEARS + EQUINOX_PERIOD_2_YEARS - normalizedCycleTime + EQUINOX_PERIOD_1_YEARS / 2;
  }
  
  return {
    isNearEdgeOn,
    viewingAngle,
    timeSinceLastEdgeOn,
    timeToNextEdgeOn
  };
}

/**
 * Gets a descriptive string for the current ring viewing phase
 * 
 * @param currentTime - Current simulation time in seconds
 * @returns Human-readable description of the current viewing phase
 */
export function getSaturnRingPhaseDescription(currentTime: number): string {
  const info = getSaturnRingViewingInfo(currentTime);
  
  if (info.isNearEdgeOn) {
    return `Edge-on viewing period (${info.viewingAngle.toFixed(1)}° from edge)`;
  } else if (info.viewingAngle > 20) {
    return `Near maximum tilt (${info.viewingAngle.toFixed(1)}° from edge)`;
  } else {
    return `Moderate tilt (${info.viewingAngle.toFixed(1)}° from edge)`;
  }
}