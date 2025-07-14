# @teskooano/celestials-satellite

This package provides rendering support for artificial satellites and spacecraft in the Teskooano space simulation engine.

## Features

- **3D Model Loading**: Supports loading FBX and other 3D model formats for realistic satellite representation
- **LOD Support**: Provides multiple levels of detail for performance optimization
- **Unified API**: Follows the same interface pattern as other celestial packages for consistent integration
- **Customizable Properties**: Supports mission types, operational status, and component information

## Key Components

- `SatelliteRenderer`: Main renderer class that handles 3D model loading and display
- `createMesh`: Factory function for creating satellite meshes with the unified API
- `SatelliteMaterial`: Specialized material for satellite rendering

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
    modelPath: "models/satellite/satellite.fbx",
    modelScale: 1.0,
    missionType: "communications",
  },
};

const mesh = createMesh(satellite, options);
```

## 3D Model Requirements

- **Supported Formats**: FBX, GLB, GLTF
- **Model Location**: Models should be placed in `public/models/` directory
- **Scaling**: Models are automatically scaled based on the satellite's radius and optional modelScale property
- **Materials**: Models should include their own materials and textures

## Integration

This package integrates with:

- `@teskooano/renderer-threejs-objects` for object lifecycle management
- `@teskooano/renderer-threejs-lod` for level of detail support
- `@teskooano/data-types` for type definitions
