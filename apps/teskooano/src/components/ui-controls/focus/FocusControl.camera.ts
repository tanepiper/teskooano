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
  // --- Try Mesh Bounding Box First ---
  const mesh = renderer?.getObjectById(object.id); // Use passed renderer

  if (mesh) {
    // --- OPTIMIZATION: Prioritize pre-calculated radius ---
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

      // Apply type-specific scaling and minimum distance
      const scaleFactor =
        SIZE_BASED_SCALING[object.type] ?? DEFAULT_SIZE_SCALING;
      const minTypeDistance =
        CAMERA_DISTANCES[object.type] ?? DEFAULT_CAMERA_DISTANCE;

      distance *= scaleFactor;
      distance = Math.max(distance, minTypeDistance); // Ensure type-specific min distance
      distance = Math.max(distance, MINIMUM_CAMERA_DISTANCE); // Ensure general minimum distance

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

      // Calculate effective radius from the largest dimension of the bounding box
      const effectiveRadius = Math.max(size.x, size.y, size.z) / 2;

      // Check if calculation was valid
      if (!isNaN(effectiveRadius) && effectiveRadius > 0) {
        let distance =
          effectiveRadius * (1 + CAMERA_DISTANCE_SURFACE_PERCENTAGE);

        // Apply type-specific scaling and minimum distance
        const scaleFactor =
          SIZE_BASED_SCALING[object.type] ?? DEFAULT_SIZE_SCALING;
        const minTypeDistance =
          CAMERA_DISTANCES[object.type] ?? DEFAULT_CAMERA_DISTANCE;

        distance *= scaleFactor;
        distance = Math.max(distance, minTypeDistance); // Ensure type-specific min distance
        console.debug(
          `[FocusControl.camera] Applied type scaling (${scaleFactor.toFixed(1)}x) and min distance (${minTypeDistance}). New Distance: ${distance.toFixed(2)}`,
        );

        // Ensure general minimum distance for all types
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

  // --- Fallback to Real Radius Calculation ---
  console.debug(
    `[FocusControl.camera] Falling back to realRadius_m calculation for ${object.name}`,
  );
  // Get type-specific scaling factor (or default)
  const sizeScaling = SIZE_BASED_SCALING[object.type] ?? DEFAULT_SIZE_SCALING;

  // Get type-specific fallback distance
  const typeDistance = CAMERA_DISTANCES[object.type];

  // Calculate distance based on REAL radius (if available)
  let radiusDistance: number | undefined = undefined;

  // Access the correct property: realRadius_m
  if (object.realRadius_m) {
    // Convert real radius to scaled renderer units
    const scaledRadius = scaleSize(object.realRadius_m, object.type);

    // Apply type-specific scaling to ensure proper framing in camera view
    // For stars and large bodies, we need to be much further away
    const adjustedRadius = scaledRadius * sizeScaling;

    // Calculate distance as scaled radius + percentage margin
    radiusDistance = adjustedRadius * (1 + CAMERA_DISTANCE_SURFACE_PERCENTAGE);

    // Ensure minimum distance
    radiusDistance = Math.max(radiusDistance, MINIMUM_CAMERA_DISTANCE);

    // For stars specifically, ensure we're never too close
    if (object.type === CelestialType.STAR) {
      radiusDistance = Math.max(
        radiusDistance,
        CAMERA_DISTANCES[CelestialType.STAR] ?? 150, // Consistent fallback
      );
    }
  }

  // Prefer radius-based distance if calculated, otherwise use type fallback, then default
  const finalDistance =
    radiusDistance ?? typeDistance ?? DEFAULT_CAMERA_DISTANCE;
  console.debug(
    `[FocusControl.camera] Final fallback distance for ${object.name}: ${finalDistance.toFixed(2)}`,
  );
  return finalDistance;
}
