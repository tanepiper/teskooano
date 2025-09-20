# AGENTS.md

A guide for AI coding agents working on the ThreeJS Lighting package for Teskooano.

## Package Overview

The **ThreeJS Lighting package** (`@teskooano/renderer-threejs-lighting`) is a sophisticated lighting management system that provides dynamic, emissive light sources and shadow casting within the Teskooano Three.js rendering pipeline. It features a component-based architecture with automatic shadow casting and performant light source queries.

## Key Features

- **Component-Based Architecture**: Light sources are managed as components linked to celestial objects
- **Dynamic Shadow Casting**: Automatic planetary shadow casting based on geometric calculations
- **Performant Light Queries**: Efficient `getInfluentialLights()` method for shader calculations
- **State-Driven Updates**: Reactive updates based on celestial object state changes
- **Hierarchical Light Mapping**: Automatic determination of primary light sources for each object
- **Visual Intensity Calculation**: Realistic mapping from stellar luminosity to visual intensity

## Setup Commands

### Prerequisites

- Node.js 24.2.0
- TypeScript 5.9.2
- Three.js for 3D rendering
- RxJS for reactive programming

### Development Commands

```bash
# Run tests
moon run threejs-lighting:test

# Run browser tests
moon run threejs-lighting:test:browser

# Run tests in watch mode
moon run threejs-lighting:test:watch

# Run tests with UI
moon run threejs-lighting:test:ui

# Build package
moon run threejs-lighting:build

# Lint code
moon run threejs-lighting:lint
```

## Package Architecture

### Directory Structure

```
src/
├── index.ts                    # Main entry point
├── setup.ts                   # Global setup and type declarations
├── types.ts                   # TypeScript interfaces and types
├── components/                # Light source components
│   ├── LightSourceComponent.ts # Wrapper for THREE.Light with celestial object
│   └── index.ts
├── managers/                  # Core management classes
│   ├── LightingManager.ts     # Central registry for light sources and shadows
│   └── index.ts
├── utils/                     # Utility functions
│   ├── intensity.ts           # Visual intensity calculations
│   ├── light-source-map.ts    # Hierarchical light source mapping
│   └── index.ts
└── __tests__/                 # Test files
    ├── LightManager.spec.ts   # Main test suite
    └── test-utils.ts          # Test helper functions
```

### Data Flow

1. **Hierarchy Calculation**: `calculateLightSourceMaps()` determines primary light sources
2. **Component Creation**: `LightSourceComponent` wraps THREE.Light with celestial object
3. **Registration**: `LightingManager` registers components and manages scene integration
4. **Shadow Casting**: Dynamic shadow calculations based on geometric relationships
5. **Light Queries**: Efficient retrieval of influential lights for shader calculations

## Code Style & Conventions

### TypeScript Standards

- **Strict Mode**: Always use strict TypeScript configuration
- **Type Safety**: Use proper typing for all Three.js objects and celestial data
- **Interfaces**: Use dedicated interfaces for configuration objects
- **JSDoc**: Include comprehensive documentation for all functions

### Naming Conventions

- **Files**: Use kebab-case for file names (e.g., `light-source-component.ts`)
- **Constants**: Use UPPER_CASE for configuration constants
- **Functions**: Use camelCase for function names
- **Classes**: Use PascalCase for class names
- **Interfaces**: Use PascalCase with descriptive names

### Data Standards

- **Vector Math**: Use THREE.Vector3 for all position calculations
- **Performance**: Minimize object creation, use efficient distance calculations
- **Memory Management**: Proper disposal of Three.js resources
- **State Management**: Use reactive patterns with RxJS subscriptions

## Key Components

### Core Manager

```typescript
export class LightingManager extends StateSubscriptionMixin {
  // Central registry for light sources and shadow casting
  constructor(scene: THREE.Scene, renderableObjects$?: Observable);
  register(component: LightSourceComponent, meshGroup?: THREE.Object3D): void;
  unregister(objectId: string): void;
  getInfluentialLights(
    targetObject: RenderableCelestialObject,
    maxLights?: number,
  ): LightSourceComponent[];
  registerShadowCaster(
    objectId: string,
    mesh: THREE.Object3D,
    object: RenderableCelestialObject,
  ): void;
}
```

