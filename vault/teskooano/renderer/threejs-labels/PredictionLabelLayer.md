---
aliases:
  [PredictionLabelLayer, prediction-labels, trajectory-labels, time-markers]
tags: [renderer, threejs, labels, predictions, trajectory, time, velocity]
type: component
package: "@teskooano/renderer-threejs-labels"
component: PredictionLabelLayer
dependencies:
  [
    "@teskooano/core-math",
    "@teskooano/data-types",
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
    "PredictionLabel",
  ]
functions: []
constants: ["PREDICTION_LABEL_TAG"]
types: ["RenderableCelestialObject", "UIRegistryComponent"]
status: active
---

# PredictionLabelLayer

Specialized layer for rendering trajectory prediction labels, providing time-based markers that show future positions of celestial objects with intelligent visibility rules based on time distance and object velocity.

## 🎯 Purpose

The `PredictionLabelLayer` manages labels for trajectory predictions, displaying time-based markers that indicate where celestial objects will be at specific future times. It implements sophisticated visibility rules that consider the object's velocity and the time distance of predictions, with occlusion detection to prevent labels from showing through celestial objects.

## 🏗️ Architecture

### Core Components

- **Label Registry**: Map-based storage of prediction labels
- **Active Object Tracking**: Current object being predicted
- **Time-based Visibility**: Velocity-dependent visibility rules
- **Occlusion Integration**: Inherits advanced occlusion detection from BaseLabelLayer

### Active Object State

```typescript
private activePredictionObject: THREE.Object3D | null = null;
private activeObjectVelocity: number = 0; // Speed in m/s
private activeObjectRadius: number = 0; // Radius in scene units
```

### Time Categories

- **Short-term**: < 1 day (green styling)
- **Medium-term**: 1 day to 90 days (yellow styling)
- **Long-term**: > 90 days (red styling)

## 🔧 Core Methods

### Constructor

```typescript
constructor(scene: THREE.Scene)
```

- **scene**: Three.js scene for label positioning
- **Initialization**: Sets up label registry and active object tracking

### Component Registration

```typescript
public getRequiredComponents(): UIRegistryComponent[]
```

- **Returns**: PredictionLabel registration
- **Tag Name**: `PREDICTION_LABEL_TAG` ("prediction-label")
- **Component Class**: PredictionLabel

### Label Creation

```typescript
public addLabel(
  id: string,
  position: THREE.Vector3,
  text: string,
  timeInSeconds: number
): CSS2DObject
```

- **id**: Unique identifier for the label
- **position**: 3D position for the prediction marker
- **text**: Text content for the label
- **timeInSeconds**: Time in seconds from now for this prediction
- **Returns**: Created CSS2DObject for scene integration

### Active Object Management

```typescript
public setActivePredictionObject(
  object: RenderableCelestialObject | null,
  threeJsObject: THREE.Object3D | null,
  velocity: number | null
): void
```

- **object**: Celestial object data for radius and properties
- **threeJsObject**: Three.js object for positioning
- **velocity**: Object velocity in m/s for visibility calculations
- **State Update**: Updates active object state for prediction calculations

### Update Cycle

```typescript
public update(
  camera: THREE.PerspectiveCamera,
  objectManager: ObjectManager
): void
```

- **Camera**: Current camera for distance and occlusion calculations
- **Object Manager**: Access to celestial objects for occlusion testing
- **Processing**: Updates all prediction labels with visibility rules
- **Velocity Scaling**: Applies velocity-based visibility thresholds

## 🔍 Visibility Logic

### Velocity-based Thresholds

```typescript
// Baseline thresholds in scene units
const BASE_HIDE_SHORT_TERM_DIST = 50;
const BASE_HIDE_MEDIUM_TERM_DIST = 150;
const EARTH_ORBITAL_VELOCITY_MS = 29780; // ~30 km/s

// Scale thresholds based on object velocity relative to Earth's orbital speed
const velocityFactor = this.activeObjectVelocity / EARTH_ORBITAL_VELOCITY_MS;
const clampedFactor = Math.max(0.5, Math.min(velocityFactor, 5.0));

const HIDE_SHORT_TERM_DIST = BASE_HIDE_SHORT_TERM_DIST * clampedFactor;
const HIDE_MEDIUM_TERM_DIST = BASE_HIDE_MEDIUM_TERM_DIST * clampedFactor;
```

### Time-based Visibility Rules

