# Phase 4: Integration and Migration

## 🎯 Goal

Integrate the new orbit architecture into the existing system, migrate from the old OrbitsManager to the new OrbitsOrchestrator, and ensure all components work together seamlessly.

## 📋 Steps

### Step 4.1: Update ModularSpaceRenderer Integration

**File**: `packages/renderer/threejs-core/src/ModularSpaceRenderer.ts`

**Purpose**: Replace OrbitsManager with OrbitsOrchestrator and use registration pattern

```typescript
// ... existing imports ...
import { OrbitsOrchestrator } from "@teskooano/renderer-threejs-orbits";

export class ModularSpaceRenderer {
  // ... existing properties ...

  // Replace old OrbitsManager with new OrbitsOrchestrator
  private orbitsOrchestrator: OrbitsOrchestrator;

  constructor(options: ModularSpaceRendererOptions) {
    // ... existing initialization ...

    // Initialize the new orchestrator
    this.orbitsOrchestrator = new OrbitsOrchestrator(
      this.scene,
      this.labelContainer,
    );
  }

  /**
   * Get the orbits orchestrator for external access
   */
  getOrbitsOrchestrator(): OrbitsOrchestrator {
    return this.orbitsOrchestrator;
  }

  /**
   * Update method - now includes orchestrator updates
   */
  update(context: RenderingContext): void {
    // ... existing update logic ...

    // Update the orchestrator (which updates all orbit managers)
    this.orbitsOrchestrator.update(context);
  }

  /**
   * Global orbit visibility controls
   */
  setOrbitLinesVisible(visible: boolean): void {
    this.orbitsOrchestrator.setOrbitLinesVisible(visible);
  }

  setTrailLinesVisible(visible: boolean): void {
    this.orbitsOrchestrator.setTrailLinesVisible(visible);
  }

  setPredictionLinesVisible(visible: boolean): void {
    this.orbitsOrchestrator.setPredictionLinesVisible(visible);
  }

  /**
   * Highlight a specific object's orbits
   */
  setOrbitHighlighted(objectId: string, highlighted: boolean): void {
    this.orbitsOrchestrator.setObjectHighlighted(objectId, highlighted);
  }

  /**
   * Get orbit performance statistics
   */
  getOrbitPerformanceStats(): {
    orbitLinesCount: number;
    trailLinesCount: number;
    predictionLinesCount: number;
    registeredObjectsCount: number;
  } {
    return this.orbitsOrchestrator.getPerformanceStats();
  }

  /**
   * Get all registered object IDs
   */
  getRegisteredOrbitObjectIds(): string[] {
    return this.orbitsOrchestrator.getRegisteredObjectIds();
  }

  /**
   * Clear all orbit data
   */
  clearAllOrbits(): void {
    this.orbitsOrchestrator.clearAllOrbits();
  }

  // ... existing methods ...

  /**
   * Cleanup resources
   */
  dispose(): void {
    // ... existing cleanup ...

    // Cleanup the orchestrator
    this.orbitsOrchestrator.dispose();
  }
}
```

**Dependencies**: OrbitsOrchestrator, RenderingContext

### Step 4.2: Update BaseCelestialRenderer Integration

**File**: `packages/renderer/threejs-celestial/src/base/BaseCelestialRenderer.ts`

**Purpose**: Integrate with orbit system using registration pattern instead of dependency injection

