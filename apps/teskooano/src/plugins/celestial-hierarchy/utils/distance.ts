import { Vector3 } from "three";
import { CelestialType, CelestialObject } from "@teskooano/data-types";
import { AU_METERS, METERS_TO_SCENE_UNITS } from "@teskooano/data-values";
/**
 * Calculates the distance from a point to the surface of a celestial object.
 * For solid bodies (planets, moons, etc.), this subtracts the object's radius.
 * For stars and other gaseous bodies, this returns the distance to the center.
 * @param fromPosition The position to measure from (in scene units)
 * @param toPosition The position of the celestial object's center (in scene units)
 * @param objectRadius The radius of the celestial object in meters
 * @param objectType The type of celestial object
 * @returns The distance to the surface (or center for stars) in scene units
 */
export function calculateSurfaceDistance(
  fromPosition: Vector3,
  toPosition: Vector3,
  objectRadius: number,
  objectType: CelestialType,
): number {
  const centerDistance = fromPosition.distanceTo(toPosition);

  // For all solid bodies, subtract the radius to get surface distance
  // This includes planets, moons, satellites, comets, etc.
  const solidBodyTypes = [
    CelestialType.PLANET,
    CelestialType.DWARF_PLANET,
    CelestialType.MOON,
    CelestialType.SATELLITE,
    CelestialType.COMET,
    CelestialType.ASTEROID_FIELD,
    CelestialType.OORT_CLOUD,
  ];

  if (solidBodyTypes.includes(objectType) && objectRadius > 0) {
    // Convert radius from meters to scene units
    const radiusInSceneUnits = objectRadius * METERS_TO_SCENE_UNITS;
    return Math.max(0, centerDistance - radiusInSceneUnits);
  }

  // For stars and gas giants (no solid surface), use center distance
  return centerDistance;
}

/**
 * Calculates the distance for particle systems (asteroid fields, oort clouds)
 * that don't have meaningful world positions.
 */
export function calculateParticleSystemDistance(
  celestialObj: CelestialObject,
): number {
  if (celestialObj.orbit?.realSemiMajorAxis_m) {
    return celestialObj.orbit.realSemiMajorAxis_m;
  }

  const props = celestialObj.properties as any;
  if (
    props &&
    props.innerRadiusAU !== undefined &&
    props.outerRadiusAU !== undefined
  ) {
    const avgRadiusAU = (props.innerRadiusAU + props.outerRadiusAU) / 2;
    return avgRadiusAU * AU_METERS;
  }

  return 0;
}

/**
 * Calculates the distance for objects with scene positions, considering parent relationships.
 */
export function calculateSceneObjectDistance(
  celestialObj: CelestialObject,
  allObjects: Record<string, CelestialObject>,
  sceneObject: any,
  renderer: any,
  origin: Vector3,
  worldPosition: Vector3,
  parentWorldPosition: Vector3,
  SCENE_UNITS_TO_METERS: number,
): number {
  sceneObject.getWorldPosition(worldPosition);
  const parentId = celestialObj.parentId;

  if (parentId && allObjects[parentId]) {
    const parentSceneObject =
      renderer.renderingOrchestrator.objectManager.getObject(parentId);
    if (parentSceneObject) {
      parentSceneObject.getWorldPosition(parentWorldPosition);
      const parentObj = allObjects[parentId];
      const radiusToUse =
        celestialObj.type === CelestialType.SATELLITE
          ? parentObj.realRadius_m || 0
          : celestialObj.realRadius_m || 0;
      return (
        calculateSurfaceDistance(
          worldPosition,
          parentWorldPosition,
          radiusToUse,
          celestialObj.type,
        ) * SCENE_UNITS_TO_METERS
      );
    }
    // Parent not found in scene, use distance from origin
    return (
      calculateSurfaceDistance(
        worldPosition,
        origin,
        celestialObj.realRadius_m || 0,
        celestialObj.type,
      ) * SCENE_UNITS_TO_METERS
    );
  }

  // No parent, use distance from origin
  return (
    calculateSurfaceDistance(
      worldPosition,
      origin,
      celestialObj.realRadius_m || 0,
      celestialObj.type,
    ) * SCENE_UNITS_TO_METERS
  );
}

/**
 * Computes the total distance in meters for any celestial object.
 * This is the main entry point that delegates to specific calculation methods.
 */
export function computeDistanceMeters(
  celestialObj: CelestialObject,
  allObjects: Record<string, CelestialObject>,
  sceneObject: any,
  renderer: any,
  origin: Vector3,
  worldPosition: Vector3,
  parentWorldPosition: Vector3,
  SCENE_UNITS_TO_METERS: number,
): number {
  // Particle systems: use orbital/average radius logic
  if (
    celestialObj.type === CelestialType.ASTEROID_FIELD ||
    celestialObj.type === CelestialType.OORT_CLOUD
  ) {
    return calculateParticleSystemDistance(celestialObj);
  }

  // Objects with scene positions
  if (sceneObject) {
    return calculateSceneObjectDistance(
      celestialObj,
      allObjects,
      sceneObject,
      renderer,
      origin,
      worldPosition,
      parentWorldPosition,
      SCENE_UNITS_TO_METERS,
    );
  }

  // Fallback to orbital parameters
  if (celestialObj.orbit?.realSemiMajorAxis_m) {
    return celestialObj.orbit.realSemiMajorAxis_m;
  }

  return 0;
}
