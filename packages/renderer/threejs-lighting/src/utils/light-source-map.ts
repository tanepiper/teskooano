import { CelestialObject, CelestialType } from "@teskooano/data-types";

/**
 * Traverses the celestial hierarchy to determine the primary light source for every object.
 *
 * This function builds a map where each object's ID is keyed to the ID of the
 * star that illuminates it. It works by recursively walking up the parent chain
 * from each object until it finds a star or the root of a sub-system.
 *
 * @param objects A record of all celestial objects in the scene.
 * @returns A map where the key is a celestial object ID and the value is the ID of its light source.
 */
export function calculateLightSourceMaps(
  objects: Record<string, CelestialObject>,
): Record<string, string | undefined> {
  const lightSourceMap: Record<string, string | undefined> = {};

  /**
   * Memoized recursive function to find the light source for a given object ID.
   * @param id The ID of the object to check.
   * @param visited Set of visited object IDs to detect circular dependencies.
   * @returns The ID of the light source, or undefined if none exists.
   */
  const determineLightSource = (
    id: string,
    visited: Set<string> = new Set(),
  ): string | undefined => {
    // Return from cache if already computed
    if (id in lightSourceMap) return lightSourceMap[id];

    // Detect circular dependency
    if (visited.has(id)) {
      console.warn(
        `[LightSourceMap] Circular dependency detected involving object ${id}`,
      );
      lightSourceMap[id] = undefined;
      return undefined;
    }

    const obj = objects[id];
    if (!obj) {
      lightSourceMap[id] = undefined;
      return undefined;
    }

    // The object is itself a star
    if (obj.type === CelestialType.STAR) {
      lightSourceMap[id] = id;
      return id;
    }

    // No parent, so no light source in this hierarchy
    if (!obj.parentId) {
      lightSourceMap[id] = undefined;
      return undefined;
    }

    // Add current object to visited set and recursively find the parent's light source
    const newVisited = new Set(visited);
    newVisited.add(id);
    lightSourceMap[id] = determineLightSource(obj.parentId, newVisited);
    return lightSourceMap[id];
  };

  // Populate the map for all objects
  Object.keys(objects).forEach((id) => determineLightSource(id));

  return lightSourceMap;
}
