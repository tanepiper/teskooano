---
aliases: [BillboardManager, billboard-manager, sprite-manager, distant-objects]
tags: [renderer, threejs, celestial, manager, billboard, sprite, lod, distant]
type: Class
package: "@teskooano/renderer-threejs-celestial"
name: BillboardManager
dependencies:
  ["@teskooano/data-types", "@teskooano/renderer-threejs-lighting", "three"]
classes:
  ["LightingHelper", "THREE.Sprite", "THREE.CanvasTexture", "THREE.PointLight"]
functions: ["createPointLight"]
constants: []
types:
  [
    "RenderableCelestialObject",
    "BillboardLODConfig",
    "BillboardInfo",
    "LODLevel",
    "Color",
  ]
status: active
---

# BillboardManager

Manages sprite-based representations for distant celestial objects, providing efficient LOD rendering with smooth transitions and light integration.

## 🎯 Purpose

The `BillboardManager` handles the lifecycle and visibility of billboard sprites used as low-detail representations of celestial objects at great distances:

- **Distance-based Visibility**: Billboards activate at configurable distances
- **Smooth Fading**: Gradual opacity and light intensity transitions
- **Resource Sharing**: Static texture caching across all billboards
- **Performance Optimized**: Minimal allocations during updates
- **Light Integration**: Point lights for enhanced distant visibility

## 🚀 Core Features

### 1. Distance-based Visibility

- **Configurable Distances**: Billboards activate at configurable distances
- **Smooth Fading**: Gradual opacity and light intensity transitions
- **Performance Optimization**: Minimal allocations during updates

### 2. Resource Sharing

- **Static Texture Caching**: Single texture instance for all billboards
- **Memory Efficiency**: Minimizes memory usage and texture creation overhead
- **Shared Resources**: Efficient resource sharing across all billboards

### 3. Light Integration

- **Point Light Creation**: Associated point lights for enhanced visibility
- **Light Fading**: Smooth light intensity transitions
- **Enhanced Visibility**: Improved distant object visibility

## 🏗️ Architecture

### Shared Texture System

Uses a statically cached radial gradient texture shared across all billboards to minimize memory usage and texture creation overhead.

### Billboard Group Structure

Each billboard consists of:

- **Sprite**: The visual representation using shared texture
- **Point Light**: Associated light for enhanced visibility
- **Group**: Container for both sprite and light

## 🔧 Core Methods

### Billboard Creation

```typescript
createBillboardLOD(
  object: RenderableCelestialObject,
  config: BillboardLODConfig
): LODLevel;
```

### Update Management

```typescript
update(
  camera: THREE.PerspectiveCamera,
  allObjects: Record<string, RenderableCelestialObject>,
  allMeshes: Record<string, THREE.Object3D>
): void;
```

### Resource Management

```typescript
dispose(): void;
```

## 🎨 Billboard Configuration

### BillboardLODConfig Interface

```typescript
interface BillboardLODConfig {
  distance: number; // Activation distance
  size: number; // Sprite size
  color: Color; // Base color
  albedo?: number; // Albedo factor (default: 0.3)
}
```

### BillboardInfo Structure

```typescript
interface BillboardInfo {
  sprite: THREE.Sprite;
  activationDistance: number;
  maxFadeDistance: number;
  object: RenderableCelestialObject;
  light?: THREE.PointLight;
}
```

## 🔄 Update Algorithm

### Opacity Fading

```typescript
// Calculate target opacity based on distance
const targetOpacity =
  distanceToSelf >= activationDistance ? baseSpriteOpacity : 0.0;

// Smooth interpolation
const newOpacity = THREE.MathUtils.lerp(
  currentOpacity,
  targetOpacity,
  0.05, // fade speed
);

// Apply opacity
material.opacity = newOpacity;
sprite.visible = newOpacity > 0.001;
```

### Light Fading

```typescript
// Calculate light fade factor
const lightFadeFactor = THREE.MathUtils.smoothstep(
  distanceToSelf,
  activationDistance,
  maxFadeDistance,
);

// Apply to light intensity
const targetIntensity = (1 - lightFadeFactor) * originalIntensity;
light.intensity = THREE.MathUtils.lerp(
  light.intensity,
  targetIntensity,
  0.05, // fade speed
);
```

## 🎨 Texture Creation

### Radial Gradient Texture

```typescript
private getBillboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;

  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, canvas.width / 2
  );

  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  return new THREE.CanvasTexture(canvas);
}
```

### Sprite Material Properties

- **Blending**: `THREE.NormalBlending`
- **Size Attenuation**: `false` (screen space sizing)
- **Transparency**: `true`
- **Opacity**: Starts at 0.8, controlled by manager
- **Depth Write**: `false` (transparent sprites)
- **Depth Test**: `true` (proper occlusion)

## 💡 Light Integration

### Point Light Creation

