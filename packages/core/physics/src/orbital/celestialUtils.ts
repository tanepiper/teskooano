import {
  CelestialObject,
  CelestialPhysicsState,
} from "@teskooano/celestial-object";
import { GRAVITATIONAL_CONSTANT, AU } from "../units/constants";

/**
 * Euclidean distance between two bodies (metres).
 */
export function calculateDistance(
  obj1: CelestialObject,
  obj2: CelestialObject,
): number {
  if (!obj1.physicsState?.position_m || !obj2.physicsState?.position_m)
    return Infinity;
  const p1 = obj1.physicsState.position_m;
  const p2 = obj2.physicsState.position_m;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculates the effective radius of an object, considering its physical properties.
 * This can be used for collision detection or other proximity checks.
 * @param obj The celestial object.
 * @returns The effective radius in meters, or 0 if not applicable.
 */
export function getEffectiveRadius(obj: CelestialObject): number {
  return obj.physicalProperties?.radius ?? 0;
}

/** Scalar relative velocity (m/s). */
export function calculateRelativeVelocity(
  v1: { x: number; y: number; z: number },
  v2: { x: number; y: number; z: number },
): number {
  return Math.sqrt(
    Math.pow(v1.x - v2.x, 2) +
      Math.pow(v1.y - v2.y, 2) +
      Math.pow(v1.z - v2.z, 2),
  );
}

/** Escape velocity (m/s). */
export function calculateEscapeVelocity(
  massKg: number,
  distanceM: number,
): number {
  return Math.sqrt((2 * GRAVITATIONAL_CONSTANT * massKg) / distanceM);
}

/** Hill sphere radius (metres). */
export function calculateHillRadius(
  secondaryMassKg: number,
  semiMajorAxisM: number,
  primaryMassKg: number,
): number {
  if (primaryMassKg === 0) {
    return 0;
  }
  return (
    semiMajorAxisM * Math.pow(secondaryMassKg / (3 * primaryMassKg), 1 / 3)
  );
}

/** Influence score – comparative, not absolute. */
export function calculateGravitationalInfluence(
  influencer: CelestialObject,
  target: CelestialObject,
): number {
  const distance = calculateDistance(influencer, target);
  if (distance === Infinity || distance === 0) return 0;
  const mass = influencer.physicsState?.mass_kg ?? 0;
  if (mass === 0) return 0;
  const distanceAU = distance / AU;
  return mass / (distanceAU * distanceAU);
}
