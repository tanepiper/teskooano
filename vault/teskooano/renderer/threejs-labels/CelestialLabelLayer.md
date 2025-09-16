---
aliases: [CelestialLabelLayer, celestial-labels, planet-labels, star-labels]
tags: [renderer, threejs, labels, celestial, planets, stars, moons, visibility]
type: component
package: "@teskooano/renderer-threejs-labels"
component: CelestialLabelLayer
dependencies:
  [
    "@teskooano/core-math",
    "@teskooano/data-types",
    "@teskooano/data-values",
    "@teskooano/renderer-threejs-objects",
    "three",
  ]
classes:
  [
    "BaseLabelLayer",
    "THREE.Scene",
    "THREE.PerspectiveCamera",
    "ObjectManager",
    "CSS2DObject",
    "OSVector3",
    "THREE.Vector3",
  ]
functions: []
constants: ["AU_METERS", "SCALE"]
types:
  [
    "RenderableCelestialObject",
    "CelestialType",
    "LabelVisibilityConfig",
    "UIRegistryComponent",
  ]
status: active
---

# CelestialLabelLayer

Specialized layer for rendering labels on celestial bodies, providing dynamic distance and speed information with sophisticated visibility rules based on object type and camera distance.

## 🎯 Purpose

The `CelestialLabelLayer` manages labels for all celestial objects (planets, stars, moons, asteroids, etc.), displaying object names, distances, and speeds. It implements complex visibility rules that vary by celestial type and provides performance-optimized updates with caching and occlusion detection.

## 🏗️ Architecture

### Core Components

- **Label Registry**: Map-based storage of celestial labels with caching
- **Visibility Configuration**: Type-specific distance thresholds for visibility
- **Performance Caching**: Attribute and position caching for efficiency
- **Occlusion Integration**: Inherits advanced occlusion detection from BaseLabelLayer

### Visibility Configuration

```typescript
interface LabelVisibilityConfig {
  planet?: number; // 500 AU default
  gasGiant?: number; // 800 AU default
  moon?: number; // 200 AU default
  comet?: number; // 300 AU default
  ejectedMoon?: number; // 150 AU default
  secondaryStar?: number; // 1000 AU default
  default?: number; // 400 AU default
  satellite?: number; // 1 AU default
  ejectedSatellite?: number; // 200,000,000 AU default
  asteroid?: number; // 100 AU default
}
```

### Caching System

```typescript
private labelCache = new Map<string, {
  lastDistance: string;
  lastSpeed: string;
  lastVisible: boolean;
  lastPosition?: THREE.Vector3;
}>();
```

## 🔧 Core Methods

### Constructor

```typescript
constructor(scene: THREE.Scene, config: LabelVisibilityConfig = {})
```

- **scene**: Three.js scene for label positioning
- **config**: Custom visibility configuration overrides
- **Initialization**: Sets up default visibility thresholds and caching

### Component Registration

```typescript
public override getRequiredComponents(): UIRegistryComponent[]
```

- **Returns**: CelestialLabelComponent registration
- **Tag Name**: `CELESTIAL_LABEL_TAG` ("celestial-label")
- **Component Class**: CelestialLabelComponent

### Label Creation

```typescript
public createLabel(
  object: RenderableCelestialObject,
  parentMesh: THREE.Object3D
): void
```

- **object**: Celestial object data for label content
- **parentMesh**: Three.js mesh for positioning
- **Element Creation**: Creates custom HTML element with object data
- **Positioning**: Calculates label position relative to celestial object
- **Group Integration**: Adds label to object's group in scene

### Update Cycle

```typescript
public override update(
  camera: THREE.PerspectiveCamera,
  objectManager: ObjectManager
): void
```

- **Camera**: Current camera for distance calculations
- **Object Manager**: Access to celestial objects and their data
- **Processing**: Updates all labels with new positions, distances, and speeds
- **Visibility**: Applies type-specific visibility rules
- **Occlusion**: Integrates with occlusion detection system

## 🌟 Celestial Type Visibility Rules

### Star Visibility

