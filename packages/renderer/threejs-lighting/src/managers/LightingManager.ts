import type { RenderableCelestialObject } from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";
import { StateSubscriptionMixin } from "@teskooano/core-state";
import * as THREE from "three";
import type { LightSourceComponent } from "../components/LightSourceComponent";

const INFLUENCE_THRESHOLD = 0.0;
const MAX_INFLUENTIAL_LIGHTS = 4;
const SHADOW_DISTANCE_THRESHOLD = 10000; // Increased for gas giants - Max distance for shadow casting in scene units
const SHADOW_UPDATE_INTERVAL = 500; // Update shadows every 500ms instead of every frame

/**
 * @public
 * Manages the calculation of light influence within the scene.
 * This manager holds a registry of all light sources and provides methods to
 * determine which lights should affect a given object based on distance and intensity.
 *
 * The LightingManager subscribes to state changes and automatically updates
 * light sources and shadow casting when the scene changes.
 */
export class LightingManager extends StateSubscriptionMixin {
  private lightSources: Map<string, LightSourceComponent> = new Map();
  private shadowCasters: Map<
    string,
    { mesh: THREE.Object3D; object: RenderableCelestialObject }
  > = new Map();
  private ringShadowCasters: Map<
    string,
    {
      meshes: THREE.Object3D[];
      object: RenderableCelestialObject;
      parentObject: RenderableCelestialObject;
    }
  > = new Map();
  private scene: THREE.Scene;
  private lastShadowUpdate: number = 0;
  private renderableObjects$: any; // Observable for renderable objects

  constructor(scene: THREE.Scene, renderableObjects$?: any) {
    super();
    this.scene = scene;
    this.renderableObjects$ = renderableObjects$;

    // Subscribe to state changes if provided
    if (this.renderableObjects$) {
      this.subscribeToStateChanges();
    }
  }

  /**
   * @internal Subscribes to renderable objects state changes to trigger updates.
   */
  private subscribeToStateChanges(): void {
    this.subscribeToState(
      this.renderableObjects$,
      (objects: Record<string, RenderableCelestialObject>) => {
        this.updateLightSources(objects);
        this.updateShadowCasting();
      },
    );
  }

  /**
   * @internal Updates all registered light source components.
   */
  private updateLightSources(
    objects: Record<string, RenderableCelestialObject>,
  ): void {
    this.lightSources.forEach((component) => {
      // Update the component - it will fetch fresh data from state internally
      component.update();
    });
  }

  /**
   * Registers a new light source component.
   * @param component - The `LightSourceComponent` to register.
   * @param meshGroup - The mesh group of the celestial object to attach the light to.
   */
  public register(
    component: LightSourceComponent,
    meshGroup?: THREE.Object3D,
  ): void {
    if (this.lightSources.has(component.celestialObject.id)) {
      this.unregister(component.celestialObject.id);
    }

    this.lightSources.set(component.celestialObject.id, component);

    // Add the light to the mesh group if provided, otherwise add to scene
    if (meshGroup) {
      meshGroup.add(component.light);
    } else {
      this.scene.add(component.light);
    }
  }

  /**
   * Registers a potential shadow caster (planet/moon).
   * @param objectId - The ID of the celestial object.
   * @param mesh - The THREE.Object3D that should cast shadows.
   * @param object - The RenderableCelestialObject for position data.
   */
  public registerShadowCaster(
    objectId: string,
    mesh: THREE.Object3D,
    object: RenderableCelestialObject,
  ): void {
    this.shadowCasters.set(objectId, { mesh, object });
    mesh.castShadow = false; // Initially disabled
  }

  /**
   * Unregisters a shadow caster.
   * @param objectId - The ID of the celestial object.
   */
  public unregisterShadowCaster(objectId: string): void {
    const entry = this.shadowCasters.get(objectId);
    if (entry) {
      entry.mesh.castShadow = false;
      this.shadowCasters.delete(objectId);
    }
  }

