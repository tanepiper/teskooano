---
aliases: [SeedStore, seed-store, system-seed, generation-seed, persistence]
tags: [core, state, store, singleton, reactive, seed, persistence, localStorage]
type: Class
package: "@teskooano/core-state"
name: SeedStore
dependencies: ["rxjs"]
classes: ["BehaviorSubject", "Observable"]
functions: []
constants: ["LAST_SEED_STORAGE_KEY", "DEFAULT_SEED"]
types: []
status: active
---

# SeedStore

Singleton store managing the current seed used for system generation with localStorage persistence and reactive state management.

## 🎯 Purpose

The `SeedStore` provides centralized seed management:

- **Seed Persistence**: Automatically saves/loads seed from localStorage
- **Reactive Updates**: Provides observable seed changes
- **Default Handling**: Manages fallback to default seed
- **Error Recovery**: Graceful handling of localStorage failures
- **System Generation**: Supports procedural system generation

## 🏗️ Architecture

### **Singleton Pattern**

- **Single Instance**: Global access to seed state
- **Persistent State**: Survives page reloads
- **Reactive Updates**: RxJS-based state management
- **Error Resilience**: Continues working if localStorage fails

### **Persistence Strategy**

1. **Initialization**: Load from localStorage on startup
2. **Default Fallback**: Use default seed if no stored value
3. **Error Handling**: Graceful degradation if localStorage unavailable
4. **Update Persistence**: Save to localStorage on changes

## 🔧 Core Components

### **getCurrentSeed()**

```typescript
public getCurrentSeed(): string
```

**Purpose**: Gets the current seed value

**Features**:

- **Synchronous Access**: Immediate value retrieval
- **Current State**: Returns latest seed value
- **Default Fallback**: Returns default if no seed set

### **updateSeed()**

```typescript
public updateSeed(newSeed: string): void
```

**Purpose**: Updates the current seed value

**Features**:

- **Input Validation**: Trims whitespace and validates
- **Persistence**: Automatically saves to localStorage
- **Reactive Updates**: Notifies all subscribers
- **Error Handling**: Continues working if save fails
- **Default Fallback**: Uses default seed for empty input

### **currentSeed$**

```typescript
public readonly currentSeed$: Observable<string>
```

**Purpose**: Observable stream of seed changes

**Features**:

- **Reactive Updates**: Notifies on seed changes
- **Initial Value**: Emits current seed immediately
- **Error Resilience**: Continues emitting if localStorage fails

## 🎮 Usage Examples

### **Basic Seed Access**

```typescript
import { seedStore } from "@teskooano/core-state";

// Get current seed
const currentSeed = seedStore.getCurrentSeed();
console.log("Current seed:", currentSeed);

// Subscribe to seed changes
seedStore.currentSeed$.subscribe((seed) => {
  console.log("Seed changed to:", seed);
});
```

### **Updating Seed**

```typescript
// Update with new seed
seedStore.updateSeed("my-custom-seed");

// Empty seed uses default
seedStore.updateSeed(""); // Uses "42"
```

### **System Generation Integration**

```typescript
import { generateSystem } from "@teskooano/systems-procedural-generation";

// Use current seed for generation
seedStore.currentSeed$.subscribe(async (seed) => {
  const { systemName, objects$ } = await generateSystem(seed);
  console.log("Generated system:", systemName);
});
```

## 🔄 Integration Points

### **Procedural Generation Integration**

- **Seed Provision**: Provides seed for system generation
- **Reactive Updates**: Triggers regeneration on seed change
- **Persistence**: Maintains seed across sessions

### **UI Integration**

- **Seed Input**: Provides current seed for UI components
- **Change Notifications**: Notifies UI of seed updates
- **Validation**: Handles user input validation

### **LocalStorage Integration**

- **Automatic Persistence**: Saves seed changes automatically
- **Error Recovery**: Continues working if storage fails
- **Initialization**: Loads seed on startup

## 🎯 Key Features

### **Persistence Management**

- **Automatic Saving**: Saves to localStorage on changes
- **Automatic Loading**: Loads from localStorage on startup
- **Error Resilience**: Continues working if storage unavailable
- **Default Fallback**: Uses default seed when needed

### **Reactive State Management**

- **Observable Stream**: RxJS-based state updates
- **Immediate Access**: Synchronous getter for current value
- **Change Notifications**: Notifies all subscribers
- **Error Handling**: Continues emitting on storage errors

### **Input Validation**

- **Whitespace Handling**: Trims input automatically
- **Empty Input**: Uses default seed for empty strings
- **Warning Messages**: Logs warnings for empty input
- **Safe Fallbacks**: Always provides valid seed

### **Error Handling**

- **Storage Failures**: Graceful handling of localStorage errors
- **Console Logging**: Detailed error logging for debugging
- **Fallback Behavior**: Continues working with default seed
- **User Feedback**: Warns about storage issues

## 🔧 Configuration

### **Constants**

- **LAST_SEED_STORAGE_KEY**: localStorage key for persistence
- **DEFAULT_SEED**: Fallback seed value ("42")

### **Error Recovery**

- **Storage Failures**: Logs errors but continues operation
- **Invalid Data**: Falls back to default seed
- **Network Issues**: Works offline with cached data

_The SeedStore provides reliable, persistent seed management with comprehensive error handling and reactive state updates._
