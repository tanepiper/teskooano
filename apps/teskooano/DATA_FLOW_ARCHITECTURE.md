# Teskooano Data Flow Architecture

## Executive Summary

The Teskooano application follows a **reactive, plugin-based architecture** with centralized state management. The system orchestrates complex interactions between physics simulation, 3D rendering, and modular UI components through a sophisticated plugin system.

## Core Architecture Patterns

### 1. Reactive State Management (RxJS-based)
The application uses a **centralized reactive state** pattern with multiple interconnected stores:

```mermaid
graph TB
    subgraph "Core State (@teskooano/core-state)"
        CS[celestialObjects$]
        SS[simulationState$]
        AS[accelerationVectors$]
        HS[celestialHierarchy$]
        SEED[currentSeed$]
    end

    subgraph "Derived State"
        RS[renderableStore.renderableObjects$]
        RSS[RendererStateAdapter.$visualSettings]
    end

    subgraph "Physics & Simulation"
        SM[SimulationManager]
        PA[PhysicsSystemAdapter]
        UPD[updateSimulation]
    end

    subgraph "Rendering Pipeline"
        MSR[ModularSpaceRenderer]
        OM[ObjectManager]
        ORM[OrbitsManager]
        LM[LightingManager]
    end

    subgraph "UI Components"
        P1[CelestialInfo Plugin]
        P2[CelestialHierarchy Plugin]
        P3[SystemControls Plugin]
        P4[EnginePanel Plugin]
    end

    %% Core State Flows
    CS --> RS
    SS --> RSS
    SS --> SM
    CS --> PA
    
    %% Physics Loop
    SM --> UPD
    UPD --> PA
    PA --> CS
    
    %% Rendering Pipeline
    RS --> OM
    RSS --> ORM
    CS --> MSR
    
    %% UI Subscriptions
    CS --> P1
    CS --> P2
    CS --> P3
    SS --> P3
    SS --> P4

    classDef stateNode fill:#e1f5fe
    classDef physicsNode fill:#f3e5f5
    classDef renderNode fill:#e8f5e8
    classDef uiNode fill:#fff3e0

    class CS,SS,AS,HS,SEED,RS,RSS stateNode
    class SM,PA,UPD physicsNode
    class MSR,OM,ORM,LM renderNode
    class P1,P2,P3,P4 uiNode
```

### 2. Plugin System Architecture
The application uses a **hierarchical plugin system** with dependency resolution:

```mermaid
graph TD
    subgraph "Plugin Manager (@teskooano/ui-plugin)"
        PM[PluginManager Singleton]
        RM[RegistrationManager]
        PR[Plugin Registries]
    end

    subgraph "Plugin Loading (Build-time)"
        VL[virtual:teskooano-loaders]
        PC[pluginConfig]
        HMR[Hot Module Replacement]
    end

    subgraph "Runtime Plugin System"
        EXEC[execute Function]
        DEPS[Dependency Resolution]
        INIT[Plugin Initialization]
    end

    subgraph "Plugin Types"
        PAN[Panels]
        FUNC[Functions]
        COMP[Components]
        TOOL[Toolbar Items]
        MGR[Manager Classes]
    end

    subgraph "Application Initialization"
        MAIN[main.ts]
        DOCK[DockviewController]
        TOOLBAR[ToolbarController]
    end

    %% Build-time connections
    VL --> PM
    PC --> PM
    HMR --> PM

    %% Runtime connections
    PM --> RM
    RM --> PR
    PM --> EXEC
    PM --> DEPS
    PM --> INIT

    %% Plugin type registration
    RM --> PAN
    RM --> FUNC
    RM --> COMP
    RM --> TOOL
    RM --> MGR

    %% Application bootstrapping
    MAIN --> PM
    PM --> DOCK
    PM --> TOOLBAR

    classDef corePlugin fill:#ffebee
    classDef buildTime fill:#e8f5e8
    classDef runtime fill:#e3f2fd
    classDef appInit fill:#fff3e0

    class PM,RM,PR corePlugin
    class VL,PC,HMR buildTime
    class EXEC,DEPS,INIT,PAN,FUNC,COMP,TOOL,MGR runtime
    class MAIN,DOCK,TOOLBAR appInit
```

## Detailed Data Flow Analysis

### 3. Simulation Loop Data Flow