  /**
   * Registers a ring system as shadow casters.
   * @param objectId - The ID of the ring system object.
   * @param meshes - Array of THREE.Object3D ring meshes that should cast shadows.
   * @param object - The RenderableCelestialObject for the ring system.
   * @param parentObject - The parent planet/star that the rings orbit.
   */
  public registerRingShadowCasters(
    objectId: string,
    meshes: THREE.Object3D[],
    object: RenderableCelestialObject,
    parentObject: RenderableCelestialObject,
  ): void {
    this.ringShadowCasters.set(objectId, { meshes, object, parentObject });
    // Initially disable shadow casting - will be enabled dynamically
    meshes.forEach((mesh) => {
      mesh.castShadow = false;
    });
  }

  /**
   * Unregisters ring shadow casters.
   * @param objectId - The ID of the ring system object.
   */
  public unregisterRingShadowCasters(objectId: string): void {
    const entry = this.ringShadowCasters.get(objectId);
    if (entry) {
      entry.meshes.forEach((mesh) => {
        mesh.castShadow = false;
      });
      this.ringShadowCasters.delete(objectId);
    }
  }

  /**
   * Unregisters a light source component.
   * @param objectId - The ID of the celestial object whose light source should be removed.
   */
  public unregister(objectId: string): void {
    const component = this.lightSources.get(objectId);
    if (component) {
      // Remove the light from its current parent if it was added to a mesh group
      if (component.light.parent && component.light.parent.type === "Group") {
        component.light.parent.remove(component.light);
      } else {
        this.scene.remove(component.light);
      }
      component.dispose();
      this.lightSources.delete(objectId);
    }
    this.unregisterShadowCaster(objectId);
    this.unregisterRingShadowCasters(objectId);
  }

  /**
   * @internal Updates all registered light source components and shadow casting.
   * This is now called automatically when state changes.
   */
  private update(): void {
    this.lightSources.forEach((component) => {
      component.update();
    });

    // Throttle shadow updates to improve performance
    const now = performance.now();
    if (
      this.lightSources.size > 0 &&
      (this.shadowCasters.size > 1 || this.ringShadowCasters.size > 0) &&
      now - this.lastShadowUpdate > SHADOW_UPDATE_INTERVAL
    ) {
      this.updateShadowCasting();
      this.lastShadowUpdate = now;
    }
  }

  /**
   * Updates shadow casting based on planetary positions relative to light sources.
   * A planet casts shadows on another planet only when it's between a light source and the target.
   */
  private updateShadowCasting(): void {
    // First, disable all shadow casting
    this.shadowCasters.forEach(({ mesh }) => {
      mesh.castShadow = false;
    });

    // For each light source, determine which planets should cast shadows
    this.lightSources.forEach((lightComponent) => {
      const lightPos = lightComponent.light.position;

      // Check all potential shadow caster combinations
      this.shadowCasters.forEach(
        ({ mesh: casterMesh, object: casterObject }, casterId) => {
          if (casterId === lightComponent.celestialObject.id) return; // Can't cast shadow on itself

          // Check if this caster blocks light to any other object
          let shouldCastShadow = false;

          this.shadowCasters.forEach(
            ({ mesh: targetMesh, object: targetObject }, targetId) => {
              if (casterId === targetId) return; // Same object
              if (targetId === lightComponent.celestialObject.id) return; // Target is the light source

              const isBlocking = this.isObjectBlockingLight(
                lightPos,
                casterObject.position,
                targetObject.position,
                casterMesh,
              );
              if (isBlocking) {
                shouldCastShadow = true;
              }
            },
          );

          if (shouldCastShadow) {
            casterMesh.castShadow = true;
          }
        },
      );
    });

    // Handle ring shadow casting
    this.ringShadowCasters.forEach(
      ({ meshes, object: ringObject, parentObject }, ringId) => {
        // Initially disable all ring shadow casting
        meshes.forEach((mesh) => {
          mesh.castShadow = false;
        });

        // For each light source, check if rings should cast shadows
        this.lightSources.forEach((lightComponent) => {
          const lightPos = lightComponent.light.position;

          // Check if rings cast shadows on their parent planet
          let shouldCastShadowOnParent = false;
          if (
            this.isRingBlockingLightToObject(
              lightPos,
              ringObject.position,
              parentObject.position,
              parentObject.radius || 1,
            )
          ) {
            shouldCastShadowOnParent = true;
          }

          // Check if rings cast shadows on other objects (moons, planets)
          let shouldCastShadowOnOthers = false;
          this.shadowCasters.forEach(
            ({ mesh: targetMesh, object: targetObject }, targetId) => {
              if (targetId === lightComponent.celestialObject.id) return; // Target is the light source
              if (targetId === parentObject.id) return; // Already checked parent above

              if (
                this.isRingBlockingLightToObject(
                  lightPos,
                  ringObject.position,
                  targetObject.position,
                  targetObject.radius || 1,
                )
              ) {
                shouldCastShadowOnOthers = true;
              }
            },
          );

          // Enable shadow casting if rings are blocking light to any object
          if (shouldCastShadowOnParent || shouldCastShadowOnOthers) {
            meshes.forEach((mesh) => {
              mesh.castShadow = true;
            });
          }
        });
      },
    );
  }

