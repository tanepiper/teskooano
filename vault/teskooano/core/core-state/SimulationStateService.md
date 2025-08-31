---
aliases:
  [SimulationStateService, simulation-state, time-management, camera-control]
tags: [core, state, service, singleton, simulation, time, camera]
type: Class
package: "@teskooano/core-state"
name: SimulationStateService
dependencies: ["@teskooano/data-types", "@teskooano/core-math", "rxjs"]
classes: ["BehaviorSubject", "Observable"]
functions: []
constants: []
types:
  [
    "SimulationState",
    "SimulationConfiguration",
    "CameraState",
    "VisualSettingsState",
    "SimulationMode",
    "AlgorithmType",
    "IntegratorType",
    "DeviceTier",
    "OSVector3",
  ]
status: active
---

# SimulationStateService

Singleton service managing simulation control state including time, pause status, camera, physics engine configuration, and visual settings with comprehensive reactive state management.

**Location**: `src/services/simulation.ts`

## 🎯 Purpose

The `SimulationStateService` provides centralized simulation control:

- **Time Management**: Controls simulation time, scale, and stepping
- **Camera Control**: Manages camera position, target, and field of view
- **Object Selection**: Handles focused and selected object state
- **Physics Configuration**: Manages simulation mode, algorithm, and integrator
- **Visual Settings**: Controls trails, labels, and prediction settings
- **Performance Profiles**: Manages device-specific performance settings

## 🏗️ Architecture

### **Singleton Pattern**

- **Single Instance**: Global access to simulation state
- **Reactive Updates**: RxJS-based state management
- **Comprehensive State**: All simulation control in one place
- **Immutable Updates**: Creates new state objects for changes

### **State Management Strategy**

1. **Initial State**: Default configuration on startup
2. **Immutable Updates**: New state objects for all changes
3. **Reactive Notifications**: Notifies all subscribers
4. **Validation**: Ensures configuration validity

## 🔧 Core Components

### **Time Management**

```typescript
public setTimeScale(scale: number): void
public togglePause(): void
public resetTime(resetPaused?: boolean): void
public stepTime(dt?: number): void
public setStartDate(startDate: Date): void
public resetToStartDate(startDate: Date): void
```

**Purpose**: Comprehensive time control and management

**Features**:

- **Time Scale**: Control simulation speed
- **Pause Control**: Start/stop simulation
- **Time Reset**: Reset to zero or start date
- **Step Control**: Manual time stepping when paused
- **Date Management**: Set and reset start dates

### **Camera Control**

```typescript
public updateCamera(position: OSVector3, target: OSVector3): void
```

**Purpose**: Manages camera position and target

**Features**:

- **Position Control**: Set camera position in 3D space
- **Target Control**: Set camera look target
- **Vector Support**: Uses OSVector3 for positions
- **State Integration**: Updates simulation state

### **Object Selection**

```typescript
public selectObject(objectId: string | null): void
public setFocusedObject(objectId: string | null): void
```

**Purpose**: Manages object selection and focus

**Features**:

- **Object Selection**: Set currently selected object
- **Camera Focus**: Set camera-focused object
- **Null Support**: Clear selection/focus
- **UI Integration**: Supports UI selection state

### **Physics Configuration**

```typescript
public setSimulationConfiguration(config: SimulationConfiguration): void
public setSimulationMode(mode: SimulationMode): void
public setNBodyAlgorithm(algorithm: AlgorithmType): void
public setNBodyIntegrator(integrator: IntegratorType): void
public getSimulationConfiguration(): SimulationConfiguration
public isConfigurationValid(): boolean
```

**Purpose**: Manages physics engine configuration

**Features**:

- **Mode Selection**: Ideal orrery vs N-body physics
- **Algorithm Control**: Barnes-Hut, FMM, P3M, Tree-PM
- **Integrator Control**: PEFRL, RK4, Verlet, etc.
- **Validation**: Ensures configuration validity
- **State Persistence**: Maintains configuration state

### **Visual Settings**

```typescript
public setTrailLengthMultiplier(multiplier: number): void
public setPredictionSettings(steps: number, duration: number): void
```

