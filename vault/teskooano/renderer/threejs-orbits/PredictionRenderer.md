---
name: "PredictionRenderer"
description: "Rendering component for prediction line visualization with material management"
package: "@teskooano/renderer-threejs-orbits"
dependencies: ["@teskooano/renderer-threejs-helpers", "three"]
classes:
  [
    "THREE.Line",
    "THREE.Group",
    "THREE.Color",
    "THREE.Vector3",
    "THREE.BufferAttribute",
    "THREE.BufferGeometry",
    "THREE.Material",
    "THREE.ShaderMaterial",
    "LineHelper",
  ]
functions:
  [
    "drawPredictionLine",
    "removePrediction",
    "setVisibility",
    "setCurveConfig",
    "getCurveConfig",
    "clearAllPredictions",
    "updatePredictionLineVisibility",
    "clearAllPredictionHighlights",
    "getPredictionLine",
    "hasPredictionLine",
    "dispose",
  ]
constants: []
types: ["TrailCurveConfig"]
---

# PredictionRenderer

Rendering component responsible for creating and managing Three.js line objects for prediction visualization, handling material management, curve interpolation, and visual effects.

## 🎯 Purpose

`PredictionRenderer` is the rendering layer for prediction visualization, responsible for creating and updating Three.js line objects that represent future trajectories. It handles material management, curve interpolation, highlighting, and visual effects for prediction lines.

## 🏗️ Architecture

### Core Components

The renderer manages prediction line objects and materials:

```typescript
class PredictionRenderer {
  public predictionLines: Map<string, THREE.Line> = new Map();
  private lineBuilder: LineHelper;
  private predictionLinesGroup: THREE.Group;
  private curveConfig: TrailCurveConfig;
  private visualizationVisible: boolean = true;
}
```

### Material Management

- **Shared Materials**: Uses `SharedMaterials` for consistent styling
- **Material Cloning**: Creates individual materials for each prediction line
- **Highlighting Support**: Enables color changes for highlighting effects

## 🚀 Core Features

### Prediction Line Creation

Creates and manages Three.js line objects for predictions:

```typescript
drawPredictionLine(
  objectId: string,
  predictionPoints: THREE.Vector3[]
): void
```

**Features:**

- **Line Creation**: Creates `THREE.Line` objects with proper materials
- **Curve Interpolation**: Applies curve interpolation for smooth visualization
- **Material Management**: Uses shared materials with individual customization
- **Scene Integration**: Adds lines to the prediction lines group

### Material Management

Handles prediction line materials and styling:

```typescript
// Uses SharedMaterials for consistent styling
const material = SharedMaterials.clone("PREDICTION");

// Applies highlighting
material.color.copy(highlightColor);
```

**Features:**

- **Shared Material Base**: Uses centralized material definitions
- **Individual Customization**: Each line gets its own material instance
- **Highlighting Support**: Enables color changes for highlighting
- **Performance Optimization**: Efficient material reuse

### Curve Interpolation

Applies advanced curve interpolation for smooth predictions:

```typescript
// Apply curve interpolation
const interpolatedPoints = TrailCurveInterpolator.interpolate(
  predictionPoints,
  this.curveConfig,
);
```

**Features:**

- **Multiple Curve Types**: Linear, Smooth, Orbital, Adaptive
- **Configurable Parameters**: Tension, segments, smoothing
- **Performance Optimization**: Efficient interpolation algorithms
- **Quality Control**: Configurable quality settings

## 🔧 Key Methods

### Constructor

```typescript
constructor(
  objectManager: ObjectManager,
  curveConfig: TrailCurveConfig,
  predictionLinesGroup: THREE.Group
)
```

**Parameters:**

- `objectManager`: The scene's ObjectManager for rendering operations
- `curveConfig`: Curve configuration for prediction interpolation
- `predictionLinesGroup`: Shared group for all prediction lines

### Line Drawing