```typescript
private createPointLightForBillboard(
  object: RenderableCelestialObject,
  config: BillboardLODConfig
): THREE.PointLight {
  // Desaturated, brighter version of object color
  const hsl = { h: 0, s: 0, l: 0 };
  config.color.getHSL(hsl);
  const lightColor = new THREE.Color().setHSL(hsl.h, 0.4, 0.85);

  // Intensity based on luminance and albedo
  const lightIntensity = (0.2 + config.color.getHSL({ h: 0, s: 0, l: 0 }).l) * (config.albedo ?? 0.3);

  const pointLight = LightingHelper.createPointLight({
    color: lightColor.getHex(),
    intensity: lightIntensity,
    decay: 2,
    distance: 0,
    name: `${object.id}-billboard-lod-light`,
  });

  pointLight.userData.originalIntensity = lightIntensity;
  return pointLight;
}
```

## 🚀 Usage Example

```typescript
// Create billboard manager
const billboardManager = new BillboardManager();

// Create billboard LOD level
const billboardLOD = billboardManager.createBillboardLOD(celestialObject, {
  distance: 10000, // Activate at 10,000 units
  size: 50, // 50-pixel sprite
  color: new THREE.Color(1, 0.8, 0.6), // Warm star color
  albedo: 0.4, // 40% albedo
});

// Add to LOD system
lod.addLevel(billboardLOD.object, billboardLOD.distance);

// Update every frame
billboardManager.update(camera, allObjects, allMeshes);

// Cleanup when done
billboardManager.dispose();
```

## 🎯 Performance Optimizations

### Memory Management

- **Shared Texture**: Single texture instance for all billboards
- **Static Caching**: Texture created once and reused
- **Efficient Updates**: Minimal allocations during update loop
- **Proper Disposal**: Automatic cleanup of materials

### Rendering Optimizations

- **Screen Space Sizing**: No perspective distortion
- **Depth Testing**: Proper occlusion without depth writing
- **Smooth Transitions**: Gradual fade-in/out to avoid popping
- **Light Integration**: Enhanced visibility without performance cost

## 🔗 Integration Points

### With LOD System

- Creates standardized LOD levels for distant objects
- Integrates with THREE.LOD for automatic switching
- Provides consistent interface for all celestial types

### With Lighting System

- Creates associated point lights for enhanced visibility
- Integrates with global lighting calculations
- Provides fallback lighting for distant objects

### With Render Order System

- Applies correct render order for star billboards
- Ensures proper depth sorting
- Integrates with transparency rendering

## ⚡ Performance Considerations

### Efficiency

- **Shared Textures**: Single texture instance for all billboards
- **Static Caching**: Texture created once and reused
- **Efficient Updates**: Minimal allocations during update loop
- **Memory Management**: Automatic cleanup of materials

### Quality Metrics

- **Visual Quality**: High-quality billboard representations
- **Performance**: Minimal performance impact on rendering
- **Memory Usage**: Efficient memory usage with shared resources
- **Smooth Transitions**: Seamless fade-in/out transitions

### Performance Monitoring

- **Billboard Count**: Track number of active billboards
- **Memory Usage**: Monitor texture and material memory usage
- **Update Performance**: Track update loop performance
- **Transition Quality**: Monitor transition smoothness

## 🔌 Integration Points

### Primary Integration

- **LOD System**: Integration with Level of Detail management
- **Lighting System**: Integration with lighting calculations
- **Render Order**: Integration with render order management

### Secondary Integration

- **Three.js Sprites**: Direct integration with Three.js sprite system
- **Camera System**: Integration with camera management
- **Performance Monitoring**: Integration with performance tracking

## 🐛 Debug Features

### Validation

- **Billboard Validation**: Validates billboard configuration
- **Texture Validation**: Validates texture creation and usage
- **Light Validation**: Validates point light creation

### Monitoring

- **Billboard Stats**: Tracks billboard creation and usage statistics
- **Memory Stats**: Monitors memory usage for billboards
- **Performance Stats**: Tracks billboard update performance

### Debugging Tools

- **Billboard Info**: Get detailed billboard information
- **Texture Info**: Get texture usage information
- **Performance Info**: Get performance statistics

## 🔮 Future Enhancements

### Optimization Opportunities

- **Texture Compression**: Compress textures for better memory usage
- **Advanced Caching**: More sophisticated texture caching
- **Memory Optimization**: Optimize memory usage patterns
- **Performance Profiling**: Enhanced performance monitoring

### Potential Improvements

- **Dynamic Textures**: Dynamic texture generation based on object properties
- **Advanced Transitions**: More sophisticated transition effects
- **Billboard Animation**: Animated billboard effects
- **Advanced Debugging**: Enhanced debugging and visualization tools

## 🔗 Related Components

- [[BaseCelestialRenderer]] - Uses this manager for billboard creation
- [[LODManager]] - Integrates with LOD system
- [[LightingHelper]] - Creates point lights for billboards
- [[RenderOrderManager]] - Applies render order for proper sorting

## 📚 Architecture Patterns

- **Manager Pattern**: Centralized billboard lifecycle management
- **Resource Management Pattern**: Shared texture and proper disposal
- **Strategy Pattern**: Configurable billboard appearance and behavior
- **Factory Pattern**: Creates billboard components

---

_The BillboardManager provides efficient, visually appealing distant object representations with smooth transitions and enhanced lighting for optimal user experience._
