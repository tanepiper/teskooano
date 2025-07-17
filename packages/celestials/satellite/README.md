# @teskooano/celestials-satellite

This package provides rendering support for artificial satellites and spacecraft in the Teskooano space simulation engine.

## Features

- **GLB/GLTF Model Loading**: Supports loading 3D models in GLB and GLTF formats with automatic caching
- **Intelligent Scaling**: Automatically scales satellites based on their real-world size and mission type
- **Advanced Lighting**: Custom shader material that calculates lighting from multiple dynamic light sources
- **LOD System**: Level of Detail system with model at close range and billboard at distance (switches at 5km scene units)
- **Performance Optimized**: Efficient model caching and material reuse
- **Fallback Support**: Graceful fallback to simple sphere if model loading fails

## Key Components

- `SatelliteRenderer`: Main renderer class that handles 3D model loading and display
- `SatelliteLightingMaterial`: Advanced shader-based material with PBR lighting calculations
- `createMesh`: Factory function for creating satellite meshes with the unified API

## Usage

This package is designed to be used by the main renderer system and follows the same patterns as other celestial packages:

```typescript
import { createMesh } from "@teskooano/celestials-satellite";
import type { RenderableCelestialObject } from "@teskooano/data-types";

// Create satellite mesh
const satellite: RenderableCelestialObject = {
  // ... satellite data
  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "models/satellite/satellite.glb",
    modelScale: 1.0,
    missionType: "communications",
  },
};

const mesh = createMesh(satellite, options);
```

## 3D Model Requirements

- **Supported Formats**: GLB, GLTF (preferred over FBX for better performance)
- **Model Location**: Models should be placed in `public/models/` directory
- **Scaling**: Models are automatically scaled based on the satellite's radius and optional modelScale property
- **Materials**: Models should include their own materials and textures - the lighting shader will enhance them

## Intelligent Scaling System

The satellite renderer uses an intelligent scaling system that automatically adjusts satellite sizes based on their real-world dimensions:

### Size-Based Scaling

- **Large Satellites (>100m)**: Reduced scaling to prevent oversized appearance (e.g., ISS)
- **Medium Satellites (10-100m)**: Standard scaling for good visibility (e.g., Hubble)
- **Small Satellites (1-10m)**: Increased scaling for visibility (e.g., communication satellites)
- **Very Small Satellites (<1m)**: Significant scaling for visibility (e.g., cubesats)

### Mission-Specific Adjustments

- **Communications/Navigation**: 20% larger for better visibility
- **Scientific/Research**: Standard scaling
- **Military/Commercial**: Standard scaling
- **Other**: Standard scaling

### Scene Scale Integration

- **Base Scale**: Converts real-world meters to scene units (1 AU = 1000 units)
- **Visibility Multiplier**: 1000x base scale for visibility in space
- **Custom Override**: Supports `modelScale` property for manual adjustments

## Lighting System

The satellite renderer uses an advanced lighting shader that:

- **Calculates Total Fragment Color**: Combines diffuse, specular, and ambient lighting
- **Supports Multiple Light Sources**: Handles up to 4 dynamic light sources
- **Implements Shadow Casting**: Calculates shadows from celestial bodies
- **Dynamic Ambient Lighting**: Adjusts ambient light based on nearby star luminosity
- **PBR Material Support**: Respects metallic and roughness properties
- **Preserves Original Materials**: Enhances rather than replaces original model materials

## LOD System

The satellite renderer implements a three-level Level of Detail (LOD) system optimized for close-up viewing:

### Distance Thresholds

- **Level 0 (High Detail)**: 0-500 scene units - Full 3D model with advanced lighting
- **Level 1 (Medium Detail)**: 500-5000 scene units - Simplified geometry for performance
- **Level 2 (Billboard)**: 5000+ scene units - 2D sprite for distant viewing

### Zoom Behavior

- **Close Zoom**: Satellites remain visible as detailed 3D models when zooming in close
- **Medium Zoom**: Switches to simplified geometry for better performance
- **Distant Zoom**: Automatically switches to billboard for performance at great distances
- **Smooth Transition**: LOD switching is handled seamlessly by the Three.js LOD system
- **Camera Settings**: Optimized camera near plane (0.00001) and orbit controls minDistance allow extremely close viewing of small satellite objects

## Integration

This package integrates with:

- `@teskooano/renderer-threejs-objects` for object lifecycle management
- `@teskooano/renderer-threejs-lod` for level of detail support
- `@teskooano/renderer-threejs-lighting` for advanced lighting calculations
- `@teskooano/data-types` for type definitions
