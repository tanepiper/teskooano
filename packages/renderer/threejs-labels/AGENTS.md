# AGENTS.md

A guide for AI coding agents working on the ThreeJS Labels package for Teskooano.

## Package Overview

The **ThreeJS Labels package** (`@teskooano/renderer-threejs-labels`) is a sophisticated 2D label rendering system that provides HTML-based UI elements positioned within the Three.js 3D scene. It features a layer-based architecture with automatic occlusion detection, performance optimization, and support for various label types including celestial object labels, AU distance markers, and prediction labels.

## Key Features

- **Layer-Based Architecture**: Modular system with distinct layers for different UI element types
- **Automatic Occlusion Detection**: Smart raycasting to hide labels behind celestial objects
- **Performance Optimized**: Throttled occlusion checks, caching, and spatial culling
- **CSS2D Rendering**: Uses Three.js CSS2DRenderer for HTML elements in 3D space
- **Custom Web Components**: Reusable HTML custom elements for different label types
- **State-Driven Updates**: Reactive updates based on celestial object state changes
- **Memory Efficient**: Object pooling and efficient resource management

## Setup Commands

### Prerequisites

- Node.js 24.2.0
- TypeScript 5.9.2
- Three.js for 3D rendering
- RxJS for reactive programming

### Development Commands

```bash
# Run tests
moon run threejs-labels:test

# Run browser tests
moon run threejs-labels:test:browser

# Run tests in watch mode
moon run threejs-labels:test:watch

# Run tests with UI
moon run threejs-labels:test:ui

# Build package
moon run threejs-labels:build

# Lint code
moon run threejs-labels:lint
```

## Package Architecture

### Directory Structure

```
src/
├── index.ts                           # Main entry point
├── Layer2DManager.ts                  # Core manager for CSS2D rendering
├── components/                        # Custom web components
│   ├── au-marker-label/              # AU distance marker component
│   │   └── AuMarkerLabelComponent.ts
│   ├── celestial-label/              # Celestial object label component
│   │   └── CelestialLabelComponent.ts
│   └── prediction/                   # Prediction label component
│       └── PredictionLabel.ts
├── layers/                           # Label layer implementations
│   ├── BaseLabelLayer.ts             # Abstract base class for all layers
│   ├── CelestialLabelLayer.ts        # Celestial object labels
│   ├── AuMarkerLabelLayer.ts         # AU distance markers
│   ├── PredictionLabelLayer.ts       # Prediction trajectory labels
│   └── index.ts
├── managers/                         # High-level managers
│   ├── AuMarkerManager.ts            # AU marker system manager
│   └── index.ts
├── types/                           # TypeScript interfaces
│   ├── label-system.ts              # Label system configuration
│   └── index.ts
└── __tests__/                       # Test files
    ├── Layer2DManager.spec.ts       # Main test suite
    └── test-utils.ts                # Test helper functions
```

### Data Flow

1. **Layer Registration**: `Layer2DManager` registers different label layers
2. **Component Creation**: Custom web components are created for each label type
3. **CSS2D Rendering**: Three.js CSS2DRenderer positions HTML elements in 3D space
4. **Occlusion Detection**: Raycasting determines which labels are hidden behind objects
5. **State Updates**: Reactive updates based on celestial object state changes

## Code Style & Conventions

### TypeScript Standards

- **Strict Mode**: Always use strict TypeScript configuration
- **Type Safety**: Use proper typing for all Three.js objects and celestial data
- **Interfaces**: Use dedicated interfaces for configuration objects
- **JSDoc**: Include comprehensive documentation for all functions

### Naming Conventions

