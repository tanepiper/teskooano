# Terrestrial Shaders - TSL Migration TODO

This document tracks the migration of terrestrial planet shaders from GLSL to TSL (Three.js Shading Language) for WebGPU compatibility.

## Current GLSL Shaders

### Main Shaders

- [ ] `src/shaders/procedural.vertex.glsl` → TSL node graph
- [ ] `src/shaders/procedural.fragment.glsl` → TSL node graph
- [ ] `src/shaders/atmosphere.vertex.glsl` → TSL node graph
- [ ] `src/shaders/atmosphere.fragment.glsl` → TSL node graph

### Shared Utilities

- [ ] `src/shared/terrain.glsl` → TSL utility functions
- [ ] `src/shared/lighting.glsl` → TSL utility functions
- [ ] `src/shared/noise.glsl` → TSL utility functions
- [ ] `src/shared/simplex/2d.glsl` → TSL noise nodes (or use built-in)
- [ ] `src/shared/simplex/3d.glsl` → TSL noise nodes (or use built-in)
- [ ] `src/shared/simplex/4d.glsl` → TSL noise nodes (or use built-in)

## Migration Priority

1. **Start with simpler shaders** - Atmosphere shaders are simpler and a good starting point
2. **Move to procedural terrain** - More complex but heavily used
3. **Convert shared utilities last** - Can be used by multiple shaders

## Detailed Migration Plan

### Phase 1: Atmosphere Shaders (Estimated: 2-3 days)

**Files**:

- `atmosphere.vertex.glsl`
- `atmosphere.fragment.glsl`

**Complexity**: Medium

**Key Features**:

- Fresnel effect for atmosphere edge glow
- Simple lighting calculations
- Color blending based on view angle

**TSL Approach**:

```typescript
import {
  fresnel,
  normalWorld,
  positionWorld,
  cameraPosition,
  mix,
  MeshPhysicalNodeMaterial,
} from "three/tsl";

// Use built-in Fresnel node
const fresnelEffect = fresnel();

// Mix colors based on Fresnel
const atmosphereColor = mix(innerColor, outerColor, fresnelEffect);
```

**Notes**:

- TSL has built-in Fresnel node
- Lighting can use standard lighting models
- May need custom node for specific atmospheric scattering

### Phase 2: Procedural Terrain Shaders (Estimated: 5-7 days)

**Files**:

- `procedural.vertex.glsl`
- `procedural.fragment.glsl`
- `terrain.glsl` (shared utilities)

**Complexity**: High

**Key Features**:

- Multi-octave noise for terrain generation
- Height-based color gradients
- Normal map generation from heightmap
- Biome blending based on temperature/moisture
- PBR material properties (roughness, metalness)

**TSL Approach**:

```typescript
import {
  positionLocal,
  simplexNoise3d,
  mix,
  vec3,
  float,
  MeshStandardNodeMaterial,
} from "three/tsl";

// Multi-octave noise
const octave1 = simplexNoise3d(positionLocal.mul(1.0));
const octave2 = simplexNoise3d(positionLocal.mul(2.0)).mul(0.5);
const octave3 = simplexNoise3d(positionLocal.mul(4.0)).mul(0.25);
const height = octave1.add(octave2).add(octave3);

// Height-based color mapping
const color = mix(lowColor, highColor, height.smoothstep(minHeight, maxHeight));
```

**Notes**:

- TSL has built-in simplex noise (simpler than custom implementation)
- May need custom nodes for complex biome blending
- Normal generation might require custom derivative calculations
- Test performance vs GLSL implementation

### Phase 3: Shared Noise Utilities (Estimated: 3-4 days)

**Files**:

- `noise.glsl`
- `lighting.glsl`
- `simplex/2d.glsl`
- `simplex/3d.glsl`
- `simplex/4d.glsl`

**Complexity**: Medium

**TSL Approach**:

1. **Evaluate Built-in Nodes First**:
   - Three.js TSL has `simplexNoise2d`, `simplexNoise3d`, `simplexNoise4d`
   - Test if these provide sufficient quality and performance
   - Only create custom implementations if necessary

2. **Create TSL Utility Module**:

```typescript
// src/tsl/noise-utilities.ts
import { simplexNoise3d, positionLocal, Fn } from "three/tsl";

export const fbmNoise = Fn(([position, octaves, lacunarity, persistence]) => {
  let value = float(0);
  let amplitude = float(1);
  let frequency = float(1);

  Loop(octaves, () => {
    value = value.add(simplexNoise3d(position.mul(frequency)).mul(amplitude));
    frequency = frequency.mul(lacunarity);
    amplitude = amplitude.mul(persistence);
  });

  return value;
});
```

3. **Create Lighting Utilities**:

```typescript
// src/tsl/lighting-utilities.ts
import { normalWorld, positionWorld, Fn } from "three/tsl";

export const calculateDiffuse = Fn(([lightPos, lightColor]) => {
  const lightDir = lightPos.sub(positionWorld).normalize();
  const ndotl = normalWorld.dot(lightDir).max(0);
  return lightColor.mul(ndotl);
});
```

**Notes**:

- Prefer built-in TSL nodes over custom implementations
- Custom implementations should match GLSL behavior exactly
- Document any performance differences

## Testing Strategy

For each migrated shader:

1. **Visual Comparison**:
   - Render same planet with GLSL and TSL side-by-side
   - Compare screenshots at multiple zoom levels
   - Test different planet types and biomes

2. **Performance Testing**:
   - Measure FPS with GLSL version
   - Measure FPS with TSL version
   - Test on both WebGL and WebGPU renderers
   - Document any performance differences

3. **Cross-Platform Testing**:
   - Test on Chrome, Firefox, Safari (WebGPU support varies)
   - Test on Windows, macOS, Linux
   - Test on different GPU vendors (NVIDIA, AMD, Intel)

4. **Edge Cases**:
   - Extreme camera distances (very close, very far)
   - Rapidly changing view angles
   - Multiple planets visible simultaneously

## Success Criteria

A shader migration is considered complete when:

- [ ] TSL version produces visually identical output to GLSL version
- [ ] Performance is within 10% of GLSL version (±10% acceptable)
- [ ] Works correctly in both WebGL and WebGPU renderers
- [ ] All tests pass
- [ ] Code is documented with JSDoc comments
- [ ] GLSL version is marked as deprecated (but not yet removed)

## Known Challenges

1. **Precision Differences**: WebGPU uses different precision than WebGL
2. **Noise Quality**: Built-in TSL noise may differ slightly from custom GLSL
3. **Performance Tradeoffs**: Node-based system may have different performance characteristics
4. **Derivative Calculations**: Normal map generation from heightmap requires careful handling

## Resources

- [Three.js TSL Noise Nodes](https://threejs.org/docs/#api/en/nodes/utils/NoiseNode)
- [WebGPU Precision Guarantees](https://www.w3.org/TR/WGSL/#floating-point-evaluation)
- [TSL Material Nodes](https://threejs.org/docs/#api/en/nodes/materials/MeshStandardNodeMaterial)

## Progress Tracking

**Last Updated**: [Date will be filled when work begins]

**Current Phase**: Not started

**Estimated Completion**: [To be determined based on phase completion]

## Notes

- Consider creating reusable TSL node libraries for common operations
- Document any workarounds or limitations discovered during migration
- Keep performance metrics for comparison with future Three.js versions
