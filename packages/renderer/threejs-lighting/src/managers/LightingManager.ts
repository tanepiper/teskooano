import type { RenderableCelestialObject } from "@teskooano/data-types";
import * as THREE from "three";
import type { LightSourceComponent } from "../components/LightSourceComponent";

const INFLUENCE_THRESHOLD = 0.05;
const MAX_INFLUENTIAL_LIGHTS = 4;

/**
 * @public
 * Manages the calculation of light influence within the scene.
 * This manager holds a registry of all light sources and provides methods to
 * determine which lights should affect a given object based on distance and intensity.
 */
export class LightingManager {
  private lightSources: Map<string, LightSourceComponent> = new Map();
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Registers a new light source component.
   * @param component - The `LightSourceComponent` to register.
   */
  public register(component: LightSourceComponent): void {
    if (this.lightSources.has(component.celestialObject.celestialObjectId)) {
      this.unregister(component.celestialObject.celestialObjectId);
    }

    this.lightSources.set(
      component.celestialObject.celestialObjectId,
      component,
    );
    this.scene.add(component.light);
  }

  /**
   * Unregisters a light source component.
   * @param objectId - The ID of the celestial object whose light source should be removed.
   */
  public unregister(objectId: string): void {
    const component = this.lightSources.get(objectId);
    if (component) {
      this.scene.remove(component.light);
      component.dispose();
      this.lightSources.delete(objectId);
    }
  }

  /**
   * Updates all registered light source components.
   * This should be called once per frame.
   */
  public update(): void {
    this.lightSources.forEach((component) => {
      component.update();
    });
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
      if (lightSourceId === targetObject.celestialObjectId) {
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
   * Clears all registered light sources from the manager.
   */
  public clear(): void {
    this.lightSources.forEach((component) => {
      this.scene.remove(component.light);
      component.dispose();
    });
    this.lightSources.clear();
  }
}
