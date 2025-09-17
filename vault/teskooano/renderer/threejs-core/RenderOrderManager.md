---
aliases: [RenderOrderManager, render-order, depth-sorting, render-priority]
tags: [renderer, threejs, core, render-order, depth, sorting]
type: Class
package: "@teskooano/renderer-threejs-core"
name: RenderOrderManager
dependencies: ["@teskooano/data-types", "three"]
classes: ["THREE.Object3D", "THREE.Scene"]
functions: []
constants: ["RENDER_ORDERS"]
types: ["CelestialType"]
status: active
---

# RenderOrderManager

Centralized manager for consistent render order across all 3D objects, ensuring proper depth sorting and preventing visual artifacts.

## 🎯 Purpose

The RenderOrderManager provides:

- **Consistent Render Order**: Centralized constants for all object types
- **Depth Sorting**: Ensures proper rendering order to prevent visual artifacts
- **Object Classification**: Maps celestial types to appropriate render orders
- **Effect Management**: Handles special effects and orbital visualizations
- **Debug Support**: Tools for analyzing and validating render orders

## 🏗️ Architecture

### Render Order Constants

Pre-defined render order values for different object types:

```typescript
private static readonly RENDER_ORDERS = {
  // Background elements (render first)
  BACKGROUND_SKYBOX: -1000,
  BACKGROUND_STARFIELD: -900,
  BACKGROUND_NEBULA: -800,

  // Distant particle fields
  OORT_CLOUD: -500,
  DISTANT_PARTICLES: -400,

  // Main celestial bodies (solid objects that write to depth buffer)
  STAR: 0,
  GAS_GIANT: 0,
  PLANET: 0,
  DWARF_PLANET: 0,
  MOON: 0,
  ASTEROID: 0,
  COMET_NUCLEUS: 0,
  SATELLITE: 0,

  // Volumetric effects around celestial bodies
  STELLAR_CORONA: 100,
  ATMOSPHERIC_EFFECTS: 200,
  RING_SYSTEM: 300,

  // Dynamic path visualizations (render AFTER celestial objects)
  ORBITAL_LINES_KEPLERIAN: 400,
  ORBITAL_LINES_TRAIL: 500,
  ORBITAL_LINES_PREDICTION: 600,

  // Particle effects
  COMET_TAIL: 700,
  COMET_JETS: 800,
  ASTEROID_FIELD_PARTICLES: 900,

  // Billboards and sprites
  STAR_BILLBOARD: -1000,
  DISTANCE_MARKERS: 1100,

  // UI and overlays (render last)
  DEBUG_HELPERS: 2000,
  UI_ELEMENTS: 3000,
} as const;
```

### Render Order Strategy

- **Lower Values**: Render first (background elements)
- **Zero Values**: Main celestial bodies (depth buffer writers)
- **Higher Values**: Render last (effects, overlays, UI)

## 🔧 Core Methods

### Celestial Type Mapping

#### getRenderOrderForCelestialType()

Maps celestial object types to appropriate render orders.

```typescript
public static getRenderOrderForCelestialType(type: CelestialType): number
```

**Mapping:**

- `STAR`, `GAS_GIANT`, `PLANET`, `DWARF_PLANET`, `MOON`, `ASTEROID`, `COMET`, `SATELLITE` → `0`
- `ASTEROID_FIELD` → `900` (particle effects)
- `OORT_CLOUD` → `-500` (distant particles)
- `RING_SYSTEM` → `300` (volumetric effects)

### Effect Type Mapping

#### getRenderOrderForEffect()

Maps effect types to appropriate render orders.

```typescript
public static getRenderOrderForEffect(effectType: string): number
```

**Mapping:**

- `stellar-corona` → `100`
- `atmosphere` → `200`
- `comet-tail` → `700`
- `comet-jets` → `800`
- `star-billboard` → `-1000`
- `distance-markers` → `1100`
- `debug-helpers` → `2000`

### Orbital Visualization Mapping

#### getRenderOrderForOrbit()

Maps orbital visualization types to appropriate render orders.

```typescript
public static getRenderOrderForOrbit(orbitType: string): number
```

**Mapping:**

- `keplerian` → `400`
- `trail` → `500`
- `prediction` → `600`

### Object Application

#### applyRenderOrder()

Applies the correct render order to a Three.js object.

```typescript
public static applyRenderOrder(
  object: THREE.Object3D,
  type: CelestialType | string,
  subType?: string
): void
```

**Process:**

1. Determines appropriate render order based on type
2. Applies render order recursively to all children
3. Handles both celestial types and string-based types

### Validation and Debug

#### validateRenderOrder()

Validates that an object has a proper render order set.

```typescript
public static validateRenderOrder(object: THREE.Object3D): boolean
```

#### debugRenderOrders()

Debug method to log all render orders in a scene.

```typescript
public static debugRenderOrders(scene: THREE.Scene): void
```

