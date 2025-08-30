---
aliases:
  [BaseCelestialRenderer, base-celestial-renderer, abstract-celestial-renderer]
tags: [renderer, threejs, celestial, base-class, abstract, template-method]
type: AbstractClass
package: "@teskooano/renderer-threejs-celestial"
name: BaseCelestialRenderer
dependencies:
  [
    "@teskooano/data-types",
    "@teskooano/core-math",
    "@teskooano/core-state",
    "@teskooano/renderer-threejs-lighting",
    "@teskooano/renderer-threejs-lod",
    "@teskooano/web-apis",
    "three",
  ]
classes:
  [
    "MaterialManager",
    "LODManager",
    "CelestialLightingManager",
    "TimeManager",
    "BillboardManager",
    "PositionHistoryManager",
    "GeometryUtilities",
    "PerformanceMonitor",
    "LightArrayUtils",
    "ShadowCasterUtils",
  ]
functions: ["LightingCalculator", "ShadowCasterUtils"]
constants: ["AU_METERS", "METERS_TO_SCENE_UNITS"]
types:
  [
    "RenderableCelestialObject",
    "CelestialType",
    "OSVector3",
    "LightSourcesMap",
    "LightSourceData",
    "ShadowCasterData",
    "LODLevel",
    "CelestialMeshOptions",
    "BaseCelestialRendererOptions",
    "OrbitalConfig",
    "TimePoint",
  ]
status: active
---

# BaseCelestialRenderer

Abstract base class providing common functionality for all celestial renderers.

## 🎯 Purpose

The `BaseCelestialRenderer` serves as the foundation for all celestial object rendering by providing:

- **Common Functionality**: Shared rendering logic and utilities
- **Resource Management**: Automatic material and texture lifecycle management
- **Manager Integration**: Coordination of specialized manager classes
- **Template Method Pattern**: Defines algorithm structure while allowing customization

## 🏗️ Architecture

### Template Method Pattern

The class uses the Template Method pattern where:

- Base class defines the algorithm structure (`update`, `dispose`)
- Subclasses implement specific steps (`getLODLevels`)
- Common functionality is provided by the base class

### Manager Integration

The renderer delegates specific responsibilities to specialized managers:

```typescript
abstract class BaseCelestialRenderer<
  TMaterial extends THREE.Material = THREE.Material,
> {
  protected materialManager: MaterialManager;
  protected lodManager: LODManager;
  protected lightingManager: CelestialLightingManager;
  protected timeManager: TimeManager;
  protected billboardManager: BillboardManager;
  public positionHistoryManager!: PositionHistoryManager;
}
```

## 🔧 Core Methods

### Abstract Methods (Must Implement)

```typescript
abstract getLODLevels(
  object: RenderableCelestialObject,
  options?: CelestialMeshOptions
): LODLevel[];
```

### Provided Methods

```typescript
// Main update loop
update(
  object: RenderableCelestialObject,
  time: number,
  timeScale: number,
  lightSources: LightSourcesMap,
  camera: THREE.PerspectiveCamera,
  allObjects?: Record<string, RenderableCelestialObject>,
  allMeshes?: Record<string, THREE.Object3D>
): void;

// Resource management
dispose(): void;
registerMaterial(id: string, material: THREE.Material): void;
```

### Optional Override Methods

```typescript
protected createMaterial?(object: RenderableCelestialObject): TMaterial;
protected beforeUpdate?(options: UpdateOptions): void;
protected afterUpdate?(options: UpdateOptions): void;
```

## 🔄 Update Flow

The main update method orchestrates the rendering pipeline:

1. **Pre-Update Hook**: Calls `beforeUpdate` if implemented
2. **Time Management**: Updates time tracking
3. **Position History**: Updates orbital data and position history
4. **Lighting**: Updates lighting calculations
5. **LOD Management**: Updates Level of Detail
6. **Billboard Updates**: Updates distant object representations
7. **Post-Update Hook**: Calls `afterUpdate` if implemented

