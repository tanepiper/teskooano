---
aliases: [MeshFactory, mesh-factory, celestial-mesh, renderer-factory]
tags: [renderer, threejs, objects, factory, mesh, celestial, creation]
type: Class
package: "@teskooano/renderer-threejs-objects"
name: MeshFactory
dependencies:
  [
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-lighting",
    "@teskooano/celestials-stars",
    "@teskooano/celestials-terrestrial",
    "@teskooano/celestials-gas-giants",
    "@teskooano/celestials-asteroid-field",
    "@teskooano/celestials-comet",
    "@teskooano/celestials-satellite",
    "@teskooano/celestials-oort-cloud",
    "@teskooano/celestials-asteroid",
    "three",
  ]
classes:
  [
    "THREE.Object3D",
    "THREE.PerspectiveCamera",
    "CelestialRenderer",
    "LightingManager",
    "GlobalLODManagerInterface",
  ]
functions: ["createFallbackSphere"]
constants: []
types: ["RenderableCelestialObject", "MeshFactoryConfig", "LODLevel"]
status: active
---

# MeshFactory

A factory class responsible for creating appropriate Three.js mesh objects for different celestial body types, delegating to specialized renderer factories and managing LOD integration.

## 🎯 Purpose

The `MeshFactory` serves as the central factory for creating Three.js Object3D instances representing celestial bodies. It selects the appropriate creation method based on object type, delegates to specialized celestial renderer factories, and handles LOD integration and debug support.

## 🏗️ Architecture

### Core Components

- **Type-Based Selection**: Selects appropriate creation method based on celestial object type
- **Renderer Delegation**: Delegates to specialized celestial renderer factories
- **LOD Integration**: Creates LOD objects with appropriate detail levels
- **Debug Support**: Provides fallback meshes for debugging scenarios
- **Error Handling**: Graceful handling of creation failures

### Factory Structure

```typescript
export class MeshFactory {
  private celestialRenderers: Map<string, CelestialRenderer>;
  private lodManager: GlobalLODManagerInterface;
  private lightingManager: LightingManager;
  private createLodCallback: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
  private camera: THREE.PerspectiveCamera;
  private debugMode: boolean = false;
  private creatorDeps: {
    celestialRenderers: Map<string, CelestialRenderer>;
    lightingManager: LightingManager;
    createLodObject: (
      object: RenderableCelestialObject,
      levels: LODLevel[],
    ) => THREE.LOD;
  };
}
```

## 🔧 Core Methods

### Constructor

```typescript
constructor(config: MeshFactoryConfig)
```

- **celestialRenderers**: Map of specialized renderers by object ID
- **lodManager**: Global LOD manager for performance optimization
- **lightingManager**: Lighting system for light source integration
- **createLodCallback**: Callback for creating LOD objects
- **camera**: Perspective camera for LOD calculations

### Mesh Creation

```typescript
public createObjectMesh(object: RenderableCelestialObject): THREE.Object3D | null
```

- **Type Selection**: Selects appropriate creation method based on object type
- **Renderer Delegation**: Delegates to specialized celestial renderer factories
- **Error Handling**: Provides fallback meshes when creation fails
- **Debug Support**: Creates simplified meshes in debug mode

### Debug Mode

```typescript
public setDebugMode(enabled: boolean): void
public getCamera(): THREE.PerspectiveCamera
```

- **Debug Mode**: Enables simplified fallback mesh creation
- **Camera Access**: Provides camera access for other managers
- **Fallback Rendering**: Uses basic spheres when complex renderers fail

## 🚀 Usage Example

