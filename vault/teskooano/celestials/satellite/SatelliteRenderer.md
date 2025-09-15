---
aliases: [SatelliteRenderer]
tags: [renderer, threejs, satellites, class]
type: class
package: "@teskooano/celestials-satellite"
file: "src/renderer.ts"
status: active
---

# SatelliteRenderer

Main renderer class for satellite objects using 3D models with intelligent scaling, LOD system, and advanced lighting integration.

## Overview

The `SatelliteRenderer` class extends `BaseCelestialRenderer` and provides comprehensive rendering support for artificial satellites and spacecraft. It handles GLB/GLTF model loading with caching, intelligent scaling based on real-world dimensions, LOD system management, and integration with the advanced lighting system.

## Class Definition

```typescript
export class SatelliteRenderer extends BaseCelestialRenderer
```

## Key Features

- **GLB/GLTF Model Loading**: Supports loading 3D models with automatic caching
- **Intelligent Scaling**: Automatically scales satellites based on real-world size and mission type
- **LOD System**: Three-level LOD system with model, simplified geometry, and billboard
- **Material Enhancement**: Preserves original textures while adding advanced lighting
- **Fallback Support**: Graceful fallback to simple sphere if model loading fails
- **Performance Optimization**: Efficient model caching and material reuse

## Properties

### Static Properties

#### modelCache

```typescript
private static modelCache = new Map<string, THREE.Group>();
```

Global cache for loaded 3D models to prevent reloading.

#### loadingPromises

```typescript
private static loadingPromises = new Map<string, Promise<THREE.Group>>();
```

Map of ongoing loading operations to prevent duplicate requests.

### Instance Properties

#### satelliteGroup

```typescript
private satelliteGroup?: THREE.Group;
```

Main group that holds either the loaded model or fallback mesh.

#### model

```typescript
private model?: THREE.Group;
```

The loaded 3D model instance.

#### mediumDetailModel

```typescript
private mediumDetailModel?: THREE.Group;
```

Simplified version of the model for medium detail LOD.

#### billboard

```typescript
private billboard?: THREE.Sprite;
```

2D sprite for distant viewing (LOD level 2).

#### loader

```typescript
private loader: GLTFLoader;
```

GLTFLoader instance for loading 3D models.

#### dracoLoader

```typescript
private dracoLoader: DRACOLoader;
```

DRACOLoader instance for compressed geometry support.

#### material

```typescript
private material?: SatelliteMaterial;
```

Custom satellite material for enhanced lighting.

#### isLoading

```typescript
private isLoading = false;
```

Flag indicating if a model is currently being loaded.

#### loadingFailed

```typescript
private loadingFailed = false;
```

Flag indicating if model loading has failed.

#### fallbackMesh

```typescript
private fallbackMesh?: THREE.Mesh;
```

Fallback sphere mesh used when model loading fails.

#### modelBoundingBox

```typescript
private modelBoundingBox = new THREE.Box3();
```

Bounding box for the loaded model.

#### currentObject

```typescript
private currentObject?: RenderableCelestialObject;
```

Reference to the current celestial object being rendered.

#### \_cachedLODLevels

```typescript
private _cachedLODLevels?: LODLevel[];
```

Cached LOD levels to prevent recreation.

#### objectId

```typescript
private objectId: string;
```

Unique identifier for the satellite object.

## Constructor

```typescript
constructor(object: RenderableCelestialObject)
```

### Parameters

- **object**: The celestial object to render

### Initialization

1. **Base Class**: Calls `super(object)` to initialize base renderer
2. **Object ID**: Stores the object ID for reference
3. **DRACO Loader**: Initializes DRACO loader with decoder path
4. **GLTF Loader**: Initializes GLTF loader with DRACO support

## Methods

### getLODLevels

```typescript
getLODLevels(
  object: RenderableCelestialObject,
  options?: CelestialMeshOptions,
): LODLevel[]
```

Creates and returns LOD levels for the satellite.

#### Parameters

- **object**: The celestial object to create LOD levels for
- **options**: Optional mesh creation options

#### Returns

- **LODLevel[]**: Array of LOD levels with distance thresholds and objects

