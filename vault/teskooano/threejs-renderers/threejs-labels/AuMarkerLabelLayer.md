---
aliases: [AuMarkerLabelLayer, au-markers, distance-markers, au-labels]
tags: [renderer, threejs, labels, au-markers, distance, markers, occlusion]
type: Class
package: "@teskooano/renderer-threejs-labels"
name: AuMarkerLabelLayer
dependencies: ["@teskooano/renderer-threejs-objects", "three"]
classes:
  [
    "BaseLabelLayer",
    "THREE.Scene",
    "THREE.Group",
    "THREE.PerspectiveCamera",
    "ObjectManager",
    "CSS2DObject",
    "AuMarkerLabelComponent",
    "THREE.Raycaster",
  ]
functions: []
constants: []
types: ["UIRegistryComponent"]
status: active
---

# AuMarkerLabelLayer

Specialized layer for managing AU (Astronomical Unit) distance marker labels, providing distance indicators with sophisticated occlusion detection and group-based visibility management.

## 🎯 Purpose

The `AuMarkerLabelLayer` manages labels for AU distance markers, displaying distance values at specific positions in 3D space. It works in conjunction with the `AuMarkerManager` to provide distance reference points throughout the solar system, with intelligent occlusion detection to prevent labels from showing through celestial objects.

## 🏗️ Architecture

### Core Components

- **Label Registry**: Map-based storage of AU marker labels
- **Group Management**: Integration with AU marker groups from AuMarkerManager
- **Occlusion Detection**: Raycasting-based occlusion testing
- **Distance-based Visibility**: Basic distance culling for performance

### Group Integration

```typescript
private managedGroups: Map<number, THREE.Group> = new Map();
```

- **Group Storage**: Stores AU marker groups with their distance values
- **Scene Distance**: Each group contains scene distance in userData
- **Label Positioning**: Labels positioned relative to their groups
- **Visibility Control**: Group-level visibility management

## 🔧 Core Methods

### Constructor

```typescript
constructor(scene: THREE.Scene)
```

- **scene**: Three.js scene for label positioning
- **Initialization**: Sets up group management and label registry

### Component Registration

```typescript
public override getRequiredComponents(): UIRegistryComponent[]
```

- **Returns**: AuMarkerLabelComponent registration
- **Tag Name**: `AuMarkerLabelComponent.TAG_NAME` ("teskooano-au-marker")
- **Component Class**: AuMarkerLabelComponent

### Label Creation

```typescript
public createLabel(
  id: string,
  auValue: number,
  position: THREE.Vector3,
  color: string
): CSS2DObject
```

- **id**: Unique identifier for the label
- **auValue**: AU distance value to display
- **position**: 3D position for the label
- **color**: Color for the label display
- **Returns**: Created CSS2DObject for external positioning

### Group Management

```typescript
public setManagedGroups(groups: Map<number, THREE.Group>): void
```

- **groups**: Map of AU values to THREE.Group instances
- **Integration**: Receives groups from AuMarkerManager
- **Scene Distance**: Groups contain scene distance in userData
- **Visibility Control**: Enables group-level visibility management

### Update Cycle

```typescript
public override update(
  camera: THREE.PerspectiveCamera,
  objectManager: ObjectManager
): void
```

- **Camera**: Current camera for distance and occlusion calculations
- **Object Manager**: Access to celestial objects for occlusion testing
- **Processing**: Updates all AU marker groups and their labels
- **Visibility**: Applies distance-based and occlusion-based visibility rules

## 🔍 Visibility Logic

### Distance-based Visibility

```typescript
// Basic visibility based on camera distance
let visible =
  cameraPosition.distanceTo(group.position) < markerAuValueScene * 5;
```

- **Distance Threshold**: Markers visible within 5x their AU distance
- **Performance**: Quick distance check before expensive occlusion testing
- **Configurable**: Threshold can be adjusted for different visibility ranges

### Occlusion Detection