- **Files**: Use kebab-case for file names (e.g., `au-marker-label-component.ts`)
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
export class Layer2DManager {
  // Central registry for CSS2D layers and rendering
  constructor(scene: THREE.Scene, container: HTMLElement);
  registerLayer(layerType: CSS2DLayerType, layer: BaseLabelLayer): void;
  update(camera: THREE.PerspectiveCamera, objectManager: ObjectManager): void;
  render(camera: THREE.PerspectiveCamera): void;
  setLayerVisibility(layerType: CSS2DLayerType, visible: boolean): void;
}
```

### Base Label Layer

```typescript
export abstract class BaseLabelLayer {
  // Abstract base class for all label layers
  protected elements: Map<string, CSS2DObject> = new Map();
  public isVisible: boolean = true;
  protected isLabelOccludedOptimized(
    labelId: string,
    labelPosition: OSVector3,
    camera: THREE.PerspectiveCamera,
    objectManager: ObjectManager,
    labelObjectId: string,
  ): boolean;
  public setVisibility(visible: boolean): void;
}
```

### Custom Web Components

```typescript
// AU Marker Label Component
export class AuMarkerLabelComponent extends HTMLElement {
  static TAG_NAME = "teskooano-au-marker";
  static get observedAttributes() {
    return ["data-au-display-value", "data-color"];
  }
  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string,
  ): void;
}

// Celestial Label Component
export class CelestialLabelComponent extends HTMLElement {
  static get observedAttributes() {
    return ["data-name", "data-distance-formatted", "data-speed-formatted"];
  }
  setVisible(visible: boolean): void;
}
```

## Testing Strategy

### Test Organization

- **File Convention**: Test files (`<filename>.spec.ts`) in `__tests__` directory
- **Test Types**: Unit tests for components, integration tests for manager functionality
- **Test Data**: Use mock objects and helper functions for consistent testing

### Test Commands

```bash
# Run all tests
moon run threejs-labels:test

# Run browser tests
moon run threejs-labels:test:browser

# Run specific test file
moon run threejs-labels:test -- Layer2DManager.spec.ts

