---
aliases: [CelestialManager, celestial-manager, object-lifecycle, factory]
tags: [core, state, manager, singleton, celestial, lifecycle, factory]
type: Class
package: "@teskooano/core-state"
name: CelestialManager
dependencies:
  ["@teskooano/data-types", "@teskooano/core-physics", "@teskooano/core-math"]
classes: ["PhysicsStateProvider", "CustomEvents"]
functions: []
constants: []
types:
  [
    "CelestialObject",
    "CelestialSpecificPropertiesUnion",
    "OrbitalParameters",
    "CelestialStatus",
    "CelestialType",
    "ClearStateOptions",
    "StarProperties",
    "PlanetAtmosphereProperties",
  ]
status: active
---

# CelestialManager

Singleton manager consolidating celestial object lifecycle operations, factory methods, and business logic.

**Location**: `src/managers/celestialManager.ts`

## 🎯 Purpose

The `CelestialManager` provides centralized management for celestial object operations:

- **Object Lifecycle**: Add, update, remove, and mark destroyed objects
- **Factory Methods**: Create solar systems and celestial objects with proper initialization
- **Hierarchy Management**: Parent-child relationship tracking and updates
- **Event Dispatching**: Custom events for UI synchronization
- **Physics Integration**: Proper physics state calculation and caching
- **Dependency Sorting**: Ensures objects are created in correct dependency order

## 🏗️ Architecture

### Singleton Pattern

Uses singleton pattern for consistent access across the application:

```typescript
export class CelestialManager {
  private static instance: CelestialManager;

  public static getInstance(): CelestialManager {
    if (!CelestialManager.instance) {
      CelestialManager.instance = new CelestialManager();
    }
    return CelestialManager.instance;
  }
}
```

### Business Logic Consolidation

Consolidates logic from factory and actions into a cleaner API:

```typescript
// Old way (still supported for backward compatibility)
import { actions } from "@teskooano/core-state";
actions.addCelestialObject(object);

// New way (recommended)
import { celestialManager } from "@teskooano/core-state";
celestialManager.addObject(object);
```

## 🔧 Core Methods

### Object Lifecycle Management

```typescript
// Add celestial object
addObject<T extends CelestialSpecificPropertiesUnion>(object: CelestialObject<T>): void;

// Update object properties
updateObject<T extends CelestialSpecificPropertiesUnion>(
  id: string,
  updates: Partial<CelestialObject<T>>
): void;

// Remove object completely
removeObject(id: string): void;

// Mark object as destroyed
markDestroyed(id: string): void;

// Update orbital parameters
updateOrbit(id: string, parameters: Partial<OrbitalParameters>): void;
```

### Factory Methods

```typescript
// Create solar system with primary star
createSolarSystem<T extends CelestialSpecificPropertiesUnion>(
  data: CelestialObject<T>,
  clearStateFirst?: boolean
): string;

// Add single celestial object
addCelestial<T extends CelestialSpecificPropertiesUnion>(
  data: CelestialObject<T>
): void;

// Add multiple objects with dependency sorting
addObjects<T extends CelestialSpecificPropertiesUnion>(
  data: CelestialObject<T>[]
): void;
```

### State Management

```typescript
// Clear all celestial objects
clearState(options?: ClearStateOptions): void;
```

## 📊 Configuration Options

### ClearStateOptions Interface

```typescript
interface ClearStateOptions {
  resetCamera?: boolean; // Reset camera to default position
  resetTime?: boolean; // Reset simulation time
  resetSelection?: boolean; // Clear selected/focused objects
}
```

### Default Values

- `resetCamera`: `false`
- `resetTime`: `true`
- `resetSelection`: `true`

## 🔄 Object Processing

### Star Processing

```typescript
private processStarData(data: CelestialObject): CelestialObject {
  const inputStarProps = data.properties?.type === CelestialType.STAR
    ? data.properties
    : undefined;

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
    atmosphere: isPlanetAtmosphere(data.atmosphere) ? data.atmosphere : undefined,
    properties: processedProperties,
    seed: data.seed ?? `${Math.floor(Date.now() % 1000000)}`,
    parentId: data.parentId,
  };
}
```

### Celestial Object Processing

```typescript
private processCelestialData<T extends CelestialSpecificPropertiesUnion>(
  data: CelestialObject<T>
): CelestialObject<T> | null {
  // Validate basic requirements
  if (!this.validateCelestialData(data)) {
    return null;
  }

  const seed = data.seed ?? `${Math.floor(Date.now() % 1000000)}`;

  return {
    ...data,
    status: CelestialStatus.ACTIVE,
    temperature: data.temperature ?? 100,
    albedo: data.albedo ?? 0.3,
    atmosphere: isPlanetAtmosphere(data.atmosphere) ? data.atmosphere : undefined,
    seed,
    parentId: data.parentId,
  };
}
```