```typescript
// Perform raycast from camera to marker's position
const markerPosition = group.position.clone();
raycaster.set(cameraPosition, markerPosition.sub(cameraPosition).normalize());

// Get all rendered meshes from the ObjectManager
const allRenderedMeshes = objectManager.getAllRenderedMeshes();

// Filter out AU marker meshes and ensure valid occluders
const occluders = allRenderedMeshes.filter(
  (mesh) =>
    mesh instanceof THREE.Mesh &&
    mesh.visible &&
    mesh.matrixWorld !== null &&
    !mesh.name.startsWith("au-marker-label"),
);

const intersects = raycaster.intersectObjects(occluders, true);

// If intersection is closer than marker, it's occluded
if (
  intersects.length > 0 &&
  intersects[0].distance < cameraPosition.distanceTo(group.position)
) {
  visible = false;
}
```

### Occlusion Features

- **Raycasting**: Camera-to-marker raycast for occlusion detection
- **Object Filtering**: Excludes AU marker meshes from occlusion testing
- **Mesh Validation**: Only tests visible meshes with valid matrixWorld
- **Distance Comparison**: Compares intersection distance to marker distance

## 🚀 Usage Example

```typescript
// Create AU marker layer
const auMarkerLayer = new AuMarkerLabelLayer(scene);

// Create labels for AU markers
const label1 = auMarkerLayer.createLabel(
  "au-1-label-xpos",
  1,
  new THREE.Vector3(1, 0, 0),
  "#00ff00",
);

const label2 = auMarkerLayer.createLabel(
  "au-10-label-xpos",
  10,
  new THREE.Vector3(10, 0, 0),
  "#FFA500",
);

// Set managed groups from AuMarkerManager
auMarkerLayer.setManagedGroups(auMarkerGroups);

// Update is called automatically by Layer2DManager
// Labels will show: "1 AU", "10 AU" with appropriate colors
```

## 🔗 Integration with AuMarkerManager

### Group Structure

```typescript
// Each AU distance has a group containing 4 labels (X+, X-, Z+, Z-)
distanceGroup.userData = {
  sceneDistance: radiusSceneUnits, // AU value in scene units
};

// Labels are added to the group
distanceGroup.add(css2dObject);
```

### Label Positioning

```typescript
// Labels positioned at cardinal directions around each AU ring
const labelPositions = {
  Xpos: new THREE.Vector3(radiusSceneUnits, 0, 0),
  Xneg: new THREE.Vector3(-radiusSceneUnits, 0, 0),
  Zpos: new THREE.Vector3(0, 0, radiusSceneUnits),
  Zneg: new THREE.Vector3(0, 0, -radiusSceneUnits),
};
```

### Visibility Synchronization

```typescript
// Group visibility controls all labels within that group
group.visible = visible;
group.children.forEach((child) => {
  if (child instanceof CSS2DObject) {
    child.element.toggleAttribute("visible", visible);
  }
});
```

## 🎯 Performance Considerations

### Distance Culling

- **Quick Check**: Distance-based visibility before expensive occlusion
- **Threshold Optimization**: 5x AU distance provides good visibility range
- **Performance Gain**: Avoids occlusion testing for distant markers

### Occlusion Optimization

- **Mesh Filtering**: Only tests relevant meshes for occlusion
- **Name-based Exclusion**: Excludes AU marker meshes from testing
- **Matrix Validation**: Only tests meshes with valid world matrices
- **Single Raycast**: One raycast per marker per update

### Group Management

- **Map-based Access**: O(1) group access and retrieval
- **Batch Updates**: All labels in a group updated together
- **Scene Integration**: Efficient integration with Three.js scene graph

## 🔍 Debug Features

### Visibility Debugging

- **Distance Thresholds**: Visualize distance-based visibility zones
- **Occlusion Rays**: Debug raycasting for occlusion detection
- **Group States**: Monitor group visibility states
- **Label Positioning**: Debug label positioning relative to groups

### Performance Monitoring

- **Update Frequency**: Track update cycle performance
- **Occlusion Tests**: Monitor occlusion test frequency and results
- **Distance Culling**: Track distance-based culling effectiveness
- **Memory Usage**: Monitor group and label memory consumption

## 📚 Related Components

- **[[BaseLabelLayer]]** - Abstract base class with occlusion detection
- **[[AuMarkerLabelComponent]]** - Custom HTML element for AU markers
- **[[AuMarkerManager]]** - Manages AU distance rings and groups
- **[[Layer2DManager]]** - Manages all label layers
- **[[Occlusion Detection System]]** - Performance-optimized visibility management