```typescript
// ... existing imports ...
import {
  OrbitRenderData,
  OrbitVisibility,
} from "@teskooano/renderer-threejs-celestial";

export abstract class BaseCelestialRenderer {
  // ... existing properties ...

  // Remove orbit manager dependency - let orchestrator manage it
  // protected orbitManager: OrbitManager;

  constructor(
    object: RenderableCelestialObject,
    renderScale: number,
    // Remove orbitsOrchestrator parameter - no dependency injection
  ) {
    // ... existing initialization ...
    // No orbit manager initialization here
    // The orchestrator will manage orbit managers for all celestials
  }

  /**
   * Get the current simulation type
   */
  protected getSimulationMode(): SimulationMode {
    // This should be determined from the global state
    // For now, return a default
    return "KEPLERIAN";
  }

  /**
   * Update method override to include orbit data provision
   */
  update(context: RenderingContext): void {
    // ... existing update logic ...
    // No orbit manager update here
    // The orchestrator will read data from this celestial when needed
  }

  /**
   * Get current orbit data for this celestial
   * This is what the orchestrator will call to get data
   */
  getOrbitData(): OrbitRenderData | null {
    // Each celestial implementation should override this
    // to provide its specific orbit data
    return null;
  }

  /**
   * Get orbit visibility settings for this celestial
   * This is what the orchestrator will call to get visibility
   */
  getOrbitVisibility(): OrbitVisibility {
    // Each celestial implementation should override this
    // to provide its specific visibility settings
    return {
      orbitLines: true,
      trailLines: true,
      predictionLines: true,
    };
  }

  /**
   * Get the unique identifier for this celestial
   * Used by the orchestrator to track this celestial
   */
  getObjectId(): string {
    return this.object.id;
  }

  /**
   * Set orbit visibility for this object
   * This can be called by the orchestrator or external systems
   */
  setOrbitVisibility(visibility: OrbitVisibility): void {
    // Store visibility settings that will be returned by getOrbitVisibility()
    // Implementation depends on how you want to store this
    this._orbitVisibility = visibility;
  }

  // ... existing methods ...

  /**
   * Cleanup resources
   */
  dispose(): void {
    // ... existing cleanup ...
    // No orbit manager cleanup needed
    // The orchestrator will handle cleanup when this celestial is removed
  }
}
```

**Alternative Approach**: If you want even less coupling, the celestial could just expose its data and let the orchestrator read it:

```typescript
export abstract class BaseCelestialRenderer {
  // ... existing properties ...

  // Public data properties that the orchestrator can read
  public orbitData: OrbitRenderData | null = null;
  public orbitVisibility: OrbitVisibility = {
    orbitLines: true,
    trailLines: true,
    predictionLines: true,
  };

  constructor(object: RenderableCelestialObject, renderScale: number) {
    // ... existing initialization ...
  }

  /**
   * Update method - just update the public data
   */
  update(context: RenderingContext): void {
    // ... existing update logic ...

    // Update the public orbit data
    this.updateOrbitData();
  }

  /**
   * Update orbit data based on current state
   */
  protected updateOrbitData(): void {
    // Each celestial implementation should override this
    // to update this.orbitData based on its current state
  }

  /**
   * Set orbit visibility
   */
  setOrbitVisibility(visibility: OrbitVisibility): void {
    this.orbitVisibility = visibility;
  }

  // ... rest of the class ...
}
```

**Dependencies**: None - the celestial just provides data, the orchestrator manages everything

### Step 4.3: Update MeshFactory Integration

**File**: `packages/renderer/threejs-celestial/src/MeshFactory.ts`

**Purpose**: Remove orchestrator dependency and let celestials register themselves