  /**
   * Determines if a caster object is blocking light from a source to a target.
   * @param lightPos - Position of the light source.
   * @param casterPos - Position of the potential shadow caster.
   * @param targetPos - Position of the shadow target.
   * @param casterMesh - The caster mesh to get radius information.
   * @returns True if the caster is blocking light to the target.
   */
  private isObjectBlockingLight(
    lightPos: THREE.Vector3,
    casterPos: THREE.Vector3,
    targetPos: THREE.Vector3,
    casterMesh: THREE.Object3D,
  ): boolean {
    // Vector from light to target
    const lightToTarget = new THREE.Vector3().subVectors(targetPos, lightPos);
    const lightToTargetDistance = lightToTarget.length();

    // Vector from light to caster
    const lightToCaster = new THREE.Vector3().subVectors(casterPos, lightPos);
    const lightToCasterDistance = lightToCaster.length();

    // Caster must be between light and target
    if (lightToCasterDistance >= lightToTargetDistance) {
      return false;
    }

    // Caster must be within shadow distance threshold
    if (lightToCasterDistance > SHADOW_DISTANCE_THRESHOLD) {
      return false;
    }

    // Calculate closest point on light-to-target line to caster
    const lightToTargetNorm = lightToTarget.normalize();
    const projectionLength = lightToCaster.dot(lightToTargetNorm);
    const closestPoint = new THREE.Vector3()
      .copy(lightToTargetNorm)
      .multiplyScalar(projectionLength)
      .add(lightPos);

    // Distance from caster to the light ray
    const distanceToRay = casterPos.distanceTo(closestPoint);

    // Get caster radius (approximate from scale or use a default)
    const casterRadius = this.getObjectRadius(casterMesh);

    // Caster blocks light if it's close enough to the light ray
    const isBlocking = distanceToRay <= casterRadius * 1.5;
    return isBlocking;
  }

  /**
   * Gets the approximate radius of an object for shadow calculations.
   * @param mesh - The THREE.Object3D to measure.
   * @returns The approximate radius.
   */
  private getObjectRadius(mesh: THREE.Object3D): number {
    // Try to get radius from scale or bounding box
    if (mesh.scale.x > 0) {
      const scaleRadius = mesh.scale.x;
      return scaleRadius;
    }

    // Fallback: calculate from bounding box
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const boundingRadius = Math.max(size.x, size.y, size.z) * 0.5;

    // If bounding box is too small, use a default radius for gas giants
    if (boundingRadius < 1) {
      return 50; // Default radius for gas giants
    }

    return boundingRadius;
  }

