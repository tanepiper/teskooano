---
aliases:
  [
    CelestialUtils,
    celestial-utils,
    validation-utils,
    processing-utils,
    event-utils,
  ]
tags:
  [core, state, utilities, static, validation, processing, hierarchy, events]
type: Module
package: "@teskooano/core-state"
name: CelestialUtils
dependencies: ["@teskooano/data-types"]
classes: []
functions:
  [
    "validateCelestialData",
    "processStarData",
    "processCelestialData",
    "sortByDependency",
    "createHierarchyFromObjects",
    "dispatchObjectDestroyedEvent",
    "dispatchObjectsLoadedEvent",
    "dispatchObjectsLoadedEventFromMap",
    "isValidRootObject",
    "isPlanetAtmosphere",
  ]
constants: ["DEFAULT_STAR_PROPERTIES", "DEFAULT_CELESTIAL_PROPERTIES"]
types:
  [
    "CelestialObject",
    "CelestialSpecificPropertiesUnion",
    "StarProperties",
    "PlanetAtmosphereProperties",
    "CelestialStatus",
    "CelestialType",
  ]
status: active
---

# CelestialUtils

Static utility functions for celestial object validation, data processing, hierarchy management, and event dispatching with comprehensive type safety and performance optimization.

**Location**: `src/utils/CelestialUtils.ts`

## 🎯 Purpose

The `CelestialUtils` provides centralized utilities for celestial object operations:

- **Data Validation**: Validates celestial object data integrity and requirements
- **Data Processing**: Processes and transforms celestial object data
- **Hierarchy Management**: Manages parent-child relationships and dependency sorting
- **Event Dispatching**: Dispatches custom events for UI synchronization
- **Code Reuse**: Eliminates duplicate logic across components
- **Type Safety**: Full TypeScript type safety for all operations
- **Performance**: Optimized utilities with minimal object creation

## 🏗️ Architecture

### **Static Utility Pattern**

- **No Instance State**: All functions are static for utility access
- **Pure Functions**: Deterministic operations without side effects
- **Type Safety**: Full TypeScript type safety
- **Performance Optimization**: Efficient algorithms and minimal allocations

### **Modular Organization**

Organized by functional areas:

- **Validation**: Data validation and integrity checking
- **Processing**: Data transformation and processing
- **Hierarchy**: Parent-child relationship management
- **Events**: Custom event dispatching

## 🔧 Core Components

### **Validation Utilities**

#### **validateCelestialData()**

```typescript
export function validateCelestialData(data: CelestialObject): boolean;
```

**Purpose**: Validates celestial object data for integrity and requirements

**Features**:

- **Root Object Validation**: Ensures root stars use proper creation methods
- **Parent ID Validation**: Validates parent-child relationships
- **Type Safety**: Full TypeScript type safety
- **Error Logging**: Comprehensive error logging for debugging

#### **isValidRootObject()**

```typescript
export function isValidRootObject(type: CelestialType): boolean;
```

**Purpose**: Checks if a celestial type can be a root object

**Features**:

- **Type Checking**: Validates against allowed root object types
- **Performance**: Fast lookup using Set
- **Consistency**: Consistent validation across application

#### **isPlanetAtmosphere()**

```typescript
export function isPlanetAtmosphere(
  props: any,
): props is PlanetAtmosphereProperties;
```

**Purpose**: Type guard for planet atmosphere properties

**Features**:

- **Type Guard**: Runtime type checking for atmosphere properties
- **Property Validation**: Validates required atmosphere properties
- **Type Safety**: Ensures type safety for atmosphere handling

### **Processing Utilities**

#### **processStarData()**

```typescript
export function processStarData(data: CelestialObject): CelestialObject;
```

**Purpose**: Processes and transforms star data with default values

**Features**:

- **Default Properties**: Applies sensible defaults for star properties
- **Property Merging**: Merges input properties with defaults
- **Status Setting**: Sets appropriate status for stars
- **Seed Generation**: Generates seeds for procedural content

#### **processCelestialData()**

```typescript
export function processCelestialData<
  T extends CelestialSpecificPropertiesUnion,
>(data: CelestialObject<T>): CelestialObject<T> | null;
```

**Purpose**: Processes and transforms celestial object data

**Features**:

- **Validation**: Validates data before processing
- **Default Values**: Applies sensible defaults
- **Status Setting**: Sets appropriate status
- **Seed Generation**: Generates seeds for procedural content
- **Null Safety**: Returns null for invalid data

### **Hierarchy Management**

#### **sortByDependency()**

```typescript
export function sortByDependency(objects: CelestialObject[]): CelestialObject[];
```

**Purpose**: Sorts celestial objects by dependency order

**Features**:

- **Dependency Resolution**: Ensures parents are created before children
- **Topological Sort**: Uses topological sorting algorithm
- **Cycle Detection**: Prevents circular dependencies
- **Performance**: Efficient sorting algorithm

#### **createHierarchyFromObjects()**