```typescript
// ... existing imports ...
// Remove OrbitsOrchestrator import - no dependency injection

export class MeshFactory {
  // ... existing properties ...

  // Remove orbitsOrchestrator property - no dependency injection

  constructor(
    renderScale: number,
    // Remove orbitsOrchestrator parameter
  ) {
    this.renderScale = renderScale;
    // Remove this.orbitsOrchestrator = orbitsOrchestrator;
  }

  /**
   * Create a planet mesh
   * Celestial will register itself with orchestrator later
   */
  createPlanetMesh(object: RenderableCelestialObject): BaseTerrestrialRenderer {
    const renderer = new BaseTerrestrialRenderer(
      object,
      this.renderScale,
      // Remove this.orbitsOrchestrator parameter
    );

    // ... existing initialization logic ...

    return renderer;
  }

  /**
   * Create a gas giant mesh
   * Celestial will register itself with orchestrator later
   */
  createGasGiantMesh(object: RenderableCelestialObject): BaseGasGiantRenderer {
    const renderer = new BaseGasGiantRenderer(
      object,
      this.renderScale,
      // Remove this.orbitsOrchestrator parameter
    );

    // ... existing initialization logic ...

    return renderer;
  }

  /**
   * Create a star mesh
   * Celestial will register itself with orchestrator later
   */
  createStarMesh(object: RenderableCelestialObject): BaseStarRenderer {
    const renderer = createStarRenderer(
      object,
      this.renderScale,
      // Remove this.orbitsOrchestrator parameter
    );

    // ... existing initialization logic ...

    return renderer;
  }

  // ... other mesh creation methods with similar updates ...
}
```

**Dependencies**: None - celestials will register themselves with orchestrator

### Step 4.4: Update ObjectManager Integration

**File**: `packages/renderer/threejs-objects/src/ObjectManager.ts`

**Purpose**: Manage orchestrator and handle celestial registration

```typescript
// ... existing imports ...
import { OrbitsOrchestrator } from "@teskooano/renderer-threejs-orbits";
import { SimulationMode } from "@teskooano/core-physics";

export class ObjectManager {
  // ... existing properties ...

  private orbitsOrchestrator: OrbitsOrchestrator;
  private meshFactory: MeshFactory;
  private registeredCelestials: Map<string, BaseCelestialRenderer> = new Map();

  constructor(
    scene: THREE.Scene,
    labelContainer: HTMLElement,
    renderScale: number,
  ) {
    // ... existing initialization ...

    // Create orchestrator first
    this.orbitsOrchestrator = new OrbitsOrchestrator(scene, labelContainer);

    // Create mesh factory without orchestrator dependency
    this.meshFactory = new MeshFactory(renderScale);
  }

  /**
   * Get the orbits orchestrator
   */
  getOrbitsOrchestrator(): OrbitsOrchestrator {
    return this.orbitsOrchestrator;
  }

  /**
   * Create and register a celestial object
   */
  createCelestial(object: RenderableCelestialObject): BaseCelestialRenderer {
    // Create the celestial renderer
    const celestial = this.createCelestialRenderer(object);

    // Set the orchestrator reference
    celestial.setOrchestrator(this.orbitsOrchestrator);

    // Register with orchestrator
    this.registerCelestialWithOrchestrator(celestial, object);

    // Store reference
    this.registeredCelestials.set(object.id, celestial);

    return celestial;
  }

  /**
   * Create the appropriate celestial renderer
   */
  private createCelestialRenderer(
    object: RenderableCelestialObject,
  ): BaseCelestialRenderer {
    switch (object.type) {
      case "PLANET":
        return this.meshFactory.createPlanetMesh(object);
      case "GAS_GIANT":
        return this.meshFactory.createGasGiantMesh(object);
      case "STAR":
        return this.meshFactory.createStarMesh(object);
      default:
        throw new Error(`Unknown celestial type: ${object.type}`);
    }
  }

  /**
   * Register a celestial with the orchestrator
   */
  private registerCelestialWithOrchestrator(
    celestial: BaseCelestialRenderer,
    object: RenderableCelestialObject,
  ): void {
    // Get simulation type from global state or celestial
    const simulationMode = this.getSimulationMode();

    // Register with orchestrator
    this.orbitsOrchestrator.registerCelestial(object, simulationMode);
  }

  /**
   * Get current simulation type
   */
  private getSimulationMode(): SimulationMode {
    // This should come from global state
    // For now, return default
    return SimulationMode.IDEAL;
  }

  /**
   * Remove a celestial object
   */
  removeCelestial(objectId: string): void {
    const celestial = this.registeredCelestials.get(objectId);
    if (celestial) {
      // Unregister from orchestrator
      this.orbitsOrchestrator.unregisterCelestial(objectId);

      // Dispose celestial
      celestial.dispose();

      // Remove from tracking
      this.registeredCelestials.delete(objectId);
    }
  }

  /**
   * Update all celestials and orbit rendering
   */
  update(context: RenderingContext): void {
    // Update all celestials
    this.registeredCelestials.forEach((celestial) => {
      celestial.update(context);
    });

    // Update orchestrator (which updates all orbit managers)
    this.orbitsOrchestrator.update(context);
  }

  /**
   * Global orbit visibility controls
   */
  setOrbitLinesVisible(visible: boolean): void {
    this.orbitsOrchestrator.setOrbitLinesVisible(visible);
  }

  setTrailLinesVisible(visible: boolean): void {
    this.orbitsOrchestrator.setTrailLinesVisible(visible);
  }

  setPredictionLinesVisible(visible: boolean): void {
    this.orbitsOrchestrator.setPredictionLinesVisible(visible);
  }

  /**
   * Highlight object orbits
   */
  setOrbitHighlighted(objectId: string, highlighted: boolean): void {
    this.orbitsOrchestrator.setObjectHighlighted(objectId, highlighted);
  }

  /**
   * Get orbit performance statistics
   */
  getOrbitPerformanceStats(): {
    orbitLinesCount: number;
    trailLinesCount: number;
    predictionLinesCount: number;
    registeredObjectsCount: number;
  } {
    return this.orbitsOrchestrator.getPerformanceStats();
  }

  /**
   * Clear all orbit data
   */
  clearAllOrbits(): void {
    this.orbitsOrchestrator.clearAllOrbits();
  }

  // ... existing methods ...

  /**
   * Cleanup resources
   */
  dispose(): void {
    // Dispose all celestials
    this.registeredCelestials.forEach((celestial) => {
      celestial.dispose();
    });
    this.registeredCelestials.clear();

    // Cleanup orchestrator
    this.orbitsOrchestrator.dispose();
  }
}
```

