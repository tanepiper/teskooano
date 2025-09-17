---
aliases: [NeutronStarRenderer, NeutronStarMaterial]
tags: [renderer, threejs, stars, remnants, neutron-star]
type: class
package: "@teskooano/celestials-stars"
file: "src/remnants/neutron-star.ts"
status: active
---

# NeutronStarRenderer & Material

Neutron star renderer with subtype support for standard neutron stars, pulsars, and magnetars. Includes gravitational lensing effects and subtype-specific visual properties.

## Overview

The `NeutronStarRenderer` and `NeutronStarMaterial` provide specialized rendering for neutron stars, which are stellar remnants formed from the collapse of massive stars. The renderer supports three subtypes: standard neutron stars, pulsars (rotating neutron stars), and magnetars (neutron stars with extremely strong magnetic fields).

## Class Definition

```typescript
export class NeutronStarRenderer extends BaseStarRenderer<NeutronStarMaterial>
class NeutronStarMaterial extends BaseStarMaterial
```

**Inheritance:**

- `BaseStarRenderer<NeutronStarMaterial>` - Base star renderer
- `BaseStarMaterial` - Base star material with plasma effects

## Key Features

### Subtype Support

- **Standard**: Basic neutron star with minimal effects
- **Pulsar**: Rotating neutron star with fast pulsing and emission beams
- **Magnetar**: Neutron star with extremely strong magnetic fields and bright glow

### Visual Effects

- **Gravitational Lensing**: Spacetime distortion effects around the neutron star
- **Pulsing Animation**: Time-based pulsing effects for pulsars and magnetars
- **Metallic Surface**: Metallic reflection effects
- **Glow Effects**: Bright atmospheric glow

### Physical Properties

- **Radius**: ~10-15 km (extremely compact)
- **Mass**: 1.4-3.2 solar masses
- **Density**: ~10^17 kg/m³ (nuclear density)
- **Temperature**: 10^6-10^7 K surface temperature

## Constructor

### NeutronStarRenderer

```typescript
constructor(
  object: RenderableCelestialObject,
  options: BaseCelestialRendererOptions = {},
)
```

**Parameters:**

- **object**: The celestial object to render
- **options**: Optional renderer configuration

### NeutronStarMaterial

```typescript
constructor(subtype: NeutronStarSubtype = NeutronStarSubtype.STANDARD)
```

**Parameters:**

- **subtype**: The neutron star subtype (STANDARD, PULSAR, or MAGNETAR)

## Subtype Properties

### Standard Neutron Star

- **Pulse Speed**: 0.0 (no pulsing)
- **Glow Intensity**: 0.1 (minimal glow)
- **Metallic Effect**: 0.1 (subtle metallic surface)

### Pulsar

- **Pulse Speed**: 2.0 (fast pulsing)
- **Glow Intensity**: 0.3 (bright glow)
- **Metallic Effect**: 0.2 (noticeable metallic surface)
- **Emission Beams**: Rotating emission patterns

### Magnetar

- **Pulse Speed**: 0.5 (slower, irregular pulsing)
- **Glow Intensity**: 0.5 (very bright glow)
- **Metallic Effect**: 0.3 (strong metallic surface)
- **Magnetic Field**: Strong magnetic field visualization

## Methods

### createMaterial

```typescript
protected createMaterial(
  object: RenderableCelestialObject,
): NeutronStarMaterial
```

Creates a new `NeutronStarMaterial` instance based on the object's subtype.

### getCustomLODs

```typescript
protected getCustomLODs(
  object: RenderableCelestialObject,
  options?: CelestialMeshOptions,
): LODLevel[]
```

Returns custom LOD levels for neutron stars, including gravitational lensing effects.

### getBillboardLODDistance

```typescript
protected getBillboardLODDistance(
  object: RenderableCelestialObject,
): number
```

Returns the distance at which the billboard LOD appears (object.radius \* 1000).

## LOD System

### High Detail LOD

