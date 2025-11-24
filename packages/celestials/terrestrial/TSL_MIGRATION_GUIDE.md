# TSL Migration Guide for Terrestrial Celestials

## Overview

This guide explains how to migrate the terrestrial planet materials from GLSL (`ShaderMaterial`) to TSL (`NodeMaterial`) to support the new WebGPU renderer. TSL (Three.js Shading Language) is a JavaScript-based shader language that works with both WebGL and WebGPU.

**Reference**: [Field Guide to TSL and WebGPU](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)

## Architecture Pattern

### Current GLSL Approach (WebGL)

```typescript
// procedural-planet.material.ts
export class ProceduralPlanetMaterial extends THREE.ShaderMaterial {
  constructor(surfaceProps: ProceduralSurfaceProperties) {
    super({
      uniforms: {
        /* ... */
      },
      vertexShader: proceduralVertexShaderSource, // GLSL string
      fragmentShader: proceduralFragmentShaderSource, // GLSL string
    });
  }
}
```

### New TSL Approach (WebGPU)

```typescript
// procedural-planet-tsl.material.ts
import { MeshStandardNodeMaterial } from "three/webgpu";
import {
  uniform,
  vec3,
  color,
  positionLocal,
  normalLocal,
  mix,
} from "three/tsl";

export class ProceduralPlanetNodeMaterial extends MeshStandardNodeMaterial {
  constructor(surfaceProps: ProceduralSurfaceProperties) {
    super();

    // Create TSL nodes for uniforms
    const color1Node = uniform(color(surfaceProps.color1));
    const color2Node = uniform(color(surfaceProps.color2));

    // Create shader logic using TSL
    const terrainNode = this.createTerrainNode(surfaceProps);

    // Assign to material nodes
    this.colorNode = mix(color1Node, color2Node, terrainNode);
  }

  private createTerrainNode(surfaceProps: ProceduralSurfaceProperties) {
    // TSL-based terrain generation
    const pos = positionLocal;
    // ... TSL noise functions ...
    return terrainNode;
  }
}
```

**Important**: Note the separate imports:

- `MeshStandardNodeMaterial` comes from `'three/webgpu'`
- TSL functions (`uniform`, `mix`, etc.) come from `'three/tsl'`

### Renderer-Aware Factory Pattern

```typescript
// procedural-planet-factory.ts
import {
  MaterialFactory,
  MaterialFactoryOptions,
} from "./materials/MaterialFactory";
import { ProceduralPlanetMaterial } from "./materials/procedural-planet.material"; // GLSL
import { ProceduralPlanetNodeMaterial } from "./materials/procedural-planet-tsl.material"; // TSL

export class ProceduralPlanetMaterialFactory extends MaterialFactory {
  createMaterial(options: MaterialFactoryOptions): THREE.Material {
    const surfaceProps = options.surfaceProps as ProceduralSurfaceProperties;

    if (this.isWebGPU(options)) {
      // Use TSL NodeMaterial for WebGPU
      console.log("[ProceduralPlanetFactory] Creating WebGPU material (TSL)");
      return new ProceduralPlanetNodeMaterial(surfaceProps);
    } else {
      // Use GLSL ShaderMaterial for WebGL
      console.log("[ProceduralPlanetFactory] Creating WebGL material (GLSL)");
      return new ProceduralPlanetMaterial(surfaceProps);
    }
  }
}
```

## TSL Basics

### 1. Uniform Declaration

**GLSL:**

```glsl
uniform vec3 uColor1;
uniform float uHeight1;
uniform sampler2D uTexture;
```

**TSL:**

```typescript
import { uniform, vec3, float, texture } from "three/tsl";

const uColor1 = uniform(vec3(1.0, 0.0, 0.0));
const uHeight1 = uniform(float(0.5));
const uTexture = uniform(texture(textureObject));
```

### 2. Built-in Attributes

**GLSL:**

```glsl
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
```

**TSL:**

```typescript
import { positionLocal, normalLocal, uv } from "three/tsl";

const vPosition = positionLocal;
const vNormal = normalLocal;
const vUv = uv();
```

### 3. Mathematical Operations

**GLSL:**

```glsl
float mix_value = mix(0.0, 1.0, height);
vec3 color_mix = mix(color1, color2, mix_value);
float noise = fbm(position * frequency);
```

**TSL:**

```typescript
import { mix, float, vec3, mul, add } from "three/tsl";

const mixValue = mix(float(0.0), float(1.0), height);
const colorMix = mix(color1, color2, mixValue);
const noise = fbm(mul(position, frequency)); // Custom function
```

### 4. Lighting Integration

