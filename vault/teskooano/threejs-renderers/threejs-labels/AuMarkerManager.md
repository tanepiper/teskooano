---
aliases: [AuMarkerManager, au-markers, distance-rings, au-rings]
tags: [renderer, threejs, labels, au-markers, rings, instanced-mesh, distance]
type: Class
package: "@teskooano/renderer-threejs-labels"
name: AuMarkerManager
dependencies:
  ["@teskooano/data-values", "@teskooano/renderer-threejs-core", "three"]
classes:
  [
    "THREE.Scene",
    "THREE.Group",
    "THREE.InstancedMesh",
    "THREE.RingGeometry",
    "THREE.MeshBasicMaterial",
    "Layer2DManager",
    "AuMarkerLabelLayer",
    "RenderOrderManager",
    "THREE.Object3D",
    "THREE.Color",
  ]
functions: []
constants: ["AU_METERS", "METERS_TO_SCENE_UNITS"]
types: []
status: active
---

# AuMarkerManager

Manages the creation, visibility, and disposal of AU (Astronomical Unit) distance markers, providing both 3D ring geometries and 2D CSS labels for distance reference throughout the solar system.

## 🎯 Purpose

The `AuMarkerManager` creates a comprehensive distance reference system using both 3D rings and 2D labels. It generates AU markers in powers of 10 (0.1, 1, 10, 100, etc.) with optimized rendering using InstancedMesh, and integrates with the CSS2D label system to provide distance indicators at cardinal directions around each ring.

## 🏗️ Architecture

### Core Components

- **InstancedMesh**: Single mesh instance for all AU rings with optimized rendering
- **Ring Geometry**: Unit ring geometry scaled to different AU distances
- **Label Integration**: Integration with AuMarkerLabelLayer for 2D labels
- **Group Management**: Hierarchical organization of labels within distance groups

### AU Marker Data Structure

```typescript
interface AuMarkerData {
  au: number; // AU distance value
  color: string; // Hex color for the ring and labels
}
```

### Ring Generation Strategy

- **Powers of 10**: Creates markers at 0.1, 1, 10, 100, 1000, etc. AU
- **Decade Markers**: First marker of each decade (0.1, 1, 10, etc.) is green
- **Secondary Markers**: Other markers in each decade are orange
- **Maximum Range**: Configurable maximum AU value (default: 1,000,000 AU)

## 🔧 Core Methods

### Constructor

```typescript
constructor(
  scene: THREE.Scene,
  css2DManager: Layer2DManager,
  name = "GROUP_AU_MARKERS"
)
```

- **scene**: Three.js scene for ring and group positioning
- **css2DManager**: Manager for 2D label integration
- **name**: Group name for scene organization
- **Initialization**: Sets up main group and render order

### Marker Creation

```typescript
public createMarkers(): void
```

- **Layer Registration**: Registers AuMarkerLabelLayer with CSS2D manager
- **Geometry Creation**: Creates unit ring geometry for instancing
- **Material Setup**: Configures transparent ring material
- **Instance Creation**: Creates InstancedMesh for all AU rings
- **Label Creation**: Creates 2D labels at cardinal directions
- **Group Organization**: Organizes labels into distance-based groups

### Ring Material Configuration

```typescript
const ringMaterial = new THREE.MeshBasicMaterial({
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.2,
  toneMapped: false, // UI elements not affected by scene lighting
  depthTest: true, // Rings occluded by celestial objects
  depthWrite: false, // Don't interfere with celestial depth buffer
  blending: THREE.NormalBlending,
});
```

### Instance Configuration

```typescript
// Set transform for each instance (scale and rotation)
dummy.rotation.x = Math.PI / 2; // Rotate to XZ plane
dummy.scale.set(radiusSceneUnits, radiusSceneUnits, 1);
dummy.updateMatrix();

this.ringInstances.setMatrixAt(i, dummy.matrix);
this.ringInstances.setColorAt(i, color.set(hexColor));
```

## 🏷️ Label System Integration

### Label Positioning

```typescript
const labelPositions = {
  Xpos: new THREE.Vector3(radiusSceneUnits, 0, 0),
  Xneg: new THREE.Vector3(-radiusSceneUnits, 0, 0),
  Zpos: new THREE.Vector3(0, 0, radiusSceneUnits),
  Zneg: new THREE.Vector3(0, 0, -radiusSceneUnits),
};
```

### Group Structure