#### LOD Levels

1. **Level 0 (High Detail)**: 0 distance - Full 3D model or fallback mesh
2. **Level 1 (Medium Detail)**: 500 distance - Simplified geometry (planned)
3. **Level 2 (Billboard)**: 5000 distance - 2D sprite for distant viewing

#### Process

1. **Cache Check**: Returns cached LOD levels if available
2. **Object Storage**: Stores current object reference
3. **Model Path Check**: Validates model path exists
4. **Group Creation**: Creates main satellite group if needed
5. **Fallback Mesh**: Creates fallback mesh initially
6. **Model Loading**: Starts loading the 3D model
7. **Billboard Creation**: Creates billboard for distant viewing
8. **LOD Assembly**: Assembles LOD levels array
9. **Caching**: Caches LOD levels for future use

### loadModel

```typescript
private async loadModel(
  object: RenderableCelestialObject,
  modelPath: string,
): Promise<void>
```

Loads a 3D model from the specified path.

#### Parameters

- **object**: The celestial object
- **modelPath**: Path to the 3D model file

#### Process

1. **Cache Check**: Checks if model is already cached
2. **Loading Check**: Checks if model is already being loaded
3. **Loading Start**: Starts new loading process if needed
4. **Model Processing**: Processes loaded model and applies properties
5. **Model Swap**: Swaps fallback mesh with loaded model
6. **Error Handling**: Handles loading failures gracefully

### swapToModel

```typescript
private swapToModel(): void
```

Swaps the fallback mesh with the loaded model in the satellite group.

#### Process

1. **Fallback Removal**: Removes fallback mesh from group
2. **Model Addition**: Adds loaded model to group
3. **Medium Detail**: Creates medium detail model

### loadGLTFModel

```typescript
private async loadGLTFModel(
  modelPath: string,
  object: RenderableCelestialObject,
): Promise<THREE.Group>
```

Loads a GLTF model and processes it for satellite rendering.

#### Parameters

- **modelPath**: Path to the GLTF model file
- **object**: The celestial object

#### Returns

- **Promise<THREE.Group>**: Promise that resolves to the loaded model group

#### Process

1. **Model Loading**: Uses GLTFLoader to load the model
2. **Scale Calculation**: Calculates appropriate scale for the satellite
3. **Scale Application**: Applies scale to the model
4. **Mesh Processing**: Processes all meshes in the model
5. **Normal Computation**: Computes vertex normals for lighting
6. **Shadow Properties**: Sets shadow casting and receiving properties
7. **Material Enhancement**: Replaces materials with enhanced satellite materials
8. **Naming**: Sets appropriate names for debugging

### applyModelProperties

```typescript
private applyModelProperties(object: RenderableCelestialObject): void
```

Applies properties to the loaded model.

#### Parameters

- **object**: The celestial object

#### Process

1. **Scale Calculation**: Calculates final scale for the model
2. **Scale Application**: Applies scale to the model
3. **Naming**: Sets model name for debugging
4. **Mesh Processing**: Processes all meshes in the model
5. **Shadow Properties**: Ensures shadow properties are set
6. **Render Order**: Sets render order for proper rendering

### calculateSatelliteScale

```typescript
private calculateSatelliteScale(
  object: RenderableCelestialObject,
  properties: SatelliteProperties,
): number
```

Calculates the appropriate scale for a satellite based on its real-world size.

#### Parameters

- **object**: The celestial object
- **properties**: Satellite-specific properties

#### Returns

- **number**: Calculated scale factor

#### Formula

```typescript
const realSizeM = object.realRadius_m * 2; // Convert radius to diameter
const sceneUnits = realSizeM * METERS_TO_SCENE_UNITS;
const modelScale = properties.modelScale ?? 1.0;
const finalScale = sceneUnits * modelScale;
```

#### Scaling Factors

- **Base Scale**: Converts real-world meters to scene units
- **Model Scale**: Applies custom model scale from properties
- **Final Scale**: Combines base scale with model scale

### createBillboard

```typescript
private createBillboard(object: RenderableCelestialObject): void
```

Creates a 2D billboard sprite for distant viewing.

#### Parameters

