import type { OSVector3 } from "@teskooano/core-math";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import * as THREE from "three";

/**
 * @internal
 * Configuration for AccelerationVisualizer.
 */
export interface AccelerationVisualizerConfig {
  objects: Map<string, THREE.Object3D>;
  arrowColor?: number; // Optional, provide default
}

/**
 * @internal
 * Manages the creation, visibility, and properties of ArrowHelper instances
 * used to visualize acceleration vectors for celestial objects.
 */
export class AccelerationVisualizer {
  private objects: Map<string, THREE.Object3D>;
  private accelerationArrows: Map<string, THREE.ArrowHelper> = new Map();
  private readonly arrowColor: number;

  constructor(config: AccelerationVisualizerConfig) {
    this.objects = config.objects;
    this.arrowColor = config.arrowColor ?? 0xff00ff; // Use default if not provided
  }

  /**
   * Synchronizes the visibility and properties of acceleration vector arrows
   * based on the latest acceleration data.
   * @param accelerations - The latest acceleration vectors { objectId: OSVector3 }.
   * @param renderableObjects - A map of all renderable celestial objects.
   */
  syncAccelerationArrows(
    accelerations: Record<string, OSVector3>,
    renderableObjects: Record<string, RenderableCelestialObject>,
  ): void {
    const updatedArrowIds = new Set<string>();

    for (const objectId in accelerations) {
      const accelerationVec = accelerations[objectId];
      const parentObject = this.objects.get(objectId);
      const renderableObject = renderableObjects[objectId];

      if (!parentObject || !accelerationVec || !renderableObject) {
        continue;
      }

      const objectRadius = renderableObject.radius ?? 1;

      // Use toArray for more efficient conversion
      const accelerationArray = accelerationVec.toArray();
      const direction = new THREE.Vector3(
        accelerationArray[0],
        accelerationArray[1],
        accelerationArray[2],
      );
      const magnitude = direction.length();

      // Normalize direction, handle near-zero length
      if (magnitude > 1e-9) {
        direction.normalize();
      } else {
        direction.set(0, 1, 0); // Default direction if length is negligible
      }

      // Arrow length is now proportional to the object's radius, not acceleration magnitude
      const arrowLength = objectRadius * 3;
      const headLength = objectRadius * 0.4;
      const headWidth = objectRadius * 0.2;

      let arrow = this.accelerationArrows.get(objectId);

      if (arrow) {
        // Update existing arrow
        arrow.setDirection(direction);
        arrow.setLength(arrowLength, headLength, headWidth);
        arrow.visible = true;
      } else {
        // Create new arrow
        arrow = new THREE.ArrowHelper(
          direction,
          new THREE.Vector3(0, 0, 0), // Origin relative to parent
          arrowLength,
          this.arrowColor,
          headLength,
          headWidth,
        );
        arrow.name = `AccelerationArrow_${objectId}`;
        parentObject.add(arrow); // Add arrow as child of the object
        this.accelerationArrows.set(objectId, arrow);
      }
      updatedArrowIds.add(objectId);
    }

    // Hide arrows for objects no longer having acceleration data
    this.accelerationArrows.forEach((arrow, objectId) => {
      if (!updatedArrowIds.has(objectId)) {
        arrow.visible = false;
      }
    });
  }

  /**
   * Removes the acceleration arrow associated with a specific object ID.
   * @param objectId - The ID of the object whose arrow should be removed.
   */
  removeArrow(objectId: string): void {
    const arrow = this.accelerationArrows.get(objectId);
    if (arrow) {
      arrow.parent?.remove(arrow); // Remove from parent object
      // ArrowHelper doesn't have a dispose method
      this.accelerationArrows.delete(objectId);
    }
  }

  /**
   * Removes all acceleration arrows and clears the internal map.
   */
  clear(): void {
    this.accelerationArrows.forEach((arrow, objectId) => {
      this.removeArrow(objectId);
    });
    // Map is cleared within removeArrow calls
  }
}
