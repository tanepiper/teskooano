# Three.js Labels Package

This package provides a comprehensive 2D label system for the Teskooano celestial rendering engine, built on top of Three.js CSS2DRenderer.

## Features

- **Multi-layer label system** with support for celestial labels, AU markers, prediction labels, and tooltips
- **Automatic occlusion testing** to hide labels behind celestial objects
- **Performance optimized** with spatial culling and caching
- **Individual label visibility control** through celestial state management
- **LOD-aware visibility** that respects object type and distance constraints

## Architecture

### Core Components

- **`Layer2DManager`**: Main orchestrator for all 2D UI layers
- **`BaseLabelLayer`**: Abstract base class for different label types
- **`CelestialLabelLayer`**: Handles celestial object labels with type-specific visibility rules
- **`AuMarkerLabelLayer`**: Manages AU distance markers
- **`PredictionLabelLayer`**: Handles trajectory prediction labels

### Label Visibility Control

The label system now integrates with the celestial state management to provide individual label visibility control:

#### Through CelestialManager

```typescript
import { celestialManager } from "@teskooano/core-state";

// Hide labels for a specific object
celestialManager.setLabelVisibility("earth", false);

// Show labels for a specific object
celestialManager.setLabelVisibility("mars", true);

// Get current label visibility
const isVisible = celestialManager.getLabelVisibility("earth");

// Bulk operations
const objectIds = ["earth", "mars", "venus"];
celestialManager.setLabelVisibilityForMultiple(objectIds, false);
```

#### Through CelestialStore

```typescript
import { celestialStore } from "@teskooano/core-state";

// Update display options including label visibility
celestialStore.updateDisplayOptions("earth", {
  showLabels: false,
  showOrbit: true,
});

// Get effective display options with defaults
const options = celestialStore.getEffectiveDisplayOptions("earth");
if (options.showLabels) {
  console.log("Earth labels are visible");
}
```

#### Through BaseCelestialRenderer

```typescript
// In a custom renderer class
export class CustomCelestialRenderer extends BaseCelestialRenderer {
  protected shouldShowLabels(): boolean {
    // Custom logic for determining label visibility
    return this.object.someProperty > threshold;
  }

  protected setLabelVisibility(visible: boolean): void {
    // Custom label visibility logic
    this.updateLabelVisibility(visible);
  }
}
```

### Label Visibility Rules

The system applies the following visibility rules in order of precedence:

1. **Individual UI Options**: `object.uiOptions.showLabels` takes highest priority
2. **Object Type Constraints**: Ring systems never show labels
3. **LOD Constraints**: Moon labels only show when parent is close
4. **Distance Constraints**: Labels fade out based on camera distance
5. **Occlusion Testing**: Labels behind celestial objects are hidden

### Performance Features

- **Spatial culling**: Skips occlusion tests for nearby labels
- **Throttled updates**: Occlusion checks are limited per frame
- **Result caching**: Occlusion results are cached for 2 seconds
- **Configurable thresholds**: Adjustable performance parameters

## Usage

### Basic Setup

```typescript
import {
  Layer2DManager,
  CelestialLabelLayer,
  CSS2DLayerType,
} from "@teskooano/renderer-threejs-labels";

const layerManager = new Layer2DManager(scene, container);
const celestialLayer = new CelestialLabelLayer(scene);

layerManager.registerLayer(CSS2DLayerType.CELESTIAL_LABELS, celestialLayer);
```

### Custom Label Layers

```typescript
export class CustomLabelLayer extends BaseLabelLayer {
  public getRequiredComponents(): UIRegistryComponent[] {
    return [
      {
        tagName: "custom-label",
        componentClass: CustomLabelComponent,
      },
    ];
  }

  public update(
    camera: THREE.PerspectiveCamera,
    objectManager: ObjectManager,
  ): void {
    // Custom update logic
  }
}
```

### Label Visibility Control

```typescript
// Control individual labels
layerManager.setInstanceVisibility(
  CSS2DLayerType.CELESTIAL_LABELS,
  "earth",
  false,
);

// Check visibility state
const isVisible = layerManager.getInstanceVisibility(
  CSS2DLayerType.CELESTIAL_LABELS,
  "earth",
);

// Layer-wide visibility
layerManager.setLayerVisibility(CSS2DLayerType.CELESTIAL_LABELS, false);
```

## Configuration

### Occlusion Settings

```typescript
const layer = new CelestialLabelLayer(scene, {
  checkFrequency: 30, // Check every 30 frames
  maxTestsPerFrame: 3, // Max 3 tests per frame
  cacheDuration: 1000, // Cache for 1 second
  nearbyDistanceThreshold: 50, // Skip tests within 50 units
  enabled: true, // Enable occlusion testing
});
```

### Label Visibility Config

```typescript
const config: LabelVisibilityConfig = {
  planet: 500, // Show planet labels within 500 AU
  gasGiant: 800, // Show gas giant labels within 800 AU
  moon: 200, // Show moon labels within 200 AU
  comet: 300, // Show comet labels within 300 AU
  asteroid: 100, // Show asteroid labels within 100 AU
  default: 400, // Default visibility distance
};
```

## Integration with Celestial System

The label system automatically integrates with the celestial state management:

- **Reactive Updates**: Labels automatically respond to state changes
- **Object Lifecycle**: Labels are created/destroyed with celestial objects
- **Performance**: Labels respect LOD and distance constraints
- **Consistency**: Label visibility matches object visibility state

## Best Practices

1. **Use the CelestialManager API** for label visibility control rather than direct DOM manipulation
2. **Respect LOD constraints** - don't force labels to show for distant objects
3. **Cache visibility decisions** when possible to avoid per-frame calculations
4. **Use bulk operations** for multiple objects to improve performance
5. **Test occlusion settings** in your specific use case to find optimal values
