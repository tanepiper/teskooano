# ThreeJS Orbits Refactoring Plan (Granular Steps)

## 🎯 Goal

Transform the threejs-orbits package from a complex, calculation-heavy system into a simple, focused rendering layer that follows clean separation of concerns:

- **Physics Package**: All orbital calculations (Keplerian, N-body, predictions)
- **Rendering Package**: Pure visualization of data provided by physics
- **BaseCelestialRenderer**: Individual object orbit management and data coordination
- **OrbitsOrchestrator**: Centralized rendering coordination (replaces OrbitsManager)

## 🏗️ Current Problems Analysis

### 1. **Tight Coupling Between Calculations and Rendering**

- `OrbitCalculator` in rendering package should be in physics package
- `PredictionCalculator` doing physics calculations in rendering layer
- `TrailManager` with embedded Web Workers for calculations
- Strategy pattern adding unnecessary complexity

### 2. **Mixed Responsibilities**

- `OrbitsManager` handling both state management and rendering
- `BaseCelestialRenderer` not properly managing its own orbit data
- Complex dependency injection chains between renderers and calculators

### 3. **Circular Dependencies**

- Rendering package depending on physics calculations
- State management mixed with rendering logic
- Complex object lifecycle management

## 🚀 Target Architecture

### **Clean Separation of Concerns**

```
Physics Package (@teskooano/core-physics)
├── OrbitalCalculations
│   ├── calculateKeplerianOrbitPoints()
│   ├── calculateNBodyTrailPoints()
│   └── calculatePredictionTrajectory()
└── OrbitalDataProviders
    ├── KeplerianOrbitProvider
    ├── NBodyTrailProvider
    └── PredictionProvider

BaseCelestialRenderer (Per Object)
├── OrbitManager (NEW)
│   ├── Detects simulation mode
│   ├── Subscribes to appropriate data provider
│   ├── Manages LOD visibility logic
│   └── Coordinates with OrbitsOrchestrator
└── PositionHistoryManager (existing)
    └── Manages position history for trails

OrbitsOrchestrator (Global - replaces OrbitsManager)
├── KeplerianRenderer (global instance)
├── TrailRenderer (global instance)
├── PredictionRenderer (global instance)
└── Manages global visibility and highlighting
```

### **Data Flow (Simplified)**

```
Physics Package
├── calculateKeplerianOrbitPoints() → OSVector3[]
├── calculateNBodyTrailPoints() → OSVector3[]
└── calculatePredictionTrajectory() → OSVector3[]

BaseCelestialRenderer.OrbitManager
├── Subscribes to physics data providers
├── Converts OSVector3[] to THREE.Vector3[]
├── Manages LOD visibility logic
└── Sends data to OrbitsOrchestrator

OrbitsOrchestrator
├── Receives data from all BaseCelestialRenderer instances
├── Renders all orbit lines in centralized instances
└── Manages global visibility and highlighting
```

## 📋 Granular Refactoring Steps

### **Phase 1: Move Calculations to Physics Package**

#### Step 1.1: Create Orbital Calculation Functions in Physics Package

**File**: `packages/core/physics/src/orbital/calculations.ts`

```typescript
// Move from renderer package to physics package
export function calculateKeplerianOrbitPoints(
  orbitalParameters: OrbitalParameters,
  numPoints: number = 100,
): OSVector3[] {
  // Move OrbitCalculator logic here
}

export function calculateNBodyTrailPoints(
  positionHistory: OSVector3[],
  maxPoints: number = 1000,
): OSVector3[] {
  // Move trail calculation logic here
}

export function calculatePredictionTrajectory(
  objectId: string,
  duration: number,
  steps: number,
): { points: OSVector3[]; timestamps: number[] } {
  // Move PredictionCalculator logic here
}
```

**Dependencies**: None (pure physics calculations)

#### Step 1.2: Create Orbital Data Providers

**File**: `packages/core/physics/src/orbital/providers.ts`

```typescript
export class KeplerianOrbitProvider {
  getOrbitPoints(objectId: string): Observable<OSVector3[]> {
    // Provides Keplerian orbit points for objects
  }
}

export class NBodyTrailProvider {
  getTrailPoints(objectId: string): Observable<OSVector3[]> {
    // Provides N-body trail points for objects
  }
}

export class PredictionProvider {
  getPredictionPoints(
    objectId: string,
  ): Observable<{ points: OSVector3[]; timestamps: number[] }> {
    // Provides prediction points for objects
  }
}
```

**Dependencies**: Core physics calculations, state access

#### Step 1.3: Update Physics Package Exports

**File**: `packages/core/physics/src/index.ts`

