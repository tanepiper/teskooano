# WebGPU-Only TSL Migration Guide

## Overview

This guide documents the **complete migration** from WebGL/GLSL to WebGPU/TSL. Unlike the previous hybrid approach, this migration **removes WebGL entirely** and makes WebGPU with Three.js TSL the only supported rendering backend.

**Status**: Core infrastructure migrated, systematic shader migration in progress

## Philosophy

- **WebGPU-Only**: No WebGL fallback support
- **TSL Everywhere**: All shaders use Three.js Shading Language
- **Modern Browsers**: Requires Chrome 113+, Edge 113+, Firefox 127+, Safari 18+
- **No Compromises**: Full feature parity with best performance

## Completed Migrations ✅

### 1. Core Type System
**File**: `packages/data/types/src/performance.ts`

```typescript
// OLD (hybrid)
export type RendererBackend = "webgpu" | "webgl";

// NEW (WebGPU-only)
export type RendererBackend = "webgpu";

interface RendererBackendConfig {
  backend: RendererBackend;  // Always 'webgpu'
  webgpuAvailable: boolean;
  initialized: boolean;
}
```

### 2. SceneManager (Core Renderer)
**File**: `packages/renderer/threejs-core/src/SceneManager.ts`

**Changes**:
- Removed WebGL renderer code entirely
- WebGPURenderer is the only renderer type
- Throws error if WebGPU not available
- Simplified initialization (no fallback logic)

```typescript
export class SceneManager {
  public renderer: WebGPURenderer;  // Not WebGLRenderer | WebGPURenderer
  
  constructor(container: HTMLElement, options: SceneManagerOptions = {}) {
    // Check WebGPU availability
    const isWebGPUAvailable = 
      typeof navigator !== "undefined" && navigator.gpu !== undefined;
      
    if (!isWebGPUAvailable) {
      throw new Error(
        "[SceneManager] WebGPU is not available. " +
        "This application requires a modern browser with WebGPU support."
      );
    }
    
    // Create WebGPU renderer only
    const renderer = new WebGPURenderer({
      antialias: this.options.antialias ?? true,
      forceWebGL: false,
    });
    
    // Initialize asynchronously
    this._initializeWebGPURenderer();
  }
  
  public getRendererBackend(): "webgpu" {
    return "webgpu";  // Always returns 'webgpu'
  }
}
```

### 3. DebrisEffectManager
**File**: `packages/renderer/threejs-objects/src/object-manager/DebrisEffectManager.ts`

**Changes**:
- Removed GLSL ShaderMaterial implementation
- Pure TSL using MeshBasicNodeMaterial
- Simplified configuration (no rendererBackend param)

```typescript
import { 
  attribute, uniform, vec3, vec4, 
  positionLocal, mul, add, sub,
  MeshBasicNodeMaterial 
} from "three/tsl";

export class DebrisEffectManager {
  private createDebrisMaterial(): MeshBasicNodeMaterial {
    // Create instance attributes for TSL
    const instancePositionOffset = attribute("instancePositionOffset", "vec3");
    const instanceVelocity = attribute("instanceVelocity", "vec3");
    const instanceColor = attribute("instanceColor", "vec4");
    const instanceLifetime = attribute("instanceLifetime", "vec2");
    
    // Uniforms
    const uTime = uniform(this.debrisClock.getElapsedTime());
    const uOpacity = uniform(1.0);
    
    // Calculate animated position
    const elapsedTime = sub(uTime, instanceLifetime.x);
    const animatedOffset = mul(instanceVelocity, elapsedTime);
    const finalPosition = add(positionLocal, add(instancePositionOffset, animatedOffset));
    
    // Create material with TSL nodes
    const material = new MeshBasicNodeMaterial();
    material.positionNode = finalPosition;
    material.colorNode = mul(instanceColor, vec4(1, 1, 1, uOpacity));
    material.transparent = true;
    material.blending = THREE.AdditiveBlending;
    
    return material;
  }
}
```

## TSL Migration Patterns

### Pattern 1: Simple Color Material

