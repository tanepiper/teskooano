---
aliases: [CelestialDisplayOptions]
tags: [data, types, celestial, display]
type: Interface
package: "@teskooano/data-types"
file: "src/celestial/display.types.ts"
status: active
---

# CelestialDisplayOptions

Interface defining display options for celestial objects including labels, orbits, predictions, and debug information.

## Overview

The `CelestialDisplayOptions` interface provides configuration options for controlling the visual display elements associated with celestial objects. It enables fine-grained control over what visual information is shown for each object in the simulation.

## Interface Definition

```typescript
export interface CelestialDisplayOptions {
  showLabels: boolean;
  showOrbit: boolean;
  showPrediction: boolean;
  showDebug: boolean;
}
```

## Properties

### showLabels

```typescript
showLabels: boolean;
```

If the celestial object should have a label displayed.

- **Type**: `boolean`
- **Required**: Yes
- **Usage**: Controls visibility of object name labels and information

### showOrbit

```typescript
showOrbit: boolean;
```

If the celestial object should have an orbit displayed.

- **Type**: `boolean`
- **Required**: Yes
- **Usage**: Controls visibility of orbital path lines

### showPrediction

```typescript
showPrediction: boolean;
```

If the celestial object should have a prediction displayed.

- **Type**: `boolean`
- **Required**: Yes
- **Usage**: Controls visibility of future trajectory predictions

### showDebug

```typescript
showDebug: boolean;
```

If the celestial object should be in debug mode.

- **Type**: `boolean`
- **Required**: Yes
- **Usage**: Controls visibility of debug information and wireframes

## Usage Examples

### Full Display Configuration

```typescript
const fullDisplay: CelestialDisplayOptions = {
  showLabels: true,
  showOrbit: true,
  showPrediction: true,
  showDebug: false,
};
```

### Minimal Display Configuration

```typescript
const minimalDisplay: CelestialDisplayOptions = {
  showLabels: false,
  showOrbit: false,
  showPrediction: false,
  showDebug: false,
};
```

### Debug Configuration

```typescript
const debugDisplay: CelestialDisplayOptions = {
  showLabels: true,
  showOrbit: true,
  showPrediction: true,
  showDebug: true,
};
```

### Performance Configuration

```typescript
const performanceDisplay: CelestialDisplayOptions = {
  showLabels: true, // Keep labels for identification
  showOrbit: false, // Disable orbits for performance
  showPrediction: false, // Disable predictions for performance
  showDebug: false,
};
```

## Type-Based Display Presets

### Star Display Options

```typescript
const starDisplayOptions: CelestialDisplayOptions = {
  showLabels: true, // Always show star labels
  showOrbit: false, // Stars don't typically show orbits
  showPrediction: false, // Stars are usually stationary
  showDebug: false,
};
```

### Planet Display Options

```typescript
const planetDisplayOptions: CelestialDisplayOptions = {
  showLabels: true,
  showOrbit: true, // Show planetary orbits
  showPrediction: true, // Show future positions
  showDebug: false,
};
```

### Moon Display Options

```typescript
const moonDisplayOptions: CelestialDisplayOptions = {
  showLabels: true,
  showOrbit: true, // Show lunar orbits
  showPrediction: false, // May be too cluttered
  showDebug: false,
};
```

### Small Body Display Options

```typescript
const smallBodyDisplayOptions: CelestialDisplayOptions = {
  showLabels: false, // Too many for labels
  showOrbit: false, // Too many for orbit lines
  showPrediction: false,
  showDebug: false,
};
```

## Integration

### Rendering System

- Controls visibility of various rendering elements
- Affects performance based on enabled features
- Enables selective display customization

### UI System

- Provides user control over display elements
- Enables performance optimization
- Supports different viewing modes

### Performance Management

- Disabling features improves performance
- Selective display for different object types
- LOD-based display options

## 🔗 Related

- [[CelestialObject]] - Celestial objects that use these display options
- [[RenderableCelestialObject]] - Renderer-ready objects with display state
- [[@teskooano/renderer-threejs-labels]] - Label rendering system
- [[@teskooano/renderer-threejs-orbits]] - Orbit rendering system