## 🔄 Integration Flow

### Object Creation Flow

```typescript
// When creating celestial objects
const planet = new THREE.Mesh(geometry, material);
RenderOrderManager.applyRenderOrder(planet, CelestialType.PLANET);

// When creating effects
const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
RenderOrderManager.applyRenderOrder(atmosphere, "atmosphere");

// When creating orbital lines
const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
RenderOrderManager.applyRenderOrder(orbitLine, "keplerian");
```

### Scene Analysis Flow

```typescript
// Analyze render orders in a scene
RenderOrderManager.debugRenderOrders(scene);

// Validate specific objects
const isValid = RenderOrderManager.validateRenderOrder(planet);
if (!isValid) {
  console.warn("Object missing proper render order");
}
```

## 🚀 Usage Examples

### Basic Object Setup

```typescript
import { RenderOrderManager } from "@teskooano/renderer-threejs-core";
import { CelestialType } from "@teskooano/data-types";

// Create a planet
const planetGeometry = new THREE.SphereGeometry(1, 32, 32);
const planetMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const planet = new THREE.Mesh(planetGeometry, planetMaterial);

// Apply render order
RenderOrderManager.applyRenderOrder(planet, CelestialType.PLANET);
// planet.renderOrder will be set to 0

// Create atmosphere effect
const atmosphereGeometry = new THREE.SphereGeometry(1.1, 32, 32);
const atmosphereMaterial = new THREE.MeshBasicMaterial({
  color: 0x0088ff,
  transparent: true,
  opacity: 0.3,
});
const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);

// Apply render order for effect
RenderOrderManager.applyRenderOrder(atmosphere, "atmosphere");
// atmosphere.renderOrder will be set to 200
```

### Orbital Visualization

```typescript
// Create keplerian orbit line
const orbitGeometry = new THREE.BufferGeometry();
const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);

// Apply render order for orbital visualization
RenderOrderManager.applyRenderOrder(orbitLine, "keplerian");
// orbitLine.renderOrder will be set to 400

// Create trail visualization
const trailGeometry = new THREE.BufferGeometry();
const trailMaterial = new THREE.LineBasicMaterial({ color: 0xff8800 });
const trailLine = new THREE.Line(trailGeometry, trailMaterial);

// Apply render order for trail
RenderOrderManager.applyRenderOrder(trailLine, "trail");
// trailLine.renderOrder will be set to 500
```

### Debug and Validation

```typescript
// Debug all render orders in scene
RenderOrderManager.debugRenderOrders(scene);
// Output: Order -1000: background-skybox, star-billboard
//         Order 0: planet-earth, star-sun, moon-luna
//         Order 200: atmosphere-earth
//         Order 400: orbit-earth-keplerian
//         Order 500: trail-earth

// Validate specific objects
const planetValid = RenderOrderManager.validateRenderOrder(planet);
const atmosphereValid = RenderOrderManager.validateRenderOrder(atmosphere);

console.log(`Planet render order valid: ${planetValid}`);
console.log(`Atmosphere render order valid: ${atmosphereValid}`);
```

## 🎯 Performance Considerations

### Render Order Impact

- **Depth Buffer Efficiency**: Proper render order reduces overdraw
- **GPU Performance**: Minimizes unnecessary fragment shader executions
- **Memory Bandwidth**: Reduces texture and buffer access conflicts

### Optimization Strategies

- **Background First**: Render skyboxes and distant objects first
- **Solid Objects**: Render depth-writing objects at order 0
- **Effects Last**: Render transparent effects after solid objects
- **UI Overlay**: Render UI elements last to ensure visibility

### Validation Overhead

- **Debug Mode Only**: Validation should only run in debug builds
- **Selective Checking**: Only validate critical objects
- **Cached Results**: Cache validation results when possible

## 🔍 Debug Features

### Render Order Analysis

```typescript
// Analyze render order distribution
const renderOrderMap = new Map<number, string[]>();

scene.traverse((object) => {
  const order = object.renderOrder || 0;
  if (!renderOrderMap.has(order)) {
    renderOrderMap.set(order, []);
  }
  renderOrderMap.get(order)!.push(object.name || object.type || "unnamed");
});

// Log distribution
Array.from(renderOrderMap.keys())
  .sort((a, b) => a - b)
  .forEach((order) => {
    console.log(`Order ${order}: ${renderOrderMap.get(order)!.join(", ")}`);
  });
```

### Validation Reporting

```typescript
// Comprehensive validation report
const validationReport = {
  totalObjects: 0,
  validOrders: 0,
  invalidOrders: 0,
  missingOrders: 0,
  details: [] as string[],
};

scene.traverse((object) => {
  validationReport.totalObjects++;

  if (object.renderOrder === undefined || object.renderOrder === 0) {
    validationReport.missingOrders++;
    validationReport.details.push(
      `${object.name || object.type}: Missing render order`,
    );
  } else if (RenderOrderManager.validateRenderOrder(object)) {
    validationReport.validOrders++;
  } else {
    validationReport.invalidOrders++;
    validationReport.details.push(
      `${object.name || object.type}: Invalid render order ${object.renderOrder}`,
    );
  }
});

console.log("Render Order Validation Report:", validationReport);
```