**GLSL (OLD)**:
```typescript
export class MyMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uColor: { value: new THREE.Color(0xff0000) }
      },
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        void main() {
          gl_FragColor = vec4(uColor, 1.0);
        }
      `
    });
  }
}
```

**TSL (NEW)**:
```typescript
import { MeshBasicNodeMaterial, uniform, color } from "three/tsl";

export class MyMaterial extends MeshBasicNodeMaterial {
  constructor() {
    super();
    
    const colorUniform = uniform(color('#ff0000'));
    this.colorNode = colorUniform;
  }
}
```

### Pattern 2: Procedural Noise

**TSL Implementation**:
```typescript
import { 
  MeshStandardNodeMaterial, 
  uniform, float, vec3,
  positionLocal, normalLocal,
  mul, add, sin, cos, mix
} from "three/tsl";

export class ProceduralMaterial extends MeshStandardNodeMaterial {
  constructor(props) {
    super();
    
    // Uniforms
    const scale = uniform(float(5.0));
    const time = uniform(float(0.0));
    
    // Simple procedural noise using trig functions
    const pos = mul(positionLocal, scale);
    const noise = add(
      sin(add(pos.x, time)),
      cos(mul(pos.y, float(2.0)))
    );
    
    // Mix colors based on noise
    const color1 = uniform(vec3(1, 0, 0));
    const color2 = uniform(vec3(0, 0, 1));
    const finalColor = mix(color1, color2, noise);
    
    this.colorNode = finalColor;
    this.roughnessNode = uniform(float(0.5));
  }
}
```

### Pattern 3: Multi-Light Support

**TSL uses automatic lighting via MeshStandardNodeMaterial**:
```typescript
import { MeshStandardNodeMaterial, uniform, color, float } from "three/tsl";

export class LitMaterial extends MeshStandardNodeMaterial {
  constructor(props) {
    super();
    
    // Material properties
    this.colorNode = uniform(color(props.baseColor));
    this.roughnessNode = uniform(float(props.roughness));
    this.metalnessNode = uniform(float(props.metalness));
    
    // Lighting is handled automatically by MeshStandardNodeMaterial
    // No need for manual light calculations like in GLSL
  }
}
```

### Pattern 4: Texture Sampling

```typescript
import { 
  MeshStandardNodeMaterial, 
  texture, uv, mul 
} from "three/tsl";

export class TexturedMaterial extends MeshStandardNodeMaterial {
  constructor(diffuseMap: THREE.Texture) {
    super();
    
    // Sample texture at UV coordinates
    const texColor = texture(diffuseMap, uv());
    
    // Use texture color
    this.colorNode = texColor.rgb;
    this.opacityNode = texColor.a;
    this.transparent = true;
  }
}
```

### Pattern 5: Instance Attributes

```typescript
import { 
  MeshBasicNodeMaterial,
  attribute, instanceIndex, uniform,
  positionLocal, add, mul
} from "three/tsl";

export class InstancedMaterial extends MeshBasicNodeMaterial {
  constructor() {
    super();
    
    // Define instance attributes
    const instanceOffset = attribute("instanceOffset", "vec3");
    const instanceColor = attribute("instanceColor", "vec3");
    
    // Apply per-instance transformations
    const finalPosition = add(positionLocal, instanceOffset);
    
    this.positionNode = finalPosition;
    this.colorNode = instanceColor;
  }
}
```

## Common TSL Functions

### Math Operations
```typescript
import { add, sub, mul, div, mod, pow, sqrt, abs } from "three/tsl";

// Addition: add(a, b)
// Subtraction: sub(a, b)
// Multiplication: mul(a, b)
// Division: div(a, b)
// Power: pow(base, exponent)
// Square root: sqrt(value)
```

### Trigonometry
```typescript
import { sin, cos, tan, asin, acos, atan, atan2 } from "three/tsl";

const angle = uniform(float(0.0));
const sineValue = sin(angle);
const cosineValue = cos(angle);
```

### Vector Operations
```typescript
import { 
  dot, cross, normalize, length, distance,
  reflect, refract, faceforward
} from "three/tsl";

const v1 = vec3(1, 0, 0);
const v2 = vec3(0, 1, 0);