```typescript
case CelestialType.STAR: {
  if (objectId === mainStarId) {
    visible = true; // Main star always visible
  } else {
    visible = distanceToSelf < config.secondaryStar; // Secondary stars by distance
  }
  break;
}
```

### Planet Visibility

```typescript
case CelestialType.PLANET: {
  visible = distanceToSelf < config.planet; // 500 AU default
  break;
}
```

### Moon Visibility

```typescript
case CelestialType.MOON: {
  const parentId = label.element.getAttribute("data-parent-id")!;
  const parentData = allObjects[parentId];
  const parentObject = objectManager.getObject(parentId);

  if (parentObject && parentData) {
    if ([CelestialType.PLANET, CelestialType.GAS_GIANT].includes(parentData.type)) {
      // Rule: Visible if camera is close to the PARENT planet
      const parentCenterDistance = cameraPosition.distanceTo(parentObject.position);
      const parentRadiusInSceneUnits = parentData.realRadius_m * (1 / AU_METERS);
      const distanceToParent = Math.max(0, parentCenterDistance - parentRadiusInSceneUnits);
      visible = distanceToParent < config.moon;
    } else if (parentData.type === CelestialType.STAR) {
      // Rule: Ejected moon, visible if camera is close to the MOON itself
      visible = distanceToSelf < config.ejectedMoon;
    }
  }
  break;
}
```

### Satellite Visibility

```typescript
case CelestialType.SATELLITE: {
  const parentId = label.element.getAttribute("data-parent-id")!;
  const parentData = allObjects[parentId];
  const parentObject = objectManager.getObject(parentId);

  if (parentObject && parentData) {
    if ([CelestialType.PLANET, CelestialType.GAS_GIANT].includes(parentData.type)) {
      // Rule: Visible if camera is close to the PARENT planet
      const parentCenterDistance = cameraPosition.distanceTo(parentObject.position);
      const parentRadiusInSceneUnits = parentData.realRadius_m * (1 / AU_METERS);
      const distanceToParent = Math.max(0, parentCenterDistance - parentRadiusInSceneUnits);
      visible = distanceToParent < config.satellite;
    } else if (parentData.type === CelestialType.STAR) {
      // Rule: Ejected satellite, visible if camera is close to the SATELLITE itself
      visible = true;
    }
  } else {
    visible = true;
  }
  break;
}
```

### Other Celestial Types

- **Gas Giants**: `distanceToSelf < config.gasGiant` (800 AU)
- **Comets**: `distanceToSelf < config.comet` (300 AU)
- **Asteroids**: `distanceToSelf < config.asteroid` (100 AU)
- **Asteroid Fields/Oort Clouds**: Always hidden (`visible = false`)

## 📏 Distance Calculation

### Surface-to-Surface Distance

```typescript
// For solid bodies, subtract the object's radius to get distance to surface
const solidBodyTypes = [
  CelestialType.PLANET,
  CelestialType.DWARF_PLANET,
  CelestialType.MOON,
  CelestialType.SATELLITE,
  CelestialType.ASTEROID,
];

let distanceToSelf = centerDistance;
if (solidBodyTypes.includes(type) && renderableObject?.realRadius_m) {
  const radiusInSceneUnits = renderableObject.realRadius_m * (1 / AU_METERS);
  distanceToSelf = Math.max(0, centerDistance - radiusInSceneUnits);
}
```

### Distance Formatting

```typescript
private _formatDistance(distanceInAu: number): string
```

- **< 0.01 AU**: Shows in meters, kilometers, megameters, or gigameters
- **0.01 - 1 AU**: Shows as decimal AU (e.g., "0.25 AU")
- **1 - 100 AU**: Shows as decimal AU (e.g., "12.5 AU")
- **> 100 AU**: Shows as rounded AU (e.g., "1,234 AU")

## ⚡ Speed Formatting

### Speed Display Logic

```typescript
private _formatSpeed(speedInMps: number): string
```