```typescript
// Add new orbital calculation exports
export {
  calculateKeplerianOrbitPoints,
  calculateNBodyTrailPoints,
  calculatePredictionTrajectory,
} from "./orbital/calculations";

export {
  KeplerianOrbitProvider,
  NBodyTrailProvider,
  PredictionProvider,
} from "./orbital/providers";
```

### **Phase 2: Create BaseCelestialRenderer OrbitManager**

#### Step 2.1: Create OrbitManager Class

**File**: `packages/renderer/threejs-celestial/src/base/managers/OrbitManager.ts`

```typescript
export class OrbitManager {
  private keplerianSubscription?: Subscription;
  private trailSubscription?: Subscription;
  private predictionSubscription?: Subscription;
  private simulationMode: "ideal" | "nbody" = "ideal";

  constructor(
    private objectId: string,
    private config: OrbitConfig,
    private onDataUpdate: (data: OrbitRenderData) => void,
  ) {}

  updateSimulationMode(mode: "ideal" | "nbody"): void {
    this.simulationMode = mode;
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    // Subscribe to appropriate data provider based on mode
    if (this.simulationMode === "ideal") {
      this.subscribeToKeplerian();
    } else {
      this.subscribeToNBody();
    }
  }

  private subscribeToKeplerian(): void {
    // Subscribe to KeplerianOrbitProvider
  }

  private subscribeToNBody(): void {
    // Subscribe to NBodyTrailProvider and PredictionProvider
  }

  shouldShowOrbitLines(cameraDistance: number): boolean {
    // LOD logic for orbit lines
  }

  shouldShowTrailLines(cameraDistance: number): boolean {
    // LOD logic for trail lines
  }

  shouldShowPredictionLines(cameraDistance: number): boolean {
    // LOD logic for prediction lines
  }
}
```

**Dependencies**: Physics package data providers, state access

#### Step 2.2: Integrate OrbitManager into BaseCelestialRenderer

**File**: `packages/renderer/threejs-celestial/src/base/BaseCelestialRenderer.ts`

```typescript
export abstract class BaseCelestialRenderer {
  // ... existing properties ...
  public orbitManager!: OrbitManager;

  constructor(
    objectOrOptions: RenderableCelestialObject | BaseCelestialRendererOptions,
    options: BaseCelestialRendererOptions = {},
  ) {
    // ... existing constructor logic ...

    // Initialize orbit manager
    this.orbitManager = new OrbitManager(
      object.id,
      options.orbitalConfig || {},
      this.handleOrbitDataUpdate.bind(this),
    );
  }

  private handleOrbitDataUpdate(data: OrbitRenderData): void {
    // Send data to global OrbitsOrchestrator
    if (BaseCelestialRenderer.orbitsOrchestrator) {
      BaseCelestialRenderer.orbitsOrchestrator.updateObjectData(
        this.object.id,
        data,
      );
    }
  }

  update(
    object: RenderableCelestialObject,
    camera: THREE.Camera,
    allObjects: RenderableCelestialObject[],
  ): void {
    // ... existing update logic ...

    // Update orbit manager
    this.orbitManager.updateSimulationMode(this.getSimulationMode());

    // Check LOD visibility
    const cameraDistance = camera.position.distanceTo(object.position);
    const shouldShowOrbitLines =
      this.orbitManager.shouldShowOrbitLines(cameraDistance);
    const shouldShowTrailLines =
      this.orbitManager.shouldShowTrailLines(cameraDistance);
    const shouldShowPredictionLines =
      this.orbitManager.shouldShowPredictionLines(cameraDistance);

    // Update visibility in orchestrator
    if (BaseCelestialRenderer.orbitsOrchestrator) {
      BaseCelestialRenderer.orbitsOrchestrator.setObjectVisibility(
        this.object.id,
        {
          orbitLines: shouldShowOrbitLines,
          trailLines: shouldShowTrailLines,
          predictionLines: shouldShowPredictionLines,
        },
      );
    }
  }

  dispose(): void {
    // ... existing dispose logic ...
    this.orbitManager.dispose();
  }
}
```

### **Phase 3: Create OrbitsOrchestrator (Replaces OrbitsManager)**

#### Step 3.1: Create OrbitsOrchestrator

**File**: `packages/renderer/threejs-orbits/src/OrbitsOrchestrator.ts`