**Dependencies**: OrbitsOrchestrator, MeshFactory (without orchestrator dependency)

### Step 4.5: Update State Integration

**File**: `packages/core/state/src/actions/orbit-actions.ts`

**Purpose**: Create actions for managing orbit state

```typescript
import { createAction } from "@reduxjs/toolkit";
import {
  OrbitRenderData,
  OrbitVisibility,
} from "@teskooano/renderer-threejs-celestial";

/**
 * Update orbit data for an object
 */
export const updateOrbitData = createAction<{
  objectId: string;
  data: OrbitRenderData;
}>("orbits/updateData");

/**
 * Set orbit visibility for an object
 */
export const setOrbitVisibility = createAction<{
  objectId: string;
  visibility: OrbitVisibility;
}>("orbits/setVisibility");

/**
 * Remove orbit data for an object
 */
export const removeOrbitData = createAction<string>("orbits/removeData");

/**
 * Set global orbit lines visibility
 */
export const setOrbitLinesVisible = createAction<boolean>(
  "orbits/setLinesVisible",
);

/**
 * Set global trail lines visibility
 */
export const setTrailLinesVisible = createAction<boolean>(
  "orbits/setTrailsVisible",
);

/**
 * Set global prediction lines visibility
 */
export const setPredictionLinesVisible = createAction<boolean>(
  "orbits/setPredictionsVisible",
);

/**
 * Set orbit highlighting for an object
 */
export const setOrbitHighlighted = createAction<{
  objectId: string;
  highlighted: boolean;
}>("orbits/setHighlighted");

/**
 * Clear all orbit data
 */
export const clearAllOrbits = createAction("orbits/clearAll");
```

**File**: `packages/core/state/src/reducers/orbit-reducer.ts`

**Purpose**: Create reducer for orbit state management

