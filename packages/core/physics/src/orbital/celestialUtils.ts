import type { CelestialObject } from "@teskooano/data-types";
import { GRAVITATIONAL_CONSTANT, AU } from "../units/constants";

/**
 * Euclidean distance between two bodies (metres).
 */
export function calculateDistance(
  obj1: CelestialObject,
  obj2: CelestialObject,
): number {
  if (!obj1.physicsStateReal || !obj2.physicsStateReal) return Infinity;
  const p1 = obj1.physicsStateReal.position_m;
  const p2 = obj2.physicsStateReal.position_m;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
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
  const mass = influencer.realMass_kg ?? 0;
  if (mass === 0) return 0;
  const distanceAU = distance / AU; // or AU_IN_METERS (same value)
  return mass / (distanceAU * distanceAU);
}
