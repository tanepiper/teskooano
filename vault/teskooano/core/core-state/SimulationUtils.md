---
aliases:
  [SimulationUtils, simulation-utils, configuration-utils, validation-utils]
tags: [core, state, utilities, static, configuration, validation, display]
type: Module
package: "@teskooano/core-state"
name: SimulationUtils
dependencies: ["@teskooano/data-types"]
classes: []
functions:
  [
    "isValidConfiguration",
    "getDefaultConfiguration",
    "getConfigurationDisplayName",
    "getConfigurationShortName",
  ]
constants: []
types:
  [
    "SimulationConfiguration",
    "SimulationMode",
    "AlgorithmType",
    "IntegratorType",
  ]
status: active
---

# SimulationUtils

Static utility functions for simulation configuration validation, default configuration generation, and user-friendly display name formatting.

**Location**: `src/types/utils.ts`

## 🎯 Purpose

The `SimulationUtils` provides configuration management utilities:

- **Configuration Validation**: Validates simulation configuration objects
- **Default Configuration**: Provides sensible default configurations
- **Display Names**: Generates user-friendly configuration names
- **Short Names**: Creates compact names for UI constraints
- **Type Safety**: Ensures configuration type safety

## 🏗️ Architecture

### **Static Utility Pattern**

- **No Instance State**: All functions are static for utility access
- **Pure Functions**: Deterministic operations without side effects
- **Type Safety**: Full TypeScript type safety
- **Validation Logic**: Centralized configuration validation

### **Configuration Management Strategy**

1. **Validation**: Ensures configuration validity
2. **Defaults**: Provides sensible defaults
3. **Formatting**: Creates user-friendly names
4. **Type Safety**: Maintains type integrity

## 🔧 Core Components

### **isValidConfiguration()**

```typescript
export function isValidConfiguration(config: SimulationConfiguration): boolean;
```

**Purpose**: Validates if a simulation configuration is valid

**Features**:

- **Mode Validation**: Validates simulation mode requirements
- **Ideal Mode**: Ensures no integrator/algorithm for ideal mode
- **N-Body Mode**: Ensures both integrator and algorithm present
- **Type Safety**: Validates configuration structure

### **getDefaultConfiguration()**

```typescript
export function getDefaultConfiguration(): SimulationConfiguration;
```

**Purpose**: Returns the default simulation configuration

**Features**:

- **N-Body Default**: Uses N-body mode as default
- **PEFRL Integrator**: Uses PEFRL integrator by default
- **Tree-PM Algorithm**: Uses Tree-PM algorithm by default
- **Sensible Defaults**: Provides production-ready defaults

### **getConfigurationDisplayName()**

```typescript
export function getConfigurationDisplayName(
  config: SimulationConfiguration,
): string;
```

**Purpose**: Gets a user-friendly display name for a configuration

**Features**:

- **Ideal Mode**: Returns "Ideal Orrery" for ideal mode
- **N-Body Mode**: Formats algorithm and integrator names
- **Name Formatting**: Properly capitalizes and formats names
- **User-Friendly**: Creates readable display names

### **getConfigurationShortName()**

```typescript
export function getConfigurationShortName(
  config: SimulationConfiguration,
): string;
```

**Purpose**: Gets a short name for display in constrained UI spaces

**Features**:

- **Compact Format**: Creates short, readable names
- **Algorithm Abbreviations**: Uses short algorithm codes (BH, FMM, P3M, TPM)
- **Integrator Shortening**: Truncates integrator names
- **UI Optimization**: Perfect for space-constrained UI elements

## 🎮 Usage Examples

### **Configuration Validation**

```typescript
import { isValidConfiguration } from "@teskooano/core-state";

// Validate configuration
const config = {
  mode: SimulationMode.NBODY,
  algorithm: AlgorithmType.BARNES_HUT,
  integrator: IntegratorType.PEFRL,
};

if (isValidConfiguration(config)) {
  console.log("Configuration is valid");
} else {
  console.log("Configuration is invalid");
}
```

### **Default Configuration**

