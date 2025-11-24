# AGENTS.md

A guide for AI coding agents working on the ThreeJS Background package for Teskooano.

## Package Overview

The **ThreeJS Background package** (`@teskooano/renderer-threejs-background`) provides dynamic, multi-layered background rendering for the Teskooano Three.js scene. It creates a visually appealing and performant space background by composing different types of environmental effects through a flexible, field-based architecture.

## Key Features

- **Multi-Layered Starfield**: Creates several layers of stars with varying densities, sizes, and colors to simulate depth
- **Procedural Nebula**: Generates complex gas nebula using custom GLSL shaders with domain-warped 3D Simplex noise
- **Randomized Palettes**: Nebula colored using randomly selected scientifically-inspired color palettes
- **Parallax Effect**: Background subtly shifts based on camera movement, enhancing the sense of scale
- **Dynamic Animation**: Star layers gently rotate at different speeds, creating a living environment
- **Debug Mode**: Built-in debug visualization for layer boundaries and colors
- **Field-Based Architecture**: Modular system for easy extension with new background effects

## Setup Commands

### Prerequisites

- Node.js 24.2.0
- TypeScript 5.9.2
- Three.js 0.180.0

### Development Commands

```bash
# Run tests
moon run threejs-background:test

# Run tests in watch mode
moon run threejs-background:test:watch

# Build package
moon run threejs-background:build

# Lint code
moon run threejs-background:lint
```

## Package Architecture

### Directory Structure

```
src/
├── index.ts                           # Main entry point with exports
├── BackgroundManager.ts               # Core background management class
├── background-manager/                # Background manager utilities
│   ├── debug-visualizer.ts           # Debug visualization helpers
│   └── index.ts                      # Barrel exports
├── fields/                           # Field-based architecture
│   ├── core/                         # Core field infrastructure
│   │   └── Field.ts                  # Abstract base class for all fields
│   ├── star-field/                   # Star field implementation
│   │   ├── StarField.ts              # Star field class
│   │   ├── star-field.generator.ts   # Star generation logic
│   │   └── types.ts                  # Star field type definitions
│   ├── nebula-field/                 # Nebula field implementation
│   │   ├── NebulaField.ts            # Nebula field class
│   │   ├── palettes.ts               # Color palette definitions
│   │   ├── shaders/                  # GLSL shader files
│   │   │   ├── vertex.glsl           # Vertex shader
│   │   │   └── fragment.glsl         # Fragment shader
│   │   └── types.ts                  # Nebula field type definitions
│   └── galaxy-field/                 # Galaxy field implementation
│       ├── GalaxyField.ts            # Galaxy field class
│       ├── galaxy-field.generator.ts # Galaxy generation logic
│       └── types.ts                  # Galaxy field type definitions
└── vite-env.d.ts                     # Vite environment declarations
```

### Data Flow

1. **Initialization**: BackgroundManager creates default star field and nebula
2. **Field Management**: Each field type (StarField, NebulaField, GalaxyField) extends abstract Field class
3. **Rendering**: Fields generate Three.js objects (Points, Mesh) with custom materials and shaders
4. **Animation**: Fields update their state each frame with rotation and time-based effects
5. **Parallax**: Camera movement triggers parallax effects for depth perception
6. **Debug Mode**: Toggle debug visualization for layer inspection

## Code Style & Conventions

### TypeScript Standards

- **Strict Mode**: Always use strict TypeScript configuration
- **Type Safety**: Use proper typing for all Three.js objects and parameters
- **Interfaces**: Use dedicated interfaces for configuration objects
- **JSDoc**: Include comprehensive documentation for all functions

### Naming Conventions

- **Files**: Use PascalCase for class files (e.g., `BackgroundManager.ts`)
- **Constants**: Use UPPER_CASE for configuration constants
- **Functions**: Use camelCase for function names
- **Classes**: Use PascalCase for class names
- **Interfaces**: Use PascalCase with descriptive names

### Data Standards

- **Vector Math**: Use THREE.Vector3 for calculations and positioning
- **Performance**: Optimize for high-frequency operations with instanced rendering
- **Memory Management**: Proper disposal of Three.js resources
- **Configuration**: Use options objects for complex parameters

## Key Components

### Background Manager

```typescript
export class BackgroundManager {
  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera);
  addField(field: Field): void;
  toggleDebug(): void;
  setCamera(camera: THREE.PerspectiveCamera): void;
  getGroup(): THREE.Group;
  update(deltaTime: number): void;
  dispose(): void;

  // Private methods
  private createDefaultStarField(): void;
  private createDefaultNebula(): void;
  private createDefaultGalaxyField(): void;
}
```

### Abstract Field Class

```typescript
export abstract class Field {
  public object: THREE.Object3D;
  public isDebugMode: boolean = false;
  protected options: FieldOptions;

  constructor(options: FieldOptions);
  abstract update(deltaTime: number, camera?: THREE.PerspectiveCamera): void;
  abstract toggleDebug(debug: boolean): void;
  abstract dispose(): void;
}
```

### Star Field