**TSL provides built-in lighting support via `MeshStandardNodeMaterial`:**

```typescript
import { MeshStandardNodeMaterial, uniform, vec3 } from "three/tsl";

export class TerrainMaterial extends MeshStandardNodeMaterial {
  constructor() {
    super();

    // MeshStandardNodeMaterial handles lighting automatically
    // Just provide surface properties
    this.colorNode = uniform(vec3(0.5, 0.8, 0.3));
    this.roughnessNode = uniform(0.7);
    this.metalnessNode = uniform(0.0);
  }
}
```

## Migration Steps

### Step 1: Create TSL Material Class

Create a new file `procedural-planet-tsl.material.ts`:

```typescript
import {
  MeshStandardNodeMaterial,
  uniform,
  vec3,
  vec4,
  float,
  color,
  positionLocal,
  normalLocal,
  uv,
  mix,
  add,
  mul,
  div,
} from "three/tsl";
import type { ProceduralSurfaceProperties } from "../types/procedural";
import * as THREE from "three";

export class ProceduralPlanetNodeMaterial extends MeshStandardNodeMaterial {
  constructor(surfaceProps: ProceduralSurfaceProperties) {
    super();

    // Create TSL uniform nodes
    const color1 = uniform(color(surfaceProps.color1 || "#5179B5"));
    const color2 = uniform(color(surfaceProps.color2 || "#4C9341"));
    const color3 = uniform(color(surfaceProps.color3 || "#836F27"));
    const color4 = uniform(color(surfaceProps.color4 || "#A0A0A0"));
    const color5 = uniform(color(surfaceProps.color5 || "#FFFFFF"));

    const height1 = uniform(float(surfaceProps.height1 ?? 0.0));
    const height2 = uniform(float(surfaceProps.height2 ?? 0.2));
    const height3 = uniform(float(surfaceProps.height3 ?? 0.4));
    const height4 = uniform(float(surfaceProps.height4 ?? 0.6));
    const height5 = uniform(float(surfaceProps.height5 ?? 0.8));

    // For initial version, use simplified terrain
    // TODO: Implement TSL noise functions
    const terrainHeight = this.createSimpleTerrainNode(surfaceProps);

    // Color mixing based on height
    const finalColor = mix(
      mix(
        mix(
          mix(
            color1,
            color2,
            terrainHeight.sub(height1).div(height2.sub(height1)),
          ),
          color3,
          terrainHeight.sub(height2).div(height3.sub(height2)),
        ),
        color4,
        terrainHeight.sub(height3).div(height4.sub(height3)),
      ),
      color5,
      terrainHeight.sub(height4).div(height5.sub(height4)),
    );

    // Assign to material nodes
    this.colorNode = finalColor;
    this.roughnessNode = uniform(float(surfaceProps.roughness ?? 0.5));
    this.metalnessNode = uniform(float(0.0)); // Terrestrial planets are not metallic
  }

  private createSimpleTerrainNode(surfaceProps: ProceduralSurfaceProperties) {
    // For now, use a simple height function
    // TODO: Port GLSL noise functions to TSL
    const pos = positionLocal;
    const heightNode = add(
      mul(pos.y, float(surfaceProps.terrainAmplitude ?? 1.0)),
      float(surfaceProps.terrainOffset ?? 0.0),
    );
    return heightNode;
  }
}
```

### Step 2: Update Material Factory

Create `procedural-planet-factory.ts`:

```typescript
import {
  MaterialFactory,
  MaterialFactoryOptions,
  getRendererBackend,
} from "./materials/MaterialFactory";
import { ProceduralPlanetMaterial } from "./materials/procedural-planet.material";
import { ProceduralPlanetNodeMaterial } from "./materials/procedural-planet-tsl.material";
import type { ProceduralSurfaceProperties } from "./types/procedural";

export class ProceduralPlanetMaterialFactory extends MaterialFactory {
  createMaterial(
    options: MaterialFactoryOptions & {
      surfaceProps: ProceduralSurfaceProperties;
    },
  ): THREE.Material {
    if (this.isWebGPU(options)) {
      console.log(
        "[ProceduralPlanetFactory] Creating WebGPU material with TSL",
      );
      return new ProceduralPlanetNodeMaterial(options.surfaceProps);
    } else {
      console.log(
        "[ProceduralPlanetFactory] Creating WebGL material with GLSL",
      );
      return new ProceduralPlanetMaterial(options.surfaceProps);
    }
  }
}
```

### Step 3: Update Renderer

In `renderer.ts`, use the factory:

```typescript
import { ProceduralPlanetMaterialFactory } from "./procedural-planet-factory";
import { getRendererBackend } from "./materials/MaterialFactory";

export class BaseTerrestrialRenderer extends BaseCelestialRenderer {
  protected materialFactory: ProceduralPlanetMaterialFactory;

  constructor(
    object: RenderableCelestialObject,
    deps: TerrestrialRendererDeps,
  ) {
    super(object);
    this.materialFactory = new ProceduralPlanetMaterialFactory();
  }

  createMaterial(
    object: RenderableCelestialObject,
    sceneManager: any,
  ): THREE.Material {
    const planetProps = object.properties as PlanetProperties;
    const surfaceProps = planetProps?.surface as ProceduralSurfaceProperties;

    return this.materialFactory.createMaterial({
      rendererBackend: getRendererBackend(sceneManager),
      surfaceProps: surfaceProps || this.getDefaultSurfaceProps(),
    });
  }
}
```

## TSL Noise Functions

One of the challenges is porting GLSL noise functions to TSL. Here are the options:

### Option 1: Use Three.js Built-in Noise (Recommended for Start)

```typescript
import { noise } from "three/tsl";

const noiseValue = noise(positionLocal.mul(frequency));
```

### Option 2: Port GLSL Functions to TSL

TSL provides `Fn()` to define custom shader functions:

```typescript
import { Fn, vec3, float } from "three/tsl";

// Define a custom simplex noise function in TSL
const simplexNoise3D = Fn(([p]) => {
  // Port GLSL simplex noise logic to TSL
  // This is complex and requires careful porting
  const i = floor(add(p, dot(p, vec3(0.333333))));
  // ... rest of simplex noise implementation
  return noiseValue;
});

// Use it
const noise = simplexNoise3D(positionLocal.mul(frequency));
```

### Option 3: Use `glslFn` for GLSL Code (Temporary Migration Step)

```typescript
import { glslFn } from "three/tsl";

// Import existing GLSL code directly
const simplexNoise3D = glslFn`
  vec3 simplexNoise3D(vec3 p) {
    // Your existing GLSL code
    return noiseValue;
  }
`;

// Use it in TSL
const noise = simplexNoise3D(positionLocal.mul(frequency));
```

## Migration Strategy

### Phase 1: Infrastructure (Current)

- ✅ Create `MaterialFactory` base class
- ✅ Add `rendererBackend` to SceneManager
- ✅ Create migration guide

### Phase 2: Simple TSL Materials

- 🔄 Create basic TSL material with simplified terrain
- 🔄 Test WebGPU rendering with TSL
- 🔄 Verify material switching works

### Phase 3: Advanced TSL Features

- Port noise functions to TSL
- Implement full terrain generation in TSL
- Add atmospheric effects in TSL
- Optimize for WebGPU performance

### Phase 4: Complete Migration

- Update all celestial packages to use factories
- Phase out GLSL materials (keep for WebGL fallback)
- Document best practices
- Performance benchmarking

## Testing

### Testing WebGPU Materials

```typescript
// In your test file
import { ProceduralPlanetNodeMaterial } from "../materials/procedural-planet-tsl.material";

describe("ProceduralPlanetNodeMaterial", () => {
  it("should create a valid TSL material", () => {
    const material = new ProceduralPlanetNodeMaterial({
      color1: "#5179B5",
      color2: "#4C9341",
      // ... other props
    });

    expect(material).toBeInstanceOf(MeshStandardNodeMaterial);
    expect(material.colorNode).toBeDefined();
    expect(material.roughnessNode).toBeDefined();
  });
});
```

### Visual Testing

1. Create a scene with WebGPU renderer
2. Create a terrestrial planet
3. Verify the material renders correctly
4. Compare with WebGL version

## Resources

- [Three.js TSL Documentation](https://threejs.org/docs/#api/en/renderers/webgpu/nodes/Nodes)
- [Maxime Heckel's TSL Guide](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)
- [Three.js WebGPU Examples](https://threejs.org/examples/?q=webgpu)
- [Three.js Node System](https://github.com/mrdoob/three.js/tree/dev/src/nodes)

## Next Steps

1. Implement a basic TSL material for terrestrial planets
2. Test WebGPU rendering
3. Gradually port GLSL shader logic to TSL
4. Apply the same pattern to other celestial types (gas giants, stars, etc.)
5. Optimize TSL materials for performance

## Notes

- TSL materials work with both WebGL and WebGPU (fallback)
- Start with simple materials, gradually add complexity
- Use `glslFn` as a bridge during migration
- Focus on WebGPU as the priority, WebGL as fallback
- Material factories allow gradual migration without breaking existing code