- **≥ 0.001c**: Shows as fraction of light speed (e.g., "0.001c", "0.123c")
- **≥ 1 km/s**: Shows in km/s (e.g., "30.5 km/s")
- **< 1 km/s**: Shows in m/s (e.g., "500.0 m/s")

## 🎯 Performance Optimizations

### Position Caching

```typescript
// Only update position if it has moved significantly
const cache = this.labelCache.get(objectId)!;
if (!cache.lastPosition || !cache.lastPosition.equals(newLabelPosition)) {
  label.position.copy(newLabelPosition);
  cache.lastPosition = newLabelPosition.clone();
}
```

### Attribute Caching

```typescript
// Only update attributes if values have changed
if (cache.lastDistance !== formattedDistance) {
  label.element.setAttribute("data-distance-formatted", formattedDistance);
  cache.lastDistance = formattedDistance;
}

if (cache.lastSpeed !== formattedSpeed) {
  label.element.setAttribute("data-speed-formatted", formattedSpeed);
  cache.lastSpeed = formattedSpeed;
}
```

### Visibility Caching

```typescript
// Only update visibility if it has changed
if (cache.lastVisible !== visible) {
  label.element.toggleAttribute("visible", visible);
  cache.lastVisible = visible;
}
```

### Pre-allocated Vectors

```typescript
// Pre-allocated vectors for performance in calculateLabelPosition
private _tempPos1 = new THREE.Vector3();
private _tempPos2 = new THREE.Vector3();
```

## 🚀 Usage Example

```typescript
// Create celestial label layer with custom visibility
const celestialLayer = new CelestialLabelLayer(scene, {
  planet: 1000, // Planets visible within 1000 AU
  moon: 500, // Moons visible within 500 AU
  asteroid: 200, // Asteroids visible within 200 AU
  secondaryStar: 2000, // Secondary stars visible within 2000 AU
});

// Create label for a planet
const earthObject = objectManager.getObject("earth");
const earthData = objectManager.getLatestRenderableObjects()["earth"];
celestialLayer.createLabel(earthData, earthObject);

// Update is called automatically by Layer2DManager
// Labels will show: "Earth ⎊ 1.5 AU ⟐ 30.5 km/s"
```

## 🔗 Integration Points

### Object Manager Integration

- **Object Data**: Access to RenderableCelestialObject data
- **Mesh Access**: Direct access to Three.js meshes for positioning
- **Parent Relationships**: Traversal of parent-child celestial relationships
- **Real-time Updates**: Dynamic updates as objects move

### Camera Integration

- **Distance Calculation**: Camera position used for distance-based visibility
- **Occlusion Testing**: Camera position used for occlusion raycasting
- **Frustum Culling**: Labels outside camera frustum are not rendered

### Scene Integration

- **Group Positioning**: Labels positioned relative to object groups
- **World Coordinates**: Labels follow objects in world space
- **Scene Hierarchy**: Integration with Three.js scene graph

## 🔍 Debug Features

### Visibility Debugging

- **Type-specific Rules**: Debug visibility rules for each celestial type
- **Distance Thresholds**: Visualize distance-based visibility zones
- **Parent-child Relationships**: Debug moon and satellite visibility logic
- **Cache Performance**: Monitor attribute and position cache effectiveness

### Performance Monitoring

- **Update Frequency**: Track label update performance
- **Cache Hit Rates**: Monitor attribute and position cache efficiency
- **Occlusion Performance**: Track occlusion detection performance
- **Memory Usage**: Monitor label and cache memory consumption

## 📚 Related Components

- **[[BaseLabelLayer]]** - Abstract base class with occlusion detection
- **[[CelestialLabelComponent]]** - Custom HTML element for celestial labels
- **[[Layer2DManager]]** - Manages all label layers
- **[[AuMarkerManager]]** - AU distance marker system
- **[[Occlusion Detection System]]** - Performance-optimized visibility management

## 🚀 Core Features

### 1. Celestial Body Labeling