**Purpose**: Controls visual aspects of simulation

**Features**:

- **Trail Control**: Adjust trail length multiplier
- **Prediction Settings**: Configure trajectory prediction
- **Performance Optimization**: Avoid unnecessary updates
- **Visual Quality**: Control rendering quality

### **Performance Management**

```typescript
public setPerformanceProfile(profile: DeviceTier): void
```

**Purpose**: Manages performance profiles

**Features**:

- **Device Tiers**: Low, medium, high performance profiles
- **Quality Control**: Adjust visual quality per device
- **Performance Optimization**: Avoid unchanged value updates
- **Hardware Adaptation**: Match user's hardware

### **State Access**

```typescript
public getSimulationState(): SimulationState
public setSimulationState(newState: SimulationState): void
public readonly simulationState$: Observable<SimulationState>
```

**Purpose**: Provides access to simulation state

**Features**:

- **Current State**: Get current simulation state
- **State Override**: Set complete state (use with caution)
- **Reactive Stream**: Observable state changes
- **State Snapshot**: Immediate state access

## 🎮 Usage Examples

### **Basic Time Control**

```typescript
import { simulationStateService } from "@teskooano/core-state";

// Control simulation time
simulationStateService.setTimeScale(2.0); // 2x speed
simulationStateService.togglePause();
simulationStateService.resetTime();

// Subscribe to state changes
simulationStateService.simulationState$.subscribe((state) => {
  console.log("Time:", state.time, "Scale:", state.timeScale);
});
```

### **Camera Management**

```typescript
import { OSVector3 } from "@teskooano/core-math";

// Update camera
const position = new OSVector3(0, 100, 100);
const target = new OSVector3(0, 0, 0);
simulationStateService.updateCamera(position, target);
```

### **Physics Configuration**

```typescript
import {
  SimulationMode,
  AlgorithmType,
  IntegratorType,
} from "@teskooano/data-types";

// Set N-body physics
simulationStateService.setSimulationMode(SimulationMode.NBODY);
simulationStateService.setNBodyAlgorithm(AlgorithmType.BARNES_HUT);
simulationStateService.setNBodyIntegrator(IntegratorType.PEFRL);
```

### **Object Selection**

```typescript
// Select and focus objects
simulationStateService.selectObject("earth");
simulationStateService.setFocusedObject("mars");
```

## 🔄 Integration Points

### **Physics Engine Integration**

- **Configuration Provision**: Provides physics configuration
- **Mode Switching**: Controls ideal vs N-body modes
- **Algorithm Selection**: Manages spatial algorithms
- **Integrator Control**: Controls numerical integrators

### **Renderer Integration**

- **Camera State**: Provides camera position and target
- **Visual Settings**: Controls trails and prediction
- **Performance Profiles**: Adjusts render quality
- **State Synchronization**: Keeps renderer in sync

### **UI Integration**

- **Object Selection**: Manages UI selection state
- **Camera Control**: Provides camera for UI controls
- **Time Display**: Provides time for UI display
- **Settings Management**: Controls UI settings

## 🎯 Key Features

### **Comprehensive State Management**

- **All Simulation Control**: Single source for all simulation state
- **Reactive Updates**: RxJS-based state notifications
- **Immutable Updates**: Safe state modifications
- **Validation**: Ensures state consistency

### **Performance Optimization**

- **Change Detection**: Avoids unnecessary updates
- **Efficient Updates**: Minimal state object creation
- **Memory Management**: Efficient state storage
- **Optimization Hints**: Performance guidance

### **Configuration Management**

- **Validation**: Ensures configuration validity
- **Mode Support**: Ideal and N-body physics modes
- **Algorithm Support**: Multiple spatial algorithms
- **Integrator Support**: Multiple numerical integrators

### **Error Handling**

- **Configuration Validation**: Validates physics configuration
- **State Consistency**: Maintains state integrity
- **Safe Operations**: Handles invalid inputs gracefully
- **Debug Support**: Comprehensive error logging

_The SimulationStateService provides comprehensive, reliable simulation control with reactive state management and extensive configuration options._
