---
aliases: [CelestialManager, celestial-manager, object-lifecycle, factory]
tags: [core, state, manager, singleton, celestial, lifecycle, factory]
type: Class
package: "@teskooano/core-state"
name: CelestialManager
dependencies: ["@teskooano/data-types"]
classes: ["PhysicsStateProvider"]
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

Singleton manager consolidating celestial object lifecycle operations, factory methods, and business logic with shared utilities integration.

**Location**: `src/managers/celestialManager.ts`

## 🎯 Purpose

The `CelestialManager` provides centralized management for celestial object operations:

- **Object Lifecycle**: Add, update, remove, and mark destroyed objects
- **Factory Methods**: Create solar systems and celestial objects with proper initialization
- **Hierarchy Management**: Parent-child relationship tracking and updates
- **Event Dispatching**: Custom events for UI synchronization using shared utilities
- **Physics Integration**: Proper physics state calculation and caching
- **Dependency Sorting**: Ensures objects are created in correct dependency order
- **Code Reuse**: Uses shared utilities to eliminate duplicate logic

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

### Shared Utilities Integration

Uses shared utilities to eliminate code duplication:

```typescript
import {
  validateCelestialData,
  processStarData,
  processCelestialData,
  sortByDependency,
  createHierarchyFromObjects,
  dispatchObjectDestroyedEvent,
  dispatchObjectsLoadedEvent,
  dispatchObjectsLoadedEventFromMap,
  isValidRootObject,
} from "../utils/CelestialUtils";
```

**Note**: All utilities are imported directly from `CelestialUtils` for clarity and explicit dependency management.

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

Uses shared `processStarData` utility:

```typescript
const processedObject = processStarData(data);
this.addObject(processedObject);
```

### Celestial Object Processing

Uses shared `processCelestialData` utility:

```typescript
const processedObject = processCelestialData(data);
if (processedObject) {
  this.addObject(processedObject);
}
```

### Dependency Sorting

Uses shared `sortByDependency` utility:

```typescript
const sortedData = sortByDependency(data);
```

### Hierarchy Creation

Uses shared `createHierarchyFromObjects` utility:

```typescript
const newHierarchy = createHierarchyFromObjects(sortedData);
```

### Event Dispatching

Uses shared event dispatching utilities:

```typescript
// Dispatch object destroyed event
dispatchObjectDestroyedEvent(id);

// Dispatch objects loaded event
dispatchObjectsLoadedEvent(totalObjects, systemId);

// Dispatch objects loaded event from map
dispatchObjectsLoadedEventFromMap(celestialStore.getObjects());
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

- **Dependency Sorting**: Objects created in correct order using shared utility
- **Bulk Updates**: Multiple objects added in single operation
- **Physics Cache**: Clears physics state cache after bulk operations
- **Event Batching**: Single event dispatch for multiple objects using shared utilities

### Memory Management

- **Pre-allocated Objects**: Reduces garbage collection
- **Efficient Validation**: Early returns for invalid data using shared validation
- **Proper Cleanup**: Removes objects from all stores
- **Event Cleanup**: Dispatches destruction events using shared utilities

### Code Reuse

- **Shared Utilities**: Uses shared validation, processing, and event utilities
- **Consistent Behavior**: Consistent behavior across application
- **Maintainability**: Centralized logic for common operations
- **Reduced Duplication**: Eliminates duplicate code between components

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

- Dispatches `CELESTIAL_OBJECTS_LOADED` events using shared utilities
- Dispatches `CELESTIAL_OBJECT_DESTROYED` events using shared utilities
- Provides event details for UI updates

### With Shared Utilities

- Uses shared validation utilities for data validation
- Uses shared processing utilities for object processing
- Uses shared event dispatching utilities for events
- Uses shared hierarchy utilities for relationship management

## 🔗 Related Components

- [[core/core-state/CelestialStore|CelestialStore]] - Stores celestial object data
- [[core/core-state/PhysicsStateProvider|PhysicsStateProvider]] - Manages physics state calculations
- [[core/core-state/SimulationStateService|SimulationStateService]] - Manages simulation state
- [[core/core-state/StateAccessor|StateAccessor]] - Provides unified state access
- [[core/core-state/CelestialUtils|CelestialUtils]] - Shared utilities for validation, processing, and events

## 📚 Architecture Patterns

- **Singleton Pattern**: Ensures single manager instance
- **Factory Pattern**: Creates and initializes objects
- **Manager Pattern**: Centralized business logic
- **Event Pattern**: Dispatches events for UI synchronization
- **Strategy Pattern**: Different processing for different object types
- **Shared Utilities Pattern**: Uses shared utilities to eliminate duplication

## 🔄 Recent Improvements

### Code Duplication Elimination

- **Shared Validation**: Uses shared `validateCelestialData` utility
- **Shared Processing**: Uses shared `processStarData` and `processCelestialData` utilities
- **Shared Hierarchy**: Uses shared `sortByDependency` and `createHierarchyFromObjects` utilities
- **Shared Events**: Uses shared event dispatching utilities

### Enhanced Functionality

- **Consistent Behavior**: Consistent behavior across application through shared utilities
- **Better Maintainability**: Centralized logic for common operations
- **Reduced Complexity**: Simplified manager through utility delegation
- **Improved Error Handling**: Consistent error handling through shared utilities

---

_The CelestialManager provides comprehensive lifecycle management for celestial objects with efficient batch processing, proper physics integration, and elimination of code duplication through shared utilities._
