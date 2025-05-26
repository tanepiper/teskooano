import type { CelestialObject } from "@teskooano/data-types";
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
  if (!capturer.physicsStateReal || !target.physicsStateReal) return false;

  const distance = calculateDistance(capturer, target);
  const capturerMass = capturer.realMass_kg ?? 0;
  const targetMass = target.realMass_kg ?? 0;
  if (capturerMass <= targetMass) return false;

  const semiMajor = capturer.orbit?.realSemiMajorAxis_m ?? distance;
  const hill = calculateHillRadius(capturerMass, semiMajor, primaryMassKg);
  if (distance > hill) return false;

  const relVel = calculateRelativeVelocity(
    capturer.physicsStateReal.velocity_mps,
    target.physicsStateReal.velocity_mps,
  );
  const escapeVel = calculateEscapeVelocity(capturerMass, distance);
  return relVel < escapeVel;
}