```mermaid
sequenceDiagram
    participant UI as UI Components
    participant PM as PluginManager
    participant SM as SimulationManager
    participant CS as Core State
    participant PHYS as Physics Engine
    participant RSA as RendererStateAdapter
    participant RS as RenderableStore
    participant REND as Renderer

    Note over UI,REND: Application Startup & System Loading

    UI->>PM: execute("system:generate_random")
    PM->>CS: actions.createSolarSystem()
    CS->>CS: celestialObjects$ emits
    
    Note over SM: Reactive Simulation Start
    CS->>SM: celestialObjects$ subscription
    SM->>SM: startLoop() when objects exist
    
    loop Animation Frame
        SM->>CS: getSimulationState()
        SM->>CS: physicsSystemAdapter.getBodies()
        SM->>PHYS: updateSimulation(bodies, deltaTime)
        PHYS-->>SM: SimulationStepResult
        SM->>CS: physicsSystemAdapter.setBodies()
        SM->>SM: emit onOrbitUpdate$
    end

    Note over RSA,REND: Rendering Pipeline

    CS->>RSA: celestialObjects$ subscription
    CS->>RSA: simulationState$ subscription
    RSA->>RSA: transform to RenderableCelestialObject
    RSA->>RS: renderableObjects$ update
    RS->>REND: ObjectManager subscription
    REND->>REND: update 3D scene
```

### 4. Plugin Communication Patterns

```mermaid
graph LR
    subgraph "Plugin Communication Methods"
        DIRECT[Direct Plugin Execution]
        STATE[Shared State Subscriptions]
        EVENTS[DOM Events]
        CONTEXT[Plugin Execution Context]
    end

    subgraph "Communication Examples"
        EXEC1["pluginManager.execute('focus:focus_on_body')"]
        SUB1["celestialObjects$.subscribe()"]
        EVENT1["'engine-focus-request' CustomEvent"]
        CTX1["PluginExecutionContext injection"]
    end

    DIRECT --> EXEC1
    STATE --> SUB1
    EVENTS --> EVENT1
    CONTEXT --> CTX1

    classDef commMethod fill:#e1f5fe
    classDef example fill:#f3e5f5

    class DIRECT,STATE,EVENTS,CONTEXT commMethod
    class EXEC1,SUB1,EVENT1,CTX1 example
```

## Identified Issues & Recommendations

### 🚨 Code Duplication Areas

#### 1. State Subscription Patterns
**Issue**: Multiple plugins implement similar RxJS subscription patterns.

**Location**: Found in:
- `apps/teskooano/src/plugins/celestial-info/`
- `apps/teskooano/src/plugins/celestial-hierarchy/`
- `apps/teskooano/src/plugins/engine-panel/main-toolbar/system-controls/`

**Pattern**:
```typescript
// Repeated in multiple plugins
private subscriptions = new Subscription();

ngOnInit() {
  this.subscriptions.add(
    celestialObjects$.subscribe(objects => {
      // Plugin-specific logic
    })
  );
  
  this.subscriptions.add(
    simulationState$.subscribe(state => {
      // Plugin-specific logic  
    })
  );
}

ngOnDestroy() {
  this.subscriptions.unsubscribe();
}
```

**Recommendation**: Create a `BaseSubscribableComponent` or `StateSubscriptionMixin`.

#### 2. Plugin Registration Boilerplate
**Issue**: Similar plugin definition structures across plugins.

**Pattern**:
```typescript
// Repeated pattern in plugin index.ts files
const panelConfig: PanelConfig = { /* ... */ };
const toolbarRegistration: ToolbarRegistration = { /* ... */ };
const components: ComponentConfig[] = [ /* ... */ ];

export const plugin: TeskooanoPlugin = {
  id: "plugin-id",
  panels: [panelConfig],
  toolbarRegistrations: [toolbarRegistration],
  components: components,
  // ...
};
```

**Recommendation**: Create plugin factory functions or decorators.

### 🧠 Cognitive Complexity Issues

#### 1. Main Application Bootstrap (`main.ts`)
**Issue**: The `initializeApp()` function is 278 lines and handles multiple concerns.

**Complexity Factors**:
- Plugin loading and dependency resolution
- Error handling for multiple initialization steps  
- Event listener setup
- Dockview integration
- Manager initialization

**Recommendation**: Break down into smaller, focused initialization functions:
- `initializePluginSystem()`
- `initializeDockview()`
- `initializeManagers()`
- `setupEventListeners()`