```typescript
export class StarField extends Field {
  constructor(options: StarFieldOptions);
  update(deltaTime: number, camera?: THREE.PerspectiveCamera): void;
  toggleDebug(debug: boolean): void;
  dispose(): void;

  // Private methods
  private createLayers(layerOptions: StarFieldLayerOptions[]): void;
  private applyParallax(camera: THREE.PerspectiveCamera): void;
  private disposeLayers(): void;
}
```

### Nebula Field

```typescript
export class NebulaField extends Field {
  constructor(options: NebulaFieldOptions);
  update(deltaTime: number): void;
  toggleDebug(debug: boolean): void;
  dispose(): void;

  // Private methods
  private createGeometry(size: number): THREE.IcosahedronGeometry;
  private createMaterial(options: NebulaFieldOptions): THREE.Material;
}
```

### Galaxy Field

```typescript
export class GalaxyField extends Field {
  constructor(options: GalaxyFieldOptions);
  update(deltaTime: number, camera?: THREE.PerspectiveCamera): void;
  toggleDebug(debug: boolean): void;
  dispose(): void;

  // Private methods
  private createGalaxies(options: GalaxyFieldOptions): void;
  private applyParallax(camera: THREE.PerspectiveCamera): void;
  private disposeGalaxies(): void;
}
```

## Testing Strategy

### Test Organization

- **File Convention**: Test files (`<filename>.spec.ts`) adjacent to source files
- **Test Types**: Unit tests for field generation, integration tests for manager interactions
- **Test Data**: Use mock objects and helper functions for consistent testing

### Test Commands

```bash
# Run all tests
moon run threejs-background:test

# Run tests in watch mode
moon run threejs-background:test:watch
```

### Test Patterns

- **Field Testing**: Test individual field classes with mocked dependencies
- **Generator Testing**: Test procedural generation functions with seeded random
- **Manager Testing**: Test BackgroundManager with mocked Three.js scene
- **Shader Testing**: Test GLSL shader compilation and uniform handling

## Data Sources & Validation

### Primary Sources

- **Three.js Documentation**: Official Three.js API reference
- **GLSL Shaders**: Custom fragment and vertex shaders for nebula effects
- **Procedural Generation**: Seeded random functions for deterministic generation
- **Color Palettes**: Scientifically-inspired nebula color schemes

### Data Quality Standards

| Property       | Accuracy               | Source                                   |
| -------------- | ---------------------- | ---------------------------------------- |
| Star Positions | Spherical distribution | Procedural generation with seeded random |
| Nebula Colors  | Scientific accuracy    | Curated color palettes                   |
| Performance    | 60+ FPS                | Optimized instanced rendering            |
| Memory Usage   | Minimal                | Proper resource disposal                 |

### Validation Process

1. **Field Validation**: Ensure proper field initialization and disposal
2. **Shader Validation**: Test GLSL shader compilation and uniform binding
3. **Performance Validation**: Monitor frame rate and memory usage
4. **Visual Validation**: Test debug mode and layer visualization

## Development Guidelines

### Adding New Components

1. **Follow Patterns**: Use established field patterns and naming conventions
2. **Add Documentation**: Include comprehensive JSDoc comments
3. **Include Tests**: Add unit tests for new functionality
4. **Update Exports**: Add new components to appropriate index files
5. **Performance Consider**: Optimize for high-frequency operations

### Field Development

- **Extend Field Class**: All new fields must extend the abstract Field class
- **Implement Required Methods**: Update, toggleDebug, and dispose methods
- **Resource Management**: Proper cleanup of Three.js resources
- **Performance Optimization**: Use instanced rendering for multiple objects

### Shader Development

- **GLSL Standards**: Follow Three.js shader conventions
- **Uniform Management**: Proper uniform binding and updates
- **Performance**: Optimize shader complexity for real-time rendering
- **Documentation**: Include detailed shader comments and explanations

## Common Patterns

### Field Pattern

```typescript
export class CustomField extends Field {
  constructor(options: CustomFieldOptions) {
    super(options);
    this.createField(options);
  }

  public update(deltaTime: number, camera?: THREE.PerspectiveCamera): void {
    // Update field state
    this.object.rotation.y += this.rotationSpeed * deltaTime;

    // Apply parallax if needed
    if (camera && this.parallaxStrength > 0) {
      this.applyParallax(camera);
    }
  }

  public toggleDebug(debug: boolean): void {
    this.isDebugMode = debug;
    // Implement debug visualization
  }

  public dispose(): void {
    // Clean up Three.js resources
    this.object.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
  }
}
```

### Manager Pattern

```typescript
export class BackgroundManager {
  private fields: Field[] = [];

  public addField(field: Field): void {
    this.fields.push(field);
    this.group.add(field.object);
  }

  public update(deltaTime: number): void {
    if (this.camera) {
      this.group.position.copy(this.camera.position);
    }

    this.fields.forEach((field) => field.update(deltaTime, this.camera!));
  }

  public dispose(): void {
    this.fields.forEach((field) => field.dispose());
    this.fields = [];
  }
}
```

### Shader Pattern (Renderer-Aware)

