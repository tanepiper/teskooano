import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
} from "@teskooano/data-types";

/**
 * Helper function to get the orbital distance for sorting.
 * Returns the real semi-major axis in meters, or 0 for objects without orbits (like stars).
 */
function getOrbitalDistance(obj: CelestialObject): number {
  return obj.orbit?.realSemiMajorAxis_m || 0;
}

/**
 * Helper util for building a hierarchy map (parent → children) as well as a map of objects
 * and an ordered root-id array for rendering.
 * This consolidates the hierarchy logic that previously lived inside `focus-tree-list`.
 */
export function buildHierarchy(objects: Record<string, CelestialObject>): {
  objectMap: Map<string, CelestialObject>;
  dynamicHierarchy: Map<string | null, string[]>;
  rootIds: string[];
} {
  // Filter out inactive objects first – tree list only cares about active ones.
  const activeObjects = Object.values(objects).filter(
    (obj) => obj.status === CelestialStatus.ACTIVE,
  );

  const objectMap = new Map<string, CelestialObject>(
    activeObjects.map((o) => [o.id, o]),
  );

  // Build parent → children index.
  const dynamicHierarchy = new Map<string | null, string[]>();
  objectMap.forEach((obj, id) => {
    const parentKey = obj.currentParentId ?? obj.parentId ?? null;
    if (!dynamicHierarchy.has(parentKey)) {
      dynamicHierarchy.set(parentKey, []);
    }
    dynamicHierarchy.get(parentKey)!.push(id);
  });

  // Determine root nodes (unique set)
  const rootIdsSet = new Set<string>();

  // 1) Anything with no parent
  (dynamicHierarchy.get(null) || []).forEach((id) => rootIdsSet.add(id));

  // 2) Orphaned children whose parent is missing
  dynamicHierarchy.forEach((children, parentId) => {
    if (parentId !== null && !objectMap.has(parentId)) {
      children.forEach((id) => rootIdsSet.add(id));
    }
  });

  // 3) Stars with no parent at all (safety net)
  objectMap.forEach((obj, id) => {
    if (
      obj.type === CelestialType.STAR &&
      !obj.parentId &&
      !obj.currentParentId
    ) {
      rootIdsSet.add(id);
    }
  });

  // Convert to ordered array, stars first then by distance from barycenter.
  const rootIds = Array.from(rootIdsSet);
  rootIds.sort((a, b) => {
    const objA = objectMap.get(a);
    const objB = objectMap.get(b);
    if (!objA || !objB) return 0;

    // Stars always come first
    if (objA.type === CelestialType.STAR && objB.type !== CelestialType.STAR)
      return -1;
    if (objA.type !== CelestialType.STAR && objB.type === CelestialType.STAR)
      return 1;

    // For non-stars, sort by distance from barycenter (orbital distance)
    const distanceA = getOrbitalDistance(objA);
    const distanceB = getOrbitalDistance(objB);
    return distanceA - distanceB;
  });

  return { objectMap, dynamicHierarchy, rootIds };
}
