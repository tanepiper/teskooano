# ReactiveState

Minimal reactive state management with computed properties, watchers, batching, and dependency tracking. Designed for plugin-local UI state with automatic updates and efficient change detection.

## Class Definition

```typescript
export class ReactiveState {
  private _data: Record<string, any> = {};
  private _watchers: Map<string, Set<StateWatcher>> = new Map();
  private _computed: Map<string, ComputedProperty> = new Map();
  private _isUpdating = false;
  private _updateQueue: Set<string> = new Set();

  constructor(initialData: Record<string, any> = {});
}
```

## Properties

### `_data: Record<string, any>`

The internal state data object.

### `_watchers: Map<string, Set<StateWatcher>>`

Map of property names to sets of watcher functions.

### `_computed: Map<string, ComputedProperty>`

Map of computed property names to their definitions and cache.

### `_isUpdating: boolean`

Flag to prevent infinite update loops.

### `_updateQueue: Set<string>`

Queue of properties that need to be updated.

## Methods

### `get data(): Record<string, any>`

Gets a read-only copy of the current state data.

**Returns**: `Record<string, any>` - Current state data

**Example**:

```typescript
const state = new ReactiveState({ count: 0, name: "test" });
console.log(state.data); // { count: 0, name: 'test' }
```

### `get(property: string): any`

Gets the value of a specific property.

**Parameters**:

- `property`: `string` - The property name

**Returns**: `any` - The property value

**Example**:

```typescript
const count = state.get("count");
const name = state.get("name");
```

### `set(property: string, value: any): void`

Sets the value of a specific property and triggers updates.

**Parameters**:

- `property`: `string` - The property name
- `value`: `any` - The new value

**Example**:

```typescript
state.set("count", 5);
state.set("name", "updated");
```

### `update(updates: Record<string, any>): void`

Updates multiple properties at once.

**Parameters**:

- `updates`: `Record<string, any>` - Object with property updates

**Example**:

```typescript
state.update({
  count: 10,
  name: "batch update",
  active: true,
});
```

### `watch(property: string, callback: StateWatcher): () => void`

Watches a property for changes.

**Parameters**:

- `property`: `string` - The property name to watch
- `callback`: `StateWatcher` - The callback function

**Returns**: `() => void` - Unsubscribe function

**Example**:

```typescript
const unsubscribe = state.watch("count", (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`);
});

// Clean up
unsubscribe();
```

### `computed(property: string, definition: ComputedDefinition): void`

Defines a computed property.

**Parameters**:

- `property`: `string` - The computed property name
- `definition`: `ComputedDefinition` - The computation definition

**Example**:

```typescript
state.computed("doubledCount", {
  deps: ["count"],
  compute: (count) => count * 2,
});

state.computed("displayText", {
  deps: ["count", "name"],
  compute: (count, name) => `${name}: ${count}`,
});
```

### `removeComputed(property: string): void`

Removes a computed property.

**Parameters**:

- `property`: `string` - The computed property name

**Example**:

```typescript
state.removeComputed("doubledCount");
```

### `getComputedProperties(): string[]`

Gets all computed property names.

**Returns**: `string[]` - Array of computed property names

**Example**:

```typescript
const computedProps = state.getComputedProperties();
console.log("Computed properties:", computedProps);
```

### `getWatchedProperties(): string[]`

Gets all watched property names.

**Returns**: `string[]` - Array of watched property names

**Example**:

```typescript
const watchedProps = state.getWatchedProperties();
console.log("Watched properties:", watchedProps);
```

### `dispose(): void`

Cleans up all watchers and computed properties.

**Example**:

```typescript
state.dispose();
```

### `snapshot(): { data: any; computed: Record<string, any> }`

Gets a snapshot of current state and computed values.

**Returns**: `{ data: any; computed: Record<string, any> }` - State snapshot

**Example**:

```typescript
const snapshot = state.snapshot();
console.log("State snapshot:", snapshot);
```

## Interfaces

### `ComputedDefinition`

Definition for computed properties.

```typescript
interface ComputedDefinition {
  deps: string[];
  compute: (...deps: any[]) => any;
}
```

### `ComputedProperty`

Internal computed property object.

```typescript
interface ComputedProperty extends ComputedDefinition {
  cache: any;
  dirty: boolean;
  dependents: Set<string>;
}
```

### `StateWatcher`

Function type for state watchers.

```typescript
type StateWatcher = (newValue: any, oldValue: any, property: string) => void;
```

## Usage Examples

### Basic State Management

```typescript
import { ReactiveState } from "@teskooano/ui-plugin/patterns";

const state = new ReactiveState({
  count: 0,
  name: "initial",
  active: false,
});

// Watch for changes
state.watch("count", (newValue, oldValue) => {
  console.log(`Count: ${oldValue} -> ${newValue}`);
});

// Update state
state.set("count", 5);
state.set("name", "updated");

// Batch updates
state.update({
  count: 10,
  active: true,
});
```

### Computed Properties

```typescript
const state = new ReactiveState({
  firstName: "John",
  lastName: "Doe",
  age: 30,
});

