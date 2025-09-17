---
aliases: [RingMaterials, RingMaterial, AccretionDiskMaterial]
tags: [renderer, threejs, rings, materials, shader]
type: class
package: "@teskooano/celestials-rings"
file: "src/material.ts"
extends: "THREE.ShaderMaterial"
status: active
---

# Ring Materials

Comprehensive collection of shader materials for ring system rendering, including standard ring materials and specialized accretion disk materials with physics-based properties.

## Overview

The ring material system provides specialized shader materials for planetary rings and accretion disks, enabling realistic ring rendering with enhanced axial inclination controls, dynamic lighting, and shadow casting. All materials extend Three.js `ShaderMaterial` and use custom GLSL shaders for optimal performance and visual quality.

## Material Classes

### RingMaterial

Standard material for celestial object rings with enhanced axial inclination controls and ring segmentation.

#### Features

- **Enhanced Axial Inclination**: Individual ring tilt, system tilt, and parent tilt inheritance
- **Ring Segmentation**: Configurable ring segmentation and density variations
- **Dynamic Lighting**: Support for multiple light sources and shadow casting
- **Precession Support**: Ring systems can precess over time
- **Performance Optimization**: LOD-controlled complexity

#### Constructor

```typescript
constructor(
  ringColor: Color = new Color(0xeeddaa),
  options: {
    opacity?: number;
    detailLevel?: "high" | "medium" | "low" | "very-low";
    rotationRate?: number;
    axialInclination?: number;
    ringTilt?: number;
    inheritParentTilt?: boolean;
    segmentDensity?: number;
    segmentWidth?: number;
    particleDetail?: number;
    densityVariation?: number;
  } = {}
)
```

#### Options

- `ringColor` - Base color for the ring (default: 0xeeddaa)
- `opacity` - Ring opacity (default: 0.8)
- `detailLevel` - LOD detail level
- `rotationRate` - Ring rotation rate
- `axialInclination` - Ring system axial inclination
- `ringTilt` - Individual ring tilt
- `inheritParentTilt` - Whether to inherit parent's axial tilt
- `segmentDensity` - Number of segments per ring
- `segmentWidth` - Width of each segment (0.0-1.0)
- `particleDetail` - Intensity of particle detail
- `densityVariation` - Intensity of density variations

#### Material Properties

- **Defines**: MAX_LIGHTS (4), MAX_SHADOW_CASTERS (4)
- **Uniforms**: color, opacity, time, rotationAngle, rotationRate, uParentPosition, uParentRadius, uNumLights, uLightSources, uNumShadowCasters, uShadowCasters, uDynamicAmbientIntensity, uAxialInclination, uRingTilt, uInheritParentTilt, uParentAxialTilt, uPrecessionAngle, uPrecessionRate, uSegmentDensity, uSegmentWidth, uParticleDetail, uDensityVariation
- **Shaders**: [[celestials/rings/ring.vertex.glsl|Ring Vertex Shader]], [[celestials/rings/ring.fragment.glsl|Ring Fragment Shader]]

### AccretionDiskMaterial

Specialized material for accretion disks around black holes and compact objects with physics-based properties.

#### Features

- **Physics-Based Properties**: Temperature, accretion rate, emission type
- **Relativistic Effects**: Support for relativistic accretion disks
- **Temperature-Based Emission**: Color changes based on temperature
- **Inner Edge Radius**: Configurable inner edge in gravitational radii
- **Enhanced Axial Inclination**: Same axial controls as standard rings

#### Constructor

```typescript
constructor(
  diskColor: Color = new Color(0xffffff),
  options: {
    opacity?: number;
    detailLevel?: "high" | "medium" | "low" | "very-low";
    rotationRate?: number;
    temperature?: number;
    accretionRate?: number;
    emissionType?: "thermal" | "synchrotron" | "mixed";
    isRelativistic?: boolean;
    innerEdgeRadius?: number;
    axialInclination?: number;
    ringTilt?: number;
    inheritParentTilt?: boolean;
  } = {}
)
```

#### Options

- `diskColor` - Base color for the accretion disk (default: white)
- `opacity` - Disk opacity (default: 0.9)
- `temperature` - Temperature in Kelvin (default: 10000)
- `accretionRate` - Accretion rate in solar masses per year (default: 1e-8)
- `emissionType` - Type of emission ("thermal", "synchrotron", "mixed")
- `isRelativistic` - Whether to apply relativistic effects
- `innerEdgeRadius` - Inner edge radius in gravitational radii (default: 3.0)

#### Material Properties