```typescript
export function createHierarchyFromObjects(
  objects: CelestialObject[],
): Record<string, string[]>;
```

**Purpose**: Creates hierarchy map from celestial objects

**Features**:

- **Parent-Child Mapping**: Maps parent IDs to child ID arrays
- **Efficient Creation**: Optimized for bulk hierarchy creation
- **Consistency**: Ensures consistent hierarchy structure
- **Performance**: Efficient object mapping

**Note**: This function is used by CelestialManager but the resulting hierarchy is not stored in CelestialStore. Hierarchy management is now handled by `FlatHierarchyService`.

### **Event Dispatching**

#### **dispatchObjectDestroyedEvent()**

```typescript
export function dispatchObjectDestroyedEvent(objectId: string): void;
```

**Purpose**: Dispatches object destroyed event

**Features**:

- **Event Dispatching**: Dispatches custom event for UI synchronization
- **Event Details**: Includes object ID in event details
- **Consistency**: Consistent event dispatching across application
- **UI Integration**: Perfect for UI component updates

#### **dispatchObjectsLoadedEvent()**

```typescript
export function dispatchObjectsLoadedEvent(
  count: number,
  systemId?: string,
): void;
```

**Purpose**: Dispatches objects loaded event

**Features**:

- **Event Dispatching**: Dispatches custom event for UI synchronization
- **Event Details**: Includes object count and optional system ID
- **UI Integration**: Perfect for UI component updates
- **System Tracking**: Tracks system loading events

#### **dispatchObjectsLoadedEventFromMap()**

```typescript
export function dispatchObjectsLoadedEventFromMap(
  objects: Record<string, CelestialObject>,
): void;
```

**Purpose**: Dispatches objects loaded event from object map

**Features**:

- **Automatic Counting**: Automatically counts objects from map
- **Event Dispatching**: Dispatches custom event for UI synchronization
- **Convenience**: Convenient wrapper for object map events
- **UI Integration**: Perfect for UI component updates

### **Constants**

#### **DEFAULT_STAR_PROPERTIES**

```typescript
export const DEFAULT_STAR_PROPERTIES: StarProperties = {
  type: CelestialType.STAR,
  isMainStar: true,
  spectralClass: "G2V",
  luminosity: 1.0,
  color: "#FFF9E5",
};
```

**Purpose**: Default properties for star objects

**Note**: `ROOT_OBJECT_TYPES` is a private constant used internally by `isValidRootObject()` and is not exported.

#### **DEFAULT_CELESTIAL_PROPERTIES**

```typescript
export const DEFAULT_CELESTIAL_PROPERTIES = {
  status: CelestialStatus.ACTIVE,
  temperature: 100,
  albedo: 0.3,
  seed: "",
};
```

**Purpose**: Default properties for celestial objects

## 🎮 Usage Examples

### **Data Validation**

```typescript
import {
  validateCelestialData,
  isValidRootObject,
} from "@teskooano/core-state";

// Validate celestial object data
const isValid = validateCelestialData(celestialObject);
if (!isValid) {
  console.error("Invalid celestial object data");
}

// Check if type can be root object
const canBeRoot = isValidRootObject(CelestialType.STAR);
console.log("Can be root:", canBeRoot);

// Type guard for atmosphere properties
const hasAtmosphere = isPlanetAtmosphere(celestialObject.atmosphere);
if (hasAtmosphere) {
  console.log("Atmosphere thickness:", celestialObject.atmosphere.thickness);
}
```

### **Data Processing**

```typescript
import { processStarData, processCelestialData } from "@teskooano/core-state";

// Process star data
const processedStar = processStarData(rawStarData);
console.log("Processed star:", processedStar.name);

// Process celestial object data
const processedObject = processCelestialData(rawCelestialData);
if (processedObject) {
  console.log("Processed object:", processedObject.name);
} else {
  console.error("Failed to process celestial object");
}
```

### **Hierarchy Management**

```typescript
import {
  sortByDependency,
  createHierarchyFromObjects,
} from "@teskooano/core-state";

// Sort objects by dependency
const sortedObjects = sortByDependency(celestialObjects);
console.log(
  "Sorted objects:",
  sortedObjects.map((obj) => obj.name),
);

// Create hierarchy from objects
const hierarchy = createHierarchyFromObjects(celestialObjects);
console.log("Hierarchy:", hierarchy);

// Check parent-child relationships
Object.entries(hierarchy).forEach(([parentId, childIds]) => {
  console.log(`${parentId} has ${childIds.length} children:`, childIds);
});
```

### **Event Dispatching**

```typescript
import {
  dispatchObjectDestroyedEvent,
  dispatchObjectsLoadedEvent,
  dispatchObjectsLoadedEventFromMap,
} from "@teskooano/core-state";

// Dispatch object destroyed event
dispatchObjectDestroyedEvent("asteroid-001");

// Dispatch objects loaded event
dispatchObjectsLoadedEvent(5, "solar-system-1");

// Dispatch objects loaded event from map
const objects = celestialStore.getObjects();
dispatchObjectsLoadedEventFromMap(objects);

// Listen for events
document.addEventListener("celestial-object-destroyed", (event) => {
  console.log("Object destroyed:", event.detail.objectId);
});

document.addEventListener("celestial-objects-loaded", (event) => {
  console.log("Objects loaded:", event.detail.count);
});
```