```typescript
const ONE_DAY = 86400;
const NINETY_DAYS = ONE_DAY * 90;

if (markerTime < ONE_DAY) {
  // Short-term markers (e.g., 1h, 6h, 12h)
  if (zoomDistance > HIDE_SHORT_TERM_DIST) {
    shouldBeVisible = false;
  }
} else if (markerTime < NINETY_DAYS) {
  // Medium-term markers (e.g., 1d, 7d, 30d)
  if (zoomDistance > HIDE_MEDIUM_TERM_DIST) {
    shouldBeVisible = false;
  }
}
```

### Object Radius Checking

```typescript
// Check if label is inside the celestial object's radius
if (this.activeObjectRadius > 0) {
  const distanceToCenter = css2dObject.position.distanceTo(objectPosition);
  if (distanceToCenter < this.activeObjectRadius) {
    css2dObject.visible = false;
    return; // Skip further checks, it's inside the object
  }
}
```

### Occlusion Detection

```typescript
// Apply occlusion checking if the label would otherwise be visible
if (shouldBeVisible && objectManager) {
  const labelWorldPosition = new THREE.Vector3();
  css2dObject.getWorldPosition(labelWorldPosition);

  const labelId = `prediction_${element.dataset.markerTime}_${this.activePredictionObject?.name || "unknown"}`;

  const isOccluded = this.isLabelOccludedOptimized(
    labelId,
    OSVector3.fromThreeJS(labelWorldPosition),
    camera,
    objectManager,
    labelId,
  );

  if (isOccluded) {
    shouldBeVisible = false;
  }
}
```

## 🚀 Usage Example

```typescript
// Create prediction label layer
const predictionLayer = new PredictionLabelLayer(scene);

// Set active prediction object
const earthObject = objectManager.getObject("earth");
const earthData = objectManager.getLatestRenderableObjects()["earth"];
predictionLayer.setActivePredictionObject(earthData, earthObject, 29780); // 30 km/s

// Add prediction labels for different time periods
predictionLayer.addLabel(
  "prediction-1h",
  new THREE.Vector3(1.1, 0, 0),
  "1 hour",
  3600, // 1 hour in seconds
);

predictionLayer.addLabel(
  "prediction-1d",
  new THREE.Vector3(1.2, 0, 0),
  "1 day",
  86400, // 1 day in seconds
);

predictionLayer.addLabel(
  "prediction-1w",
  new THREE.Vector3(1.3, 0, 0),
  "1 week",
  604800, // 1 week in seconds
);

// Update is called automatically by Layer2DManager
// Labels will show with appropriate colors and visibility based on time and velocity
```

## 🎨 Styling System

### Time Category Styling

```typescript
// Short-term predictions (green)
:host([data-time-category="short"]) {
  background-color: rgba(76, 175, 80, 0.2);
  border-color: rgba(76, 175, 80, 0.8);
  color: rgba(204, 235, 206, 1);
}

// Medium-term predictions (yellow)
:host([data-time-category="medium"]) {
  background-color: rgba(255, 235, 59, 0.2);
  border-color: rgba(255, 235, 59, 0.8);
  color: rgba(255, 249, 196, 1);
}

// Long-term predictions (red)
:host([data-time-category="long"]) {
  background-color: rgba(244, 67, 54, 0.2);
  border-color: rgba(244, 67, 54, 0.8);
  color: rgba(251, 204, 201, 1);
}
```

### Time Category Assignment

```typescript
setTimeCategory(timeInSeconds: number) {
  const ONE_DAY = 86400;
  const NINETY_DAYS = ONE_DAY * 90;

  if (timeInSeconds < ONE_DAY) {
    this.dataset.timeCategory = "short";
  } else if (timeInSeconds < NINETY_DAYS) {
    this.dataset.timeCategory = "medium";
  } else {
    this.dataset.timeCategory = "long";
  }
}
```

## 🎯 Performance Considerations

### Velocity Scaling

- **Dynamic Thresholds**: Visibility thresholds scale with object velocity
- **Clamped Factors**: Velocity factor clamped between 0.5x and 5.0x
- **Performance**: Avoids extreme values for very slow or very fast objects
- **Earth Reference**: Uses Earth's orbital velocity as reference point

### Distance Optimization

