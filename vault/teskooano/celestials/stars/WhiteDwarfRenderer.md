---
aliases: [WhiteDwarfRenderer, WhiteDwarfMaterial]
tags: [renderer, threejs, stars, remnants, white-dwarf]
type: class
package: "@teskooano/celestials-stars"
file: "src/remnants/white-dwarf.ts"
status: active
---

# WhiteDwarfRenderer & Material

White Dwarf star renderer for stellar remnants with subtype-specific properties. Features electron-degenerate matter and cooling remnant effects.

## Overview

The `WhiteDwarfRenderer` and `WhiteDwarfMaterial` provide specialized rendering for white dwarf stars, which are stellar remnants composed of electron-degenerate matter. These stars have no fusion and are slowly cooling over time.

## Class Definition

```typescript
export class WhiteDwarfRenderer extends BaseStarRenderer<WhiteDwarfMaterial>
export class WhiteDwarfMaterial extends BaseStarMaterial
```

**Inheritance:**

- `BaseStarRenderer<WhiteDwarfMaterial>` - Base star renderer
- `BaseStarMaterial` - Base star material

## Key Features

### Stellar Remnant Phase

- **White Dwarf Phase**: Stellar remnant phase
- **No Fusion**: No nuclear fusion occurring
- **Electron-Degenerate**: Electron-degenerate matter
- **Temperature Range**: 8,000-40,000K surface temperatures

### Physical Properties

- **Mass Range**: 0.5-0.7 solar masses
- **Radius**: ~0.01 solar radii (Earth-sized)
- **Density**: Very high density
- **Color**: White to pale blue

### Subtype Support

- **DA**: Hydrogen-dominated (white with slight blue tint)
- **DB**: Helium-dominated (white with slight yellow tint)
- **DC**: Carbon-dominated (white with slight red tint)
- **DZ**: Metal-dominated (white with metallic tint)

## Constructor

### WhiteDwarfRenderer

```typescript
constructor(
  object: RenderableCelestialObject,
  options: BaseCelestialRendererOptions = {},
)
```

**Parameters:**

- **object**: The celestial object to render
- **options**: Optional renderer configuration

### WhiteDwarfMaterial

```typescript
constructor(
  subtype: WhiteDwarfSubtype = WhiteDwarfSubtype.DA,
  options: {
    coronaIntensity?: number;
    pulseSpeed?: number;
    glowIntensity?: number;
    temperatureVariation?: number;
    metallicEffect?: number;
  } = {},
)
```

**Parameters:**

- **subtype**: White dwarf subtype (DA, DB, DC, DZ)
- **options**: Optional material configuration

## Material Configuration

### Subtype-Specific Properties

#### DA (Hydrogen-dominated)

```typescript
baseColor: new THREE.Color(0xf8fcff), // White with slight blue tint
coronaIntensity: 0.4,
pulseSpeed: 0.2,
glowIntensity: 0.7,
temperatureVariation: 0.05,
metallicEffect: 0.8,
```

#### DB (Helium-dominated)

```typescript
baseColor: new THREE.Color(0xfff8f0), // White with slight yellow tint
coronaIntensity: 0.3,
pulseSpeed: 0.15,
glowIntensity: 0.6,
temperatureVariation: 0.04,
metallicEffect: 0.7,
```

#### DC (Carbon-dominated)

```typescript
baseColor: new THREE.Color(0xfff0f0), // White with slight red tint
coronaIntensity: 0.2,
pulseSpeed: 0.1,
glowIntensity: 0.5,
temperatureVariation: 0.03,
metallicEffect: 0.6,
```

#### DZ (Metal-dominated)

```typescript
baseColor: new THREE.Color(0xf0f0f0), // White with metallic tint
coronaIntensity: 0.1,
pulseSpeed: 0.05,
glowIntensity: 0.4,
temperatureVariation: 0.02,
metallicEffect: 0.9,
```

## Methods

### createMaterial

```typescript
protected createMaterial(
  object: RenderableCelestialObject,
): WhiteDwarfMaterial
```

Creates a new `WhiteDwarfMaterial` instance for the given object.

### update

```typescript
update(
  time: number,
  timeScale: number,
  lightSources: LightSourcesMap,
  camera: THREE.PerspectiveCamera,
  allObjects?: Record<string, RenderableCelestialObject>,
  allMeshes?: Record<string, THREE.Object3D>,
): void
```

Updates the material with cooling remnant effects.

**Parameters:**

- **time**: Current simulation time
- **timeScale**: Time scaling factor
- **lightSources**: Map of light sources
- **camera**: Camera for distance calculations
- **allObjects**: Optional map of all celestial objects
- **allMeshes**: Optional map of all meshes

## Visual Effects

### Cooling Remnant

The material implements cooling remnant effects:

- **Slow Cooling**: Gradual temperature decrease over time
- **No Fusion**: No nuclear fusion effects
- **Electron-Degenerate**: Electron-degenerate matter visualization

### Subtype-Specific Effects

- **DA**: Hydrogen-dominated appearance
- **DB**: Helium-dominated appearance
- **DC**: Carbon-dominated appearance
- **DZ**: Metal-dominated appearance

## Usage

### Basic Usage

```typescript
const whiteDwarfObject = {
  id: "white-dwarf-1",
  properties: {
    mass: 0.6,
    radius: 0.01,
    temperature: 15000,
    stellarType: "WHITE_DWARF",
    whiteDwarfSubtype: "DA",
  },
};

const renderer = new WhiteDwarfRenderer(whiteDwarfObject);
const material = renderer.createMaterial(whiteDwarfObject);
```

### With Custom Options

```typescript
const renderer = new WhiteDwarfRenderer(whiteDwarfObject, {
  lightingManager: lightingManager,
  detailLevel: "high",
});
```

## Performance

### Optimizations

- **Material Caching**: Materials are cached by object ID
- **Efficient Updates**: Optimized update cycles
- **Subtype-Specific**: Performance-friendly subtype effects

### Memory Usage

- **Minimal Memory**: Efficient memory usage
- **Resource Management**: Proper resource cleanup
- **Caching**: Material caching for performance

## Error Handling

### Validation

- **Property Validation**: Ensures required properties exist
- **Fallback Values**: Provides defaults for missing data
- **Error Recovery**: Graceful handling of invalid data

### Fallbacks

- **Default Subtype**: Falls back to DA if subtype is invalid
- **Default Properties**: Uses DA defaults for missing data
- **Error Recovery**: Graceful handling of invalid data

## Compatibility

### Three.js Versions

- **Version**: Compatible with Three.js 0.179.1
- **Features**: Uses modern Three.js features
- **Extensions**: No custom extensions required

### GPU Compatibility

- **OpenGL ES**: Compatible with OpenGL ES 2.0+
- **WebGL**: Compatible with WebGL 1.0+
- **Mobile**: Optimized for mobile GPUs

## 🔗 Related

- [[celestials/stars/BaseStarRenderer|Base Star Renderer]] - Base renderer class
- [[celestials/stars/BaseStarMaterial|Base Star Material]] - Base material class
- [[celestials/stars/PostAGBRenderer|Post AGB Renderer]] - Previous evolution phase
- [[celestials/stars/NeutronStarRenderer|Neutron Star Renderer]] - Related stellar remnant
- [[celestials/stars/enhanced-star.vertex.glsl|Enhanced Star Vertex Shader]] - Vertex shader
- [[celestials/stars/enhanced-star.fragment.glsl|Enhanced Star Fragment Shader]] - Fragment shader
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[data/data-types/data-types|Data Types]] - Type definitions