// Simple computed property
state.computed("fullName", {
  deps: ["firstName", "lastName"],
  compute: (firstName, lastName) => `${firstName} ${lastName}`,
});

// Complex computed property
state.computed("description", {
  deps: ["fullName", "age"],
  compute: (fullName, age) => `${fullName} is ${age} years old`,
});

// Access computed values
console.log(state.get("fullName")); // "John Doe"
console.log(state.get("description")); // "John Doe is 30 years old"

// Update dependencies
state.set("firstName", "Jane");
console.log(state.get("fullName")); // "Jane Doe"
console.log(state.get("description")); // "Jane Doe is 30 years old"
```

### Component Integration

```typescript
class MyComponent extends HTMLElement {
  private state = new ReactiveState({
    selectedObject: null,
    isLoading: false,
    filter: "all",
  });

  constructor() {
    super();

    // Set up computed properties
    this.state.computed("hasSelection", {
      deps: ["selectedObject"],
      compute: (selectedObject) => selectedObject !== null,
    });

    this.state.computed("displayText", {
      deps: ["selectedObject", "isLoading"],
      compute: (selectedObject, isLoading) => {
        if (isLoading) return "Loading...";
        return selectedObject ? selectedObject.name : "No selection";
      },
    });

    // Set up watchers
    this.state.watch("displayText", (newText) => {
      this.updateDisplay(newText);
    });

    this.state.watch("hasSelection", (hasSelection) => {
      this.updateButtons(hasSelection);
    });
  }

  selectObject(object: any) {
    this.state.set("selectedObject", object);
  }

  setLoading(loading: boolean) {
    this.state.set("isLoading", loading);
  }

  private updateDisplay(text: string) {
    const displayEl = this.shadowRoot.querySelector(".display");
    if (displayEl) {
      displayEl.textContent = text;
    }
  }

  private updateButtons(hasSelection: boolean) {
    const buttons = this.shadowRoot.querySelectorAll("button");
    buttons.forEach((button) => {
      button.disabled = !hasSelection;
    });
  }

  disconnectedCallback() {
    this.state.dispose();
  }
}
```

### Advanced Computed Properties

```typescript
const state = new ReactiveState({
  items: [],
  filter: "all",
  sortBy: "name",
});

// Computed property with complex logic
state.computed("filteredItems", {
  deps: ["items", "filter"],
  compute: (items, filter) => {
    if (filter === "all") return items;
    return items.filter((item) => item.type === filter);
  },
});

// Computed property depending on another computed property
state.computed("sortedItems", {
  deps: ["filteredItems", "sortBy"],
  compute: (filteredItems, sortBy) => {
    return [...filteredItems].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "date") return new Date(a.date) - new Date(b.date);
      return 0;
    });
  },
});

// Computed property for UI state
state.computed("itemCount", {
  deps: ["sortedItems"],
  compute: (sortedItems) => sortedItems.length,
});

// Update data
state.set("items", [
  { name: "Earth", type: "planet", date: "2023-01-01" },
  { name: "Sun", type: "star", date: "2023-01-02" },
]);

console.log(state.get("sortedItems")); // Sorted items
console.log(state.get("itemCount")); // 2
```

### State Debugging

```typescript
const state = new ReactiveState({
  user: { name: "John", age: 30 },
  settings: { theme: "dark", notifications: true },
});

// Get state snapshot
const snapshot = state.snapshot();
console.log("Current state:", snapshot.data);
console.log("Computed values:", snapshot.computed);

// Get property information
const computedProps = state.getComputedProperties();
const watchedProps = state.getWatchedProperties();
console.log("Computed properties:", computedProps);
console.log("Watched properties:", watchedProps);

// Watch all changes for debugging
Object.keys(state.data).forEach((prop) => {
  state.watch(prop, (newValue, oldValue) => {
    console.log(`[DEBUG] ${prop}: ${oldValue} -> ${newValue}`);
  });
});
```

### Utility Functions

```typescript
import {
  createReactiveState,
  connectObservable,
} from "@teskooano/ui-plugin/patterns";

// Typed reactive state
const typedState = createReactiveState({
  count: 0,
  name: "test",
});

// Connect to RxJS observable
import { BehaviorSubject } from "rxjs";

const dataSubject = new BehaviorSubject({ items: [] });
const subscription = connectObservable(state, "items", dataSubject);

// Clean up
subscription.unsubscribe();
```

## Performance Characteristics

- **Efficient Updates**: Batched updates prevent excessive re-renders
- **Dependency Tracking**: Only recomputes when dependencies change
- **Memory Management**: Automatic cleanup of watchers and computed properties
- **Change Detection**: Minimal overhead for state changes

## Best Practices

1. **Use Computed Properties**: Derive state instead of storing redundant data
2. **Clean Up Watchers**: Always dispose of state in component cleanup
3. **Batch Updates**: Use `update()` for multiple property changes
4. **Minimize Dependencies**: Keep computed property dependencies minimal
5. **Debug with Snapshots**: Use snapshots for debugging state issues

## Related

- [[EventBus]] - Integrates with ReactiveState for event-driven updates
- [[createComponentState]] - Combines ReactiveState with EventBus
- [[Events]] - Event types for state synchronization