#### 2. Plugin Manager (`packages/app/ui-plugin/src/pluginManager.ts`)
**Issue**: Single class handling multiple responsibilities (367 lines).

**Complexity Factors**:
- Plugin loading and registration
- Dependency resolution
- Hot Module Replacement
- Registry management
- Function execution

**Current Delegation**:
```typescript
class PluginManager {
  #registrationManager: RegistrationManager; // ✅ Good
  // But still handles too much logic directly
}
```

**Recommendation**: Further decompose into:
- `PluginLoader`
- `DependencyResolver`  
- `ExecutionContext`
- `HMRManager`

#### 3. ModularSpaceRenderer (`packages/renderer/threejs/src/ModularSpaceRenderer.ts`)
**Issue**: Large coordinator class (434 lines) managing many subsystems.

**Current Structure**: ✅ Generally well-decomposed into managers, but could benefit from:
- Extract setup logic into `RendererSetup` class
- Move event listener logic to `RendererEventManager`
- Create `RendererAPI` interface for public methods

### 🏗️ Architectural Misplacement Issues

#### 1. State Management Split
**Issue**: Application state is split between `@teskooano/core-state` and local component state.

**Examples**:
- Camera state in `packages/app/simulation/src/camera/CameraManager.ts`
- UI state in individual plugin components
- Visual settings in both `SimulationState` and `RendererStateAdapter`

**Recommendation**: Consolidate related state into dedicated state slices.

#### 2. Cross-Package Dependencies
**Issue**: Some packages have unclear dependency boundaries.

**Examples**:
```typescript
// In renderer package, importing from systems
import { calculateLightSourceMaps } from "@teskooano/renderer-threejs-lighting";

// UI logic mixed with business logic
// In plugin components importing simulation logic directly
```

**Recommendation**: Enforce cleaner package boundaries with dependency injection.

### 📊 State Flow Complexity Analysis

```mermaid
graph TD
    subgraph "State Complexity Hotspots"
        A[SimulationState: 15+ properties]
        B[CelestialObject: 20+ properties]  
        C[RenderableCelestialObject: 25+ properties]
        D[PluginExecutionContext: 6+ methods]
    end

    subgraph "Data Transformation Layers"
        T1[Raw Physics Data]
        T2[Core State Objects]
        T3[Renderable Objects]
        T4[UI Display Data]
    end

    T1 --> T2
    T2 --> T3  
    T3 --> T4

    A --> T2
    B --> T2
    C --> T3
    D --> T4

    classDef complexity fill:#ffcdd2
    classDef transform fill:#e8f5e8

    class A,B,C,D complexity
    class T1,T2,T3,T4 transform
```

## Performance Considerations

### 1. Observable Subscription Management
**Current Pattern**: Each plugin manages its own subscriptions.
**Risk**: Memory leaks if not properly cleaned up.
**Solution**: Centralized subscription management or auto-cleanup utilities.

### 2. State Update Frequency
**Current**: Multiple state streams update independently.
**Risk**: Excessive re-renders and calculations.
**Solution**: Batch state updates where possible.

### 3. Plugin Hot Reloading
**Current**: Full plugin disposal and re-registration.
**Risk**: Losing component state during development.
**Solution**: State preservation during HMR.

## Recommendations Summary

### Immediate Actions (High Impact, Low Effort)
1. **Create Base Classes**: Extract common subscription patterns
2. **Plugin Factories**: Reduce boilerplate in plugin definitions
3. **State Type Cleanup**: Consolidate similar interfaces

### Medium-term Refactoring (High Impact, Medium Effort)  
1. **Main.ts Decomposition**: Break down initialization logic
2. **Manager Boundaries**: Clearer separation of concerns
3. **State Consolidation**: Reduce state management complexity

### Long-term Architecture (High Impact, High Effort)
1. **Plugin System V2**: More declarative plugin definitions
2. **State Machine**: Replace ad-hoc state with formal state machines
3. **Micro-frontend**: Consider splitting large plugins into smaller packages

## Testing Strategy

### Current Gaps
- Limited integration tests for plugin interactions
- No tests for complex state flow scenarios
- Manual testing required for plugin loading/unloading

### Recommended Tests
1. **Plugin Integration Tests**: Test cross-plugin communication
2. **State Flow Tests**: Test complete data transformation pipelines  
3. **Performance Tests**: Measure subscription and rendering performance

---

*This document should be updated as the architecture evolves. Consider running architectural reviews quarterly to identify new complexity hotspots.*