### Light Source Component

```typescript
export class LightSourceComponent {
  // Wrapper for THREE.Light with celestial object synchronization
  constructor(object: RenderableCelestialObject, options?: LightSourceOptions);
  update(): void;
  dispose(): void;
  readonly light: THREE.Light;
  celestialObject: RenderableCelestialObject;
}
```

### Utility Functions

```typescript
// Calculate visual intensity from stellar luminosity
export function calculateVisualIntensity(luminosity_L_sun: number): number;

// Determine primary light sources for all objects
export function calculateLightSourceMaps(
  objects: Record<string, CelestialObject>,
): Record<string, string | undefined>;
```

## Testing Strategy

### Test Organization

- **File Convention**: Test files (`<filename>.spec.ts`) in `__tests__` directory
- **Test Types**: Unit tests for components, integration tests for manager functionality
- **Test Data**: Use mock objects and helper functions for consistent testing

### Test Commands

```bash
# Run all tests
moon run threejs-lighting:test

# Run browser tests
moon run threejs-lighting:test:browser

# Run specific test file
moon run threejs-lighting:test -- LightManager.spec.ts

# Run tests with UI
moon run threejs-lighting:test:ui
```

### Test Patterns

- **Component Testing**: Test LightSourceComponent creation and updates
- **Manager Testing**: Test registration, unregistration, and light queries
- **Shadow Testing**: Test dynamic shadow casting calculations
- **Integration Testing**: Test with mock Three.js scene and objects

## Data Sources & Validation

### Primary Sources

- **Renderable Objects**: From core state via `renderableObjects$` stream
- **Celestial Hierarchy**: Parent-child relationships for light source mapping
- **Stellar Properties**: Luminosity, color, and temperature for intensity calculations
- **Position Data**: Real-time position updates for light and shadow calculations

### Data Quality Standards

| Property        | Accuracy           | Source                           |
| --------------- | ------------------ | -------------------------------- |
| Light Positions | High precision     | Real-time object positions       |
| Light Intensity | Visual mapping     | Stellar luminosity calculations  |
| Shadow Casting  | Geometric accuracy | Position and radius calculations |
| Performance     | 60 FPS target      | Efficient distance calculations  |

### Validation Process

1. **Component Validation**: Ensure proper light source creation and updates
2. **Shadow Validation**: Verify geometric shadow casting calculations
3. **Performance Validation**: Monitor light query performance
4. **Integration Validation**: Test with full rendering system

## Development Guidelines

### Adding New Light Types

1. **Update LightSourceComponent**: Add support for new THREE.Light types
2. **Update Intensity Calculation**: Add type-specific intensity calculations
3. **Update Shadow Casting**: Add support for new light types in shadow calculations
4. **Add Tests**: Include comprehensive test coverage
5. **Document Usage**: Update documentation and examples

### Performance Optimization

- **Distance Calculations**: Use squared distance to avoid square root operations
- **Shadow Updates**: Throttle shadow casting updates to maintain performance
- **Light Queries**: Efficient sorting and filtering of influential lights
- **Memory Management**: Proper disposal of Three.js resources

### Memory Management

- **Disposal**: Properly dispose of Three.js light resources
- **Component Cleanup**: Clean up component references and subscriptions
- **Shadow Cleanup**: Remove shadow caster registrations
- **Resource Management**: Limit cache sizes to prevent memory leaks

## Common Patterns

### Component Registration Pattern

```typescript
export class LightingManager {
  public register(
    component: LightSourceComponent,
    meshGroup?: THREE.Object3D,
  ): void {
    if (this.lightSources.has(component.celestialObject.id)) {
      this.unregister(component.celestialObject.id);
    }
    this.lightSources.set(component.celestialObject.id, component);
    // Add to scene or mesh group
  }
}
```

### Shadow Casting Pattern