### **Complete Workflow**

```typescript
import {
  validateCelestialData,
  processCelestialData,
  sortByDependency,
  createHierarchyFromObjects,
  dispatchObjectsLoadedEventFromMap,
} from "@teskooano/core-state";

// Complete object creation workflow
function createCelestialSystem(objects: CelestialObject[]) {
  // Validate all objects
  const validObjects = objects.filter(validateCelestialData);

  if (validObjects.length !== objects.length) {
    console.warn("Some objects failed validation");
  }

  // Process all objects
  const processedObjects = validObjects
    .map(processCelestialData)
    .filter(Boolean) as CelestialObject[];

  // Sort by dependency
  const sortedObjects = sortByDependency(processedObjects);

  // Create hierarchy
  const hierarchy = createHierarchyFromObjects(sortedObjects);

  // Add objects to store
  sortedObjects.forEach((obj) => {
    celestialStore.setObject(obj.id, obj);
  });

  // Set hierarchy
  celestialStore.setHierarchy(hierarchy);

  // Dispatch event
  dispatchObjectsLoadedEventFromMap(celestialStore.getObjects());

  return {
    objects: processedObjects,
    hierarchy,
  };
}
```

### **Component Integration**

```typescript
// In CelestialManager
import {
  validateCelestialData,
  processStarData,
  processCelestialData,
  sortByDependency,
  createHierarchyFromObjects,
  dispatchObjectDestroyedEvent,
  dispatchObjectsLoadedEvent,
} from "../utils/CelestialUtils";

export class CelestialManager {
  public addCelestial<T extends CelestialSpecificPropertiesUnion>(
    data: CelestialObject<T>,
  ): void {
    const processedObject = processCelestialData(data);
    if (processedObject) {
      this.addObject(processedObject);
    }
  }

  public addObjects<T extends CelestialSpecificPropertiesUnion>(
    data: CelestialObject<T>[],
  ): void {
    const sortedData = sortByDependency(data);
    const newHierarchy = createHierarchyFromObjects(sortedData);

    // Add objects and hierarchy
    // ...

    dispatchObjectsLoadedEvent(sortedData.length);
  }

  public markDestroyed(id: string): void {
    // Update object status
    // ...

    dispatchObjectDestroyedEvent(id);
  }
}
```

## 🔄 Integration Points

### **Component Integration**

- **CelestialManager**: Uses for validation, processing, and event dispatching
- **CelestialStore**: Uses for hierarchy management
- **PhysicsSystemAdapter**: Uses for event dispatching
- **Consistency**: Ensures consistent behavior across components

### **Store Integration**

- **CelestialStore**: Uses for hierarchy management
- **Event System**: Uses for UI synchronization
- **Performance**: Optimizes store operations

### **Utility Integration**

- **StoreFilters**: Complements filtering utilities
- **StateAccessor**: Works with state access patterns
- **Performance**: Optimizes utility performance

## 🎯 Key Features

### **Performance Optimization**

- **Efficient Algorithms**: Optimized processing algorithms
- **Minimal Allocations**: Minimal object creation
- **Caching**: Efficient caching for repeated operations
- **Type Safety**: Compile-time type checking

### **Code Reuse**

- **Centralized Logic**: Single source for common operations
- **Consistency**: Consistent behavior across application
- **Maintainability**: Easy to maintain and update
- **Reduced Duplication**: Eliminates duplicate code

### **Type Safety**

- **Full TypeScript**: Complete type safety throughout
- **Type Guards**: Runtime type checking where needed
- **Interface Compliance**: Ensures interface compliance
- **Compile-time Checking**: Compile-time type validation

### **Error Handling**

- **Validation**: Comprehensive data validation
- **Error Logging**: Detailed error logging for debugging
- **Graceful Degradation**: Continues working on validation failures
- **Debug Support**: Comprehensive debugging support

## 🔧 Configuration

### **Validation Rules**

- **Root Objects**: Only specific types can be root objects
- **Parent Requirements**: Non-root objects must have parent IDs
- **Data Integrity**: Ensures data integrity and completeness
- **Type Safety**: Validates type safety and structure

### **Processing Rules**

- **Default Values**: Applies sensible defaults for missing values
- **Status Setting**: Sets appropriate status for objects
- **Seed Generation**: Generates seeds for procedural content
- **Property Merging**: Merges input properties with defaults

### **Event Rules**

- **Event Details**: Includes relevant details in events
- **UI Synchronization**: Perfect for UI component updates
- **Consistency**: Consistent event dispatching across application
- **Performance**: Efficient event dispatching

_The CelestialUtils provides comprehensive, efficient utilities for celestial object operations with full TypeScript type safety and performance optimization._