```typescript
// Create mesh factory with dependencies
const meshFactory = new MeshFactory({
  celestialRenderers: rendererMap,
  lodManager: globalLODManager,
  lightingManager: lightingManager,
  camera: perspectiveCamera,
  createLodCallback: (object, levels) => {
    const lod = new THREE.LOD();
    levels.forEach((level) => {
      lod.addLevel(level.object, level.distance);
    });
    return lod;
  },
});

// Create mesh for different object types
const starMesh = meshFactory.createObjectMesh(starObject);
const planetMesh = meshFactory.createObjectMesh(planetObject);
const gasGiantMesh = meshFactory.createObjectMesh(gasGiantObject);

// Debug mode for simplified meshes
meshFactory.setDebugMode(true);
const debugMesh = meshFactory.createObjectMesh(complexObject);

// Access camera for other managers
const camera = meshFactory.getCamera();
```

## 🎨 Celestial Type Support

### Star Objects

```typescript
case CelestialType.STAR:
  mesh = createStarMesh(object, deps);
  break;
```

- **Main Sequence Stars**: G-type, K-type, M-type stars
- **Giant Stars**: Red giants, blue giants with extended atmospheres
- **Stellar Remnants**: White dwarfs, neutron stars, black holes
- **Special Types**: Pulsars, variable stars, binary components

### Planetary Objects

```typescript
case CelestialType.PLANET:
case CelestialType.DWARF_PLANET:
  mesh = createPlanetMesh(object, deps);
  break;
case CelestialType.MOON:
  mesh = createMoonMesh(object, deps);
  break;
case CelestialType.GAS_GIANT:
  mesh = createGasGiantMesh(object, deps);
  break;
```

- **Terrestrial Planets**: Rocky worlds with solid surfaces
- **Gas Giants**: Massive planets with thick atmospheres
- **Moons**: Natural satellites with varied compositions
- **Dwarf Planets**: Small planetary bodies

### Small Bodies

```typescript
case CelestialType.ASTEROID_FIELD:
  mesh = createAsteroidFieldMesh(object, deps);
  break;
case CelestialType.COMET:
  mesh = createCometMesh(object, deps);
  break;
case CelestialType.SATELLITE:
  mesh = createSatelliteMesh(object, deps);
  break;
case CelestialType.OORT_CLOUD:
  mesh = createOortCloudMesh(object, deps);
  break;
case CelestialType.ASTEROID:
  mesh = createAsteroidMesh(object, deps);
  break;
```

- **Asteroid Fields**: Particle systems representing asteroid belts
- **Comets**: Icy bodies with tails and orbital characteristics
- **Satellites**: Artificial objects in orbit
- **Oort Cloud**: Distant icy body populations

## 🔧 Creation Process

### Type-Based Selection

```typescript
switch (object.type) {
  case CelestialType.STAR:
    mesh = createStarMesh(object, deps);
    break;
  case CelestialType.PLANET:
  case CelestialType.DWARF_PLANET:
    mesh = createPlanetMesh(object, deps);
    break;
  case CelestialType.MOON:
    mesh = createMoonMesh(object, deps);
    break;
  case CelestialType.GAS_GIANT:
    mesh = createGasGiantMesh(object, deps);
    break;
  case CelestialType.ASTEROID_FIELD:
    mesh = createAsteroidFieldMesh(object, deps);
    break;
  case CelestialType.COMET:
    mesh = createCometMesh(object, deps);
    break;
  case CelestialType.SATELLITE:
    mesh = createSatelliteMesh(object, deps);
    break;
  case CelestialType.OORT_CLOUD:
    mesh = createOortCloudMesh(object, deps);
    break;
  case CelestialType.ASTEROID:
    mesh = createAsteroidMesh(object, deps);
    break;
  default:
    console.warn(
      `[MeshFactory] No mesh creation logic for type: ${object.type}`,
    );
    mesh = createFallbackSphere(object);
}
```

### Dependencies Injection

```typescript
const deps = {
  celestialRenderers: this.celestialRenderers,
  createLodObject: this.createLodCallback,
  lightingManager: this.lightingManager,
};
```

- **Renderer Access**: Provides access to specialized renderers
- **LOD Creation**: Provides LOD object creation callback
- **Lighting Integration**: Provides lighting manager for light sources

### Error Handling

