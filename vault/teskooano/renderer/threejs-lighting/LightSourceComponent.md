---
aliases: [LightSourceComponent, light-source, star-light, celestial-light]
tags: [renderer, threejs, lighting, component, star, celestial, dynamic]
type: Class
package: "@teskooano/renderer-threejs-lighting"
name: LightSourceComponent
dependencies:
  [
    "@teskooano/core-state",
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-helpers",
    "three",
  ]
classes:
  [
    "THREE.Light",
    "THREE.PointLight",
    "THREE.Color",
    "StateAccessor",
    "LightingHelper",
  ]
functions: ["calculateVisualIntensity"]
constants: []
types: ["RenderableCelestialObject", "StarProperties", "LightSourceOptions"]
status: active
---

# LightSourceComponent

A component that represents a single light source attached to a celestial object, providing dynamic lighting that adapts to stellar properties and object movement.

## 🎯 Purpose

The `LightSourceComponent` serves as a bridge between celestial objects and Three.js lighting, automatically managing light properties based on stellar characteristics. It wraps a `THREE.Light` instance and keeps it synchronized with a `RenderableCelestialObject`, updating position, color, and intensity based on the object's current state and properties.

## 🏗️ Architecture

### Core Components

- **Light Instance**: Wrapped `THREE.Light` (typically `THREE.PointLight`)
- **Celestial Object**: Associated `RenderableCelestialObject` for position and properties
- **Dynamic Updates**: Automatic synchronization with object state changes
- **Stellar Properties**: Light characteristics based on star type and properties

### Component Structure

```typescript
export class LightSourceComponent {
  public readonly light: THREE.Light;
  public celestialObject: RenderableCelestialObject;
}
```

## 🔧 Core Methods

### Constructor

```typescript
constructor(object: RenderableCelestialObject, options: LightSourceOptions = {})
```

- **object**: The celestial object this component is attached to
- **options**: Configuration options for light creation and behavior
- **Initialization**: Creates appropriate light type and sets initial properties

### Light Creation Logic

```typescript
// Default light creation for stars
if (object.type === CelestialType.STAR) {
  const starProps = object.properties as StarProperties;
  if (starProps) {
    color = starProps.color; // From stellar properties
    intensity = calculateVisualIntensity(starProps.luminosity); // From luminosity
  }
}

this.light = LightingHelper.createPointLight({
  color: color as number,
  intensity,
  decay: 2,
  distance: 0,
  castShadow: options.castShadow ?? false,
  shadowMapSize: 1024,
  name: `${object.id}-light`,
});
```

### Update Methods

```typescript
public update(): void
private updateLightProperties(): void
```

- **Position Updates**: Synchronizes light position with celestial object
- **Property Updates**: Updates color and intensity based on stellar properties
- **State Integration**: Fetches fresh object data from state system

## 🎨 Stellar Light Properties

### Color Management

```typescript
// Update color from stellar properties
if (starProps.color && this.light instanceof THREE.PointLight) {
  this.light.color.set(starProps.color);
}
```

- **Stellar Colors**: Uses actual stellar spectral colors
- **Dynamic Updates**: Color changes as stellar properties evolve
- **Type Safety**: Handles both string and numeric color representations

### Intensity Calculation

```typescript
// Update intensity from luminosity
if (
  starProps.luminosity !== undefined &&
  this.light instanceof THREE.PointLight
) {
  this.light.intensity = calculateVisualIntensity(starProps.luminosity);
}
```

- **Luminosity Mapping**: Converts physical luminosity to visual intensity
- **Dynamic Range**: Handles enormous stellar luminosity ranges
- **Visual Optimization**: Clamped to prevent scene blow-out

## 🔧 Configuration Options

### LightSourceOptions Interface

```typescript
export interface LightSourceOptions {
  /** The specific THREE.Light instance to use. Defaults to a PointLight. */
  light?: THREE.Light;
  /** Whether this light source should cast shadows. Defaults to false. */
  castShadow?: boolean;
}
```

### Default Light Configuration

- **Type**: `THREE.PointLight` for stars, customizable for other objects
- **Decay**: 2 (realistic light falloff)
- **Distance**: 0 (no distance limit)
- **Shadow Casting**: Configurable per component
- **Shadow Map Size**: 1024 for quality shadows

## 🚀 Usage Example

```typescript
// Create light source for a star
const starObject: RenderableCelestialObject = getStarData();
const lightSource = new LightSourceComponent(starObject, {
  castShadow: true,
});

// Register with lighting manager
lightingManager.register(lightSource);

// Update is called automatically by lighting manager
// Light position and properties stay synchronized with star

// Access the underlying Three.js light
const threeJsLight = lightSource.light;
scene.add(threeJsLight);

// Clean up when done
lightSource.dispose();
```

## 🎯 Performance Considerations

### State Integration

- **Efficient Updates**: Only fetches fresh data when needed
- **State Access**: Uses `StateAccessor` for optimized state queries
- **Reference Management**: Maintains fresh object references

### Light Property Updates

- **Conditional Updates**: Only updates properties that have changed
- **Type Checking**: Safe property access with type guards
- **Performance Optimization**: Minimal property updates per frame

### Memory Management

- **Proper Disposal**: Cleans up Three.js light resources
- **Reference Cleanup**: Removes references to prevent memory leaks
- **Component Lifecycle**: Integrates with lighting manager lifecycle

## 🔍 Debug Features

### Light Property Debugging

- **Color Inspection**: Monitor stellar color application
- **Intensity Tracking**: Track luminosity to intensity conversion
- **Position Verification**: Debug light position synchronization

### Performance Monitoring

- **Update Frequency**: Track component update performance
- **State Access**: Monitor state query efficiency
- **Memory Usage**: Track light component memory consumption

## 📚 Related Components

- **[[LightingManager]]** - Manages light source components
- **[[calculateVisualIntensity]]** - Converts luminosity to visual intensity
- **[[LightingHelper]]** - Creates optimized Three.js lights
- **[[StateAccessor]]** - Provides access to celestial object state

## 🏛️ Architecture Patterns

- **Component Pattern**: Wraps Three.js light with celestial data
- **Observer Pattern**: Updates triggered by state changes
- **Factory Pattern**: Light creation delegated to LightingHelper
- **State Pattern**: Integration with centralized state management
- **Lifecycle Pattern**: Proper initialization and cleanup

## 🔧 Integration Points

### State System Integration

- **StateAccessor**: Fetches fresh object data
- **Renderable Objects**: Access to current object state
- **Property Updates**: Synchronizes with state changes

### Three.js Integration

- **Light Creation**: Uses LightingHelper for optimized light creation
- **Scene Management**: Light instances added to Three.js scene
- **Property Updates**: Direct Three.js light property manipulation

### Lighting Manager Integration

- **Registration**: Components registered with LightingManager
- **Update Cycle**: Update calls triggered by manager
- **Lifecycle Management**: Disposal handled by manager

---

_The LightSourceComponent provides the essential bridge between celestial objects and Three.js lighting, enabling dynamic, realistic space illumination._
