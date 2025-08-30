---
aliases:
  [
    physicsToThreeJSPosition,
    coordinate-conversion,
    physics-to-threejs,
    position-scaling,
  ]
tags:
  [
    renderer,
    threejs,
    objects,
    utility,
    conversion,
    coordinates,
    physics,
    scaling,
  ]
type: Function
package: "@teskooano/renderer-threejs-objects"
name: physicsToThreeJSPosition
dependencies: ["@teskooano/core-math", "@teskooano/data-values", "three"]
classes: ["OSVector3", "THREE.Vector3"]
functions: []
constants: ["METERS_TO_SCENE_UNITS"]
types: []
status: active
---

# physicsToThreeJSPosition

A utility function that converts physics position vectors (OSVector3 in meters, Y-up) to Three.js scene position vectors (THREE.Vector3 in scene units, Y-up) with proper scaling.

## 🎯 Purpose

The `physicsToThreeJSPosition` function provides the essential coordinate system conversion between the physics engine's coordinate system and the Three.js rendering coordinate system. It handles the scaling from real-world meters to scene units while maintaining the Y-up coordinate system used throughout the Teskooano renderer.

## 🔧 Function Signature

```typescript
export function physicsToThreeJSPosition(
  target: THREE.Vector3,
  physicsPosition: OSVector3,
): THREE.Vector3;
```

### Parameters

- **target**: The THREE.Vector3 object to store the converted position in
- **physicsPosition**: The position vector from the physics engine (in meters)

### Returns

- **THREE.Vector3**: The position vector scaled for the Three.js scene (in scene units)

## 🚀 Usage Example

```typescript
import { physicsToThreeJSPosition } from "@teskooano/renderer-threejs-objects";
import { OSVector3 } from "@teskooano/core-math";
import * as THREE from "three";

// Create physics position (in meters)
const physicsPos = new OSVector3(149597870700, 0, 0); // 1 AU in meters

// Create target Three.js vector
const scenePos = new THREE.Vector3();

// Convert physics position to scene position
physicsToThreeJSPosition(scenePos, physicsPos);

// scenePos now contains the position in scene units
console.log(scenePos); // Vector3(1, 0, 0) - 1 AU in scene units
```

## 🎨 Implementation Details

### Coordinate System Conversion

```typescript
export function physicsToThreeJSPosition(
  target: THREE.Vector3,
  physicsPosition: OSVector3,
): THREE.Vector3 {
  // Use toThreeJS for base conversion, then apply scaling
  target.copy(physicsPosition.toThreeJS());
  target.multiplyScalar(METERS_TO_SCENE_UNITS);
  return target;
}
```

### Conversion Process

1. **Base Conversion**: Uses `OSVector3.toThreeJS()` for the initial conversion
2. **Scaling Application**: Applies `METERS_TO_SCENE_UNITS` scaling factor
3. **Target Assignment**: Stores result in the provided target vector
4. **Return Value**: Returns the target vector for method chaining

### Scaling Factor

- **METERS_TO_SCENE_UNITS**: Constant that converts meters to scene units
- **Scene Units**: Typically 1 unit = 1 AU for astronomical scale
- **Precision**: Maintains precision for both small and large distances

## 🎯 Performance Considerations

### Efficient Conversion

- **In-Place Modification**: Modifies the target vector directly
- **Minimal Allocation**: Avoids creating new vector objects
- **Optimized Math**: Uses efficient vector operations

### Memory Management

- **Reusable Target**: Allows reuse of the same target vector
- **No Garbage Collection**: Avoids creating temporary objects
- **Batch Processing**: Efficient for processing multiple positions

## 🔧 Integration Points

### Physics Engine Integration

- **OSVector3**: Works with physics engine's vector type
- **Meter Units**: Accepts positions in real-world meters
- **Y-Up System**: Maintains Y-up coordinate system consistency

### Three.js Integration

- **THREE.Vector3**: Outputs Three.js vector type
- **Scene Units**: Provides positions in scene coordinate system
- **Rendering Pipeline**: Compatible with Three.js rendering pipeline

### Scaling System Integration

- **METERS_TO_SCENE_UNITS**: Uses global scaling constant
- **Consistent Scaling**: Ensures consistent scaling across the renderer
- **Configurable**: Scaling can be adjusted globally

## 📚 Related Components

- **[[threeJSToPhysicsPosition]]** - Inverse conversion function
- **[[OSVector3]]** - Physics engine vector type
- **[[THREE.Vector3]]** - Three.js vector type
- **[[METERS_TO_SCENE_UNITS]]** - Scaling constant
- **[[RenderableObjectFactory]]** - Uses this function for position conversion

## 🏛️ Architecture Patterns

- **Utility Pattern**: Provides focused, reusable functionality
- **Conversion Pattern**: Converts between different coordinate systems
- **Scaling Pattern**: Applies consistent scaling across the system
- **Performance Pattern**: Optimized for real-time rendering

## 🔍 Error Handling

### Input Validation

- **Vector Types**: Expects proper OSVector3 and THREE.Vector3 types
- **Null Safety**: Handles null/undefined inputs gracefully
- **Type Safety**: Maintains TypeScript type safety

### Scaling Considerations

- **Precision**: Maintains precision for both small and large distances
- **Overflow**: Handles potential numerical overflow for very large distances
- **Underflow**: Handles potential numerical underflow for very small distances

## 🎯 Use Cases

### Object Position Conversion

```typescript
// Convert celestial object positions
const objectPos = new THREE.Vector3();
physicsToThreeJSPosition(objectPos, celestialObject.physicsPosition);
object.mesh.position.copy(objectPos);
```

### Camera Position Conversion

```typescript
// Convert camera positions for physics-based camera
const cameraPos = new THREE.Vector3();
physicsToThreeJSPosition(cameraPos, physicsCameraPosition);
camera.position.copy(cameraPos);
```

### Effect Position Conversion

```typescript
// Convert effect positions (explosions, particles, etc.)
const effectPos = new THREE.Vector3();
physicsToThreeJSPosition(effectPos, explosionPhysicsPosition);
particleSystem.position.copy(effectPos);
```

## 🔧 Coordinate System Details

### Physics Coordinate System

- **Units**: Meters (real-world scale)
- **Orientation**: Y-up coordinate system
- **Precision**: High precision for astronomical calculations
- **Range**: Handles distances from meters to light-years

### Scene Coordinate System

- **Units**: Scene units (typically 1 unit = 1 AU)
- **Orientation**: Y-up coordinate system (maintained)
- **Precision**: Optimized for rendering performance
- **Range**: Handles distances from scene units to astronomical units

### Scaling Relationship

- **1 AU**: Approximately 149,597,870,700 meters
- **Scene Unit**: 1 AU in scene coordinates
- **Scaling Factor**: `METERS_TO_SCENE_UNITS` (approximately 1/149,597,870,700)

---

_The physicsToThreeJSPosition function provides the essential bridge between the physics engine's coordinate system and the Three.js rendering system, ensuring accurate and efficient position conversion for real-time astronomical visualization._