```typescript
import { createReducer } from "@reduxjs/toolkit";
import {
  OrbitRenderData,
  OrbitVisibility,
} from "@teskooano/renderer-threejs-celestial";
import {
  updateOrbitData,
  setOrbitVisibility,
  removeOrbitData,
  setOrbitLinesVisible,
  setTrailLinesVisible,
  setPredictionLinesVisible,
  setOrbitHighlighted,
  clearAllOrbits,
} from "../actions/orbit-actions";

interface OrbitState {
  objectData: Map<string, OrbitRenderData>;
  objectVisibility: Map<string, OrbitVisibility>;
  globalVisibility: {
    orbitLines: boolean;
    trailLines: boolean;
    predictionLines: boolean;
  };
  highlightedObjectId: string | null;
}

const initialState: OrbitState = {
  objectData: new Map(),
  objectVisibility: new Map(),
  globalVisibility: {
    orbitLines: true,
    trailLines: true,
    predictionLines: true,
  },
  highlightedObjectId: null,
};

export const orbitReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(updateOrbitData, (state, action) => {
      const { objectId, data } = action.payload;
      state.objectData.set(objectId, data);
    })
    .addCase(setOrbitVisibility, (state, action) => {
      const { objectId, visibility } = action.payload;
      state.objectVisibility.set(objectId, visibility);
    })
    .addCase(removeOrbitData, (state, action) => {
      const objectId = action.payload;
      state.objectData.delete(objectId);
      state.objectVisibility.delete(objectId);
    })
    .addCase(setOrbitLinesVisible, (state, action) => {
      state.globalVisibility.orbitLines = action.payload;
    })
    .addCase(setTrailLinesVisible, (state, action) => {
      state.globalVisibility.trailLines = action.payload;
    })
    .addCase(setPredictionLinesVisible, (state, action) => {
      state.globalVisibility.predictionLines = action.payload;
    })
    .addCase(setOrbitHighlighted, (state, action) => {
      const { objectId, highlighted } = action.payload;
      state.highlightedObjectId = highlighted ? objectId : null;
    })
    .addCase(clearAllOrbits, (state) => {
      state.objectData.clear();
      state.objectVisibility.clear();
      state.highlightedObjectId = null;
    });
});
```

**Dependencies**: Redux toolkit, orbit action types

### Step 4.6: Update UI Integration

**File**: `packages/app/teskooano/src/plugins/engine-settings/view/engine-settings.component.ts`

**Purpose**: Add orbit controls to the engine settings UI

```typescript
// ... existing imports ...
import {
  setOrbitLinesVisible,
  setTrailLinesVisible,
  setPredictionLinesVisible,
} from "@teskooano/core-state";

export class EngineSettingsComponent extends HTMLElement {
  // ... existing properties ...

  private orbitLinesToggle: HTMLInputElement;
  private trailLinesToggle: HTMLInputElement;
  private predictionLinesToggle: HTMLInputElement;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.innerHTML = EngineSettingsTemplate;

    // ... existing initialization ...

    // Initialize orbit controls
    this.initializeOrbitControls();
  }

  /**
   * Initialize orbit visibility controls
   */
  private initializeOrbitControls(): void {
    this.orbitLinesToggle = this.shadowRoot!.querySelector(
      "#orbit-lines-toggle",
    ) as HTMLInputElement;
    this.trailLinesToggle = this.shadowRoot!.querySelector(
      "#trail-lines-toggle",
    ) as HTMLInputElement;
    this.predictionLinesToggle = this.shadowRoot!.querySelector(
      "#prediction-lines-toggle",
    ) as HTMLInputElement;

    // Set initial states from global state
    this.updateOrbitToggleStates();

    // Add event listeners
    this.orbitLinesToggle.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      this.context.store.dispatch(setOrbitLinesVisible(target.checked));
    });

    this.trailLinesToggle.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      this.context.store.dispatch(setTrailLinesVisible(target.checked));
    });

    this.predictionLinesToggle.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      this.context.store.dispatch(setPredictionLinesVisible(target.checked));
    });
  }

  /**
   * Update toggle states from global state
   */
  private updateOrbitToggleStates(): void {
    const orbitState = this.context.store.getState().orbits;

    this.orbitLinesToggle.checked = orbitState.globalVisibility.orbitLines;
    this.trailLinesToggle.checked = orbitState.globalVisibility.trailLines;
    this.predictionLinesToggle.checked =
      orbitState.globalVisibility.predictionLines;
  }

  // ... existing methods ...
}
```