```typescript
drawPredictionLine(objectId: string, predictionPoints: THREE.Vector3[]): void
```

**Process:**

1. **Point Interpolation**: Applies curve interpolation to prediction points
2. **Line Creation**: Creates or updates THREE.Line object
3. **Material Application**: Applies prediction material with highlighting
4. **Scene Integration**: Adds line to the prediction lines group

### Visibility Control

```typescript
setVisibility(visible: boolean): void
```

**Purpose:**

- Controls visibility of all prediction lines
- Provides performance optimization when hidden
- Enables smooth fade transitions

### Highlighting Management

```typescript
updatePredictionLineVisibility(highlightedObjectId: string): void
clearAllPredictionHighlights(): void
```

**Features:**

- **Object-specific Highlighting**: Highlights specific prediction lines
- **Color Management**: Applies and removes highlight colors
- **Smooth Transitions**: Provides smooth color transitions

## 🔄 Data Flow

### Line Creation Flow

```typescript
// 1. Interpolate prediction points
const interpolatedPoints = TrailCurveInterpolator.interpolate(
  predictionPoints,
  this.curveConfig,
);

// 2. Create or update line
const line = this.lineBuilder.createLine(
  interpolatedPoints.length,
  material,
  `prediction-line-${objectId}`,
);

// 3. Update line geometry
this.lineBuilder.updateLine(
  line,
  interpolatedPoints,
  interpolatedPoints.length,
);

// 4. Add to scene
this.predictionLinesGroup.add(line);
```

### Material Management Flow

```typescript
// 1. Clone shared material
const material = SharedMaterials.clone("PREDICTION");

// 2. Apply highlighting if needed
if (highlighted) {
  material.color.copy(highlightColor);
}

// 3. Apply to line
line.material = material;
```

### Highlighting Flow

```typescript
// 1. Update line visibility based on highlighting
this.predictionLines.forEach((line, objectId) => {
  const isHighlighted = objectId === highlightedObjectId;
  line.visible = isHighlighted && this.visualizationVisible;

  // 2. Apply highlight color
  if (isHighlighted && line.material instanceof THREE.LineDashedMaterial) {
    line.material.color.copy(this.highlightColor);
  }
});
```

## 🎨 Visualization Features

### Prediction Line Styling

Advanced styling for prediction visualization:

```typescript
// Dashed material for predictions
PREDICTION: new THREE.LineDashedMaterial({
  color: 0xffff00,
  linewidth: isMobileWidth ? 2 : 5,
  scale: 1,
  dashSize: 10,
  gapSize: 5,
  precision: "highp",
  transparent: true,
  opacity: 0.7,
});
```

**Features:**

- **Dashed Lines**: Distinct visual style for predictions
- **Yellow Color**: Clear distinction from trails
- **Transparency**: Subtle visualization
- **Responsive Width**: Adapts to screen size

### Curve Interpolation

Multiple interpolation types for different prediction scenarios:

```typescript
// Orbital-aware interpolation
const orbitalConfig: TrailCurveConfig = {
  type: TrailCurveType.Orbital,
  tension: 0.5,
  segments: 6,
  smoothing: 0.4,
};

// Smooth interpolation
const smoothConfig: TrailCurveConfig = {
  type: TrailCurveType.Smooth,
  tension: 0.7,
  segments: 10,
  smoothing: 0.3,
};
```

### Highlighting Effects

Dynamic highlighting for focused predictions:

```typescript
// Apply highlighting
if (highlighted) {
  material.color.copy(highlightColor);
  line.visible = true;
} else {
  material.color.copy(defaultColor);
  line.visible = false; // Hide non-highlighted predictions
}
```

## 📊 Performance Considerations

### Rendering Optimization

- **Material Reuse**: Efficient material cloning and reuse
- **Geometry Updates**: Optimized geometry updates for line changes
- **Visibility Culling**: Hide non-visible prediction lines
- **Batch Processing**: Group multiple line updates

