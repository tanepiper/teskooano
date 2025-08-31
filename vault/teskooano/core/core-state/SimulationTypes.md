---
aliases: [SimulationTypes, simulation-types, state-types, configuration-types]
tags: [core, state, types, interfaces, configuration, state-management]
type: Module
package: "@teskooano/core-state"
name: SimulationTypes
dependencies: ["@teskooano/core-math", "@teskooano/data-types"]
classes: []
functions: []
constants: []
types:
  [
    "SimulationState",
    "SimulationConfiguration",
    "CameraState",
    "VisualSettingsState",
    "ClearStateOptions",
    "CelestialRegistry",
  ]
status: active
---

# SimulationTypes

TypeScript type definitions for simulation state management, configuration, and camera control with comprehensive type safety and documentation.

**Location**: `src/types/types.ts`

## 🎯 Purpose

The `SimulationTypes` provides comprehensive type definitions:

- **State Interfaces**: Complete simulation state structure
- **Configuration Types**: Physics engine configuration types
- **Camera Types**: Camera position and control types
- **Visual Settings**: Rendering and display configuration
- **Utility Types**: Helper types for state management
- **Type Safety**: Full TypeScript type safety

## 🏗️ Architecture

### **Type Organization**

- **State Types**: Core simulation state interfaces
- **Configuration Types**: Physics and rendering configuration
- **Camera Types**: Camera position and control
- **Utility Types**: Helper and convenience types
- **Type Safety**: Comprehensive type validation

### **Type Design Strategy**

1. **Comprehensive Coverage**: All simulation aspects covered
2. **Type Safety**: Full TypeScript type safety
3. **Documentation**: Extensive JSDoc documentation
4. **Extensibility**: Designed for future expansion

## 🔧 Core Components

### **SimulationState Interface**

```typescript
interface SimulationState {
  time: number; // Current simulation time in seconds
  timeScale: number; // Time scale factor (1 = real-time)
  startDate: Date; // Simulation start date
  paused: boolean; // Pause state
  selectedObject: string | null; // Currently selected object ID
  focusedObjectId: string | null; // Camera-focused object ID
  camera: CameraState; // Camera position, target, FOV
  simulationConfig: SimulationConfiguration;
  visualSettings: VisualSettingsState;
  performanceProfile: DeviceTier;
  renderer?: {
    // Optional renderer statistics
    fps?: number;
    drawCalls?: number;
    triangles?: number;
    memory?: { usedJSHeapSize?: number };
  };
}
```

**Purpose**: Complete simulation state representation

**Features**:

- **Time Management**: Simulation time and scale
- **Object Selection**: Selected and focused objects
- **Camera State**: Complete camera configuration
- **Configuration**: Physics and visual settings
- **Performance**: Device-specific performance settings
- **Statistics**: Optional renderer performance data

### **SimulationConfiguration Interface**

```typescript
interface SimulationConfiguration {
  mode: SimulationMode; // "ideal" or "nbody"
  integrator?: string; // Required for n-body mode
  algorithm?: string; // Required for n-body mode
}
```

**Purpose**: Physics engine configuration

**Features**:

- **Mode Selection**: Ideal orrery vs N-body physics
- **Algorithm Configuration**: Spatial algorithm selection
- **Integrator Configuration**: Numerical integrator selection
- **Optional Fields**: Mode-dependent required fields

### **CameraState Interface**

```typescript
interface CameraState {
  position: OSVector3; // Camera position in 3D space
  target: OSVector3; // Point camera is looking at
  fov: number; // Field of view in degrees
}
```

**Purpose**: Camera position and control

**Features**:

- **Position Control**: 3D camera position
- **Target Control**: Camera look target
- **Field of View**: Camera FOV in degrees
- **Vector Support**: Uses OSVector3 for positions

### **VisualSettingsState Interface**

```typescript
interface VisualSettingsState {
  showAllOrbits: boolean; // Show orbit paths
  showAllLabels: boolean; // Show object labels
  showAuMarkers: boolean; // Show AU markers
  trailLengthMultiplier: number; // Trail length multiplier
  predictionSteps: number; // Prediction line points
  predictionDuration: number; // Prediction duration in years
}
```

**Purpose**: Visual rendering configuration

**Features**:

- **Orbit Display**: Control orbit path visibility
- **Label Display**: Control object label visibility
- **Marker Display**: Control AU marker visibility
- **Trail Configuration**: Trail length and appearance
- **Prediction Settings**: Trajectory prediction configuration

### **ClearStateOptions Interface**

```typescript
interface ClearStateOptions {
  resetCamera?: boolean; // Reset camera to default
  resetTime?: boolean; // Reset time to zero
  resetSelection?: boolean; // Clear object selection
}
```

**Purpose**: State clearing configuration

**Features**:

- **Selective Reset**: Choose what to reset
- **Camera Reset**: Reset camera to default position
- **Time Reset**: Reset simulation time
- **Selection Reset**: Clear object selection