**File**: `packages/app/teskooano/src/plugins/engine-settings/view/engine-settings.template.ts`

**Purpose**: Add orbit control UI elements to the template

```typescript
export const EngineSettingsTemplate = `
  <style>
    /* ... existing styles ... */
    
    .orbit-controls {
      margin-top: 1rem;
      padding: 1rem;
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
    }
    
    .orbit-controls h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 600;
    }
    
    .orbit-toggle {
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    
    .orbit-toggle input[type="checkbox"] {
      margin-right: 0.5rem;
    }
    
    .orbit-toggle label {
      font-size: 0.9rem;
    }
  </style>
  
  <div class="engine-settings">
    <!-- ... existing content ... -->
    
    <div class="orbit-controls">
      <h3>Orbit Visualization</h3>
      
      <div class="orbit-toggle">
        <input type="checkbox" id="orbit-lines-toggle" checked>
        <label for="orbit-lines-toggle">Show Orbit Lines</label>
      </div>
      
      <div class="orbit-toggle">
        <input type="checkbox" id="trail-lines-toggle" checked>
        <label for="trail-lines-toggle">Show Trail Lines</label>
      </div>
      
      <div class="orbit-toggle">
        <input type="checkbox" id="prediction-lines-toggle" checked>
        <label for="prediction-lines-toggle">Show Prediction Lines</label>
      </div>
    </div>
  </div>
`;
```

**Dependencies**: Redux store, orbit actions

### Step 4.7: Create Migration Script

**File**: `packages/renderer/threejs-orbits/src/migration/OrbitsMigration.ts`

**Purpose**: Provide utilities for migrating from old OrbitsManager to new OrbitsOrchestrator

```typescript
import { OrbitsManager } from "../core/OrbitsManager";
import { OrbitsOrchestrator } from "../OrbitsOrchestrator";
import {
  OrbitRenderData,
  OrbitVisibility,
} from "@teskooano/renderer-threejs-celestial";

/**
 * Migration utility for transitioning from OrbitsManager to OrbitsOrchestrator
 */
export class OrbitsMigration {
  /**
   * Migrate data from old OrbitsManager to new OrbitsOrchestrator
   */
  static migrateFromOrbitsManager(
    oldManager: OrbitsManager,
    newOrchestrator: OrbitsOrchestrator,
  ): void {
    // Extract data from old manager
    const oldData = this.extractDataFromOldManager(oldManager);

    // Migrate to new orchestrator
    this.migrateDataToNewOrchestrator(oldData, newOrchestrator);
  }

  /**
   * Extract data from the old OrbitsManager
   */
  private static extractDataFromOldManager(oldManager: OrbitsManager): {
    objectData: Map<string, OrbitRenderData>;
    objectVisibility: Map<string, OrbitVisibility>;
    globalVisibility: {
      orbitLines: boolean;
      trailLines: boolean;
      predictionLines: boolean;
    };
  } {
    // This would need to be implemented based on the actual OrbitsManager structure
    // For now, return empty data
    return {
      objectData: new Map(),
      objectVisibility: new Map(),
      globalVisibility: {
        orbitLines: true,
        trailLines: true,
        predictionLines: true,
      },
    };
  }

  /**
   * Migrate data to the new OrbitsOrchestrator
   */
  private static migrateDataToNewOrchestrator(
    data: {
      objectData: Map<string, OrbitRenderData>;
      objectVisibility: Map<string, OrbitVisibility>;
      globalVisibility: {
        orbitLines: boolean;
        trailLines: boolean;
        predictionLines: boolean;
      };
    },
    orchestrator: OrbitsOrchestrator,
  ): void {
    // Set global visibility
    orchestrator.setOrbitLinesVisible(data.globalVisibility.orbitLines);
    orchestrator.setTrailLinesVisible(data.globalVisibility.trailLines);
    orchestrator.setPredictionLinesVisible(
      data.globalVisibility.predictionLines,
    );

    // Migrate object data
    data.objectData.forEach((orbitData, objectId) => {
      orchestrator.updateObjectData(objectId, orbitData);
    });

    // Migrate object visibility
    data.objectVisibility.forEach((visibility, objectId) => {
      orchestrator.setObjectVisibility(objectId, visibility);
    });
  }

  /**
   * Validate migration was successful
   */
  static validateMigration(
    oldManager: OrbitsManager,
    newOrchestrator: OrbitsOrchestrator,
  ): boolean {
    // Compare performance stats
    const oldStats = oldManager.getPerformanceStats?.() || {
      orbitLinesCount: 0,
    };
    const newStats = newOrchestrator.getPerformanceStats();

    // Basic validation - should have same number of orbit lines
    return oldStats.orbitLinesCount === newStats.orbitLinesCount;
  }
}
```

**Dependencies**: Old OrbitsManager, new OrbitsOrchestrator

## 🧪 Testing

### Integration Tests

**File**: `packages/renderer/threejs-orbits/src/__tests__/integration.test.ts`

```typescript
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs-core";
import { OrbitsOrchestrator } from "../OrbitsOrchestrator";
import {
  OrbitRenderData,
  OrbitVisibility,
} from "@teskooano/renderer-threejs-celestial";
import * as THREE from "three";

describe("Orbit Integration", () => {
  let renderer: ModularSpaceRenderer;
  let orchestrator: OrbitsOrchestrator;

  beforeEach(() => {
    const container = document.createElement("div");
    renderer = new ModularSpaceRenderer({
      container,
      renderScale: 1,
    });
    orchestrator = renderer.getOrbitsOrchestrator();
  });

  it("should integrate with ModularSpaceRenderer", () => {
    expect(orchestrator).toBeDefined();
    expect(typeof orchestrator.updateObjectData).toBe("function");
    expect(typeof orchestrator.setObjectVisibility).toBe("function");
  });

  it("should handle orbit data updates", () => {
    const objectId = "test-object";
    const data: OrbitRenderData = {
      keplerianPoints: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0)],
    };

    renderer.updateOrbitData(objectId, data);

    const stats = renderer.getOrbitPerformanceStats();
    expect(stats.orbitLinesCount).toBe(1);
  });

  it("should handle visibility changes", () => {
    const objectId = "test-object";
    const visibility: OrbitVisibility = {
      orbitLines: true,
      trailLines: false,
      predictionLines: false,
    };

    renderer.setOrbitVisibility(objectId, visibility);

    // Should not throw errors
    expect(() =>
      renderer.setOrbitVisibility(objectId, visibility),
    ).not.toThrow();
  });

  it("should handle global visibility controls", () => {
    expect(() => {
      renderer.setOrbitLinesVisible(false);
      renderer.setTrailLinesVisible(false);
      renderer.setPredictionLinesVisible(false);
    }).not.toThrow();
  });
});
```

## ✅ Success Criteria

- [ ] ModularSpaceRenderer successfully integrated with OrbitsOrchestrator
- [ ] BaseCelestialRenderer successfully integrated with OrbitManager
- [ ] MeshFactory updated to pass OrbitsOrchestrator to renderers
- [ ] ObjectManager updated to use new orbit architecture
- [ ] State management actions and reducers created
- [ ] UI controls added to engine settings
- [ ] Migration utilities created
- [ ] Integration tests passing
- [ ] No breaking changes to existing functionality
- [ ] Performance maintained or improved

## 🔄 Next Steps

After completing Phase 4:

1. Test the complete integration
2. Verify all orbit features work correctly
3. Monitor performance and optimize if needed
4. Proceed to Phase 5: Cleanup and Optimization

## 🏗️ Improved Architecture Summary

### Chain of Least Responsibility

The refactored architecture follows the **chain of least responsibility** principle:

```
ModularSpaceRenderer
    ↓ (owns)
OrbitsOrchestrator
    ↓ (coordinates)
ObjectManager
    ↓ (creates & manages)
BaseCelestialRenderer
    ↓ (owns)
OrbitManager
    ↓ (sends data to)
OrbitsOrchestrator (for rendering)
```

### Key Improvements

1. **No Static References**: Removed static orchestrator reference from BaseCelestialRenderer
2. **Proper Dependency Injection**: Orchestrator is passed through the chain of responsibility
3. **Instance-Based Management**: Each celestial manages its own OrbitManager instance
4. **Clean Separation**: Each component has a single, clear responsibility
5. **No Global State**: All dependencies are properly injected

### Data Flow

1. **ObjectManager** creates celestials and passes orchestrator reference
2. **BaseCelestialRenderer** creates its own OrbitManager and receives orchestrator
3. **OrbitManager** manages data and sends updates to orchestrator
4. **OrbitsOrchestrator** coordinates rendering through specialized renderers
5. **Renderers** handle only visualization (no calculations)

### Benefits

- **No Static Dependencies**: Clean instance-based architecture
- **Proper Encapsulation**: Each component manages its own dependencies
- **Easier Testing**: Components can be tested in isolation
- **Better Performance**: No global state lookups
- **Maintainable**: Clear separation of concerns and responsibilities

## 🎯 SimulationMode Integration Flow

### Correct Type Usage

```typescript
// Phase 1: Physics Package
import { SimulationMode } from "@teskooano/data-types";

// Phase 2: OrbitManager
private simulationMode: SimulationMode = SimulationMode.IDEAL;
updateSimulationMode(mode: SimulationMode): void

// Phase 3: OrbitsOrchestrator
registerCelestial(object, simulationMode: SimulationMode): void

// Phase 4: Integration
private getSimulationMode(): SimulationMode {
  return SimulationMode.IDEAL; // or from global state
}
```

### Mode-Specific Behavior

| SimulationMode          | Keplerian Points | Trail Points | Prediction Points |
| ----------------------- | ---------------- | ------------ | ----------------- |
| `SimulationMode.IDEAL`  | ✅ Rendered      | ❌ Not used  | ✅ Optional       |
| `SimulationMode.N_BODY` | ✅ Rendered      | ✅ Rendered  | ✅ Optional       |

### Data Flow with SimulationMode

```
ObjectManager.getSimulationMode()
    ↓ (SimulationMode)
OrbitsOrchestrator.registerCelestial(object, simulationMode)
    ↓ (SimulationMode)
OrbitManager.updateSimulationMode(simulationMode)
    ↓ (Mode-specific behavior)
- IDEAL: Only calculated properties (Keplerian orbit points)
- N_BODY: Calculated properties + position history (trails)
```

### Key Integration Points

1. **Creation**: `ObjectManager` creates celestials and passes orchestrator reference
2. **Registration**: `OrbitsOrchestrator` receives registration but doesn't create managers
3. **Data Management**: `OrbitManager` manages data and sends updates to orchestrator
4. **Rendering**: `OrbitsOrchestrator` coordinates rendering based on received data

This ensures type safety, proper dependency injection, and mode-specific behavior throughout the entire orbit rendering system!
