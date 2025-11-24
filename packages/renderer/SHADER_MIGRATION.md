# GLSL to TSL Shader Migration Guide

This guide covers migrating existing GLSL shaders to Three.js Shading Language (TSL) for WebGPU compatibility.

## Overview

TSL is Three.js's new shading language that works with both WebGL and WebGPU. It uses a node-based system instead of raw shader strings, providing better type safety, composability, and cross-platform compatibility.

## Why Migrate to TSL?

- **WebGPU Support**: TSL is required for WebGPU renderer compatibility
- **Type Safety**: Node-based system provides compile-time type checking
- **Composability**: Easier to reuse and combine shader components
- **Maintainability**: Better debugging and error messages
- **Future-Proof**: Three.js is moving towards TSL as the standard

## Migration Strategy

### Incremental Approach

1. **Incremental Migration**: Migrate shaders package-by-package
2. **Dual Support Period**: Keep both GLSL and TSL versions during transition
3. **Testing**: Thoroughly test each migrated shader before removing GLSL version
4. **Documentation**: Document TSL equivalents for custom shader functions

### Priority Order

Migration will proceed in the following order:

1. **Core renderer shaders** (background, helpers)
2. **Terrestrial planets** (most commonly viewed)
3. **Gas giants**
4. **Stars**
5. **Other celestials** (comets, asteroids, rings, etc.)

## Current GLSL Shaders (55 files)

### By Package

- **Renderer** (threejs-background): 2 shaders (nebula field)
- **Terrestrial**: 10 shaders (procedural, atmosphere, terrain utilities)
- **Stars**: 6 shaders (enhanced star, corona, black hole effects)
- **Gas Giants**: 12 shaders (class I-V variations, basic)
- **Rings**: 4 shaders (rings, accretion disk)
- **Comets**: 10 shaders (nucleus, coma, tail, jet, particle effects)
- **Asteroids**: 5 shaders (nucleus, simplex noise, lighting utilities)
- **Satellites**: 2 shaders (satellite rendering)
- **Oort Cloud**: 2 shaders (particle cloud)

### Detailed Inventory

```
packages/renderer/threejs-background/src/fields/nebula-field/shaders/
├── vertex.glsl
└── fragment.glsl

packages/celestials/terrestrial/src/
├── shaders/
│   ├── procedural.vertex.glsl
│   ├── procedural.fragment.glsl
│   ├── atmosphere.vertex.glsl
│   └── atmosphere.fragment.glsl
└── shared/
    ├── terrain.glsl
    ├── noise.glsl
    ├── lighting.glsl
    └── simplex/*.glsl

packages/celestials/stars/src/
├── shaders/
│   ├── enhanced-star.vertex.glsl
│   ├── enhanced-star.fragment.glsl
│   ├── corona.vertex.glsl
│   └── corona.fragment.glsl
└── black-holes/
    ├── blur-vertical.glsl
    └── blur-horizontal.glsl

packages/celestials/gas-giants/src/shaders/
├── class-i.vertex.glsl
├── class-i.fragment.glsl
├── class-ii.vertex.glsl
├── class-ii.fragment.glsl
├── class-iii.vertex.glsl
├── class-iii.fragment.glsl
├── class-iv.vertex.glsl
├── class-iv.fragment.glsl
├── class-v.vertex.glsl
├── class-v.fragment.glsl
├── basic.vertex.glsl
└── basic.fragment.glsl

packages/celestials/rings/src/shaders/
├── ring.vertex.glsl
├── ring.fragment.glsl
└── accretion-disk.fragment.glsl

packages/celestials/comet/src/
├── shaders/
│   ├── nucleus.vertex.glsl
│   ├── nucleus.fragment.glsl
│   ├── coma.vertex.glsl
│   ├── coma.fragment.glsl
│   ├── jet.vertex.glsl
│   ├── jet.fragment.glsl
│   ├── particle.vertex.glsl
│   ├── particle.fragment.glsl
│   ├── simplified-tail.vertex.glsl
│   └── simplified-tail.fragment.glsl
└── shared/
    ├── noise.glsl
    ├── lighting.glsl
    └── simplex/3d.glsl

packages/celestials/asteroid/src/
├── shaders/
│   ├── nucleus.vertex.glsl
│   └── nucleus.fragment.glsl
└── shared/
    ├── noise.glsl
    ├── lighting.glsl
    └── simplex/3d.glsl

packages/celestials/satellite/src/shaders/
├── satellite.vertex.glsl
└── satellite.fragment.glsl

packages/celestials/oort-cloud/src/shaders/
├── oort-cloud.vertex.glsl
└── oort-cloud.fragment.glsl
```

