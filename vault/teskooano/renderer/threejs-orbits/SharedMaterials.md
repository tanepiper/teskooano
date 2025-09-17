---
name: "SharedMaterials"
description: "Centralized material management for orbit visualization with performance optimization"
package: "@teskooano/renderer-threejs-orbits"
dependencies: ["three"]
classes: ["THREE.LineBasicMaterial", "THREE.LineDashedMaterial", "THREE.Color"]
functions: ["clone"]
constants: []
types: []
---

# SharedMaterials

A centralized utility for managing and reusing Three.js materials across the orbit visualization system, providing performance optimization through material sharing and consistent visual styling.

## 🎯 Purpose

`SharedMaterials` provides a centralized repository of pre-configured materials for orbit visualization, reducing memory usage by avoiding unnecessary material duplication and ensuring consistent visual styling across all orbit lines.

## 🏗️ Architecture

### Material Types

The utility provides four distinct material types optimized for different visualization needs:

```typescript
export const SharedMaterials = {
  TRAIL: THREE.LineBasicMaterial, // Historical trail lines
  PREDICTION: THREE.LineDashedMaterial, // Future trajectory predictions
  KEPLERIAN: THREE.LineBasicMaterial, // Static Keplerian orbits
  KEPLERIAN_MOON: THREE.LineBasicMaterial, // Moon orbit lines
};
```

### Performance Optimization

- **Material Reuse**: Pre-allocated materials prevent expensive material creation
- **Memory Efficiency**: Single material instances shared across multiple lines
- **Cloning Support**: Each line gets its own material instance for individual customization

## 🚀 Core Features

### Trail Material

```typescript
TRAIL: new THREE.LineBasicMaterial({
  color: 0xffffff,
  linewidth: isMobileWidth ? 2 : 5,
  transparent: true,
  opacity: 1,
  depthTest: true,
  depthWrite: false, // Trails should not write to depth buffer
  blending: THREE.NormalBlending,
});
```

**Features:**

- **White color** for high visibility
- **Responsive line width** (mobile vs desktop)
- **Transparency support** for visual effects
- **Depth buffer optimization** to avoid occlusion conflicts

### Prediction Material

```typescript
PREDICTION: new THREE.LineDashedMaterial({
  color: 0xffff00,
  linewidth: isMobileWidth ? 2 : 5,
  scale: 1,
  dashSize: 10,
  gapSize: 5,
  precision: "highp",
  transparent: true,
  opacity: 0.7,
  depthTest: true,
  depthWrite: false,
});
```

**Features:**

- **Yellow dashed lines** to distinguish from trails
- **High precision** for smooth rendering
- **Reduced opacity** for subtle visualization
- **Dashed pattern** for future trajectory indication

### Keplerian Materials

```typescript
KEPLERIAN: new THREE.LineBasicMaterial({
  color: 0xffffff,
  linewidth: isMobileWidth ? 1 : 3,
  transparent: true,
  opacity: 1,
  depthTest: true,
  depthWrite: false,
});

KEPLERIAN_MOON: new THREE.LineBasicMaterial({
  color: 0xffffff,
  linewidth: isMobileWidth ? 1 : 2,
  transparent: true,
  opacity: 0.5,
  depthTest: true,
  depthWrite: false,
});
```

**Features:**

- **Thinner lines** for static orbits
- **Moon-specific styling** with reduced opacity
- **Consistent depth buffer handling**

## 🔧 Key Methods

### Clone Method

```typescript
clone(type: "TRAIL" | "PREDICTION" | "KEPLERIAN" | "KEPLERIAN_MOON"): THREE.LineBasicMaterial | THREE.LineDashedMaterial
```

**Purpose:**

- Creates individual material instances for each line
- Allows per-line customization (highlighting, color changes)
- Maintains performance through shared base definitions

**Usage:**

```typescript
// Create a trail material for a specific line
const trailMaterial = SharedMaterials.clone("TRAIL");

// Customize for highlighting
trailMaterial.color.setHex(0xff0000);
```

## 🎨 Visual Design

### Color Scheme

- **Trails**: White (`0xffffff`) - High visibility for historical paths
- **Predictions**: Yellow (`0xffff00`) - Distinct color for future trajectories
- **Keplerian**: White (`0xffffff`) - Clean, mathematical appearance
- **Moon Orbits**: White with 50% opacity - Subtle distinction from planet orbits

