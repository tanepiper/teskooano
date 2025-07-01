# Scale Analysis: Reducing from 1000 to 100 Units per AU

## Overview

This document analyzes all systems that will be affected by reducing the scale from **1000 units per AU** to **100 units per AU** (a 10x reduction). The goal is to maintain relative scale while improving numerical precision for large distances.

## Current Scale Implementation

### Core Constants Location: `packages/data/types/src/scaling.ts`

```typescript
export const SCALE = {
  DISTANCE: 1.0,
  SIZE: 1.0,
  TIME: 1.0,
  MASS: 1.0e-20,
  
  RENDER_SCALE_AU: 1000,  // ← This needs to change to 100
  
  GAS_GIANT_SIZE: 1.0,
  STAR_SIZE: 1.0,
  MOON_DISTANCE: 50.0,
};

export const METERS_TO_SCENE_UNITS = SCALE.RENDER_SCALE_AU / AU_METERS;
```

## Affected Systems by Category

### 1. Core Scaling & Constants

| File | Component | Impact | Change Required |
|------|-----------|--------|-----------------|
| `packages/data/types/src/scaling.ts` | `SCALE.RENDER_SCALE_AU` | **CRITICAL** | Change from 1000 to 100 |
| `packages/core/physics/src/units/constants.ts` | Physics constants | Low | Verify compatibility |
| `packages/core/physics/src/units/units.ts` | Unit conversions | Low | Should auto-adjust with new scale |
| `packages/systems/procedural-generation/src/constants.ts` | AU_TO_METERS constant | Low | Verify usage |

### 2. Physics & Simulation

| File | Component | Impact | Change Required |
|------|-----------|--------|-----------------|
| `packages/core/physics/src/simulation/simulation.ts` | Octree size parameter | **HIGH** | `octreeSize = 5e13` may need adjustment |
| `packages/core/physics/src/simulation/prediction.ts` | Trajectory prediction | **HIGH** | Same octreeSize issue |
| `packages/core/physics/src/integrators/*` | All integrators | **MEDIUM** | Should work with new scale, verify numerics |
| `packages/core/physics/src/spatial/octree.ts` | Spatial partitioning | **HIGH** | Size bounds need verification |

**Key Physics Concerns:**
- Octree size `5e13` is in meters - may need adjustment for efficiency
- Verlet integrator stability at new scale
- Barnes-Hut theta parameter may need tuning

### 3. Rendering & Visual Systems

#### 3.1 Level of Detail (LOD) Systems

| File | Component | Impact | Distance Values to Check |
|------|-----------|--------|--------------------------|
| `packages/systems/celestial/src/renderers/terrestrial/base-terrestrial.ts` | Planet LOD distances | **HIGH** | `250 * scale`, `1000 * scale` |
| `packages/systems/celestial/src/renderers/gas-giants/base/renderer.ts` | Gas giant LOD | **HIGH** | `800 * scale`, `2000 * scale` |
| `packages/systems/celestial/src/renderers/stars/black-holes/kerr-black-hole.ts` | Black hole LOD | **HIGH** | `8000`, `20000` |
| `packages/systems/celestial/src/renderers/stars/black-holes/schwarzschild-black-hole.ts` | Schwarzschild LOD | **HIGH** | `10000` |
| `packages/systems/celestial/src/renderers/particles/AsteroidFieldRenderer.ts` | Particle LOD | **HIGH** | Distance array `[0, 1, 4, 10]` AU |
| `packages/renderer/threejs-lod/src/LODManager.ts` | LOD scaling factors | **MEDIUM** | Profile-based scaling |

#### 3.2 Camera & Controls

| File | Component | Impact | Values to Check |
|------|-----------|--------|------------------|
| `packages/renderer/threejs-controls/src/transition/CameraTransitionManager.ts` | Transition calculations | **HIGH** | `AU = 150` approximation |
| `packages/renderer/threejs-controls/src/orbit/OrbitControlsHandler.ts` | Control limits | **MEDIUM** | `maxDistance = 1e7` |
| `packages/app/simulation/src/camera/constants.ts` | Camera defaults | **MEDIUM** | `DEFAULT_CAMERA_POSITION` |
| `packages/app/simulation/src/camera/CameraManager.ts` | Camera positioning | **HIGH** | Distance calculations |

#### 3.3 Labels & UI Markers

| File | Component | Impact | Change Required |
|------|-----------|--------|-----------------|
| `packages/renderer/threejs-labels/src/managers/AuMarkerManager.ts` | AU marker rings | **HIGH** | Ring geometry scale |
| `packages/renderer/threejs-labels/src/layers/AuMarkerLabelLayer.ts` | Label visibility | **HIGH** | Distance calculations |
| `packages/renderer/threejs-labels/src/layers/CelestialLabelLayer.ts` | Object labels | **MEDIUM** | Distance formatting |
| `packages/renderer/threejs-labels/src/layers/BaseLabelLayer.ts` | Base conversion | **LOW** | Should auto-adjust |

#### 3.4 Orbit Visualization