## 🚀 Core Features

### 1. AU Distance Marker Labels

- **Distance Display**: Shows AU values at cardinal directions around rings
- **Group Management**: Hierarchical organization of labels within distance groups
- **Color Configuration**: Dynamic color application based on marker configuration
- **Occlusion Detection**: Smart visibility management to prevent labels showing through objects

### 2. Group Integration

- **AuMarkerManager Integration**: Receives groups from AuMarkerManager
- **Scene Distance Storage**: Groups contain scene distance in userData for efficient access
- **Group-level Visibility**: Controls all labels within a group together
- **Cardinal Positioning**: Labels positioned at X+, X-, Z+, Z- around each ring

### 3. Performance Optimization

- **Distance Culling**: Quick distance check before expensive occlusion testing
- **Group-based Updates**: All labels in a group updated together
- **Occlusion Integration**: Inherits optimized occlusion detection from base class
- **Efficient Access**: O(1) group access and retrieval

## ⚡ Performance Considerations

### Distance Culling

- **Quick Check**: Distance-based visibility before expensive occlusion
- **Threshold Optimization**: 5x AU distance provides good visibility range
- **Performance Gain**: Avoids occlusion testing for distant markers

### Occlusion Optimization

- **Mesh Filtering**: Only tests relevant meshes for occlusion
- **Name-based Exclusion**: Excludes AU marker meshes from testing
- **Matrix Validation**: Only tests meshes with valid world matrices
- **Single Raycast**: One raycast per marker per update

### Group Management

- **Map-based Access**: O(1) group access and retrieval
- **Batch Updates**: All labels in a group updated together
- **Scene Integration**: Efficient integration with Three.js scene graph

## 🔌 Integration Points

### AuMarkerManager Integration

- **Group Structure**: Receives groups with scene distance in userData
- **Label Positioning**: Labels positioned at cardinal directions around rings
- **Visibility Synchronization**: Group visibility controls all labels within that group
- **Color Configuration**: Dynamic color application based on marker configuration

### Three.js Integration

- **Scene Integration**: Labels positioned relative to 3D objects
- **Camera Integration**: Camera position for distance and occlusion calculations
- **CSS2DRenderer**: Underlying renderer for HTML element overlay
- **ObjectManager**: Access to celestial objects for occlusion testing

### Layer Integration

- **BaseLabelLayer**: Inherits occlusion detection and performance optimization
- **Component Registration**: Automatic web component registration
- **Update Delegation**: Centralized update cycle management
- **Resource Management**: Proper cleanup and disposal

## 🔮 Future Enhancements

### Performance Optimizations

- **Spatial Indexing**: Octree or BVH for faster group queries
- **Web Workers**: Offload occlusion calculations to background threads
- **GPU Occlusion**: GPU-based occlusion detection using compute shaders
- **Predictive Caching**: Predict visibility changes based on camera movement

### Feature Enhancements

- **Dynamic Label Count**: Adjust number of labels based on distance
- **Label Clustering**: Group nearby labels to reduce visual clutter
- **Interactive Labels**: Clickable labels with hover effects
- **Label Animations**: Smooth transitions for label appearance/disappearance

### Integration Improvements

- **VR/AR Support**: Enhanced support for immersive environments
- **Mobile Optimization**: Touch-friendly label interactions
- **Accessibility**: Screen reader support and keyboard navigation
- **Internationalization**: Multi-language label support

## 📚 Architecture Patterns

- **Template Method Pattern**: Extends BaseLabelLayer with specialized behavior
- **Group Pattern**: Hierarchical organization of labels within groups
- **Occlusion Pattern**: Raycasting-based visibility detection
- **Registry Pattern**: Map-based group and label management
- **Observer Pattern**: Updates triggered by camera and object changes
- **Factory Pattern**: Label creation with position and styling

## 📚 Related Documentation

- **[[BaseLabelLayer]]** - Abstract base class with occlusion detection
- **[[AuMarkerLabelComponent]]** - Custom HTML element for AU markers
- **[[AuMarkerManager]]** - Manages AU distance rings and groups
- **[[Layer2DManager]]** - Manages all label layers
- **[[Occlusion Detection System]]** - Performance-optimized visibility management

---