```typescript
try {
  // Attempt to create mesh
  mesh = createSpecializedMesh(object, deps);
} catch (error) {
  console.error(`[MeshFactory] Error creating mesh for ${object.id}:`, error);
  // Fallback to basic sphere
  mesh = createFallbackSphere(object);
}
```

## 🎯 Performance Considerations

### Type-Based Optimization

- **Specialized Renderers**: Each celestial type has optimized renderer
- **LOD Integration**: Level of detail reduces rendering overhead
- **Caching**: Renderer instances are cached for reuse

### Debug Mode Performance

- **Simplified Meshes**: Debug mode creates basic spheres for performance
- **Fallback Rendering**: Ensures rendering continues even with complex failures
- **Error Recovery**: Graceful handling of creation failures

### Memory Management

- **Resource Sharing**: Dependencies are shared across creators
- **Efficient Delegation**: Minimal overhead in factory delegation
- **Cleanup Support**: Proper disposal of created resources

## 🔧 Integration Points

### Celestial Renderer Integration

- **Specialized Factories**: Delegates to type-specific creation functions
- **Renderer Caching**: Manages renderer instances for reuse
- **LOD Integration**: Coordinates with LOD system for performance

### Lighting System Integration

- **Light Source Creation**: Provides lighting manager to creators
- **Shadow Integration**: Supports shadow casting setup
- **Dynamic Lighting**: Enables real-time lighting updates

### LOD System Integration

- **LOD Creation**: Provides callback for LOD object creation
- **Distance Management**: Coordinates with camera for LOD levels
- **Performance Optimization**: Reduces detail for distant objects

## 📚 Related Components

- **[[ObjectLifecycleManager]]** - Uses MeshFactory for object creation
- **[[GlobalLODManager]]** - Manages LOD objects for performance
- **[[LightingManager]]** - Provides lighting integration for creators
- **[[createFallbackSphere]]** - Fallback mesh creation function
- **[[celestials-stars]]** - Star-specific renderer creation
- **[[celestials-terrestrial]]** - Planet and moon renderer creation
- **[[celestials-gas-giants]]** - Gas giant renderer creation

## 🏛️ Architecture Patterns

- **Factory Pattern**: Creates appropriate objects based on type
- **Delegation Pattern**: Delegates to specialized creators
- **Dependency Injection**: Injects dependencies into creators
- **Error Handling Pattern**: Graceful handling of creation failures
- **Fallback Pattern**: Provides fallback meshes when creation fails

## 🔍 Debug Features

### Debug Mode

- **Simplified Rendering**: Creates basic spheres for debugging
- **Performance Testing**: Enables performance testing with simple meshes
- **Error Isolation**: Isolates rendering issues from complex mesh creation

### Error Handling

- **Creation Failures**: Handles failures in specialized creators
- **Type Support**: Warns about unsupported celestial types
- **Fallback Rendering**: Ensures rendering continues with fallback meshes

### Logging and Monitoring

- **Creation Logging**: Logs mesh creation attempts and results
- **Error Reporting**: Provides detailed error information for debugging
- **Performance Monitoring**: Tracks creation performance and success rates

## 🔮 Future Enhancements

### Optimization Opportunities

- **Performance Optimization**: Implement mesh caching and reuse for frequently created objects
- **Memory Optimization**: Add mesh pooling and reuse for frequently created/destroyed objects
- **Code Optimization**: Optimize mesh creation calculations with spatial partitioning for large numbers of objects
- **Architecture Optimization**: Implement mesh LOD system to reduce complexity for distant objects

### Potential Improvements

- **Feature Enhancement**: Add support for more celestial object types and specialized renderers
- **Integration Enhancement**: Improve integration with physics engine for more accurate mesh positioning
- **API Enhancement**: Add more granular control over mesh creation and rendering
- **User Experience**: Add more debug visualization options and performance monitoring tools

---

_The MeshFactory provides the essential factory pattern for creating appropriate Three.js meshes for different celestial body types, ensuring optimal rendering performance and graceful error handling._