## TSL Basics

### Fundamental Concepts

1. **Nodes**: TSL uses a node-based system where each operation is a node
2. **Composition**: Nodes can be combined to create complex effects
3. **Type Safety**: TypeScript provides compile-time type checking
4. **Built-in Nodes**: Three.js provides many built-in nodes for common operations

### GLSL vs TSL Examples

#### Example 1: Simple Diffuse Lighting

**GLSL (old)**:

```glsl
// Vertex Shader
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment Shader
varying vec3 vNormal;
varying vec3 vWorldPosition;
uniform vec3 uLightPosition;
uniform vec3 uColor;

void main() {
  vec3 lightDir = normalize(uLightPosition - vWorldPosition);
  float diff = max(dot(vNormal, lightDir), 0.0);
  vec3 color = uColor * diff;
  gl_FragColor = vec4(color, 1.0);
}
```

**TSL (new)**:

```typescript
import {
  normalWorld,
  positionWorld,
  uniform,
  vec3,
  max,
  dot,
  normalize,
  MeshBasicNodeMaterial,
} from "three/tsl";

// Create uniforms
const lightPosition = uniform(vec3(0, 100, 0));
const objectColor = uniform(vec3(1, 0, 0));

// Build shader graph
const lightDir = normalize(lightPosition.sub(positionWorld));
const diff = max(dot(normalWorld, lightDir), 0.0);
const outputColor = objectColor.mul(diff);

// Create material
const material = new MeshBasicNodeMaterial();
material.colorNode = outputColor;
```

#### Example 2: Procedural Noise

**GLSL (old)**:

```glsl
// Simplex noise function (many lines)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
// ... many more lines ...

float snoise(vec3 v) {
  // Complex implementation
  // ... 50+ lines of noise code ...
}

void main() {
  float noise = snoise(vPosition * 2.0);
  vec3 color = vec3(noise);
  gl_FragColor = vec4(color, 1.0);
}
```

**TSL (new)**:

```typescript
import {
  positionLocal,
  simplexNoise3d,
  MeshBasicNodeMaterial,
} from "three/tsl";

// Use built-in noise function
const noiseValue = simplexNoise3d(positionLocal.mul(2.0));
const outputColor = vec3(noiseValue);

// Create material
const material = new MeshBasicNodeMaterial();
material.colorNode = outputColor;
```

#### Example 3: Multiple Lights

**GLSL (old)**:

```glsl
struct Light {
  vec3 position;
  vec3 color;
  float intensity;
};

uniform Light lights[MAX_LIGHTS];
uniform int numLights;

void main() {
  vec3 totalLight = vec3(0.0);

  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= numLights) break;

    vec3 lightDir = normalize(lights[i].position - vWorldPosition);
    float diff = max(dot(vNormal, lightDir), 0.0);
    totalLight += lights[i].color * lights[i].intensity * diff;
  }

  gl_FragColor = vec4(totalLight, 1.0);
}
```

**TSL (new)**:

```typescript
import {
  normalWorld,
  positionWorld,
  uniformArray,
  vec3,
  float,
  Loop,
  max,
  dot,
  normalize,
  MeshBasicNodeMaterial,
} from "three/tsl";

// Define light structure
const lightPositions = uniformArray("vec3", 10);
const lightColors = uniformArray("vec3", 10);
const lightIntensities = uniformArray("float", 10);
const numLights = uniform("int", 5);

// Calculate lighting in a loop
const totalLight = Loop(numLights, ({ i }) => {
  const lightPos = lightPositions.element(i);
  const lightColor = lightColors.element(i);
  const lightIntensity = lightIntensities.element(i);

  const lightDir = normalize(lightPos.sub(positionWorld));
  const diff = max(dot(normalWorld, lightDir), 0.0);

  return lightColor.mul(lightIntensity).mul(diff);
}).sum();

// Create material
const material = new MeshBasicNodeMaterial();
material.colorNode = totalLight;
```