```typescript
import { getDefaultConfiguration } from "@teskooano/core-state";

// Get default configuration
const defaultConfig = getDefaultConfiguration();
console.log("Default config:", defaultConfig);
// Output: { mode: "nbody", algorithm: "tree-pm", integrator: "pefrl" }
```

### **Display Names**

```typescript
import { getConfigurationDisplayName } from "@teskooano/core-state";

// Get user-friendly names
const idealName = getConfigurationDisplayName({ mode: SimulationMode.IDEAL });
console.log(idealName); // "Ideal Orrery"

const nbodyName = getConfigurationDisplayName({
  mode: SimulationMode.NBODY,
  algorithm: AlgorithmType.BARNES_HUT,
  integrator: IntegratorType.PEFRL,
});
console.log(nbodyName); // "N-Body (Barnes-Hut + Pefrl)"
```

### **Short Names**

```typescript
import { getConfigurationShortName } from "@teskooano/core-state";

// Get short names for UI
const shortName = getConfigurationShortName({
  mode: SimulationMode.NBODY,
  algorithm: AlgorithmType.BARNES_HUT,
  integrator: IntegratorType.PEFRL,
});
console.log(shortName); // "BH-Pef"
```

### **Configuration Management**

```typescript
import {
  isValidConfiguration,
  getDefaultConfiguration,
  getConfigurationDisplayName,
} from "@teskooano/core-state";

// Complete configuration workflow
function setupConfiguration(userConfig?: SimulationConfiguration) {
  // Use user config or default
  const config = userConfig || getDefaultConfiguration();

  // Validate configuration
  if (!isValidConfiguration(config)) {
    throw new Error("Invalid configuration");
  }

  // Get display name
  const displayName = getConfigurationDisplayName(config);
  console.log(`Using configuration: ${displayName}`);

  return config;
}
```

## 🔄 Integration Points

### **SimulationStateService Integration**

- **Configuration Validation**: Used by SimulationStateService for validation
- **Default Provision**: Provides defaults for service initialization
- **Display Support**: Supports UI display in service methods
- **Type Safety**: Ensures service configuration safety

### **UI Integration**

- **Display Names**: Provides user-friendly names for UI components
- **Short Names**: Supports space-constrained UI elements
- **Validation**: Ensures UI configuration validity
- **Default Handling**: Provides sensible UI defaults

### **Configuration Management**

- **Validation Logic**: Centralized validation for all consumers
- **Default Standards**: Consistent defaults across the application
- **Name Standards**: Consistent naming conventions
- **Type Safety**: Ensures configuration type integrity

## 🎯 Key Features

### **Configuration Validation**

- **Mode-Specific Rules**: Different rules for ideal vs N-body modes
- **Required Fields**: Ensures required fields are present
- **Type Safety**: Validates configuration structure
- **Error Prevention**: Prevents invalid configurations

### **Default Configuration**

- **Production Ready**: Sensible defaults for production use
- **N-Body Focus**: Optimized for N-body physics
- **Modern Algorithms**: Uses modern, efficient algorithms
- **Consistent Standards**: Consistent across application

### **Display Name Generation**

- **User-Friendly**: Creates readable display names
- **Proper Formatting**: Correctly capitalizes and formats names
- **Mode Awareness**: Different formats for different modes
- **Consistent Style**: Consistent naming conventions

### **Short Name Generation**

- **Compact Format**: Creates space-efficient names
- **Algorithm Codes**: Uses standard algorithm abbreviations
- **Integrator Shortening**: Truncates integrator names appropriately
- **UI Optimization**: Perfect for constrained UI spaces

## 🔧 Configuration

### **Validation Rules**

- **Ideal Mode**: No integrator or algorithm required
- **N-Body Mode**: Both integrator and algorithm required
- **Type Safety**: Full TypeScript type validation
- **Structure Validation**: Ensures proper configuration structure

### **Default Values**

- **Mode**: SimulationMode.NBODY
- **Algorithm**: AlgorithmType.TREE_PM
- **Integrator**: IntegratorType.PEFRL
- **Production Ready**: Optimized for real-world use

_The SimulationUtils provides comprehensive, reliable configuration management with validation, defaults, and user-friendly formatting._
