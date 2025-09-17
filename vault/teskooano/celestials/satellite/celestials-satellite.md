---
aliases: [celestials-satellite]
tags: [renderer, threejs, satellites]
type: index
package: "@teskooano/celestials-satellite"
version: "0.1.0-dev.0"
dependencies:
  [
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-celestial",
    "@teskooano/renderer-threejs-lighting",
    "three",
  ]
classes: [SatelliteRenderer, SatelliteMaterial, createMesh]
status: active
---

# Celestials: Satellite

Renderer for satellites and spacecraft using 3D models with advanced lighting, LOD system, and intelligent scaling.

## Overview

The `@teskooano/celestials-satellite` package provides comprehensive rendering support for artificial satellites and spacecraft in the Teskooano space simulation engine. It features GLB/GLTF model loading, intelligent scaling based on real-world dimensions, advanced PBR lighting, and a sophisticated LOD system optimized for close-up viewing.

## Key Features

### 3D Model Support

- **GLB/GLTF Loading**: Supports loading 3D models in GLB and GLTF formats with automatic caching
- **DRACO Compression**: Built-in support for DRACO-compressed models for better performance
- **Texture Preservation**: Preserves original model textures and materials while enhancing them with lighting
- **Fallback Support**: Graceful fallback to simple sphere if model loading fails

### Intelligent Scaling System

- **Size-Based Scaling**: Automatically scales satellites based on their real-world size and mission type
- **Mission-Specific Adjustments**: Different scaling factors for communications, scientific, military, and other mission types
- **Scene Scale Integration**: Converts real-world meters to scene units (1 AU = 1000 units)
- **Custom Override**: Supports `modelScale` property for manual adjustments

### Advanced Lighting

- **PBR Materials**: Physically-based rendering with metallic and roughness properties
- **Multi-Source Lighting**: Calculates lighting from multiple dynamic light sources
- **Shadow Casting**: Shadows from celestial bodies with soft penumbra effects
- **Dynamic Ambient Lighting**: Adjusts ambient light based on nearby star luminosity
- **Emissive Enhancement**: Automatic emissive lighting in shadows for visibility

### LOD System

- **Three-Level LOD**: High detail (0-500 units), medium detail (500-5000 units), billboard (5000+ units)
- **Close-Up Optimization**: Satellites remain visible as detailed 3D models when zooming in close
- **Performance Scaling**: Simplified geometry and billboard sprites for distant viewing
- **Smooth Transitions**: Seamless LOD switching handled by Three.js LOD system

## Architecture

### Core Components

#### [[celestials/satellite/SatelliteRenderer|Satellite Renderer]]

Main renderer class that handles 3D model loading, scaling, and LOD management.

**Key Responsibilities:**

- GLB/GLTF model loading with caching
- Intelligent scaling calculations
- LOD level creation and management
- Material enhancement and lighting integration
- Fallback mesh creation

#### [[celestials/satellite/SatelliteMaterial|Satellite Material]]

Advanced shader-based material with PBR lighting calculations and texture preservation.

**Key Features:**

- Preserves original model textures
- Multi-source lighting calculations
- Shadow casting with soft penumbra
- Dynamic emissive lighting
- Environment map reflections

#### [[celestials/satellite/createMesh|Create Mesh Factory]]

Factory function for creating satellite meshes with the unified API.

**Features:**

- Unified interface for mesh creation
- Renderer caching and management
- LOD object creation
- Debug mode support

### Shader System

#### [[celestials/satellite/satellite.vertex.glsl|Satellite Vertex Shader]]

Vertex shader that provides world-space position, normal, and UV data for lighting calculations.

#### [[celestials/satellite/satellite.fragment.glsl|Satellite Fragment Shader]]

Fragment shader that implements PBR lighting, shadow casting, and texture sampling.

## Data Structures

### SatelliteProperties

```typescript
interface SatelliteProperties {
  modelPath?: string; // Path to 3D model file
  modelScale?: number; // Custom scaling factor
  missionType?: string; // Mission type for scaling adjustments
  materialProperties?: {
    // Material enhancement properties
    metalness?: number;
    roughness?: number;
    envMapIntensity?: number;
  };
}
```

### CreateMeshOptions

```typescript
interface CreateMeshOptions {
  celestialRenderers: Map<string, CelestialRenderer>;
  createLodObject: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
  lightingManager?: LightingManager;
  debug?: boolean;
}
```

## Usage Examples

### Basic Satellite Creation

```typescript
import { createMesh } from "@teskooano/celestials-satellite";
import type { RenderableCelestialObject } from "@teskooano/data-types";

const satellite: RenderableCelestialObject = {
  id: "iss-001",
  type: CelestialType.SATELLITE,
  name: "International Space Station",
  realRadius_m: 50, // 100m diameter
  position: new THREE.Vector3(0, 0, 0),
  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "models/satellites/iss.glb",
    modelScale: 1.0,
    missionType: "scientific",
    materialProperties: {
      metalness: 0.8,
      roughness: 0.2,
      envMapIntensity: 1.2,
    },
  },
};

const mesh = createMesh(satellite, options);
```