## 🎨 Material Management

### Registration

```typescript
public registerMaterial(id: string, material: THREE.Material): void;
public registerMaterials(id: string, materials: THREE.Material[]): void;
```

### Retrieval

```typescript
public getMaterial(id: string): THREE.Material | THREE.Material[] | undefined;
public getTypedMaterial(id: string): TMaterial | undefined;
```

### Creation

```typescript
public createAndRegisterMaterial(object: RenderableCelestialObject): TMaterial | undefined;
```

## 🌟 Lighting Integration

### Light Source Management

```typescript
protected updateLightSources(lightSources: LightSourcesMap): void;
protected applyLightAttenuation(config?: LightingConfig, forceRefresh?: boolean): LightSourcesMap;
protected findClosestLightSource(forceRefresh?: boolean): LightSourceData | null;
```

### Shadow Caster Detection

```typescript
public findShadowCasters(forceRefresh?: boolean): ShadowCasterData[];
public findRingShadowCasters(forceRefresh?: boolean): ShadowCasterData[];
```

## 📊 Orbital Data Access

### Position Data

```typescript
protected getCurrentPosition(): OSVector3;
protected getCurrentVelocity(): OSVector3;
protected getPositionHistory(maxPoints?: number): OSVector3[];
protected getPositionHistoryWithTimestamps(maxPoints?: number): TimePoint[];
```

### LOD-Based Visibility

```typescript
protected shouldShowOrbitLines(cameraDistance: number, objectType: CelestialType): boolean;
protected shouldShowTrailLines(cameraDistance: number, objectType: CelestialType): boolean;
protected shouldShowPredictionLines(): boolean;
```

### State Management

```typescript
protected setHighlighted(highlighted: boolean): void;
protected setShowPredictionLines(show: boolean): void;
protected isObjectHighlighted(): boolean;
```

## 🛠️ Geometry Utilities

### Segment Calculations

```typescript
protected getSegmentsForDetailLevel(detailLevel?: string, defaultSegments?: number): number;
protected calculateLODLevel(distance: number, objectRadius: number): number;
```

### Position Utilities

```typescript
protected getWorldPosition(object: RenderableCelestialObject): THREE.Vector3;
```

## ⏰ Time Management

### Time Tracking

```typescript
protected getElapsedTime(): number;
protected getStartTime(): number;
```

## 🚀 Usage Example

```typescript
class StarRenderer extends BaseCelestialRenderer {
  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, {
      ...options,
      orbitalConfig: {
        maxHistoryPoints: 2000,
        minDistanceThreshold: 1e-5,
        showOrbitLines: true,
        showPredictionLines: false,
        orbitLineLODDistance: 1500,
        trailLODDistance: 800,
      },
    });
  }

  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    return [
      { distance: 0, object: this.createDetailedStarMesh(object) },
      { distance: 1000, object: this.createSimpleStarMesh(object) },
      { distance: 10000, object: this.createBillboardMesh(object) },
    ];
  }

  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.Camera,
  ): void {
    // Call parent update for common functionality
    super.update(object, time, timeScale, lightSources, camera);

    // Add star-specific update logic
    this.updateStarShaders(object, lightSources);
  }
}
```

## 🔗 Related Components

- [[MaterialManager]] - Material lifecycle management
- [[LODManager]] - Level of Detail management
- [[CelestialLightingManager]] - Lighting calculations
- [[TimeManager]] - Time tracking utilities
- [[BillboardManager]] - Distant object representations
- [[PositionHistoryManager]] - Orbital data management
- [[GeometryUtilities]] - Geometry calculation utilities

## 📚 Architecture Patterns

- **Template Method Pattern**: Base class defines algorithm structure
- **Manager Pattern**: Delegates responsibilities to specialized managers
- **Resource Management Pattern**: Automatic cleanup and disposal
- **Strategy Pattern**: Configurable rendering strategies

---

_The BaseCelestialRenderer provides a robust foundation for all celestial object rendering with comprehensive resource management and performance optimization._