```typescript
export class NebulaField extends Field {
  private rendererBackend: string;

  constructor(options: NebulaFieldOptions) {
    super(options);
    this.rendererBackend = options.rendererBackend ?? "webgl";
    // ... rest of initialization
  }

  private createMaterial(options: NebulaFieldOptions): THREE.Material {
    if (this.rendererBackend === "webgpu") {
      // For WebGPU, use a simple colored material
      const avgColor = new THREE.Color();
      options.colors.forEach((c) => avgColor.add(c));
      avgColor.multiplyScalar(1 / options.colors.length);

      return new THREE.MeshBasicMaterial({
        color: avgColor,
        transparent: true,
        opacity: options.alpha * 0.3,
        depthWrite: false,
        depthTest: true,
        side: THREE.BackSide,
      });
    }

    // For WebGL, use the full GLSL shader
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uAlpha: { value: options.alpha },
        uColors: { value: options.colors },
        uNoiseScale: { value: options.noiseConfig.scale },
        uNoiseOctaves: { value: options.noiseConfig.octaves },
        uNoisePersistence: { value: options.noiseConfig.persistence },
        uNoiseLacunarity: { value: options.noiseConfig.lacunarity },
        uNoiseSeed: { value: options.noiseConfig.seed * 100 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.BackSide,
    });
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;

    // Only update uniforms for GLSL ShaderMaterial (WebGL)
    if ("uniforms" in this.material && this.material.uniforms) {
      (this.material as THREE.ShaderMaterial).uniforms.uTime.value = this.time;
    }

    this.object.rotation.y += this.rotationSpeed * deltaTime;
  }
}
```

## Performance Considerations

### Memory Optimization

- **Instanced Rendering**: Use THREE.InstancedMesh for multiple similar objects
- **Resource Disposal**: Proper cleanup of geometries, materials, and textures
- **Object Pooling**: Reuse Three.js objects where possible
- **Buffer Management**: Efficient buffer attribute management

### Rendering Performance

- **LOD System**: Different detail levels based on camera distance
- **Culling**: Frustum culling for off-screen objects
- **Shader Optimization**: Efficient GLSL shaders with minimal complexity
- **Batch Rendering**: Group similar objects for efficient rendering

### Animation Performance

- **Time-Based Updates**: Use deltaTime for smooth animation
- **Parallax Optimization**: Efficient camera position calculations
- **Rotation Optimization**: Use object rotation instead of position updates
- **Update Throttling**: Limit update frequency for expensive operations

## Troubleshooting

### Common Issues

- **Shader Compilation**: Check GLSL syntax and uniform binding
- **Memory Leaks**: Ensure proper disposal of Three.js resources
- **Performance Issues**: Monitor frame rate and optimize shader complexity
- **Visual Artifacts**: Check depth testing and transparency settings

### Debug Tools

- **Debug Mode**: Toggle debug visualization for layer inspection
- **Performance Monitoring**: Track frame rate and memory usage
- **Shader Validation**: Test shader compilation and uniform updates
- **Field Inspection**: Examine field objects and their properties

## Dependencies

### Core Dependencies

- `three`: 3D rendering library
- `@teskooano/core-math`: Seeded random functions
- `@teskooano/core-state`: State management integration

### Development Dependencies

- `@types/three`: TypeScript definitions for Three.js
- `vitest`: Testing framework
- `typescript`: Type checking
- `vite`: Build tool with GLSL plugin

## Contributing Guidelines

### Code Quality

1. **Follow Patterns**: Use established field patterns and naming conventions
2. **Write Tests**: Add comprehensive test coverage
3. **Document Changes**: Update documentation for new features
4. **Validate Performance**: Ensure no regression in performance

### Architecture Guidelines

1. **Field-Based Design**: Extend abstract Field class for new effects
2. **Performance First**: Optimize for real-time rendering
3. **Memory Efficiency**: Minimize allocations and garbage collection
4. **Shader Quality**: Write efficient and well-documented GLSL shaders

### Review Process

1. **Architecture Review**: Check for proper field pattern usage
2. **Performance Review**: Verify no performance regression
3. **Test Review**: Ensure adequate test coverage
4. **Shader Review**: Validate GLSL shader quality and efficiency

## Integration Points

### With Other Renderer Packages

- **Core Renderer**: Integrates with main Three.js scene
- **Camera Package**: Uses camera position for parallax effects
- **State Management**: Integrates with core state for seeded random
- **Performance**: Optimizes based on device capabilities

### With Core Systems

- **State Management**: Uses seeded random from core state
- **Math System**: Uses seeded random functions for deterministic generation
- **Performance System**: Integrates with performance optimization
- **Scene Management**: Adds background objects to Three.js scene

## Architecture Documentation

For detailed technical documentation, see:

- [README.md](./README.md) - Package overview and usage examples
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed technical architecture
- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes
- [TODO.md](./TODO.md) - Planned improvements and future tasks

## Scientific References

- [Three.js Documentation](https://threejs.org/docs/)
- [WebGL Shader Development](https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html)
- [Procedural Generation Techniques](https://en.wikipedia.org/wiki/Procedural_generation)
- [Astronomical Color Palettes](https://hubblesite.org/contents/articles/the-meaning-of-light-and-color)
