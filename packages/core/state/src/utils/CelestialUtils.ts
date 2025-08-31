import type {
  CelestialObject,
  CelestialSpecificPropertiesUnion,
  OrbitalParameters,
  PlanetAtmosphereProperties,
  StarProperties,
} from "@teskooano/data-types";
import {
  CelestialStatus,
  CelestialType,
  CustomEvents,
} from "@teskooano/data-types";

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Cache for frequently accessed data
 */
const ROOT_OBJECT_TYPES = new Set([
  CelestialType.STAR,
  CelestialType.PLANET,
  CelestialType.GAS_GIANT,
  CelestialType.SATELLITE,
]);

/**
 * Pre-allocated objects to reduce garbage collection
 */
export const DEFAULT_STAR_PROPERTIES: StarProperties = {
  type: CelestialType.STAR,
  isMainStar: true,
  spectralClass: "G2V",
  luminosity: 1.0,
  color: "#FFF9E5",
};

export const DEFAULT_CELESTIAL_PROPERTIES = {
  status: CelestialStatus.ACTIVE,
  temperature: 100,
  albedo: 0.3,
  seed: "",
};

/**
 * Type guard to check if an object is of type PlanetAtmosphereProperties.
 */
export function isPlanetAtmosphere(
  props: any,
): props is PlanetAtmosphereProperties {
  return (
    props &&
    typeof props.thickness === "number" &&
    typeof props.power === "number" &&
    typeof props.intensity === "number" &&
    props.glowColor !== undefined
  );
}

/**
 * Validates basic celestial object data requirements.
 */
export function validateCelestialData(data: CelestialObject): boolean {
  if (data.type === CelestialType.STAR && !data.parentId) {
    console.error(
      `[CelestialUtils] Root stars should use createSolarSystem() method.`,
    );
    return false;
  }

  if (!data.parentId && !isValidRootObject(data.type)) {
    console.error(`[CelestialUtils] Cannot add ${data.type} without parentId.`);
    return false;
  }

  return true;
}

/**
 * Checks if a celestial type can be a root object (no parent required).
 */
export function isValidRootObject(type: CelestialType): boolean {
  return ROOT_OBJECT_TYPES.has(type);
}

// =============================================================================
// DATA PROCESSING UTILITIES
// =============================================================================

/**
 * Processes star data with default properties and validation.
 */
export function processStarData(data: CelestialObject): CelestialObject {
  const inputStarProps =
    data.properties?.type === CelestialType.STAR ? data.properties : undefined;

  // Use pre-allocated default properties to reduce object creation
  const processedProperties: StarProperties = {
    ...DEFAULT_STAR_PROPERTIES,
    isMainStar: inputStarProps?.isMainStar ?? true,
    spectralClass: inputStarProps?.spectralClass || "G2V",
    luminosity: inputStarProps?.luminosity ?? 1.0,
    color: inputStarProps?.color ?? "#FFF9E5",
    stellarType: inputStarProps?.stellarType,
    partnerStars: inputStarProps?.partnerStars,
    mainSpectralClass: inputStarProps?.mainSpectralClass,
    luminosityClass: inputStarProps?.luminosityClass,
    specialSpectralClass: inputStarProps?.specialSpectralClass,
  };

  return {
    ...data,
    status: CelestialStatus.ACTIVE,
    temperature: data.temperature ?? 5778,
    albedo: data.albedo ?? 0.3,
    atmosphere: isPlanetAtmosphere(data.atmosphere)
      ? data.atmosphere
      : undefined,
    properties: processedProperties,
    seed: data.seed ?? `${Math.floor(Date.now() % 1000000)}`,
    parentId: data.parentId,
  };
}

/**
 * Processes celestial data with validation and default properties.
 */
export function processCelestialData<
  T extends CelestialSpecificPropertiesUnion,
>(data: CelestialObject<T>): CelestialObject<T> | null {
  // Validate basic requirements
  if (!validateCelestialData(data)) {
    return null;
  }

  // Generate seed once to avoid multiple Date.now() calls
  const seed = data.seed ?? `${Math.floor(Date.now() % 1000000)}`;

  return {
    ...data,
    status: CelestialStatus.ACTIVE,
    temperature: data.temperature ?? 100,
    albedo: data.albedo ?? 0.3,
    atmosphere: isPlanetAtmosphere(data.atmosphere)
      ? data.atmosphere
      : undefined,
    seed,
    parentId: data.parentId,
  };
}

// =============================================================================
// HIERARCHY UTILITIES
// =============================================================================

/**
 * Sorts celestial objects by dependency (parents before children).
 */
export function sortByDependency(
  objects: CelestialObject[],
): CelestialObject[] {
  if (objects.length <= 1) return objects;

  const objectMap = new Map(objects.map((obj) => [obj.id, obj]));
  const sorted: CelestialObject[] = [];
  const visited = new Set<string>();

  function visit(objectId: string) {
    if (visited.has(objectId)) return;
    visited.add(objectId);

    const obj = objectMap.get(objectId);
    if (obj) {
      if (obj.parentId && objectMap.has(obj.parentId)) {
        visit(obj.parentId);
      }
      sorted.push(obj);
    }
  }

  for (const obj of objects) {
    visit(obj.id);
  }

  return sorted;
}

/**
 * Creates hierarchy entries for a set of objects.
 */
export function createHierarchyFromObjects(
  objects: CelestialObject[],
): Record<string, string[]> {
  const hierarchy: Record<string, string[]> = {};

  // Pre-allocate arrays for better performance
  const parentIds = new Set<string>();
  const starIds = new Set<string>();

  // First pass: collect all parent IDs and star IDs
  for (const objectData of objects) {
    if (objectData.parentId) {
      parentIds.add(objectData.parentId);
    }
    if (objectData.type === CelestialType.STAR) {
      starIds.add(objectData.id);
    }
  }

  // Pre-allocate hierarchy entries
  for (const parentId of parentIds) {
    if (!hierarchy[parentId]) {
      hierarchy[parentId] = [];
    }
  }
  for (const starId of starIds) {
    if (!hierarchy[starId]) {
      hierarchy[starId] = [];
    }
  }

  // Add all objects to hierarchy
  for (const objectData of objects) {
    if (objectData.parentId) {
      hierarchy[objectData.parentId].push(objectData.id);
    }
  }

  return hierarchy;
}

// =============================================================================
// EVENT DISPATCHING UTILITIES
// =============================================================================

/**
 * Dispatches a celestial object destroyed event.
 */
export function dispatchObjectDestroyedEvent(objectId: string): void {
  document.dispatchEvent(
    new CustomEvent(CustomEvents.CELESTIAL_OBJECT_DESTROYED, {
      detail: { objectId },
    }),
  );
}

/**
 * Dispatches a celestial objects loaded event.
 */
export function dispatchObjectsLoadedEvent(
  count: number,
  systemId?: string,
): void {
  document.dispatchEvent(
    new CustomEvent(CustomEvents.CELESTIAL_OBJECTS_LOADED, {
      detail: { count, systemId },
    }),
  );
}

/**
 * Dispatches a celestial objects loaded event with count from objects map.
 */
export function dispatchObjectsLoadedEventFromMap(
  objects: Record<string, CelestialObject>,
  systemId?: string,
): void {
  const count = Object.keys(objects).length;
  dispatchObjectsLoadedEvent(count, systemId);
}