```typescript
export class OrbitsOrchestrator {
  private keplerianRenderer: KeplerianRenderer;
  private trailRenderer: TrailRenderer;
  private predictionRenderer: PredictionRenderer;
  private objectData: Map<string, OrbitRenderData> = new Map();
  private objectVisibility: Map<string, OrbitVisibility> = new Map();

  constructor(
    private scene: THREE.Scene,
    private labelContainer: HTMLElement,
  ) {
    this.keplerianRenderer = new KeplerianRenderer(scene);
    this.trailRenderer = new TrailRenderer(scene);
    this.predictionRenderer = new PredictionRenderer(scene, labelContainer);
  }

  updateObjectData(objectId: string, data: OrbitRenderData): void {
    this.objectData.set(objectId, data);
    this.updateObjectRendering(objectId);
  }

  setObjectVisibility(objectId: string, visibility: OrbitVisibility): void {
    this.objectVisibility.set(objectId, visibility);
    this.updateObjectRendering(objectId);
  }

  private updateObjectRendering(objectId: string): void {
    const data = this.objectData.get(objectId);
    const visibility = this.objectVisibility.get(objectId);

    if (!data || !visibility) return;

    // Update Keplerian orbits
    if (visibility.orbitLines && data.keplerianPoints) {
      this.keplerianRenderer.updateOrbit(objectId, data.keplerianPoints);
    } else {
      this.keplerianRenderer.removeOrbit(objectId);
    }

    // Update trails
    if (visibility.trailLines && data.trailPoints) {
      this.trailRenderer.updateTrail(objectId, data.trailPoints);
    } else {
      this.trailRenderer.removeTrail(objectId);
    }

    // Update predictions
    if (visibility.predictionLines && data.predictionPoints) {
      this.predictionRenderer.updatePrediction(
        objectId,
        data.predictionPoints,
        data.predictionTimestamps,
      );
    } else {
      this.predictionRenderer.removePrediction(objectId);
    }
  }

  // Global visibility controls
  setOrbitLinesVisible(visible: boolean): void {
    this.keplerianRenderer.setVisibility(visible);
  }

  setTrailLinesVisible(visible: boolean): void {
    this.trailRenderer.setVisibility(visible);
  }

  setPredictionLinesVisible(visible: boolean): void {
    this.predictionRenderer.setVisibility(visible);
  }

  // Highlighting
  setObjectHighlighted(objectId: string, highlighted: boolean): void {
    this.keplerianRenderer.setHighlighted(objectId, highlighted);
    this.trailRenderer.setHighlighted(objectId, highlighted);
    this.predictionRenderer.setHighlighted(objectId, highlighted);
  }

  dispose(): void {
    this.keplerianRenderer.dispose();
    this.trailRenderer.dispose();
    this.predictionRenderer.dispose();
  }
}
```

**Dependencies**: Individual renderers, scene management

#### Step 3.2: Create Simplified Renderers

**File**: `packages/renderer/threejs-orbits/src/renderers/KeplerianRenderer.ts`

```typescript
export class KeplerianRenderer {
  private orbits: Map<string, THREE.Line> = new Map();
  private scene: THREE.Scene;
  private visible: boolean = true;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  updateOrbit(objectId: string, points: THREE.Vector3[]): void {
    // Create or update orbit line
    let orbit = this.orbits.get(objectId);
    if (!orbit) {
      orbit = this.createOrbitLine(points);
      this.orbits.set(objectId, orbit);
      this.scene.add(orbit);
    } else {
      this.updateOrbitGeometry(orbit, points);
    }
  }

  removeOrbit(objectId: string): void {
    const orbit = this.orbits.get(objectId);
    if (orbit) {
      this.scene.remove(orbit);
      this.orbits.delete(objectId);
    }
  }

  setVisibility(visible: boolean): void {
    this.visible = visible;
    this.orbits.forEach((orbit) => {
      orbit.visible = visible;
    });
  }

  setHighlighted(objectId: string, highlighted: boolean): void {
    const orbit = this.orbits.get(objectId);
    if (orbit) {
      // Apply highlighting
    }
  }

  private createOrbitLine(points: THREE.Vector3[]): THREE.Line {
    // Create orbit line geometry and material
  }

  private updateOrbitGeometry(line: THREE.Line, points: THREE.Vector3[]): void {
    // Update line geometry
  }

  dispose(): void {
    this.orbits.forEach((orbit) => {
      this.scene.remove(orbit);
    });
    this.orbits.clear();
  }
}
```

**Dependencies**: Three.js only

### **Phase 4: Integration and Migration**

#### Step 4.1: Update ModularSpaceRenderer

**File**: `packages/renderer/threejs/src/ModularSpaceRenderer.ts`