### Memory Management

- **Object Pooling**: Reuse line objects when possible
- **Material Cleanup**: Proper disposal of unused materials
- **Geometry Cleanup**: Efficient geometry disposal
- **Map Management**: Efficient prediction line tracking

### Quality vs Performance

- **Adaptive Quality**: Adjust curve quality based on performance
- **LOD Support**: Different quality levels for different distances
- **Throttled Updates**: Limit update frequency for performance

## 🔧 Integration Points

### Object Manager Integration

```typescript
// Add prediction lines to scene
this.objectManager.addObject(predictionLine);

// Remove prediction lines from scene
this.objectManager.removeObject(objectId);
```

### Material System Integration

```typescript
// Use shared materials
import { SharedMaterials } from "./SharedMaterials";

const material = SharedMaterials.clone("PREDICTION");
```

### Curve System Integration

```typescript
// Use curve interpolation
import { TrailCurveInterpolator } from "./TrailCurveInterpolator";

const interpolatedPoints = TrailCurveInterpolator.interpolate(
  points,
  this.curveConfig,
);
```

## 🎯 Usage Examples

### Basic Prediction Rendering

```typescript
import { PredictionRenderer } from "@teskooano/renderer-threejs-orbits";

const renderer = new PredictionRenderer(
  objectManager,
  { type: TrailCurveType.Orbital, tension: 0.5, segments: 6 },
  predictionLinesGroup,
);

// Draw prediction line
renderer.drawPredictionLine("earth", predictionPoints);
```

### Highlighting Predictions

```typescript
// Highlight specific prediction
renderer.updatePredictionLineVisibility("earth");

// Clear all highlights
renderer.clearAllPredictionHighlights();
```

### Configuration Management

```typescript
// Set curve configuration
renderer.setCurveConfig({
  type: TrailCurveType.Smooth,
  tension: 0.7,
  segments: 10,
  smoothing: 0.3,
});

// Get current configuration
const config = renderer.getCurveConfig();
```

### Visibility Control

```typescript
// Show/hide all predictions
renderer.setVisibility(true);

// Check if prediction exists
const hasPrediction = renderer.hasPredictionLine("earth");

// Get prediction line
const predictionLine = renderer.getPredictionLine("earth");
```

## 🔍 Debug Features

### Line Inspection

```typescript
// Inspect prediction lines
console.log("Prediction lines:", renderer.predictionLines);

// Check line properties
const line = renderer.getPredictionLine("earth");
if (line) {
  console.log("Line geometry:", line.geometry);
  console.log("Line material:", line.material);
  console.log("Line visible:", line.visible);
}
```

### Performance Monitoring

```typescript
// Monitor rendering performance
const startTime = performance.now();
renderer.drawPredictionLine("earth", points);
const endTime = performance.now();
console.log(`Prediction rendering took ${endTime - startTime}ms`);
```

### Material Debugging

```typescript
// Debug material properties
const line = renderer.getPredictionLine("earth");
if (line && line.material instanceof THREE.LineDashedMaterial) {
  console.log("Material color:", line.material.color);
  console.log("Material opacity:", line.material.opacity);
  console.log("Material dash size:", line.material.dashSize);
}
```

## 🚀 Future Enhancements

### Planned Features

- **Advanced Materials**: Custom shaders for prediction effects
- **Animation Support**: Animated prediction line transitions
- **Quality Presets**: Predefined quality configurations

### Optimization Opportunities

- **Instanced Rendering**: Use instanced rendering for multiple predictions
- **GPU Compute**: Move interpolation to GPU
- **Predictive Rendering**: Pre-render common prediction patterns

### Advanced Features

- **Temporal Effects**: Time-based prediction visualization
- **Uncertainty Visualization**: Show prediction uncertainty ranges
- **Interactive Predictions**: User-controlled prediction parameters