- **Baseline Thresholds**: Base distances for short and medium-term predictions
- **Velocity Multiplication**: Thresholds multiplied by velocity factor
- **Clamping**: Prevents extreme visibility ranges
- **Efficient Calculation**: Simple multiplication for performance

### Occlusion Integration

- **Inherited System**: Uses BaseLabelLayer's optimized occlusion detection
- **Unique IDs**: Each prediction label has unique occlusion ID
- **Performance**: Inherits caching and throttling from base class
- **Accuracy**: Prevents labels from showing through celestial objects

## 🔍 Debug Features

### Visibility Debugging

- **Time Categories**: Debug time-based visibility rules
- **Velocity Scaling**: Monitor velocity-based threshold adjustments
- **Distance Thresholds**: Visualize distance-based visibility zones
- **Object Radius**: Debug radius-based visibility checks

### Performance Monitoring

- **Update Frequency**: Track prediction label update performance
- **Velocity Calculations**: Monitor velocity factor calculations
- **Occlusion Performance**: Track occlusion detection performance
- **Memory Usage**: Monitor label and cache memory consumption

## 📚 Related Components

- **[[BaseLabelLayer]]** - Abstract base class with occlusion detection
- **[[PredictionLabel]]** - Custom HTML element for prediction labels
- **[[Layer2DManager]]** - Manages all label layers
- **[[AuMarkerManager]]** - AU distance marker system
- **[[Occlusion Detection System]]** - Performance-optimized visibility management

## 🚀 Core Features

### 1. Trajectory Prediction Labels

- **Time-based Markers**: Future position indicators with time information
- **Velocity-scaled Visibility**: Visibility based on object speed and time distance
- **Time Category Styling**: Color-coded by prediction time distance (short/medium/long)
- **Occlusion Integration**: Smart visibility management to prevent labels showing through objects

### 2. Active Object Management

- **Object State Tracking**: Tracks current object being predicted
- **Velocity Integration**: Uses object velocity for visibility calculations
- **Radius Checking**: Prevents labels from appearing inside celestial objects
- **Dynamic Updates**: Real-time updates as object state changes

### 3. Performance Optimization

- **Velocity Scaling**: Dynamic thresholds based on object velocity
- **Distance Optimization**: Efficient distance calculations for visibility
- **Occlusion Integration**: Inherits optimized occlusion detection from base class
- **Memory Efficiency**: Minimal memory footprint for prediction labels

## ⚡ Performance Considerations

### Velocity Scaling

- **Dynamic Thresholds**: Visibility thresholds scale with object velocity
- **Clamped Factors**: Velocity factor clamped between 0.5x and 5.0x
- **Performance**: Avoids extreme values for very slow or very fast objects
- **Earth Reference**: Uses Earth's orbital velocity as reference point

### Distance Optimization

- **Baseline Thresholds**: Base distances for short and medium-term predictions
- **Velocity Multiplication**: Thresholds multiplied by velocity factor
- **Clamping**: Prevents extreme visibility ranges
- **Efficient Calculation**: Simple multiplication for performance

### Occlusion Integration

- **Inherited System**: Uses BaseLabelLayer's optimized occlusion detection
- **Unique IDs**: Each prediction label has unique occlusion ID
- **Performance**: Inherits caching and throttling from base class
- **Accuracy**: Prevents labels from showing through celestial objects

## 🔌 Integration Points

### Object Manager Integration

- **Object Data**: Access to RenderableCelestialObject data
- **Mesh Access**: Direct access to Three.js meshes for positioning
- **Velocity Data**: Access to object velocity for visibility calculations
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
- **Web Workers**: Offload velocity calculations to background threads
- **GPU Calculations**: GPU-based distance and visibility calculations
- **Predictive Caching**: Predict visibility changes based on object movement

### Feature Enhancements

- **Dynamic Time Categories**: Adjust time categories based on object type
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
- **Strategy Pattern**: Velocity-based visibility strategies
- **State Pattern**: Active object state management
- **Observer Pattern**: Updates triggered by camera and object changes
- **Factory Pattern**: Label creation with time and position data
- **Registry Pattern**: Map-based label management

## 📚 Related Documentation

- **[[BaseLabelLayer]]** - Abstract base class with occlusion detection
- **[[PredictionLabel]]** - Custom HTML element for prediction labels
- **[[Layer2DManager]]** - Manages all label layers
- **[[AuMarkerManager]]** - AU distance marker system
- **[[Occlusion Detection System]]** - Performance-optimized visibility management

---