```typescript
// Get or create the group for this AU distance
let distanceGroup = this.auMarkerGroups.get(au);
if (!distanceGroup) {
  distanceGroup = new THREE.Group();
  distanceGroup.name = `AU_MARKER_GROUP_${au}`;
  distanceGroup.userData = {
    sceneDistance: radiusSceneUnits, // Store scene distance for efficient access
  };
  this.auMarkerGroups.set(au, distanceGroup);
  this.mainGroup.add(distanceGroup);
}
```

### Label Creation

```typescript
for (const [dir, pos] of Object.entries(labelPositions)) {
  const labelId = `au-marker-${au}-label-${dir}`;
  const css2dObject = auMarkerLayer.createLabel(labelId, au, pos, hexColor);
  distanceGroup.add(css2dObject);
}
```

## 🔄 AU Data Generation

### Dynamic Generation Algorithm

```typescript
private generateAuMarkersData(maxAu: number = 1000000): Array<AuMarkerData>
```

- **Power Progression**: Starts at 0.1 AU and multiplies by 10
- **Decade Markers**: First marker of each decade gets green color
- **Secondary Markers**: Other markers get orange color
- **Range Limiting**: Stops when exceeding maximum AU value

### Generation Example

```typescript
// Generates markers like:
// 0.1 AU (green), 0.2 AU (orange), 0.3 AU (orange), ..., 0.9 AU (orange)
// 1 AU (green), 2 AU (orange), 3 AU (orange), ..., 9 AU (orange)
// 10 AU (green), 20 AU (orange), 30 AU (orange), ..., 90 AU (orange)
// etc.
```

## 🚀 Usage Example

```typescript
// Create AU marker manager
const auMarkerManager = new AuMarkerManager(scene, layer2DManager);

// Create all markers and labels
auMarkerManager.createMarkers();

// Control visibility
auMarkerManager.setVisible(true); // Show all markers
auMarkerManager.toggle(); // Toggle visibility

// Clean up when done
auMarkerManager.dispose();
```

## 🎯 Performance Considerations

### InstancedMesh Optimization

- **Single Geometry**: All rings share the same unit ring geometry
- **Single Material**: All rings share the same material
- **Efficient Rendering**: GPU instancing for optimal performance
- **Memory Efficiency**: Minimal memory footprint for large numbers of rings

### Render Order Management

```typescript
// Set render order to ensure AU markers are rendered behind celestial objects
this.mainGroup.renderOrder =
  RenderOrderManager.getRenderOrderForEffect("distance-markers");
```

### Group Organization

- **Hierarchical Structure**: Labels organized by distance groups
- **Efficient Access**: O(1) access to groups by AU value
- **Batch Updates**: All labels in a group updated together
- **Scene Integration**: Efficient integration with Three.js scene graph

### Material Optimization

- **Transparency**: Low opacity (0.2) for subtle visual effect
- **Depth Testing**: Enabled to prevent rings showing through objects
- **Depth Writing**: Disabled to avoid interfering with celestial objects
- **Tone Mapping**: Disabled for consistent UI appearance

## 🔍 Debug Features

### Ring Debugging

- **Instance Count**: Monitor number of ring instances
- **Geometry Usage**: Track geometry and material usage
- **Render Order**: Verify correct render order placement
- **Memory Usage**: Monitor InstancedMesh memory consumption

### Label Debugging

- **Group Structure**: Inspect hierarchical group organization
- **Label Positioning**: Debug label positioning at cardinal directions
- **Distance Storage**: Verify scene distance values in userData
- **Layer Integration**: Monitor integration with CSS2D layer system

### Performance Monitoring

- **Render Performance**: Track InstancedMesh rendering performance
- **Memory Usage**: Monitor geometry, material, and group memory
- **Update Frequency**: Track label update performance
- **Scene Integration**: Monitor scene graph performance impact

## 📚 Related Components

- **[[AuMarkerLabelLayer]]** - Manages 2D labels for AU markers
- **[[AuMarkerLabelComponent]]** - Custom HTML element for AU labels
- **[[Layer2DManager]]** - Manages all CSS2D layers
- **[[RenderOrderManager]]** - Manages render order for effects
- **[[Occlusion Detection System]]** - Performance-optimized visibility management

## 🏛️ Architecture Patterns

- **Manager Pattern**: Centralized management of AU marker system
- **Factory Pattern**: Dynamic generation of AU marker data
- **Instanced Pattern**: Efficient rendering using InstancedMesh
- **Group Pattern**: Hierarchical organization of labels
- **Integration Pattern**: Seamless integration with CSS2D system
- **Resource Management Pattern**: Proper cleanup and disposal

---
