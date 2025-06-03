import type { CelestialObject } from "@teskooano/celestial-object";
import {
  calculateDistance,
  calculateHillRadius,
  calculateRelativeVelocity,
  calculateEscapeVelocity,
} from "./celestialUtils";

/**
 * Determine if `capturer` can gravitationally bind `target`.
 */
export function canCapture(
  capturer: CelestialObject,
  target: CelestialObject,
  primaryMassKg: number,
): boolean {
  if (!capturer.physicsState || !target.physicsState) return false;

  const distance = calculateDistance(capturer, target);
  const capturerMass = capturer.physicsState.mass_kg ?? 0;
  const targetMass = target.physicsState.mass_kg ?? 0;
  if (capturerMass <= targetMass) return false;

  const semiMajor = capturer.orbit?.semiMajorAxis_m ?? distance;
  const hill = calculateHillRadius(capturerMass, semiMajor, primaryMassKg);
  if (distance > hill) return false;

  const relVel = calculateRelativeVelocity(
    capturer.physicsState.velocity_mps,
    target.physicsState.velocity_mps,
  );
  const escapeVel = calculateEscapeVelocity(capturerMass, distance);
  return relVel < escapeVel;
}
