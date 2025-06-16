import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { LightSourceComponent } from "../components/LightSourceComponent";

/**
 * @public
 * Manages the calculation of light influence within the scene.
 * This manager holds a registry of all light sources and provides methods
 * to determine which lights should affect a given object.
 */
export class LightingInfluenceManager {
  private lightSources: Map<string, LightSourceComponent> = new Map();

  /**
   * Registers a new light source component.
   * @param component - The `LightSourceComponent` to register.
   */
  public register(component: LightSourceComponent): void {
    this.lightSources.set(
      component.celestialObject.celestialObjectId,
      component,
    );
  }

  /**
   * Unregisters a light source component.
   * @param objectId - The ID of the celestial object whose light source should be removed.
   */
  public unregister(objectId: string): void {
    this.lightSources.delete(objectId);
  }

  /**
   * Calculates the most influential light sources for a given target object.
   * The current algorithm simply finds the closest lights.
   *
   * @param targetObject - The object for which to find influential lights.
   * @param maxLights - The maximum number of lights to return.
   * @returns An array of the most influential `LightSourceComponent` instances.
   */
  public getInfluentialLights(
    targetObject: RenderableCelestialObject,
    maxLights = 4,
  ): LightSourceComponent[] {
    const influentialLights: {
      component: LightSourceComponent;
      distanceSq: number;
    }[] = [];

    this.lightSources.forEach((sourceComponent, sourceId) => {
      // An object cannot light itself.
      if (sourceId === targetObject.celestialObjectId) {
        return;
      }

      const distanceSq = targetObject.position.distanceToSquared(
        sourceComponent.celestialObject.position,
      );
      influentialLights.push({ component: sourceComponent, distanceSq });
    });

    // Sort by distance (squared) and return the nearest ones.
    return influentialLights
      .sort((a, b) => a.distanceSq - b.distanceSq)
      .slice(0, maxLights)
      .map((item) => item.component);
  }

  /**
   * Clears all registered light sources from the manager.
   */
  public clear(): void {
    this.lightSources.clear();
  }
}
