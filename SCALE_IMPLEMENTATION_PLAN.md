# Scale Implementation Plan: 1000 → 100 Units per AU

## Step-by-Step Implementation Guide

### Phase 1: Core Scale Change

#### 1.1 Primary Constant Change
**File**: `packages/data/types/src/scaling.ts`

```typescript
// CHANGE THIS:
RENDER_SCALE_AU: 1000,

// TO THIS:
RENDER_SCALE_AU: 100,
```

**Test**: Load any system and verify objects still render at basic level.

---

### Phase 2: Critical LOD Distance Fixes

#### 2.1 Terrestrial Planet LOD Distances
**File**: `packages/systems/celestial/src/renderers/terrestrial/base-terrestrial.ts`

**Line 121**: Currently uses hardcoded scale multipliers
```typescript
// CURRENT (Lines 121-127):
const level1: LODLevel = {
  object: mediumDetailGroup,
  distance: 250 * scale,  // ← This will now be 25,000 instead of 250,000
};

// And later (Line 135):
billboardDistance = 1000 * scale;  // ← This will now be 100,000 instead of 1,000,000
```

**Recommended Fix**: Adjust the base multipliers to compensate for the 10x scale reduction:
```typescript
// NEW VALUES (multiply by 10):
const level1: LODLevel = {
  object: mediumDetailGroup,
  distance: 2500 * scale,  // Multiply by 10
};

// And:
billboardDistance = 10000 * scale;  // Multiply by 10
```

#### 2.2 Asteroid Field LOD Distances  
**File**: `packages/systems/celestial/src/renderers/particles/AsteroidFieldRenderer.ts`

**Lines 371-374**: Hardcoded AU distances for LOD transitions
```typescript
// CURRENT:
const distancesAU = [0, 1, 4, 10];

// CONSIDER ADJUSTING TO:
const distancesAU = [0, 0.1, 0.4, 1.0];  // 10x closer transitions
```

---

### Phase 3: Camera & Control System Fixes

#### 3.1 Camera Transition Manager
**File**: `packages/renderer/threejs-controls/src/transition/CameraTransitionManager.ts`

**Line 175 & 331**: Hardcoded AU approximation
```typescript
// CURRENT:
const AU = 150; // Approximate scene units per Astronomical Unit

// NEEDS TO CHANGE TO:
const AU = 15; // New approximate scene units per AU (150/10)
```

**Lines 266-268**: Speed and distance calculations in notifications
```typescript
// These will automatically adjust with the AU change above, but verify:
const speedInAU = speed / AU / 10;
const remainingDistanceAU = remainingDistance / AU / 10;
```

#### 3.2 Orbit Controls Maximum Distance
**File**: `packages/renderer/threejs-controls/src/orbit/OrbitControlsHandler.ts`

**Line 30**: May need adjustment for new scale
```typescript
// CURRENT:
this.controls.maxDistance = 1e7; // 10,000,000 units

// CONSIDER REDUCING TO:
this.controls.maxDistance = 1e6; // 1,000,000 units (10x reduction)
```

---

### Phase 4: Black Hole & Stellar Object LOD Fixes

#### 4.1 Kerr Black Hole LOD
**File**: `packages/systems/celestial/src/renderers/stars/black-holes/kerr-black-hole.ts`

**Lines 217 & 223**: Hardcoded distances
```typescript
// CURRENT:
const lod1: LODLevel = { object: mediumDetailGroup, distance: 8000 };
const lod2: LODLevel = { object: lowDetailGroup, distance: 20000 };

// NEEDS TO CHANGE TO:
const lod1: LODLevel = { object: mediumDetailGroup, distance: 800 };  // 10x reduction
const lod2: LODLevel = { object: lowDetailGroup, distance: 2000 };    // 10x reduction
```

#### 4.2 Schwarzschild Black Hole LOD
**File**: `packages/systems/celestial/src/renderers/stars/black-holes/schwarzschild-black-hole.ts`

**Line 242**: Hardcoded distance
```typescript
// CURRENT:
const lod1: LODLevel = { object: lowDetailGroup, distance: 10000 };

// NEEDS TO CHANGE TO:
const lod1: LODLevel = { object: lowDetailGroup, distance: 1000 };  // 10x reduction
```

---

### Phase 5: Gas Giant LOD Fixes

#### 5.1 Base Gas Giant Renderer
**File**: `packages/systems/celestial/src/renderers/gas-giants/base/renderer.ts`

**Lines 109 & 115**: Hardcoded scale multipliers
```typescript
// CURRENT:
const level1: LODLevel = { object: level1Group, distance: 800 * scale };
const billboardDistance = 2000 * scale;

// NEEDS TO CHANGE TO (multiply by 10):
const level1: LODLevel = { object: level1Group, distance: 8000 * scale };
const billboardDistance = 20000 * scale;
```

---

### Phase 6: Physics System Verification

#### 6.1 Octree Size Check
**File**: `packages/core/physics/src/simulation/simulation.ts`

**Line 125**: Default octree size
```typescript
// CURRENT:
octreeSize = 5e13,  // 50,000,000,000,000 meters

// MAY NEED TO VERIFY: This is in meters, so should still work
// But monitor performance - may need adjustment
```

**File**: `packages/core/physics/src/simulation/prediction.ts`

**Line 41**: Same octree size - monitor performance

---

### Phase 7: UI Marker System Verification

#### 7.1 AU Markers
**File**: `packages/renderer/threejs-labels/src/managers/AuMarkerManager.ts`

**Lines 90-93**: Ring geometry scaling - should auto-adjust via `METERS_TO_SCENE_UNITS`
```typescript
// This SHOULD auto-adjust, but verify:
const radiusSceneUnits = au * AU_METERS * METERS_TO_SCENE_UNITS;
```

**File**: `packages/renderer/threejs-labels/src/layers/AuMarkerLabelLayer.ts`

**Line 78**: Label visibility calculation - should auto-adjust
```typescript
// This SHOULD auto-adjust, but verify the 10x multiplier makes sense:
const visible = cameraDistance < markerAuValueScene * 10;
```

---

## Implementation Order

### 1. **Start with Core Change**
- Change `RENDER_SCALE_AU: 1000` to `100`
- Test basic rendering still works

### 2. **Fix Most Critical LOD Issues**
- Camera transition manager AU constant
- Terrestrial planet LOD distances
- Gas giant LOD distances

### 3. **Fix Stellar Object LODs**
- Black hole renderers
- Any star LOD issues

### 4. **Verify Physics Performance**
- Monitor octree performance
- Check integrator stability

### 5. **Test & Adjust**
- Navigate through system at various scales
- Check UI displays are correct
- Verify camera feels natural

---

## Testing Checklist

- [ ] Objects render at 1 AU distance
- [ ] Objects render at 10 AU distance  
- [ ] Objects render at 100 AU distance
- [ ] Objects render at 1000 AU distance
- [ ] LOD transitions occur at appropriate times
- [ ] Camera movement feels natural
- [ ] AU markers display correctly
- [ ] Distance labels show correct values
- [ ] Physics simulation remains stable
- [ ] No performance regressions

---

## Rollback Strategy

If issues occur:
1. **Immediately revert** `RENDER_SCALE_AU` to 1000
2. **Document which changes worked** vs. which caused problems
3. **Address issues incrementally** rather than trying to fix everything at once

---

## Expected Benefits After Implementation

- **Better numerical precision** at large distances
- **Reduced floating-point errors** in physics calculations
- **More stable camera controls** at extreme ranges
- **Improved LOD behavior** across the scale range
- **Maintained visual fidelity** at all scales