- **Defines**: MAX_LIGHTS (4), MAX_SHADOW_CASTERS (4)
- **Uniforms**: color, opacity, time, rotationAngle, rotationRate, uParentPosition, uParentRadius, uNumLights, uLightSources, uNumShadowCasters, uShadowCasters, uDynamicAmbientIntensity, uIsAccretionDisk, uTemperature, uAccretionRate, uEmissionType, uIsRelativistic, uInnerEdgeRadius, uAxialInclination, uRingTilt, uInheritParentTilt, uParentAxialTilt, uPrecessionAngle, uPrecessionRate
- **Shaders**: [[celestials/rings/ring.vertex.glsl|Ring Vertex Shader]], [[celestials/rings/accretion-disk.fragment.glsl|Accretion Disk Fragment Shader]]

## Common Features

### Dynamic Lighting System

Both materials support:

- **Multiple Light Sources**: Up to 4 light sources (configurable)
- **Real-time Updates**: Light positions and intensities updated per frame
- **Efficient Array Management**: Automatic array resizing for performance
- **Light Attenuation**: Centralized light attenuation calculations

### Shadow Casting System

Both materials support:

- **Multiple Shadow Casters**: Up to 4 shadow casters (configurable)
- **Real-time Shadow Calculations**: Ray-sphere intersection tests
- **Penumbra Effects**: Soft shadow edges for realistic appearance
- **Performance Optimization**: Efficient shadow caster management

### Enhanced Axial Inclination Controls

Both materials support:

- **Individual Ring Tilt**: Each ring can have its own tilt
- **System Axial Inclination**: Overall tilt of the ring system
- **Parent Tilt Inheritance**: Rings can inherit parent body's axial tilt
- **Precession**: Ring systems can precess over time

## Update Methods

### RingMaterial.update

```typescript
update(
  time: number,
  parentPosition: Vector3,
  parentRadius: number,
  lightSources?: LightSourcesMap,
  shadowCasters?: { position: Vector3; radius: number }[],
  parentAxialTilt?: Vector3,
  precessionRate?: number
): void
```

Updates the ring material with current time and pre-calculated data.

### AccretionDiskMaterial.update

```typescript
update(
  time: number,
  parentPosition: Vector3,
  parentRadius: number,
  lightSources?: LightSourcesMap,
  shadowCasters?: { position: Vector3; radius: number }[],
  parentAxialTilt?: Vector3,
  precessionRate?: number
): void
```

Updates the accretion disk material with current time and pre-calculated data.

## Performance Considerations

### Array Management

- **Dynamic Resizing**: Arrays resize automatically based on active lights/shadow casters
- **Memory Optimization**: Efficient memory usage with proper cleanup
- **Update Optimization**: Only updates when array sizes change

### Shader Optimization

- **LOD Control**: Complexity reduces with distance
- **Efficient Calculations**: Optimized shader code for real-time performance
- **GPU Optimization**: Shader code optimized for GPU execution

### Material Caching

- **Reuse Across LOD**: Materials cached and reused across LOD levels
- **Efficient Updates**: Minimal uniform updates for performance
- **Memory Management**: Proper disposal of materials and textures

## Usage Examples

### Standard Ring Material

```typescript
import { RingMaterial } from "@teskooano/celestials-rings";
import * as THREE from "three";

const ringMaterial = new RingMaterial(new THREE.Color(0xeeddaa), {
  opacity: 0.7,
  rotationRate: 0.01,
  axialInclination: 0.1,
  ringTilt: 0.02,
  inheritParentTilt: true,
  segmentDensity: 50.0,
  segmentWidth: 0.8,
  particleDetail: 0.3,
  densityVariation: 0.4,
});
```

### Accretion Disk Material

```typescript
import { AccretionDiskMaterial } from "@teskooano/celestials-rings";
import * as THREE from "three";

const accretionDiskMaterial = new AccretionDiskMaterial(
  new THREE.Color(0xffffff),
  {
    opacity: 0.9,
    temperature: 10000,
    accretionRate: 1e-8,
    emissionType: "thermal",
    isRelativistic: true,
    innerEdgeRadius: 3.0,
    inheritParentTilt: false,
  },
);
```

## Integration with Ring System

The materials are used by:

1. **RingSystemRenderer**: Manages material creation and updates
2. **LOD System**: Different materials for different LOD levels
3. **Lighting System**: Dynamic lighting and shadow casting
4. **Physics System**: Physics-based properties for accretion disks

## Dependencies

- **Three.js ShaderMaterial**: Base material class
- **LightArrayUtils**: Utility functions for light array management
- **GLSL Shaders**: Custom shader implementations for each material type

## 🔗 Related

- [[celestials/rings/RingSystemRenderer|Ring System Renderer]] - Renderer that uses these materials
- [[celestials/rings/ring.vertex.glsl|Ring Vertex Shader]] - Ring vertex shader
- [[celestials/rings/ring.fragment.glsl|Ring Fragment Shader]] - Ring fragment shader
- [[celestials/rings/accretion-disk.fragment.glsl|Accretion Disk Fragment Shader]] - Accretion disk fragment shader