### Line Widths

- **Desktop**: 3-5 pixels for good visibility
- **Mobile**: 1-2 pixels for performance and touch interface
- **Responsive**: Automatically adjusts based on screen size

### Transparency

- **Trails**: Full opacity for clear visibility
- **Predictions**: 70% opacity for subtle indication
- **Moon Orbits**: 50% opacity for hierarchy distinction

## 📊 Performance Considerations

### Memory Optimization

- **Single Material Instances**: Base materials created once
- **Efficient Cloning**: Fast material duplication for customization
- **Reduced Allocations**: Minimizes garbage collection pressure

### Rendering Optimization

- **Depth Buffer Management**: `depthWrite: false` prevents occlusion conflicts
- **Blending Modes**: Consistent blending for proper transparency
- **Precision Settings**: High precision for smooth line rendering

### Mobile Optimization

- **Responsive Line Widths**: Thinner lines on mobile devices
- **Reduced Complexity**: Simplified materials for better performance
- **Touch Interface**: Optimized for touch-based interaction

## 🔧 Integration Points

### Material Usage

```typescript
// In TrailManager
const material = SharedMaterials.clone("TRAIL");
const line = new THREE.Line(geometry, material);

// In PredictionManager
const material = SharedMaterials.clone("PREDICTION");
const line = new THREE.Line(geometry, material);

// In KeplerianManager
const material = SharedMaterials.clone("KEPLERIAN");
const line = new THREE.Line(geometry, material);
```

### Highlighting Support

```typescript
// Clone material for individual customization
const material = SharedMaterials.clone("TRAIL");

// Apply highlighting
material.color.setHex(0xff0000);

// Reset to default
material.color.copy(SharedMaterials.TRAIL.color);
```

## 🎯 Usage Examples

### Basic Material Usage

```typescript
import { SharedMaterials } from "@teskooano/renderer-threejs-orbits";

// Create trail material
const trailMaterial = SharedMaterials.clone("TRAIL");

// Create prediction material
const predictionMaterial = SharedMaterials.clone("PREDICTION");

// Create Keplerian orbit material
const orbitMaterial = SharedMaterials.clone("KEPLERIAN");
```

### Customization

```typescript
// Clone and customize for highlighting
const highlightMaterial = SharedMaterials.clone("TRAIL");
highlightMaterial.color.setHex(0x00ff00);
highlightMaterial.opacity = 0.8;

// Use for highlighted trail
const highlightedLine = new THREE.Line(geometry, highlightMaterial);
```

### Material Management

```typescript
// Efficient material reuse
const materials = {
  trail: SharedMaterials.clone("TRAIL"),
  prediction: SharedMaterials.clone("PREDICTION"),
  orbit: SharedMaterials.clone("KEPLERIAN"),
};

// Apply to different line types
trailLines.forEach((line) => (line.material = materials.trail));
predictionLines.forEach((line) => (line.material = materials.prediction));
```

## 🔍 Debug Features

### Material Inspection

```typescript
// Check material properties
console.log("Trail material:", SharedMaterials.TRAIL);
console.log("Prediction material:", SharedMaterials.PREDICTION);

// Verify cloning
const cloned = SharedMaterials.clone("TRAIL");
console.log("Cloned material:", cloned);
console.log("Is same instance:", cloned === SharedMaterials.TRAIL); // false
```

### Performance Monitoring

```typescript
// Monitor material creation
const startTime = performance.now();
const materials = Array.from({ length: 100 }, () =>
  SharedMaterials.clone("TRAIL"),
);
const endTime = performance.now();
console.log(`Created 100 materials in ${endTime - startTime}ms`);
```

## 🚀 Future Enhancements

### Planned Features

- **Dynamic Material Updates**: Runtime material property changes
- **Theme Support**: Configurable color schemes
- **Advanced Blending**: Custom blending modes for special effects

### Optimization Opportunities

- **Material Pooling**: Pre-allocated material pools for high-frequency usage
- **LOD Materials**: Different quality materials based on distance
- **Shader Customization**: Custom shaders for advanced effects

### Advanced Features

- **Animated Materials**: Materials with time-based properties
- **Conditional Styling**: Materials that adapt to object properties
- **Performance Profiling**: Built-in material performance analysis