  /**
   * Determines if a ring system is blocking light from a source to a target object.
   * Rings are flat disc-shaped objects, so this uses different geometry than spherical shadow casting.
   * @param lightPos - Position of the light source.
   * @param ringPos - Position of the ring system (center).
   * @param targetPos - Position of the shadow target.
   * @param targetRadius - Radius of the target object.
   * @returns True if the ring is blocking light to the target.
   */
  private isRingBlockingLightToObject(
    lightPos: THREE.Vector3,
    ringPos: THREE.Vector3,
    targetPos: THREE.Vector3,
    targetRadius: number,
  ): boolean {
    // Vector from light to target
    const lightToTarget = new THREE.Vector3().subVectors(targetPos, lightPos);
    const lightToTargetDistance = lightToTarget.length();

    // Vector from light to ring center
    const lightToRing = new THREE.Vector3().subVectors(ringPos, lightPos);
    const lightToRingDistance = lightToRing.length();

    // Ring must be between light and target
    if (lightToRingDistance >= lightToTargetDistance) {
      return false;
    }

    // Ring must be within shadow distance threshold
    if (lightToRingDistance > SHADOW_DISTANCE_THRESHOLD) {
      return false;
    }

    // Calculate where the light ray intersects the ring plane
    // Assuming ring is in XZ plane (Y is up/normal)
    const lightToTargetNorm = lightToTarget.normalize();

    // Project ring position onto light-to-target line
    const projectionLength = lightToRing.dot(lightToTargetNorm);
    const intersectionPoint = new THREE.Vector3()
      .copy(lightToTargetNorm)
      .multiplyScalar(projectionLength)
      .add(lightPos);

    // Distance from ring center to intersection point
    const ringToIntersection = ringPos.distanceTo(intersectionPoint);

    // For ring shadow calculation, we need to check if the intersection point
    // is within the ring's area. Since we don't have exact ring dimensions here,
    // we'll use a simplified approach based on the parent object's radius.
    // Typical ring systems extend 1.5-3x the parent radius
    const estimatedRingOuterRadius = targetRadius * 2.5;
    const estimatedRingInnerRadius = targetRadius * 1.2;

    // Check if intersection is within ring area (between inner and outer radius)
    const isInRingArea =
      ringToIntersection >= estimatedRingInnerRadius &&
      ringToIntersection <= estimatedRingOuterRadius;

    // Check if target is close to the ring plane (within a reasonable height)
    const ringPlaneHeight = Math.abs(targetPos.y - ringPos.y);
    const maxRingThickness = targetRadius * 0.1; // Rings are typically very thin
    const isNearRingPlane = ringPlaneHeight <= maxRingThickness;

    return isInRingArea && isNearRingPlane;
  }

  /**
   * Calculates the most influential light sources for a given target object.
   * This method iterates through all available lights and scores them based on
   * their distance and intensity to find the most significant ones.
   *
   * @param targetObject - The object for which to find influential lights.
   * @param maxLights - The maximum number of lights to return.
   * @returns An array of the most influential `LightSourceComponent` instances.
   */
  public getInfluentialLights(
    targetObject: RenderableCelestialObject,
    maxLights = MAX_INFLUENTIAL_LIGHTS,
  ): LightSourceComponent[] {
    const influentialLights: {
      component: LightSourceComponent;
      influence: number;
    }[] = [];

    this.lightSources.forEach((sourceComponent, lightSourceId) => {
      // An object cannot light itself.
      if (lightSourceId === targetObject.id) {
        return;
      }

      const light = sourceComponent.light as THREE.PointLight;
      const distanceSq = targetObject.position.distanceToSquared(
        light.position,
      );

      // Basic influence calculation: intensity / (distance^2 + constant)
      // The constant prevents division by zero and tones down the effect at very close ranges.
      const influence = light.intensity / (distanceSq + 1.0);

      if (influence > INFLUENCE_THRESHOLD) {
        influentialLights.push({ component: sourceComponent, influence });
      }
    });

    // Sort by influence and return the top N
    return influentialLights
      .sort((a, b) => b.influence - a.influence)
      .slice(0, maxLights)
      .map((item) => item.component);
  }

  /**
   * Disposes of all registered light sources from the manager.
   */
  public dispose(): void {
    this.lightSources.forEach((component) => {
      // Remove the light from its current parent if it was added to a mesh group
      if (component.light.parent && component.light.parent.type === "Group") {
        component.light.parent.remove(component.light);
      } else {
        this.scene.remove(component.light);
      }
      component.dispose();
    });
    this.lightSources.clear();
    this.shadowCasters.clear();
    this.ringShadowCasters.clear();
  }
}
