import {
  CelestialObject,
  CelestialType,
  scaleSize,
} from "@teskooano/data-types";
import * as THREE from "three";

import {
  CAMERA_DISTANCE_SURFACE_PERCENTAGE,
  CAMERA_DISTANCES,
  DEFAULT_CAMERA_DISTANCE,
  DEFAULT_SIZE_SCALING,
  MINIMUM_CAMERA_DISTANCE,
  SIZE_BASED_SCALING,
} from "./FocusControl.constants";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";

/**
 * Calculate camera distance based on object mesh bounds or fallback to real radius.
 * Uses both scaling factor and percentage from surface based on type
 * With improved handling for large objects like stars.
 *
 * @param object - The celestial object to calculate distance for.
 * @param renderer - The ThreeJS renderer instance to access mesh data.
 * @returns The calculated camera distance.
 */
export function calculateCameraDistance(
  object: CelestialObject,
  renderer: ModularSpaceRenderer | null | undefined,
): number {
  const mesh = renderer?.getObjectById(object.id);

  if (mesh) {
    if (
      mesh.userData?.effectiveRadius &&
      typeof mesh.userData.effectiveRadius === "number" &&
      mesh.userData.effectiveRadius > 0
    ) {
      const effectiveRadius = mesh.userData.effectiveRadius;
      console.debug(
        `[FocusControl.camera] Using pre-calculated radius from userData for ${object.name}: ${effectiveRadius.toFixed(2)}`,
      );

      let distance = effectiveRadius * (1 + CAMERA_DISTANCE_SURFACE_PERCENTAGE);

      const scaleFactor =
        SIZE_BASED_SCALING[object.type] ?? DEFAULT_SIZE_SCALING;
      const minTypeDistance =
        CAMERA_DISTANCES[object.type] ?? DEFAULT_CAMERA_DISTANCE;

      distance *= scaleFactor;
      distance = Math.max(distance, minTypeDistance);
      distance = Math.max(distance, MINIMUM_CAMERA_DISTANCE);

      console.debug(
        `[FocusControl.camera] Final distance using userData radius for ${object.name}: ${distance.toFixed(2)}`,
      );
      return distance;
    } else {
      console.warn(
        `[FocusControl.camera] No valid pre-calculated effectiveRadius in userData for ${object.name}. Attempting dynamic calculation.`,
      );
    }

    try {
      const box = new THREE.Box3().setFromObject(mesh);
      const size = new THREE.Vector3();
      box.getSize(size);

      const effectiveRadius = Math.max(size.x, size.y, size.z) / 2;

      if (!isNaN(effectiveRadius) && effectiveRadius > 0) {
        let distance =
          effectiveRadius * (1 + CAMERA_DISTANCE_SURFACE_PERCENTAGE);

        const scaleFactor =
          SIZE_BASED_SCALING[object.type] ?? DEFAULT_SIZE_SCALING;
        const minTypeDistance =
          CAMERA_DISTANCES[object.type] ?? DEFAULT_CAMERA_DISTANCE;

        distance *= scaleFactor;
        distance = Math.max(distance, minTypeDistance);
        console.debug(
          `[FocusControl.camera] Applied type scaling (${scaleFactor.toFixed(1)}x) and min distance (${minTypeDistance}). New Distance: ${distance.toFixed(2)}`,
        );

        distance = Math.max(distance, MINIMUM_CAMERA_DISTANCE);

        console.debug(
          `[FocusControl.camera] Using mesh bounds for ${object.name}. Effective Radius: ${effectiveRadius.toFixed(2)}, Distance: ${distance.toFixed(2)}`,
        );
        return distance;
      } else {
        console.warn(
          `[FocusControl.camera] Mesh bounds calculation resulted in invalid radius for ${object.name}. Falling back.`,
        );
      }
    } catch (error) {
      console.error(
        `[FocusControl.camera] Error calculating mesh bounds for ${object.name}:`,
        error,
        ". Falling back.",
      );
    }
  }

  console.debug(
    `[FocusControl.camera] Falling back to realRadius_m calculation for ${object.name}`,
  );

  const sizeScaling = SIZE_BASED_SCALING[object.type] ?? DEFAULT_SIZE_SCALING;

  const typeDistance = CAMERA_DISTANCES[object.type];

  let radiusDistance: number | undefined = undefined;

  if (object.realRadius_m) {
    const scaledRadius = scaleSize(object.realRadius_m, object.type);

    const adjustedRadius = scaledRadius * sizeScaling;

    radiusDistance = adjustedRadius * (1 + CAMERA_DISTANCE_SURFACE_PERCENTAGE);

    radiusDistance = Math.max(radiusDistance, MINIMUM_CAMERA_DISTANCE);

    if (object.type === CelestialType.STAR) {
      radiusDistance = Math.max(
        radiusDistance,
        CAMERA_DISTANCES[CelestialType.STAR] ?? 150,
      );
    }
  }

  const finalDistance =
    radiusDistance ?? typeDistance ?? DEFAULT_CAMERA_DISTANCE;
  console.debug(
    `[FocusControl.camera] Final fallback distance for ${object.name}: ${finalDistance.toFixed(2)}`,
  );
  return finalDistance;
}