# Run tests with UI
moon run threejs-labels:test:ui
```

### Test Patterns

- **Component Testing**: Test custom web component creation and attribute updates
- **Manager Testing**: Test layer registration, visibility control, and rendering
- **Occlusion Testing**: Test raycasting and occlusion detection algorithms
- **Integration Testing**: Test with mock Three.js scene and objects

## Data Sources & Validation

### Primary Sources

- **Renderable Objects**: From core state via `renderableObjects$` stream
- **Celestial Hierarchy**: Parent-child relationships for label positioning
- **Position Data**: Real-time position updates for label placement
- **Camera State**: Camera position and orientation for occlusion testing

### Data Quality Standards

| Property            | Accuracy           | Source                                 |
| ------------------- | ------------------ | -------------------------------------- |
| Label Positions     | High precision     | Real-time object positions             |
| Occlusion Detection | Geometric accuracy | Raycasting calculations                |
| Performance         | 60 FPS target      | Throttled updates and caching          |
| Memory Usage        | Efficient          | Object pooling and resource management |

### Validation Process

1. **Component Validation**: Ensure proper custom element creation and updates
2. **Occlusion Validation**: Verify raycasting and occlusion detection accuracy
3. **Performance Validation**: Monitor label update performance and memory usage
4. **Integration Validation**: Test with full rendering system

## Development Guidelines

### Adding New Label Types

1. **Create Custom Component**: Extend HTMLElement for new label type
2. **Create Label Layer**: Extend BaseLabelLayer for new layer type
3. **Register Layer**: Add new layer type to CSS2DLayerType enum
4. **Add Tests**: Include comprehensive test coverage
5. **Document Usage**: Update documentation and examples

### Performance Optimization

- **Occlusion Throttling**: Use throttled occlusion checks to maintain performance
- **Spatial Culling**: Skip occlusion tests for nearby labels
- **Caching**: Cache occlusion results to avoid redundant calculations
- **Memory Management**: Proper disposal of Three.js resources

### Memory Management

- **Disposal**: Properly dispose of Three.js CSS2D objects
- **Component Cleanup**: Clean up component references and subscriptions
- **Layer Cleanup**: Remove layer registrations and clear elements
- **Resource Management**: Limit cache sizes to prevent memory leaks

## Common Patterns

### Layer Registration Pattern

```typescript
export class Layer2DManager {
  public registerLayer(layerType: CSS2DLayerType, layer: BaseLabelLayer): void {
    if (this.layers.has(layerType)) {
      console.warn(
        `Layer for type ${layerType} already registered. Overwriting.`,
      );
      this.layers.get(layerType)?.clear();
    }
    this.layers.set(layerType, layer);

    // Register components required by the layer
    layer.getRequiredComponents().forEach(({ tagName, componentClass }) => {
      if (!customElements.get(tagName)) {
        customElements.define(tagName, componentClass);
      }
    });
  }
}
```

### Occlusion Detection Pattern

```typescript
export class BaseLabelLayer {
  protected isLabelOccludedOptimized(
    labelId: string,
    labelPosition: OSVector3,
    camera: THREE.PerspectiveCamera,
    objectManager: ObjectManager,
    labelObjectId: string,
  ): boolean {
    // Check cache first
    const cached = this.occlusionResults.get(labelId);
    if (cached && now - cached.timestamp < this.occlusionConfig.cacheDuration) {
      return cached.result;
    }

    // Perform raycasting test
    const result = this.performOcclusionTest(
      labelPosition,
      camera,
      objectManager,
      labelObjectId,
    );
    this.occlusionResults.set(labelId, { result, timestamp: now });
    return result;
  }
}
```

### Custom Element Pattern

```typescript
export class CustomLabelComponent extends HTMLElement {
  static get observedAttributes() {
    return ["data-property"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.createElements();
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    this.updateProperty(name, newValue);
  }
}
```

## Performance Considerations

### Rendering Performance

- **CSS2D Updates**: Efficient position and property updates
- **Occlusion Calculations**: Throttled raycasting for performance
- **Distance Calculations**: Squared distance for performance
- **Layer Management**: Efficient layer visibility control

### Data Processing

- **State Synchronization**: Reactive updates based on state changes
- **Position Updates**: Efficient label positioning calculations
- **Occlusion Testing**: Optimized raycasting algorithms
- **Memory Usage**: Minimize object creation and garbage collection

## Troubleshooting

### Common Issues

- **Labels Not Appearing**: Check layer registration and visibility settings
- **Occlusion Problems**: Verify raycasting setup and object manager integration
- **Performance Issues**: Monitor occlusion check frequency and cache settings
- **Memory Leaks**: Verify proper disposal of components and resources

### Debug Tools

- **Layer Inspection**: Check registered layers and their visibility states
- **Occlusion Debugging**: Verify raycasting setup and intersection results
- **Performance Monitoring**: Monitor label update times and memory usage
- **State Inspection**: Check label positioning and attribute updates

## Dependencies

### Core Dependencies

- `@teskooano/core-state`: State management and subscriptions
- `@teskooano/data-types`: TypeScript interfaces and enums
- `@teskooano/core-math`: Mathematical utilities and vector operations
- `@teskooano/renderer-threejs-objects`: Object manager integration
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

1. **Follow Patterns**: Use established layer and component patterns
2. **Write Tests**: Add comprehensive test coverage
3. **Document Changes**: Update documentation for new features
4. **Validate Performance**: Ensure no regression in label performance

### Architecture Guidelines

1. **Layer-Based**: Use layer pattern for different label types
2. **Separation of Concerns**: Keep rendering separate from business logic
3. **Performance First**: Optimize for 60 FPS rendering
4. **Memory Efficiency**: Minimize allocations and garbage collection

### Review Process

1. **Architecture Review**: Check for proper pattern usage
2. **Performance Review**: Verify no performance regression
3. **Test Review**: Ensure adequate test coverage
4. **Integration Review**: Test with full rendering system

## Integration Points

### With Other Renderer Packages

- **Objects Manager**: Integrates with object lifecycle for label positioning
- **Scene Manager**: Manages CSS2D renderer and scene integration
- **Camera System**: Uses camera state for occlusion testing
- **Debug System**: Integrates with debug visualization system

### With Core Systems

- **State Management**: Subscribes to renderable objects stream
- **Physics System**: Uses physics state for object positioning
- **Celestial System**: Integrates with celestial object hierarchy
- **Event System**: Handles object lifecycle events

## Architecture Documentation

For detailed technical documentation, see:

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Complete system architecture
- [README.md](./README.md) - Usage examples and overview
- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes

## Scientific References

- [Three.js CSS2DRenderer Documentation](https://threejs.org/docs/#examples/en/renderers/CSS2DRenderer)
- [Web Components Documentation](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Raycasting Techniques](https://en.wikipedia.org/wiki/Ray_casting)
- [Performance Optimization Best Practices](https://developer.mozilla.org/en-US/docs/Web/Performance)