- **Rich Information Display**: Names, distances, and speeds for all celestial objects
- **Type-Specific Visibility**: Different visibility rules for planets, stars, moons, etc.
- **Surface-to-Surface Distance**: Accurate distance calculations excluding object radius
- **Real-time Updates**: Dynamic position and data updates as objects move

### 2. Advanced Visibility System

- **Hierarchical Rules**: Parent-child relationships for moons and satellites
- **Distance-based Culling**: Type-specific distance thresholds for visibility
- **Main Star Priority**: Main star always visible, secondary stars by distance
- **Ejected Object Handling**: Special rules for objects ejected from their parent

### 3. Performance Optimization

- **Attribute Caching**: Only update DOM when values actually change
- **Position Caching**: Skip position updates for stationary objects
- **Visibility Caching**: Cache visibility states to prevent redundant updates
- **Pre-allocated Vectors**: Reuse THREE.Vector3 instances for calculations

## ⚡ Performance Considerations

### Caching System

- **Attribute Caching**: Prevents unnecessary DOM updates
- **Position Caching**: Skips position updates for stationary objects
- **Visibility Caching**: Caches visibility states to prevent redundant calculations
- **Memory Management**: Automatic cache cleanup and management

### Distance Calculations

- **Surface-to-Surface**: Accurate distance calculations excluding object radius
- **Pre-allocated Vectors**: Reuse THREE.Vector3 instances for performance
- **Efficient Math**: Optimized distance and position calculations
- **Type-specific Logic**: Efficient handling of different celestial types

### Update Optimization

- **Conditional Updates**: Only update when values change
- **Batch Processing**: Process multiple labels efficiently
- **Occlusion Integration**: Inherits optimized occlusion detection from base class
- **Memory Efficiency**: Minimal memory footprint for large numbers of labels

## 🔌 Integration Points

### Object Manager Integration

- **Object Data**: Access to RenderableCelestialObject data
- **Mesh Access**: Direct access to Three.js meshes for positioning
- **Parent Relationships**: Traversal of parent-child celestial relationships
- **Real-time Updates**: Dynamic updates as objects move

### Camera Integration

- **Distance Calculation**: Camera position used for distance-based visibility
- **Occlusion Testing**: Camera position used for occlusion raycasting
- **Frustum Culling**: Labels outside camera frustum are not rendered

### Scene Integration

- **Group Positioning**: Labels positioned relative to object groups
- **World Coordinates**: Labels follow objects in world space
- **Scene Hierarchy**: Integration with Three.js scene graph

## 🔮 Future Enhancements

### Performance Optimizations

- **Spatial Indexing**: Octree or BVH for faster distance calculations
- **Web Workers**: Offload distance calculations to background threads
- **GPU Calculations**: GPU-based distance and visibility calculations
- **Predictive Caching**: Predict visibility changes based on object movement

### Feature Enhancements

- **Label Clustering**: Group nearby labels to reduce visual clutter
- **Adaptive LOD**: Dynamic level-of-detail for labels based on distance
- **Interactive Labels**: Clickable labels with hover effects
- **Label Animations**: Smooth transitions for label appearance/disappearance

### Integration Improvements

- **VR/AR Support**: Enhanced support for immersive environments
- **Mobile Optimization**: Touch-friendly label interactions
- **Accessibility**: Screen reader support and keyboard navigation
- **Internationalization**: Multi-language label support

## 📚 Architecture Patterns

- **Template Method Pattern**: Extends BaseLabelLayer with specialized behavior
- **Strategy Pattern**: Type-specific visibility rules
- **Caching Pattern**: Attribute and position caching for performance
- **Observer Pattern**: Updates triggered by camera and object changes
- **Factory Pattern**: Automatic label creation from celestial objects
- **Registry Pattern**: Map-based label management with caching

## 📚 Related Documentation

- **[[BaseLabelLayer]]** - Abstract base class with occlusion detection
- **[[CelestialLabelComponent]]** - Custom HTML element for celestial labels
- **[[Layer2DManager]]** - Manages all label layers
- **[[AuMarkerManager]]** - AU distance marker system
- **[[Occlusion Detection System]]** - Performance-optimized visibility management

---