```typescript
export class ModularSpaceRenderer {
  // ... existing properties ...
  private orbitsOrchestrator: OrbitsOrchestrator;

  constructor(container: HTMLElement) {
    // ... existing initialization ...

    // Initialize orbits orchestrator
    this.orbitsOrchestrator = new OrbitsOrchestrator(
      this.renderingOrchestrator.sceneManager.scene,
      this.interactionOrchestrator.getLayer2DManager().getContainer(),
    );

    // Connect to BaseCelestialRenderer
    BaseCelestialRenderer.setOrbitsOrchestrator(this.orbitsOrchestrator);
  }

  // Public API for orbit rendering
  get orbitsRendering(): OrbitsOrchestrator {
    return this.orbitsOrchestrator;
  }

  dispose(): void {
    // ... existing disposal ...
    this.orbitsOrchestrator.dispose();
  }
}
```

#### Step 4.2: Update Global Controls

**File**: `apps/teskooano/src/plugins/engine-panel/panels/composite-panel/CompositeEnginePanel.utils.ts`

```typescript
export function applyViewStateToRenderer(
  renderer: ModularSpaceRenderer | undefined,
  updates: Partial<CompositeEngineState>,
): void {
  if (!renderer) return;

  // ... existing updates ...

  if (updates.showOrbitLines !== undefined) {
    renderer.orbitsRendering.setOrbitLinesVisible(updates.showOrbitLines);
  }
  if (updates.showTrailLines !== undefined) {
    renderer.orbitsRendering.setTrailLinesVisible(updates.showTrailLines);
  }
  if (updates.showPredictionLines !== undefined) {
    renderer.orbitsRendering.setPredictionLinesVisible(
      updates.showPredictionLines,
    );
  }
}
```

### **Phase 5: Remove Old Components**

#### Step 5.1: Remove Old Files

**Files to Delete**:

- `packages/renderer/threejs-orbits/src/core/OrbitsManager.ts`
- `packages/renderer/threejs-orbits/src/core/modes/IdealStrategy.ts`
- `packages/renderer/threejs-orbits/src/core/modes/NBodyStrategy.ts`
- `packages/renderer/threejs-orbits/src/core/modes/IOrbitVisualizationStrategy.ts`
- `packages/renderer/threejs-orbits/src/keplerian/OrbitCalculator.ts`
- `packages/renderer/threejs-orbits/src/renderers/PredictionCalculator.ts`
- `packages/renderer/threejs-orbits/src/renderers/TrailManager.ts`
- `packages/renderer/threejs-orbits/src/renderers/PredictionManager.ts`

#### Step 5.2: Update Package Exports

**File**: `packages/renderer/threejs-orbits/src/index.ts`

```typescript
export { OrbitsOrchestrator } from "./OrbitsOrchestrator";
export { KeplerianRenderer } from "./renderers/KeplerianRenderer";
export { TrailRenderer } from "./renderers/TrailRenderer";
export { PredictionRenderer } from "./renderers/PredictionRenderer";
export { SharedMaterials } from "./SharedMaterials";

export type { OrbitRenderData, OrbitVisibility } from "./types";
```

## 🎯 Success Criteria

### **Architectural Benefits**

- **Clean Separation**: Calculations in physics package, rendering in renderer package
- **No Circular Dependencies**: One-way data flow from physics → renderer
- **Simplified Rendering**: Pure visualization components with no calculations
- **Better State Management**: Individual objects manage their own orbit data

### **Performance Benefits**

- **Centralized Rendering**: Single instances of renderers for all objects
- **Efficient Updates**: Only update what's visible and changed
- **Reduced Complexity**: Fewer layers of abstraction
- **Better Memory Management**: Simplified object lifecycle

### **Developer Experience**

- **Easier to Understand**: Clear responsibilities and data flow
- **Easier to Debug**: Separated concerns make issues easier to isolate
- **Easier to Extend**: New orbit types can be added to physics package
- **Better Testing**: Pure functions in physics package, simple renderers

## 🚨 Migration Strategy

### **Step-by-Step Approach**

1. **Phase 1**: Move calculations to physics package (no breaking changes)
2. **Phase 2**: Create OrbitManager in BaseCelestialRenderer (backward compatible)
3. **Phase 3**: Create OrbitsOrchestrator alongside existing OrbitsManager
4. **Phase 4**: Update integration points to use new orchestrator
5. **Phase 5**: Remove old components after testing

### **Testing Strategy**

- **Unit Tests**: Test physics calculations independently
- **Integration Tests**: Test data flow from physics to rendering
- **Visual Tests**: Verify orbit lines appear correctly
- **Performance Tests**: Ensure no regression in rendering performance

### **Rollback Plan**

- Keep old OrbitsManager until new system is fully tested
- Gradual migration allows easy rollback if issues arise
- Clear separation means old system can run alongside new system

This granular approach ensures we can achieve the clean architecture while minimizing risk and maintaining functionality throughout the migration.