### **CelestialRegistry Type**

```typescript
type CelestialRegistry = Record<string, CelestialObject>;
```

**Purpose**: Celestial object storage type

**Features**:

- **Object Mapping**: Maps IDs to celestial objects
- **Type Safety**: Full TypeScript type safety
- **Consistent Structure**: Standardized object storage
- **Extensibility**: Easy to extend and modify

## 🎮 Usage Examples

### **State Management**

```typescript
import type { SimulationState } from "@teskooano/core-state";

// Create simulation state
const state: SimulationState = {
  time: 0,
  timeScale: 1,
  startDate: new Date(),
  paused: false,
  selectedObject: null,
  focusedObjectId: null,
  camera: {
    position: new OSVector3(0, 100, 100),
    target: new OSVector3(0, 0, 0),
    fov: 75,
  },
  simulationConfig: {
    mode: SimulationMode.NBODY,
    algorithm: AlgorithmType.TREE_PM,
    integrator: IntegratorType.PEFRL,
  },
  visualSettings: {
    showAllOrbits: true,
    showAllLabels: false,
    showAuMarkers: true,
    trailLengthMultiplier: 2,
    predictionSteps: 500,
    predictionDuration: 2,
  },
  performanceProfile: "medium",
};
```

### **Configuration Management**

```typescript
import type { SimulationConfiguration } from "@teskooano/core-state";

// Ideal orrery configuration
const idealConfig: SimulationConfiguration = {
  mode: SimulationMode.IDEAL,
};

// N-body configuration
const nbodyConfig: SimulationConfiguration = {
  mode: SimulationMode.NBODY,
  algorithm: AlgorithmType.BARNES_HUT,
  integrator: IntegratorType.PEFRL,
};
```

### **Camera Control**

```typescript
import type { CameraState } from "@teskooano/core-state";
import { OSVector3 } from "@teskooano/core-math";

// Create camera state
const camera: CameraState = {
  position: new OSVector3(0, 1000, 1000),
  target: new OSVector3(0, 0, 0),
  fov: 60,
};
```

### **Visual Settings**

```typescript
import type { VisualSettingsState } from "@teskooano/core-state";

// Configure visual settings
const visualSettings: VisualSettingsState = {
  showAllOrbits: true,
  showAllLabels: true,
  showAuMarkers: false,
  trailLengthMultiplier: 3,
  predictionSteps: 1000,
  predictionDuration: 5,
};
```

### **State Clearing**

```typescript
import type { ClearStateOptions } from "@teskooano/core-state";

// Clear specific state components
const clearOptions: ClearStateOptions = {
  resetCamera: true,
  resetTime: true,
  resetSelection: false,
};
```

## 🔄 Integration Points

### **SimulationStateService Integration**

- **State Structure**: Provides complete state structure
- **Configuration Types**: Defines configuration interfaces
- **Camera Types**: Defines camera control interfaces
- **Type Safety**: Ensures service type safety

### **UI Integration**

- **State Display**: Provides types for UI state display
- **Configuration UI**: Defines configuration UI types
- **Camera Controls**: Defines camera control types
- **Settings UI**: Defines settings UI types

### **Renderer Integration**

- **Camera State**: Provides camera state for rendering
- **Visual Settings**: Defines visual rendering settings
- **Performance Types**: Defines performance configuration
- **Statistics Types**: Defines renderer statistics

## 🎯 Key Features

### **Comprehensive Type Coverage**

- **Complete State**: All simulation aspects covered
- **Configuration Types**: Physics and rendering configuration
- **Camera Types**: Complete camera control
- **Utility Types**: Helper and convenience types

### **Type Safety**

- **Full TypeScript**: Complete TypeScript type safety
- **Interface Validation**: Ensures interface compliance
- **Type Checking**: Compile-time type checking
- **Documentation**: Extensive type documentation

### **Extensibility**

- **Future-Proof**: Designed for future expansion
- **Modular Design**: Easy to extend and modify
- **Consistent Patterns**: Consistent type patterns
- **Backward Compatibility**: Maintains compatibility

### **Documentation**

- **JSDoc Comments**: Extensive inline documentation
- **Type Descriptions**: Clear type descriptions
- **Usage Examples**: Practical usage examples
- **Integration Guidance**: Integration documentation

## 🔧 Configuration

### **Type Organization**

- **State Types**: Core simulation state
- **Configuration Types**: Physics and rendering
- **Camera Types**: Camera control
- **Utility Types**: Helper types

### **Type Safety Features**

- **Interface Compliance**: Ensures interface compliance
- **Type Validation**: Compile-time validation
- **Documentation**: Extensive type documentation
- **Extensibility**: Future-proof design

_The SimulationTypes provides comprehensive, type-safe definitions for all simulation state management with extensive documentation and future-proof design._