const dotProduct = dot(v1, v2);
const crossProduct = cross(v1, v2);
const normalized = normalize(v1);
const len = length(v1);
```

### Interpolation
```typescript
import { mix, smoothstep, step, clamp } from "three/tsl";

// Linear interpolation
const result = mix(colorA, colorB, t);

// Smooth interpolation
const smooth = smoothstep(edge0, edge1, x);

// Clamping
const clamped = clamp(value, minVal, maxVal);
```

### Built-in Attributes
```typescript
import { 
  positionLocal, positionWorld,
  normalLocal, normalWorld,
  uv, color as vertexColor,
  cameraPosition
} from "three/tsl";

// Use in material
this.positionNode = positionLocal;
const viewDir = sub(cameraPosition, positionWorld);
```

## Noise Functions in TSL

Since Three.js TSL doesn't have built-in Simplex noise, we need to implement it:

```typescript
import { Fn, float, vec2, vec3, vec4, dot, floor, fract, sin, mul, add, sub } from "three/tsl";

// Simple hash function for noise
const hash = Fn(([p]: [any]) => {
  const h = dot(p, vec3(127.1, 311.7, 74.7));
  return fract(mul(sin(h), float(43758.5453123)));
}).setLayout({
  name: "hash",
  type: "float",
  inputs: [{ name: "p", type: "vec3" }],
});

// 3D noise function
const noise3D = Fn(([p]: [any]) => {
  const i = floor(p);
  const f = fract(p);
  
  // Cubic interpolation
  const u = mul(mul(f, f), sub(float(3.0), mul(float(2.0), f)));
  
  return mix(
    mix(
      mix(hash(add(i, vec3(0, 0, 0))), hash(add(i, vec3(1, 0, 0))), u.x),
      mix(hash(add(i, vec3(0, 1, 0))), hash(add(i, vec3(1, 1, 0))), u.x),
      u.y
    ),
    mix(
      mix(hash(add(i, vec3(0, 0, 1))), hash(add(i, vec3(1, 0, 1))), u.x),
      mix(hash(add(i, vec3(0, 1, 1))), hash(add(i, vec3(1, 1, 1))), u.x),
      u.y
    ),
    u.z
  );
}).setLayout({
  name: "noise3D",
  type: "float",
  inputs: [{ name: "p", type: "vec3" }],
});

// FBM (Fractional Brownian Motion)
const fbm = Fn(([p, octaves]: [any, any]) => {
  let value = float(0.0);
  let amplitude = float(1.0);
  let frequency = float(1.0);
  
  for (let i = 0; i < octaves; i++) {
    value = add(value, mul(amplitude, noise3D(mul(p, frequency))));
    amplitude = mul(amplitude, float(0.5));
    frequency = mul(frequency, float(2.0));
  }
  
  return value;
}).setLayout({
  name: "fbm",
  type: "float",
  inputs: [
    { name: "p", type: "vec3" },
    { name: "octaves", type: "int" }
  ],
});
```

## Migration Checklist

### For Each Material:

- [ ] Create new `*-tsl.material.ts` file
- [ ] Import TSL functions from `three/tsl`
- [ ] Extend `MeshBasicNodeMaterial` or `MeshStandardNodeMaterial`
- [ ] Convert GLSL uniforms to TSL `uniform()` calls
- [ ] Convert vertex shader to `positionNode`
- [ ] Convert fragment shader to `colorNode`/`normalNode`/etc
- [ ] Remove GLSL shader strings
- [ ] Update imports to use new material
- [ ] Remove old GLSL material file
- [ ] Update factory to only create TSL version
- [ ] Remove `rendererBackend` conditional logic
- [ ] Test visual output matches original
- [ ] Update documentation

### For Each Package:

- [ ] Migrate all materials to TSL
- [ ] Remove material factories (no longer needed)
- [ ] Remove `rendererBackend` parameters
- [ ] Update renderer to only use TSL materials
- [ ] Remove GLSL shader files (`.glsl`)
- [ ] Update package exports
- [ ] Update tests to use TSL materials
- [ ] Update README/documentation

## File Structure

### Before (Hybrid):
```
src/
  materials/
    my-material.material.ts          // GLSL ShaderMaterial
    my-material-tsl.material.ts      // TSL NodeMaterial
    my-material-factory.ts           // Factory with backend switching
  shaders/
    vertex.glsl                      // GLSL vertex shader
    fragment.glsl                    // GLSL fragment shader