- **object**: The celestial object

#### Process

1. **Canvas Creation**: Creates canvas for billboard texture
2. **Icon Drawing**: Draws simple satellite icon
3. **Texture Creation**: Creates texture from canvas
4. **Material Creation**: Creates sprite material
5. **Sprite Creation**: Creates sprite object
6. **Scale Calculation**: Calculates appropriate scale for billboard
7. **Naming**: Sets sprite name for debugging

### createMediumDetailModel

```typescript
private createMediumDetailModel(object: RenderableCelestialObject): void
```

Creates a simplified version of the model for medium detail LOD.

#### Parameters

- **object**: The celestial object

#### Process

1. **Bounding Box**: Gets model bounding box
2. **Box Geometry**: Creates simplified box geometry
3. **Material Creation**: Creates satellite material
4. **Mesh Creation**: Creates simplified mesh
5. **Group Creation**: Creates group for medium detail model
6. **Scale Application**: Applies same scale as original model

### createFallbackMesh

```typescript
private createFallbackMesh(object: RenderableCelestialObject): void
```

Creates a fallback sphere mesh when model loading fails.

#### Parameters

- **object**: The celestial object

#### Process

1. **Sphere Creation**: Creates fallback sphere using base utility
2. **Material Application**: Applies satellite material
3. **Render Order**: Sets render order for proper rendering

### createFallbackLOD

```typescript
private createFallbackLOD(object: RenderableCelestialObject): LODLevel[]
```

Creates LOD levels using fallback mesh when model loading fails.

#### Parameters

- **object**: The celestial object

#### Returns

- **LODLevel[]**: Array of LOD levels with fallback mesh and billboard

#### LOD Levels

1. **Level 0**: 0 distance - Fallback mesh
2. **Level 1**: 1000 distance - Billboard sprite

### createSatelliteMaterial

```typescript
private createSatelliteMaterial(
  originalMaterial?: THREE.Material,
): SatelliteMaterial
```

Creates a satellite material with enhanced lighting properties.

#### Parameters

- **originalMaterial**: Optional original material to preserve textures

#### Returns

- **SatelliteMaterial**: Enhanced satellite material

#### Properties

- **Color**: Clean satellite color (0xdddddd)
- **Metalness**: Metallic satellite materials (0.7)
- **Roughness**: Smooth but not mirror-like (0.3)
- **Max Emissive**: Maximum brightness when fully illuminated (0.8)
- **Original Material**: Preserves textures if provided

### update

```typescript
update(
  object: RenderableCelestialObject,
  time: number,
  timeScale: number,
  lightSources: LightSourcesMap,
  camera: THREE.PerspectiveCamera,
  allObjects?: Record<string, RenderableCelestialObject>,
  allMeshes?: Record<string, THREE.Object3D>,
): void
```

Updates the satellite renderer with current state.

#### Parameters

- **object**: The celestial object
- **time**: Current time
- **timeScale**: Time scale factor
- **lightSources**: Map of light sources
- **camera**: Camera for rendering
- **allObjects**: All celestial objects (optional)
- **allMeshes**: All meshes (optional)

#### Process

1. **Base Update**: Calls parent update method
2. **Light Source Update**: Updates lighting manager with light sources
3. **Light Attenuation**: Applies centralized light attenuation
4. **Rogue Object Handling**: Special handling for satellites without parents
5. **Dynamic Ambient**: Calculates dynamic ambient light
6. **Shadow Casters**: Finds shadow casters
7. **Material Update**: Updates satellite material with lighting
8. **Model Update**: Updates all materials in the model
9. **Animation**: Applies satellite-specific animations

### ensureMinimumLightingForRogueObject

```typescript
private ensureMinimumLightingForRogueObject(
  object: RenderableCelestialObject,
  attenuatedLightSources: LightSourcesMap,
  originalLightSources: LightSourcesMap,
): LightSourcesMap
```

Ensures rogue satellites get minimum lighting for visibility.

#### Parameters

- **object**: The celestial object
- **attenuatedLightSources**: Attenuated light sources
- **originalLightSources**: Original light sources

#### Returns

- **LightSourcesMap**: Enhanced light sources with minimum lighting