### Dependency Sorting

```typescript
private sortByDependency(objects: CelestialObject[]): CelestialObject[] {
  if (objects.length <= 1) return objects;

  const objectMap = new Map(objects.map(obj => [obj.id, obj]));
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
```

## 🚀 Usage Examples

### Creating a Solar System

```typescript
import { celestialManager } from "@teskooano/core-state";

// Create primary star
const starId = celestialManager.createSolarSystem({
  id: "sun",
  name: "Sol",
  type: CelestialType.STAR,
  realMass_kg: 1.989e30,
  realRadius_m: 696340000,
  temperature: 5778,
  properties: {
    type: CelestialType.STAR,
    isMainStar: true,
    spectralClass: "G2V",
    luminosity: 1.0,
    color: "#FFF9E5",
  },
});

console.log("Created star with ID:", starId);
```

### Adding Planets

```typescript
// Add single planet
celestialManager.addCelestial({
  id: "earth",
  name: "Earth",
  type: CelestialType.PLANET,
  parentId: "sun",
  realMass_kg: 5.972e24,
  realRadius_m: 6371000,
  orbit: {
    realSemiMajorAxis_m: 149597870700,
    eccentricity: 0.0167,
    inclination: 0,
    longitudeOfAscendingNode: 0,
    argumentOfPeriapsis: 0,
    meanAnomaly: 0,
  },
  properties: {
    type: CelestialType.PLANET,
    isMoon: false,
    composition: ["silicate", "iron"],
  },
});

// Add multiple objects with dependency sorting
celestialManager.addObjects([
  {
    id: "mars",
    name: "Mars",
    type: CelestialType.PLANET,
    parentId: "sun",
    // ... mars data
  },
  {
    id: "phobos",
    name: "Phobos",
    type: CelestialType.MOON,
    parentId: "mars",
    // ... phobos data
  },
  {
    id: "deimos",
    name: "Deimos",
    type: CelestialType.MOON,
    parentId: "mars",
    // ... deimos data
  },
]);
```

### Object Lifecycle Management

```typescript
// Update object properties
celestialManager.updateObject("earth", {
  name: "Terra",
  temperature: 288,
});

// Update orbital parameters
celestialManager.updateOrbit("earth", {
  eccentricity: 0.017,
  meanAnomaly: Math.PI / 4,
});

// Mark object as destroyed
celestialManager.markDestroyed("asteroid-001");

// Remove object completely
celestialManager.removeObject("destroyed-satellite");
```

### State Management

```typescript
// Clear all objects
celestialManager.clearState();

// Clear with options
celestialManager.clearState({
  resetCamera: true,
  resetTime: false,
  resetSelection: true,
});
```

## 🎯 Performance Optimizations

### Batch Processing

- **Dependency Sorting**: Objects created in correct order
- **Bulk Updates**: Multiple objects added in single operation
- **Physics Cache**: Clears physics state cache after bulk operations
- **Event Batching**: Single event dispatch for multiple objects

### Memory Management

- **Pre-allocated Objects**: Reduces garbage collection
- **Efficient Validation**: Early returns for invalid data
- **Proper Cleanup**: Removes objects from all stores
- **Event Cleanup**: Dispatches destruction events

## 🔗 Integration Points

### With Stores

- Updates `celestialStore` with object data
- Manages `celestialHierarchyStore` for parent-child relationships
- Integrates with `renderableStore` for rendering data

### With Physics System

- Clears physics state cache after bulk operations
- Ensures proper physics state calculation
- Integrates with `PhysicsStateProvider`

### With Event System

- Dispatches `CELESTIAL_OBJECTS_LOADED` events
- Dispatches `CELESTIAL_OBJECT_DESTROYED` events
- Provides event details for UI updates

## 🔗 Related Components

- [[CelestialStore]] - Stores celestial object data
- [[PhysicsStateProvider]] - Manages physics state calculations
- [[SimulationStateService]] - Manages simulation state
- [[StateAccessor]] - Provides unified state access

## 📚 Architecture Patterns

- **Singleton Pattern**: Ensures single manager instance
- **Factory Pattern**: Creates and initializes objects
- **Manager Pattern**: Centralized business logic
- **Event Pattern**: Dispatches events for UI synchronization
- **Strategy Pattern**: Different processing for different object types

---

_The CelestialManager provides comprehensive lifecycle management for celestial objects with efficient batch processing and proper physics integration._
