# Core State Architecture

## Overview

The core state management system has been refactored from a monolithic approach to a modular, single-responsibility architecture. This addresses the cognitive complexity and overlap issues in the original implementation.

## Architecture Principles

### 1. Separation of Concerns

- **Stores**: Pure data storage with no business logic
- **Managers**: Business logic and operations
- **Services**: External integrations and complex workflows

### 2. Single Responsibility

Each module has one clear purpose:

- `CelestialStore`: Celestial object data and hierarchy
- `SeedStore`: Seed management and persistence
- `PhysicsStore`: Physics-related state (acceleration vectors)
- `CelestialManager`: Celestial object lifecycle operations

### 3. Clean APIs

- Functional APIs grouped by domain (`celestial.*`, `seed.*`, `physics.*`, `simulation.*`)
- Consistent naming and parameter patterns
- Clear separation between data access and operations

## Module Structure

### Stores (`stores/`)

Pure data storage with RxJS observables:

```typescript
// CelestialStore - manages celestial objects and hierarchy
celestialStore.getObjects();
celestialStore.setObject(id, object);
celestialStore.getHierarchy();
celestialStore.addChild(parentId, childId);

// SeedStore - manages seed state and localStorage
seedStore.getCurrentSeed();
seedStore.updateSeed(newSeed);

// PhysicsStore - manages physics-related state
physicsStore.getAccelerationVectors();
physicsStore.updateAccelerationVectors(vectors);
```

### Managers (`managers/`)

Business logic and complex operations:

```typescript
// CelestialManager - consolidates factory and actions logic
celestialManager.addObject(object);
celestialManager.createSolarSystem(data);
celestialManager.addObjects(objects);
celestialManager.updateObject(id, updates);
celestialManager.removeObject(id);
```

### Functional APIs

Grouped by domain for easy discovery:

```typescript
// Celestial operations
celestial.addObject(object);
celestial.createSolarSystem(data);
celestial.getObjects();
celestial.getChildren(parentId);

// Seed operations
seed.getCurrent();
seed.update(newSeed);

// Physics operations
physics.getAccelerationVectors();
physics.updateAccelerationVectors(vectors);

// Simulation operations
simulation.setTimeScale(scale);
simulation.selectObject(id);
```

## Benefits

### 1. Reduced Cognitive Load

- **Before**: 583-line `factory.ts` with complex conditional logic
- **After**: Focused modules with clear responsibilities

### 2. Eliminated Overlap

- **Before**: `factory.ts` and `celestialActions.ts` doing similar things
- **After**: Single `CelestialManager` with clear API

### 3. Better Testability

- Stores can be tested independently
- Business logic isolated in managers
- Clear interfaces for mocking

### 4. Improved Maintainability

- Changes to celestial logic don't affect seed management
- Physics state changes don't impact object hierarchy
- Clear boundaries for refactoring

### 5. Enhanced Discoverability

- Grouped APIs make it easy to find related functions
- Consistent naming patterns
- Clear separation of concerns

## Migration Path

The new architecture maintains backward compatibility through the `actions` object:

```typescript
// Old way (still works)
import { actions } from "@teskooano/core-state";
actions.addCelestialObject(object);
actions.updateSeed(newSeed);

// New way (recommended)
import { celestial, seed } from "@teskooano/core-state";
celestial.addObject(object);
seed.update(newSeed);
```

## Usage Examples

### Creating a Solar System

```typescript
import { celestial } from "@teskooano/core-state";

// Create primary star
const starId = celestial.createSolarSystem(starData);

// Add planets
celestial.addObjects(planetDataArray);

// Get system info
const objects = celestial.getObjects();
const hierarchy = celestial.getHierarchy();
```

### Managing Seeds

```typescript
import { seed } from "@teskooano/core-state";

// Update seed
seed.update("new-seed-value");

// Get current seed
const currentSeed = seed.getCurrent();
```

### Physics Operations

```typescript
import { physics } from "@teskooano/core-state";

// Update acceleration vectors
physics.updateAccelerationVectors(newVectors);

// Get current vectors
const vectors = physics.getAccelerationVectors();
```

## Future Enhancements

1. **Event System**: Centralized event management for state changes
2. **Validation**: Input validation at store boundaries
3. **Persistence**: Automatic state persistence and recovery
4. **Performance**: Optimized updates and change detection
5. **Debugging**: Enhanced debugging tools and state inspection