### Custom Scaling

```typescript
const cubesat: RenderableCelestialObject = {
  id: "cubesat-001",
  type: CelestialType.SATELLITE,
  name: "CubeSat",
  realRadius_m: 0.1, // 20cm cube
  position: new THREE.Vector3(0, 0, 0),
  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "models/satellites/cubesat.glb",
    modelScale: 2.0, // Double size for visibility
    missionType: "communications",
  },
};
```

### Debug Mode

```typescript
const mesh = createMesh(satellite, {
  ...options,
  debug: true, // Forces fallback sphere usage
});
```

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

### Scene Scale Integration

- **Base Scale**: Converts real-world meters to scene units (1 AU = 1000 units)
- **Visibility Multiplier**: 1000x base scale for visibility in space
- **Custom Override**: Supports `modelScale` property for manual adjustments

## Lighting System

### PBR Material Properties

- **Metallic**: Controls metallic vs dielectric behavior
- **Roughness**: Controls surface roughness and specular reflection
- **Environment Map**: Reflection intensity from environment
- **Emissive**: Dynamic emissive lighting in shadows

### Multi-Source Lighting

- **Light Sources**: Up to 4 dynamic light sources
- **Shadow Casting**: Soft shadows from celestial bodies
- **Ambient Lighting**: Dynamic ambient based on nearby stars
- **Terminator Handling**: Smooth day/night transitions

### Shadow System

- **Soft Penumbra**: Realistic shadow falloff
- **Multiple Casters**: Support for multiple shadow-casting objects
- **Performance Optimized**: Efficient shadow calculations

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

### Zoom Behavior

- **Close Zoom**: Satellites remain visible as detailed 3D models
- **Medium Zoom**: Switches to simplified geometry
- **Distant Zoom**: Automatically switches to billboard
- **Smooth Transition**: Seamless LOD switching

## Performance Optimizations

### Model Caching

- **Static Cache**: Models are cached globally to prevent reloading
- **Instance Cloning**: Multiple satellites can share the same model
- **Memory Management**: Proper disposal of unused resources

### LOD Optimization

- **Distance-Based**: LOD switching based on camera distance
- **Performance Scaling**: Reduced complexity at distance
- **Smooth Transitions**: No visual artifacts during LOD changes

### Lighting Optimization

- **Efficient Calculations**: Optimized lighting and shadow calculations
- **Clamped Values**: Prevents lighting artifacts and performance issues
- **Early Exits**: Skips calculations when not needed

## Integration

### Dependencies

- **@teskooano/data-types**: Type definitions and data structures
- **@teskooano/renderer-threejs-celestial**: Base renderer and utilities
- **@teskooano/renderer-threejs-lighting**: Advanced lighting system
- **three**: Three.js 3D graphics library

### Integration Points

- **Object Lifecycle**: Integrates with object lifecycle management
- **LOD System**: Uses centralized LOD management
- **Lighting System**: Integrates with advanced lighting calculations
- **Renderer System**: Follows unified renderer patterns

## 3D Model Requirements

### Supported Formats

- **GLB**: Binary glTF format (preferred)
- **GLTF**: JSON glTF format
- **DRACO**: Compressed geometry support

### Model Location

- Models should be placed in `public/models/` directory
- Relative paths from the public directory

### Model Requirements

- **Materials**: Models should include their own materials and textures
- **Scaling**: Models are automatically scaled based on satellite properties
- **Origin**: Models should be centered at origin for proper positioning

## Error Handling

### Model Loading Failures

- **Graceful Fallback**: Falls back to simple sphere if model loading fails
- **Error Logging**: Comprehensive error logging for debugging
- **Cache Management**: Handles loading failures without breaking cache

### Performance Issues

- **LOD Fallback**: Falls back to simpler LOD levels if performance issues
- **Memory Management**: Proper cleanup of resources
- **Error Recovery**: Recovers from rendering errors

## 🔗 Related

- [[celestials/satellite/SatelliteRenderer|Satellite Renderer]] - Main renderer class
- [[celestials/satellite/SatelliteMaterial|Satellite Material]] - Advanced shader material
- [[celestials/satellite/createMesh|Create Mesh Factory]] - Factory function for mesh creation
- [[celestials/satellite/satellite.vertex.glsl|Satellite Vertex Shader]] - Vertex shader
- [[celestials/satellite/satellite.fragment.glsl|Satellite Fragment Shader]] - Fragment shader
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[renderer/threejs-lighting/threejs-lighting|Three.js Lighting System]] - Lighting system
- [[data/data-types/data-types|Data Types]] - Type definitions