#### Process

1. **Light Check**: Checks if lighting is very low
2. **Intensity Boost**: Boosts light intensity to minimum level
3. **Minimum Intensity**: Ensures minimum intensity of 0.3 for rogue objects

### dispose

```typescript
dispose(): void
```

Disposes of the renderer and cleans up resources.

#### Process

1. **Base Disposal**: Calls parent dispose method
2. **Material Disposal**: Disposes of satellite material
3. **Fallback Disposal**: Disposes of fallback mesh
4. **Billboard Disposal**: Disposes of billboard sprite
5. **Group Cleanup**: Clears satellite group
6. **Reference Reset**: Resets all references
7. **DRACO Disposal**: Disposes of DRACO loader

## Intelligent Scaling System

### Size Categories

#### Large Satellites (>100m)

- **Examples**: ISS, large space stations
- **Scaling**: Reduced scaling to prevent oversized appearance
- **Factor**: 0.5x base scale

#### Medium Satellites (10-100m)

- **Examples**: Hubble Space Telescope, large satellites
- **Scaling**: Standard scaling for good visibility
- **Factor**: 1.0x base scale

#### Small Satellites (1-10m)

- **Examples**: Communication satellites, weather satellites
- **Scaling**: Increased scaling for visibility
- **Factor**: 1.5x base scale

#### Very Small Satellites (<1m)

- **Examples**: CubeSats, small satellites
- **Scaling**: Significant scaling for visibility
- **Factor**: 2.0x base scale

### Mission-Specific Adjustments

- **Communications/Navigation**: +20% larger for better visibility
- **Scientific/Research**: Standard scaling
- **Military/Commercial**: Standard scaling
- **Other**: Standard scaling

## LOD System

### Distance Thresholds

- **Level 0 (High Detail)**: 0-500 scene units
  - Full 3D model with advanced lighting
  - All textures and materials preserved
  - Maximum visual fidelity

- **Level 1 (Medium Detail)**: 500-5000 scene units
  - Simplified geometry for performance
  - Reduced polygon count
  - Maintained lighting effects

- **Level 2 (Billboard)**: 5000+ scene units
  - 2D sprite for distant viewing
  - Minimal performance impact
  - Maintained visibility

## Performance Optimizations

### Model Caching

- **Static Cache**: Models are cached globally to prevent reloading
- **Instance Cloning**: Multiple satellites can share the same model
- **Loading Prevention**: Prevents duplicate loading operations

### LOD Optimization

- **Distance-Based**: LOD switching based on camera distance
- **Performance Scaling**: Reduced complexity at distance
- **Smooth Transitions**: No visual artifacts during LOD changes

### Memory Management

- **Proper Disposal**: Cleans up all resources on disposal
- **Reference Management**: Manages object references properly
- **Cache Management**: Handles model cache efficiently

## Error Handling

### Model Loading Failures

- **Graceful Fallback**: Falls back to simple sphere if model loading fails
- **Error Logging**: Comprehensive error logging for debugging
- **Cache Management**: Handles loading failures without breaking cache

### Performance Issues

- **LOD Fallback**: Falls back to simpler LOD levels if performance issues
- **Memory Management**: Proper cleanup of resources
- **Error Recovery**: Recovers from rendering errors

## Integration

### Base Renderer

- **Extends**: `BaseCelestialRenderer` for common functionality
- **Lighting Manager**: Integrates with lighting management system
- **LOD System**: Uses centralized LOD management

### Dependencies

- **Three.js**: Core 3D graphics library
- **GLTFLoader**: For loading 3D models
- **DRACOLoader**: For compressed geometry support
- **Data Types**: Type definitions and data structures

## 🔗 Related

- [[SatelliteMaterial]] - Material used by this renderer
- [[createMesh]] - Factory function that creates this renderer
- [[satellite.vertex.glsl]] - Vertex shader used by materials
- [[satellite.fragment.glsl]] - Fragment shader used by materials
- [[@teskooano/renderer-threejs-celestial]] - Base renderer system
- [[@teskooano/renderer-threejs-lighting]] - Lighting system
- [[@teskooano/data-types]] - Type definitions