| File | Component | Impact | Change Required |
|------|-----------|--------|-----------------|
| `packages/renderer/threejs-orbits/src/keplerian/OrbitCalculator.ts` | Keplerian orbits | **HIGH** | Scale conversion for orbit points |
| `packages/renderer/threejs-orbits/src/verlet/PredictionManager.ts` | Future predictions | **HIGH** | Scene unit scaling |
| `packages/renderer/threejs-objects/src/utils/coordinateUtils.ts` | Coordinate conversion | **LOW** | Should auto-adjust |

### 4. Procedural Generation

| File | Component | Impact | Values to Check |
|------|-----------|--------|------------------|
| `packages/systems/procedural-generation/src/zones/CelestialZoneManager.ts` | Zone boundaries | **MEDIUM** | `maxAU: 10000.0` |
| `packages/systems/procedural-generation/src/utils.ts` | Distance checks | **MEDIUM** | Distance calculations |
| `packages/systems/procedural-generation/src/generators/belts/asteroidBelt.ts` | Belt distances | **MEDIUM** | Formation distances |
| `packages/app/simulation/src/systems/solar-system/oortCloud.ts` | Oort cloud size | **MEDIUM** | `OORT_OUTER_AU = 100000` |

### 5. Shaders & Materials

#### 5.1 Distance-Based Effects

| Shader | Effect | Impact | Change Required |
|--------|--------|--------|-----------------|
| `packages/systems/celestial/src/shaders/gas-giants/*.fragment.glsl` | Shadow calculations | **LOW** | Should work with new scale |
| `packages/systems/celestial/src/shaders/ring/ring.fragment.glsl` | Ring shadows | **LOW** | Should work with new scale |
| `packages/systems/celestial/src/shaders/terrestrial/procedural.fragment.glsl` | Terrain effects | **LOW** | Should work with new scale |

### 6. UI & Formatting

| File | Component | Impact | Change Required |
|------|-----------|--------|-----------------|
| `apps/teskooano/src/plugins/celestial-info/utils/formatters.ts` | Distance formatting | **MEDIUM** | Verify display accuracy |
| `packages/renderer/threejs-labels/src/layers/CelestialLabelLayer.ts` | Label formatting | **MEDIUM** | Distance display |
| Various celestial info components | Info panels | **LOW** | Should auto-adjust |

### 7. Billboard & Visibility Systems

| File | Component | Impact | Values to Check |
|------|-----------|--------|------------------|
| `packages/systems/celestial/src/renderers/billboards/manager.ts` | Billboard visibility | **HIGH** | Activation distances |
| `packages/systems/celestial/src/renderers/billboards/billboard-utils.ts` | Billboard sizing | **MEDIUM** | Size calculations |

## Implementation Strategy

### Phase 1: Core Constants
1. **Change the primary constant**: `SCALE.RENDER_SCALE_AU: 1000` → `100`
2. **Test basic rendering** to ensure objects still appear

### Phase 2: LOD System Updates
1. **Audit all hardcoded LOD distances** in renderer files
2. **Update distance calculations** that don't auto-scale
3. **Test LOD transitions** at various zoom levels

### Phase 3: Camera & Controls
1. **Update camera transition calculations** in `CameraTransitionManager.ts`
2. **Verify camera movement speeds** are still appropriate
3. **Check orbit control limits** are still reasonable

### Phase 4: Physics Verification
1. **Test octree performance** with new scale
2. **Verify integrator stability** hasn't degraded
3. **Check trajectory prediction accuracy**

### Phase 5: UI & Formatting
1. **Verify distance displays** are accurate
2. **Check AU markers** render correctly
3. **Test label visibility** at various scales

## Risk Assessment

### High Risk Areas
- **LOD distances**: Many hardcoded values that won't auto-adjust
- **Camera transitions**: Hardcoded AU approximation (`AU = 150`)
- **Octree sizing**: May need manual adjustment for performance
- **Billboard activation**: Distance thresholds may need updates

### Medium Risk Areas  
- **Shader distance calculations**: Should mostly work but need verification
- **UI formatting**: May show unexpected precision or ranges

### Low Risk Areas
- **Basic coordinate conversion**: Should auto-adjust via `METERS_TO_SCENE_UNITS`
- **Core physics math**: Scale-agnostic calculations

## Testing Strategy

1. **Load a known system** (e.g., Solar System)
2. **Navigate to various distances** (1 AU, 10 AU, 100 AU, 1000 AU)
3. **Verify LOD transitions** occur at appropriate distances
4. **Check UI displays** show correct scale information
5. **Test camera movements** feel natural at all scales
6. **Verify physics stability** over extended simulation time

## Rollback Plan

If issues arise:
1. **Revert `SCALE.RENDER_SCALE_AU`** to 1000
2. **Keep detailed notes** of what works vs. what breaks
3. **Address issues incrementally** rather than all-at-once

This analysis shows that while the change touches many systems, most should auto-adjust through the central `METERS_TO_SCENE_UNITS` conversion. The main work will be updating hardcoded distance values in LOD and camera systems.