- **Distance**: 0 (closest)
- **Features**: Full neutron star with gravitational lensing
- **Geometry**: High-detail sphere with lensing distortion
- **Effects**: Full subtype-specific effects

### Medium Detail LOD

- **Distance**: `object.radius * 100`
- **Features**: Simplified neutron star without lensing
- **Geometry**: Medium-detail sphere
- **Effects**: Reduced subtype effects

### Billboard LOD

- **Distance**: `object.radius * 1000`
- **Features**: 2D representation for distant viewing
- **Type**: Billboard sprite with star color

## Gravitational Lensing

### Lensing Effects

- **Spacetime Distortion**: Visual distortion around the neutron star
- **Light Bending**: Simulated gravitational light bending
- **Event Horizon**: Visual representation of strong gravity

### Implementation

- **GravitationalLensingHelper**: Specialized helper for lensing effects
- **LOD Integration**: Lensing effects only at high detail
- **Performance**: Optimized for real-time rendering

## Material Properties

### Base Properties

- **Color**: White (#ffffff) base color
- **Noise Scale**: 0.5 (fine surface detail)
- **Noise Intensity**: Subtype-dependent (0.1-0.5)
- **Plasma Turbulence**: 0.1 (minimal turbulence)

### Subtype Variations

- **Pulsar**: Enhanced pulsing and glow effects
- **Magnetar**: Strong metallic effects and bright glow
- **Standard**: Minimal effects for basic neutron stars

## Usage

### Basic Usage

```typescript
const neutronStarObject = {
  id: "neutron-star-1",
  properties: {
    subtype: NeutronStarSubtype.PULSAR,
    mass: 1.4,
    radius: 0.00001, // ~10 km in AU
    temperature: 1000000,
  },
};

const renderer = new NeutronStarRenderer(neutronStarObject);
```

### With Custom Options

```typescript
const renderer = new NeutronStarRenderer(neutronStarObject, {
  lightingManager: lightingManager,
  detailLevel: "high",
});
```

### Subtype-Specific Rendering

```typescript
// Pulsar with fast rotation
const pulsarRenderer = new NeutronStarRenderer(pulsarObject);

// Magnetar with strong magnetic field
const magnetarRenderer = new NeutronStarRenderer(magnetarObject);

// Standard neutron star
const standardRenderer = new NeutronStarRenderer(standardObject);
```

## Performance

### Optimizations

- **LOD System**: Efficient LOD switching based on distance
- **Gravitational Lensing**: Only rendered at high detail
- **Subtype Caching**: Materials cached by subtype
- **Effect Scaling**: Effects scaled by distance

### Memory Usage

- **Efficient Memory**: Minimal memory footprint
- **Resource Management**: Proper cleanup of lensing effects
- **Caching**: Material and effect caching

## Error Handling

### Validation

- **Subtype Validation**: Validates neutron star subtype
- **Property Validation**: Ensures required properties exist
- **Lensing Validation**: Validates lensing effect parameters

### Fallbacks

- **Default Subtype**: Falls back to STANDARD if invalid
- **Default Properties**: Uses standard neutron star properties
- **Error Recovery**: Graceful handling of rendering errors

## Compatibility

### Three.js Versions

- **Version**: Compatible with Three.js 0.179.1
- **Features**: Uses modern Three.js features
- **Extensions**: Supports gravitational lensing extensions

### GPU Compatibility

- **OpenGL ES**: Compatible with OpenGL ES 2.0+
- **WebGL**: Compatible with WebGL 1.0+
- **Mobile**: Optimized for mobile GPUs

## 🔗 Related

- [[celestials/stars/BaseStarRenderer|Base Star Renderer]] - Base renderer class
- [[celestials/stars/BaseStarMaterial|Base Star Material]] - Base material class
- [[celestials/stars/GravitationalLensingHelper|Gravitational Lensing Helper]] - Lensing effects
- [[data/data-types/NeutronStarSubtype|Neutron Star Subtype]] - Subtype enumeration
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[data/data-types/data-types|Data Types]] - Type definitions