```

### After (WebGPU-only):
```
src/
  materials/
    my-material.material.ts          // TSL NodeMaterial only
  // No shaders/ directory - TSL is inline
```

## Common Pitfalls

### 1. Import Paths
```typescript
// ❌ WRONG
import { MeshStandardNodeMaterial } from "three/tsl";

// ✅ CORRECT
import { MeshStandardNodeMaterial } from "three/webgpu";
import { uniform, float, vec3 } from "three/tsl";
```

### 2. Uniform Updates
```typescript
// ❌ WRONG (GLSL style)
material.uniforms.uTime.value = time;

// ✅ CORRECT (TSL - uniforms auto-update)
// Store uniform reference and update it
this.timeUniform = uniform(float(0.0));
// Later: timeUniform.value = time;  // Works for simple uniforms
```

### 3. Node Assignment
```typescript
// ❌ WRONG
this.color = colorNode;

// ✅ CORRECT
this.colorNode = colorNode;
this.roughnessNode = roughnessUniform;
this.metalnessNode = metalnessUniform;
```

### 4. Material Base Class
```typescript
// ❌ WRONG for complex materials
class MyMaterial extends MeshBasicNodeMaterial { }

// ✅ CORRECT for PBR lighting
class MyMaterial extends MeshStandardNodeMaterial { }
```

## Performance Optimization

### 1. Minimize Uniform Updates
```typescript
// Cache uniform references
private timeUniform = uniform(float(0.0));
private colorUniform = uniform(color('#ff0000'));

update(time: number) {
  // Direct update is faster than recreating
  this.timeUniform.value = time;
}
```

### 2. Use Appropriate Material Types
```typescript
// For simple unlit materials
MeshBasicNodeMaterial

// For PBR with lighting
MeshStandardNodeMaterial

// For custom lighting
MeshPhysicalNodeMaterial
```

### 3. LOD (Level of Detail)
```typescript
// Reduce shader complexity at distance
if (distanceFromCamera > threshold) {
  // Use simpler material
  return new MeshBasicNodeMaterial();
} else {
  // Use complex procedural material
  return new ComplexProceduralMaterial();
}
```

## Testing Strategy

### Visual Testing
1. Compare side-by-side with original GLSL version
2. Verify colors, normals, lighting match
3. Test at different camera angles/distances
4. Verify animations work correctly

### Performance Testing
```typescript
// Measure frame time
const startTime = performance.now();
renderer.render(scene, camera);
const frameTime = performance.now() - startTime;

console.log(`Frame time: ${frameTime.toFixed(2)}ms`);
```

### Integration Testing
1. Test with full scene
2. Verify LOD transitions
3. Test with multiple lights
4. Verify shadows work
5. Test memory usage

## Resources

- [Three.js TSL Documentation](https://threejs.org/docs/#api/en/renderers/webgpu/nodes/Nodes)
- [Three.js WebGPU Examples](https://threejs.org/examples/?q=webgpu)
- [Maxime Heckel's TSL Guide](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)
- [WebGPU Spec](https://www.w3.org/TR/webgpu/)

## Support Matrix

| Browser | Version | WebGPU Support |
|---------|---------|----------------|
| Chrome  | 113+    | ✅ Yes         |
| Edge    | 113+    | ✅ Yes         |
| Safari  | 18+     | ✅ Yes         |
| Firefox | 127+    | ✅ Yes         |
| Chrome Android | 113+ | ✅ Yes    |
| Safari iOS | 18+ | ✅ Yes         |

## Migration Status

- ✅ Core infrastructure (SceneManager, types)
- ✅ DebrisEffectManager
- 🔄 Terrestrial planets (in progress)
- ⏳ Stars
- ⏳ Gas giants
- ⏳ Rings
- ⏳ Small bodies (asteroids, comets, satellites)
- ⏳ Particle systems (fields, clouds)
- ⏳ Background effects
- ⏳ Black holes & lensing

---

**Last Updated**: November 24, 2025
**Status**: Core migration complete, systematic shader migration in progress