```typescript
export class LightingManager {
  private updateShadowCasting(): void {
    // Disable all shadow casting
    // For each light source, determine which objects should cast shadows
    // Enable shadow casting for objects blocking light rays
  }
}
```

### Light Query Pattern

```typescript
export class LightingManager {
  public getInfluentialLights(
    targetObject: RenderableCelestialObject,
    maxLights = 4,
  ): LightSourceComponent[] {
    // Calculate influence for each light source
    // Sort by influence and return top N lights
  }
}
```

## Performance Considerations

### Rendering Performance

- **Light Updates**: Efficient position and property updates
- **Shadow Calculations**: Throttled shadow casting updates
- **Distance Calculations**: Squared distance for performance
- **Query Optimization**: Efficient light source filtering

### Data Processing

- **State Synchronization**: Reactive updates based on state changes
- **Hierarchy Traversal**: Efficient light source mapping
- **Geometric Calculations**: Optimized shadow casting algorithms
- **Memory Usage**: Minimize object creation and garbage collection

## Troubleshooting

### Common Issues

- **Light Not Appearing**: Check component registration and scene attachment
- **Shadow Problems**: Verify shadow caster registration and geometric calculations
- **Performance Issues**: Monitor light query performance and shadow update frequency
- **Memory Leaks**: Verify proper disposal of components and resources

### Debug Tools

- **Component Inspection**: Check registered light sources and their properties
- **Shadow Debugging**: Verify shadow caster positions and calculations
- **Performance Monitoring**: Monitor light query times and shadow update frequency
- **State Inspection**: Check light source mapping and hierarchy

## Dependencies

### Core Dependencies

- `@teskooano/core-state`: State management and subscriptions
- `@teskooano/data-types`: TypeScript interfaces and enums
- `@teskooano/core-math`: Mathematical utilities and vector operations
- `@teskooano/renderer-threejs-helpers`: Three.js helper functions
- `@teskooano/renderer-threejs-core`: Core rendering utilities

### Development Dependencies

- `vitest`: Testing framework
- `@vitest/browser`: Browser testing support
- `@vitest/ui`: Test UI interface
- `@playwright/test`: End-to-end testing
- `typescript`: Type checking
- `three`: 3D rendering library

## Contributing Guidelines

### Code Quality

1. **Follow Patterns**: Use established component and manager patterns
2. **Write Tests**: Add comprehensive test coverage
3. **Document Changes**: Update documentation for new features
4. **Validate Performance**: Ensure no regression in lighting performance

### Architecture Guidelines

1. **Component-Based**: Use component pattern for light sources
2. **Separation of Concerns**: Keep lighting separate from rendering
3. **Performance First**: Optimize for 60 FPS rendering
4. **Memory Efficiency**: Minimize allocations and garbage collection

### Review Process

1. **Architecture Review**: Check for proper pattern usage
2. **Performance Review**: Verify no performance regression
3. **Test Review**: Ensure adequate test coverage
4. **Integration Review**: Test with full rendering system

## Integration Points

### With Other Renderer Packages

- **Objects Manager**: Registers light sources for celestial objects
- **Scene Manager**: Manages light attachment to scene or mesh groups
- **Shader System**: Provides light data for shader calculations
- **Debug System**: Integrates with debug visualization system

### With Core Systems

- **State Management**: Subscribes to renderable objects stream
- **Physics System**: Uses physics state for light positioning
- **Celestial System**: Integrates with celestial object hierarchy
- **Event System**: Handles object lifecycle events

## Architecture Documentation

For detailed technical documentation, see:

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Complete system architecture
- [README.md](./README.md) - Usage examples and overview
- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes
- [TODO.md](./TODO.md) - Planned improvements and features

## Scientific References

- [Three.js Lighting Documentation](https://threejs.org/docs/#api/en/lights/Light)
- [WebGL Lighting Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
- [Stellar Luminosity Calculations](https://en.wikipedia.org/wiki/Stellar_luminosity)
- [Shadow Mapping Techniques](https://en.wikipedia.org/wiki/Shadow_mapping)