## Migration Checklist

For each shader being migrated:

- [ ] Identify all uniforms and convert to TSL uniform nodes
- [ ] Identify all varyings and convert to TSL attribute nodes
- [ ] Convert GLSL functions to TSL node graphs
- [ ] Replace custom noise with built-in TSL noise functions (if possible)
- [ ] Test visual output matches original GLSL shader
- [ ] Verify performance is acceptable
- [ ] Update material creation code to use TSL material
- [ ] Document any breaking changes or behavioral differences
- [ ] Update tests to cover TSL version
- [ ] Keep GLSL version until TSL is fully validated

## Common Patterns

### Uniforms

**GLSL**:

```glsl
uniform float uTime;
uniform vec3 uColor;
uniform sampler2D uTexture;
```

**TSL**:

```typescript
import { uniform, texture } from "three/tsl";

const time = uniform("float");
const color = uniform("vec3");
const textureNode = texture(textureUniform);
```

### Varyings

**GLSL**:

```glsl
// Vertex shader
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vNormal = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

**TSL**:

```typescript
import { uv, normalLocal, positionLocal } from "three/tsl";

// TSL automatically handles built-in attributes
// uv, normalLocal, positionLocal, etc. are available directly
```

### Texture Sampling

**GLSL**:

```glsl
vec4 texColor = texture2D(uTexture, vUv);
```

**TSL**:

```typescript
import { texture, uv } from "three/tsl";

const texColor = texture(textureUniform, uv());
```

### Conditional Logic

**GLSL**:

```glsl
if (distance > threshold) {
  color = vec3(1.0, 0.0, 0.0);
} else {
  color = vec3(0.0, 1.0, 0.0);
}
```

**TSL**:

```typescript
import { cond, vec3 } from "three/tsl";

const color = cond(
  distance.greaterThan(threshold),
  vec3(1, 0, 0),
  vec3(0, 1, 0),
);
```

## Package-Level Migration Tasks

See individual package SHADER_TODO.md files for specific migration tasks:

- [packages/celestials/terrestrial/SHADER_TODO.md](../celestials/terrestrial/SHADER_TODO.md)
- [packages/celestials/gas-giants/SHADER_TODO.md](../celestials/gas-giants/SHADER_TODO.md)
- [packages/celestials/stars/SHADER_TODO.md](../celestials/stars/SHADER_TODO.md)
- [packages/celestials/rings/SHADER_TODO.md](../celestials/rings/SHADER_TODO.md)
- [packages/celestials/comet/SHADER_TODO.md](../celestials/comet/SHADER_TODO.md)
- [packages/celestials/asteroid/SHADER_TODO.md](../celestials/asteroid/SHADER_TODO.md)
- [packages/celestials/satellite/SHADER_TODO.md](../celestials/satellite/SHADER_TODO.md)
- [packages/celestials/oort-cloud/SHADER_TODO.md](../celestials/oort-cloud/SHADER_TODO.md)
- [packages/renderer/threejs-background/SHADER_TODO.md](./threejs-background/SHADER_TODO.md)

## Resources

- [Three.js TSL Documentation](https://threejs.org/docs/#api/en/nodes/Nodes)
- [Three.js TSL Examples](https://threejs.org/examples/?q=tsl)
- [WebGPU Fundamentals](https://webgpufundamentals.org/)
- [WGSL Specification](https://www.w3.org/TR/WGSL/)

## Next Steps

1. Start with the simplest shaders (background effects)
2. Create TSL equivalents alongside GLSL versions
3. Test thoroughly in both WebGL and WebGPU renderers
4. Document any differences or limitations
5. Gradually phase out GLSL versions as TSL versions are validated
6. Update this guide with learnings and best practices

## Notes for Developers

- TSL is still evolving; some features may require workarounds
- Performance characteristics may differ from GLSL
- WebGPU has different precision guarantees than WebGL
- Some GLSL extensions may not have TSL equivalents yet
- Always test on multiple devices and browsers