## 📚 Related Components

- [[SceneManager]] - Scene management and object creation
- [[LogarithmicDepthMaterial]] - Depth buffer configuration
- [[DepthBufferDebugger]] - Depth buffer analysis
- [[Performance Optimization]] - Performance considerations

## 🏛️ Architecture Patterns

- **Constants Pattern**: Centralized render order constants
- **Strategy Pattern**: Different render order strategies for different object types
- **Validation Pattern**: Runtime validation of render order correctness
- **Debug Pattern**: Comprehensive debugging and analysis tools

## 🔧 Advanced Usage

### Custom Render Orders

```typescript
// Define custom render order ranges
const CUSTOM_RENDER_ORDERS = {
  CUSTOM_EFFECT_1: 150,
  CUSTOM_EFFECT_2: 250,
  CUSTOM_UI: 2500,
} as const;

// Apply custom render orders
RenderOrderManager.applyRenderOrder(customObject, "custom-effect-1");
```

### Batch Processing

```typescript
// Apply render orders to multiple objects
const objects = [planet, atmosphere, orbitLine, trailLine];
const types = [CelestialType.PLANET, "atmosphere", "keplerian", "trail"];

objects.forEach((object, index) => {
  RenderOrderManager.applyRenderOrder(object, types[index]);
});
```

### Conditional Render Orders

```typescript
// Apply different render orders based on conditions
const renderOrder = isTransparent
  ? RenderOrderManager.getRenderOrderForEffect("atmosphere")
  : RenderOrderManager.getRenderOrderForCelestialType(CelestialType.PLANET);

RenderOrderManager.applyRenderOrder(object, renderOrder);
```

## ⚡ Performance Considerations

### Efficiency

- **Static Constants**: Pre-defined render orders for optimal performance
- **Fast Lookup**: O(1) lookup time for render order determination
- **Minimal Overhead**: Lightweight render order application
- **Memory Efficient**: No dynamic allocations during operation

### Quality Metrics

- **Consistency**: Consistent render order across all objects
- **Reliability**: Robust render order validation
- **Accuracy**: Accurate depth sorting and occlusion
- **Scalability**: Efficient handling of large numbers of objects

### Performance Monitoring

- **Render Order Distribution**: Monitor render order distribution
- **Validation Performance**: Track validation execution time
- **Memory Usage**: Monitor memory usage during operations
- **Optimization Impact**: Measure optimization effectiveness

## 🔌 Integration Points

### Primary Integration

- **SceneManager**: Applies render orders to scene objects
- **Object Creation**: Sets render orders during object creation
- **Material Systems**: Coordinates with material render order settings
- **Depth Systems**: Integrates with depth buffer management

### Secondary Integration

- **Debug Systems**: Provides debugging and validation tools
- **Performance Monitoring**: Integrates with performance systems
- **Validation Systems**: Validates render order correctness
- **Optimization Tools**: Provides optimization recommendations

## 🔍 Debug Features

### Validation

- **Render Order Validation**: Validates render order correctness
- **Conflict Detection**: Detects render order conflicts
- **Distribution Analysis**: Analyzes render order distribution
- **Performance Impact**: Measures render order performance impact

### Monitoring

- **Render Order Tracking**: Tracks render order changes
- **Performance Monitoring**: Monitors render order performance
- **Usage Analytics**: Analyzes render order usage patterns
- **Error Detection**: Detects render order errors

## 🔮 Future Enhancements

### Optimization Opportunities

- **Dynamic Render Orders**: Adjust render orders based on performance
- **Automatic Optimization**: Automatically optimize render orders
- **Performance Prediction**: Predict render order performance impact
- **Memory Optimization**: Reduce render order memory usage

### Potential Improvements

- **Advanced Validation**: More sophisticated render order validation
- **Performance Analytics**: Advanced performance analytics
- **Automated Fixes**: Automatically fix render order issues
- **Predictive Analysis**: Predict potential render order problems

## 📚 Related Components

- [[SceneManager]] - Scene management and object creation
- [[LogarithmicDepthMaterial]] - Depth buffer configuration
- [[DepthBufferDebugger]] - Depth buffer analysis
- [[PerformanceOptimization]] - Performance considerations

## 🏛️ Architecture Patterns

- **Constants Pattern**: Centralized render order constants
- **Strategy Pattern**: Different render order strategies for different object types
- **Validation Pattern**: Runtime validation of render order correctness
- **Debug Pattern**: Comprehensive debugging and analysis tools

---

_The RenderOrderManager ensures consistent and optimal rendering order across all 3D objects, preventing visual artifacts and maximizing rendering performance._
