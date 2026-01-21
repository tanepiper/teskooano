# AGENTS.md

A guide for AI coding agents working on the Teskooano N-Body simulation engine.

## Project Overview

**Teskooano** is a 3D N-Body simulation engine that accurately simulates real physics and provides a multi-view experience in real time. It features collision detection, realistic orbital mechanics, and procedural generation to create unique star systems.

### Key Architecture

- **Modular Monorepo**: Managed with `moon` and `proto` for streamlined development
- **Plugin-Based UI**: DockView for modular, dockable panels with custom plugin system
- **Reactive State**: Centralized RxJS-based state management
- **3D Rendering**: Three.js with custom renderer packages and GLSL shaders
- **Physics Engine**: N-Body simulation with Verlet integrator and orbital mechanics

## Setup Commands

### Prerequisites

- Install [moon](https://moonrepo.dev/) and [proto](https://moonrepo.dev/proto) for task running and dependency management
- Node.js 24.2.0 (specified in package.json engines)

### Installation & Development

```bash
# Clone and setup
git clone https://github.com/tanepiper/teskooano.git
cd teskooano

# Install dependencies and start the main app
proto use
moon run teskooano:dev
```

The application will be available at `http://localhost:3000`.

### Key Commands

- **Start dev server**: `moon run teskooano:dev`
- **Build**: `moon run teskooano:build`
- **Run tests**: `moon run :test` (runs all package tests)
- **Run specific package tests**: `moon run <package-name>:test`
- **Format code**: `npm run format` (prettier)

## Code Style & Conventions

### TypeScript Standards

- **Strict Mode**: Always use strict TypeScript configuration
- **Type Safety**: Prefer explicit types over inference when clarity is needed
- **Interfaces**: Define dedicated TypeScript interfaces for constructor options instead of inline object types
- **JSDoc**: Include documentation but omit explicit type annotations (types are in TypeScript code)

### Code Style

- **Indentation**: Use 2-space indentation
- **Naming**:
  - `PascalCase` for classes, interfaces, and types
  - `camelCase` for variables, properties, and functions
  - `UPPER_CASE` for constants
- **File Size**: Target max 300-400 lines per file
- **Modularity**: Prefer small, composable files with single responsibility

### Import Patterns

- **Static Imports**: Use ES import statements at the top of files exclusively
- **Never use**: `require()` or dynamic `import()`
- **Path Aliases**: Use `@teskooano/*` aliases defined in tsconfig.json

## Package Architecture

### Core Packages (`@teskooano/core-*`)

- **Purpose**: Application-agnostic business logic and data structures
- **Dependencies**: No UI-specific dependencies (no DockView, ThreeJS, etc.)
- **Examples**: `core-math`, `core-physics`, `core-state`, `core-debug`

### Renderer Packages (`@teskooano/renderer-*`)

- **Purpose**: Three.js rendering modules with specific responsibilities
- **Pattern**: Compositional architecture with LOD management
- **Examples**: `renderer-threejs-core`, `renderer-threejs-celestial`, `renderer-threejs-orbits`

### System Packages (`@teskooano/systems-*`)

- **Purpose**: Domain-specific logic for celestial systems
- **Examples**: `systems-procedural-generation`, `systems-solar-system`

### App Packages (`@teskooano/app-*`)

- **Purpose**: Application-specific functionality
- **Examples**: `app-simulation`, `app-ui-plugin`, `design-system`

## Plugin Development Patterns

### MVC Architecture

All UI plugins follow a strict **Model-View-Controller (MVC)** pattern:

```
plugin-name/
├── controller/
│   └── PluginName.controller.ts    # Business logic
├── view/
│   ├── PluginName.view.ts          # Custom element (dumb view)
│   └── PluginName.template.ts      # HTML/CSS template
├── services/                       # Reusable business logic
├── index.ts                        # Plugin registration
└── README.md                       # Architecture documentation
```

### Plugin Registration

- **Custom Elements**: Define as `ComponentConfig` objects in plugin definition
- **No Manual Registration**: Don't call `customElements.define()` manually
- **Plugin Manager**: Handles registration automatically during plugin loading

### Component Organization

Plugins should follow a consistent directory structure based on component complexity:

**Flat Structure (Most Common)**

```
plugin-name/
├── controller/
│   └── PluginName.controller.ts
├── view/
│   ├── PluginName.view.ts
│   └── PluginName.template.ts
├── services/                      # Optional
├── index.ts
└── README.md
```

**Nested Structure (Complex Plugins)**

```
plugin-name/
├── controller/
├── view/
├── components/                    # For reusable sub-components
│   ├── component-name/
│   │   ├── ComponentName.ts
│   │   └── ComponentName.template.ts
│   └── another-component/
├── services/
├── index.ts
└── README.md
```

**When to Use `components/` Subdirectory:**

- Component is **reusable** across multiple plugins or views
- Component has **complex internal structure** (own controller/view/template pattern)
- Component is **not a standalone plugin** (doesn't register with plugin manager)
- Example: `celestial-row` component in `celestial-hierarchy` plugin, `plugin-detail-card` in `plugin-manager`

**When to Use Flat Structure:**

- Single-purpose plugin with straightforward controller/view
- No reusable sub-components needed
- Simpler to navigate and maintain
- Example: `notifications`, `celestial-info`, `engine-settings`

### Key Patterns

- **View**: "Dumb" custom elements that only manage DOM and delegate to controllers
- **Controller**: Contains all business logic, subscribes to state, handles events
- **Services**: Reusable, injectable classes for complex business logic
- **Dependency Injection**: Pass dependencies through constructors, not global state

### Subscription Management

**All controllers and managers MUST use `StateSubscriptionMixin`** from `@teskooano/core-state` for subscription management:

```typescript
import { StateSubscriptionMixin } from "@teskooano/core-state";

export class MyController extends StateSubscriptionMixin {
  constructor() {
    super(); // Required for mixin initialization
  }

  public init(): void {
    // ✅ Use subscribeToState for all RxJS subscriptions
    this.subscribeToState(someObservable$, (value) => {
      // Handle value
    });
  }

  public dispose(): void {
    // ✅ Automatic cleanup via StateSubscriptionMixin
    super.dispose();
  }
}
```

**Anti-patterns to avoid:**

- ❌ Never use `private subscriptions = new Subscription()`
- ❌ Never manually call `.subscribe()` and track subscriptions
- ❌ Views should NOT manage subscriptions - delegate to controllers

### Event Handling Guidelines

Choose the appropriate event pattern based on the communication scope:

**1. RxJS Streams (Internal Component Logic)**

- **Use for**: Complex reactive logic within a controller or service
- **Pattern**: Operators like `combineLatest`, `merge`, `switchMap`, `debounceTime`
- **Example**: Combining multiple state streams, form validation, complex user interactions

```typescript
const displayState$ = combineLatest([
  celestialObjects$,
  currentSeed$,
  isGenerating$$,
]).pipe(
  debounceTime(0),
  tap(([objects, seed, isGenerating]) => {
    this.updateDisplay(objects, seed, isGenerating);
  }),
);

this.subscribeToState(displayState$, () => {});
```

**2. Custom DOM Events (Cross-System Communication)**

- **Use for**: Communication between different systems/packages, plugin→core, or UI→renderer
- **Pattern**: `document.dispatchEvent(new CustomEvent(...))`
- **Example**: Renderer events, state change notifications, system-level actions

```typescript
// Dispatch
document.dispatchEvent(
  new CustomEvent("renderer-focus-changed", {
    detail: { objectId: "sun-001" },
  }),
);

// Listen
document.addEventListener("renderer-focus-changed", (event) => {
  const { objectId } = event.detail;
  this.handleFocusChange(objectId);
});
```

**3. Direct Event Listeners (DOM-Native Events)**

- **Use for**: ONLY native DOM events like clicks, inputs, resize, keyboard
- **Pattern**: `fromEvent(element, 'click')` or `element.addEventListener()`
- **Example**: Button clicks, input changes, window resize

```typescript
// RxJS approach (preferred for reactive pipelines)
const click$ = fromEvent(button, "click").pipe(
  debounceTime(300),
  map(() => this.getValue()),
);

// Direct listener (for simple cases)
button.addEventListener("click", () => this.handleClick());
```

**Decision Matrix:**

| Scope            | Pattern           | When to Use                              |
| ---------------- | ----------------- | ---------------------------------------- |
| Within component | RxJS Streams      | Complex reactive logic, multiple sources |
| Across systems   | Custom DOM Events | Plugin communication, renderer events    |
| DOM interaction  | Direct Listeners  | Simple button clicks, native events      |

## Testing Strategy

### Test Organization

- **File Convention**: Test files (`<filename>.spec.ts`) adjacent to source files
- **Unit Tests**: Use Vitest for both backend and frontend
- **Integration Tests**: Use Playwright for complex UI features
- **Test Data**: Use fixed random values for deterministic tests

### Test Commands

- **All tests**: `moon run :test`
- **Specific package**: `moon run <package-name>:test`
- **Interactive mode**: Tests run in interactive mode by default
- **Browser tests**: Use `@vitest/browser` for UI component testing

### Test Patterns

- **MVC Testing**: Test controllers independently of views
- **State Testing**: Test state management with RxJS operators
- **Renderer Testing**: Test renderer logic without ThreeJS context
- **Plugin Testing**: Test plugin registration and lifecycle

## Physics & Rendering Guidelines

### Coordinate Systems

- **Right-Handed**: Use right-handed coordinate system for 3D axes
- **Scene Units**: 1000 scene units = 1 AU of distance (RENDER_SCALE_AU = 1000)
- **Scaling**: Use `AU_METERS` constant and `METERS_TO_SCENE_UNITS` for conversions
- **Vector Math**: Use `OSVector3` for physics, convert to `THREE.Vector3` for rendering
- **Logarithmic Depth**: Far plane at 200 AU (30 billion scene units) with NEAR=0.00001

### Rendering Architecture

- **Compositional Pattern**: Complex objects (planets with rings) use composition
- **LOD Management**: Level of Detail for performance optimization
- **Shader Management**: GLSL shaders in external files, not embedded strings
- **Material Patterns**: Separate material logic into `material.ts` files

### State Management

- **Reactive Patterns**: Use RxJS for data flow and state synchronization
- **Centralized State**: All state managed through `@teskooano/core-state`
- **Unidirectional Flow**: State flows down, events flow up
- **No Direct DOM Manipulation**: Use reactive patterns instead of manual DOM updates

## Development Workflow

### Creating Features

1. **Create branch**: `git checkout -b feature/your-feature-name`
2. **Follow patterns**: Use established MVC patterns for UI components
3. **Write tests**: Follow TDD approach with Vitest
4. **Run tests**: `moon run :test` before committing
5. **Commit**: Use conventional commits format
6. **PR**: Create pull request with clear description

### Package Development

- **Respect boundaries**: Don't create tight dependencies between packages
- **Use file: dependencies**: Inter-package references use `file:` paths
- **Build dependencies**: Use `^:build` for build task dependencies
- **Documentation**: Each package needs README.md and ARCHITECTURE.md

## Common Patterns & Anti-Patterns

### Recommended Patterns

- **Dependency Injection**: Pass dependencies through constructors
- **Factory Functions**: Use factories for complex object creation
- **Composition over Inheritance**: Prefer composition
- **Immutable Data**: Use immutable data structures where possible
- **Reactive Programming**: Use RxJS for data flow

### Anti-Patterns to Avoid

- **Global State**: Avoid global variables and singletons
- **Tight Coupling**: Don't create tight dependencies between packages
- **Premature Optimization**: Don't optimize before measuring
- **Magic Numbers**: Use named constants instead of magic numbers
- **Deep Nesting**: Avoid deeply nested conditionals and loops

## Performance Guidelines

### Rendering Performance

- **Draw Call Reduction**: Use instancing and batching
- **LOD Management**: Implement proper Level of Detail systems
- **Memory Efficiency**: Reuse objects and minimize allocations
- **Caching**: Cache expensive calculations and results

### JavaScript Performance

- **Object Reuse**: Pre-allocate vectors and matrices
- **Garbage Collection**: Minimize object creation in hot paths
- **Algorithm Efficiency**: Use appropriate data structures (Octrees, spatial hashing)

## Event System Architecture

Teskooano uses a comprehensive event-driven architecture with three types of events for different communication patterns:

### Event Types

1. **RxJS Events** - Type-safe observables for internal renderer communication
2. **DOM Events** - Custom events for cross-system communication
3. **Pipeline Events** - Stage-specific events for render pipeline coordination

### Event Flow

```
Core State (DOM Events) → EventBridge → Renderer (RxJS Events) → Components
                    ↓
            Custom DOM Events ← UI Components
```

### Key Components

#### Event Bridges (in `@teskooano/core-state`)

- **Purpose**: Bridge DOM events to RxJS for system and celestial operations
- **Components**:
  - `SystemEventBridge` – system-wide events (e.g., objects loaded/destroyed)
  - `CelestialEventBridge` – celestial/UI events (e.g., clear trails/predictions)
- **Usage**: Initialized by `ModularSpaceRenderer` at startup

#### Renderer Events (`@teskooano/renderer-threejs`)

- **`destruction$`**: Emits when celestial objects are destroyed
- **Purpose**: Trigger visual effects like explosions or particle systems

#### Pipeline Events (`@teskooano/renderer-threejs`)

- **10 stage-specific events**: beforeUpdate, afterControlsUpdate, afterOrbitsUpdate, afterObjectsUpdate, afterBackgroundUpdate, afterGridUpdate, beforeRender, afterRender, afterOverlaysRender, afterUpdate
- **Purpose**: Allow components to react to specific rendering stages
- **Payload**: `{ deltaTime, elapsedTime, frameCount }`

#### Core State Events (`@teskooano/core-state`)

- **DOM Events**: `CELESTIAL_OBJECT_DESTROYED`, `CELESTIAL_OBJECTS_LOADED`
- **Purpose**: Cross-system communication for state changes
- **Usage**: Dispatched by state management functions and bridged to RxJS via `SystemEventBridge`/`CelestialEventBridge`

### Usage Patterns

```typescript
// Subscribe to destruction events
import { rendererEvents } from "@teskooano/renderer-threejs";
rendererEvents.destruction$.subscribe((payload) => {
  console.log(`Object ${payload.object.id} was destroyed`);
  this.createExplosionEffect(payload.object.position);
});

// Subscribe to pipeline events
import { renderPipelineEvents } from "@teskooano/renderer-threejs";
renderPipelineEvents.afterObjectsUpdate$.subscribe((payload) => {
  console.log(`Objects updated at frame ${payload.frameCount}`);
  this.updateObjectUI();
});

// Dispatch custom DOM events
import { CustomEvents } from "@teskooano/data-types";
document.dispatchEvent(new CustomEvent("teskooano-clear-orbit-trails"));
```

### Best Practices

- **Use StateSubscriptionMixin**: Automatic subscription cleanup
- **Validate payloads**: Always check event data validity
- **Throttle expensive operations**: Use RxJS operators for performance
- **Handle errors**: Implement proper error handling in subscriptions
- **Event documentation**: See `packages/core/state/src/services/EVENT_SYSTEM.md` for comprehensive documentation

## Unified Architecture Patterns

This section documents the 10 core patterns that ensure consistency across the codebase. All new code MUST follow these patterns.

### 1. StateSubscriptionMixin Pattern

**Rule**: All controllers and managers MUST extend `StateSubscriptionMixin` from `@teskooano/core-state`.

```typescript
import { StateSubscriptionMixin } from "@teskooano/core-state";

export class MyController extends StateSubscriptionMixin {
  constructor() {
    super(); // Required for mixin initialization
  }

  public init(): void {
    // ✅ Use subscribeToState for all RxJS subscriptions
    this.subscribeToState(someObservable$, (value) => {
      // Handle value
    });
  }

  public dispose(): void {
    // ✅ Automatic cleanup via StateSubscriptionMixin
    super.dispose();
    // Manual cleanup (event listeners, etc.)
  }
}
```

**Anti-patterns to avoid**:

- ❌ `private subscriptions = new Subscription()`
- ❌ Manually calling `.subscribe()` and tracking subscriptions
- ❌ Views managing subscriptions (delegate to controllers)

### 2. Filter Factory Pattern

**Rule**: Use `createFilteredStream$` and `createFilteredMap` from `StoreFilters.ts` for state filtering.

```typescript
import {
  createFilteredStream$,
  createFilteredMap,
} from "@teskooano/core-state";
import { isActive, isDestroyed, isVisible } from "@teskooano/core-state";

// Filter to active, visible objects
const activeVisible$ = createFilteredStream$(
  celestialStore.objects$,
  (obj) => isActive(obj) && isVisible(obj),
);

// Map with composed predicates
const activeRenderables = createFilteredMap(
  renderableStore.renderableObjects$,
  isActive,
);
```

**Benefits**: 60% reduction in code duplication, composable predicates, consistent filtering logic.

### 3. Stream Composition Pattern

**Rule**: Use helpers from `StreamCompositionHelpers.ts` for state composition and performance optimization.

```typescript
import {
  withCelestialState,
  withRenderableState,
  atFrameRate,
} from "@teskooano/core-state";

// Combine with full state
const userAction$ = fromEvent(button, "click").pipe(
  withCelestialState(),
  map(({ value, celestials, renderables }) => {
    return processAction(value, celestials, renderables);
  }),
);

// Throttle to ~60fps
const mouseMove$ = fromEvent(document, "mousemove").pipe(
  atFrameRate(),
  map((event) => updateUIExpensively(event)),
);
```

**Available Helpers**:

- `withCelestialState()` - Combines with celestial + renderable state
- `withRenderableState()` - Lighter-weight, renderable-only
- `atFrameRate()` - Throttles to ~60fps
- `atCustomFrameRate(fps)` - Custom throttling

### 4. Render Pipeline Events Pattern

**Rule**: Subscribe to `renderPipelineEvents` for stage-specific rendering logic.

```typescript
import { renderPipelineEvents } from "@teskooano/renderer-threejs";

// React to specific pipeline stages
renderPipelineEvents.afterObjectsUpdate$.subscribe((payload) => {
  const { deltaTime, elapsedTime, frameCount } = payload;
  this.updateObjectUI();
});

// Available events (all emit RenderPipelineStagePayload):
// - beforeUpdate$, afterControlsUpdate$, afterOrbitsUpdate$
// - afterObjectsUpdate$, afterBackgroundUpdate$, afterGridUpdate$
// - beforeRender$, afterRender$, afterOverlaysRender$, afterUpdate$
```

### 5. Plugin Factory Pattern

**Rule**: Use factory functions from `plugin-factory.ts` to define plugins.

```typescript
import { createPanelPlugin } from "@teskooano/app-ui-plugin";

export const plugin = createPanelPlugin({
  id: "my-plugin",
  name: "My Plugin",
  description: "Description",
  componentName: "my-plugin-panel",
  panelClass: MyPluginPanel,
  defaultTitle: "My Plugin",
  iconSvg: "<svg>...</svg>",
  order: 100,
  target: "panel-toolbar",
});
```

**Available Factories**:

- `createPanelPlugin` - Panel-based plugins (most common)
- `createComponentPlugin` - Component-only plugins
- `createControllerPlugin` - Service plugins
- `createInterfacePlugin` - Function plugins with toolbar
- `createFunctionPlugin` - Lightweight function-only
- `createWidgetPlugin` - Toolbar widget plugins

### 6. Event Bridge Pattern

**Rule**: Use EventBridge classes for DOM→RxJS event bridging.

```typescript
// System-level events
import { SystemEventBridge } from "@teskooano/core-state";
SystemEventBridge.getInstance().init();

// Celestial-specific events
import { CelestialEventBridge } from "@teskooano/core-state";
CelestialEventBridge.getInstance().init();

// Event flow: Core State (DOM) → EventBridge → Renderer (RxJS) → Components
```

### 7. Custom Events Constants Pattern

**Rule**: Always use `CustomEvents` constants for custom DOM events.

```typescript
import { CustomEvents } from "@teskooano/data-types";

// ✅ Correct
document.dispatchEvent(
  new CustomEvent(CustomEvents.CELESTIAL_OBJECT_DESTROYED, {
    detail: { objectId },
  }),
);

// ❌ Incorrect - string literals create typo risk
document.dispatchEvent(
  new CustomEvent("celestial-object-destroyed", { detail: { objectId } }),
);
```

### 8. MVC Directory Structure Pattern

**Rule**: Follow flat structure by default, nested only for reusable sub-components.

**Flat Structure (Most Common)**:

```
plugin-name/
├── controller/
│   └── PluginName.controller.ts
├── view/
│   ├── PluginName.view.ts
│   └── PluginName.template.ts
├── services/                      # Optional
├── index.ts
└── README.md
```

**Nested Structure (Complex Plugins)**:

```
plugin-name/
├── controller/
├── view/
├── components/                    # For reusable sub-components
│   ├── component-name/
│   │   ├── ComponentName.ts
│   │   └── ComponentName.template.ts
├── services/
├── index.ts
└── README.md
```

### 9. Event Handling Decision Matrix

**Rule**: Choose the appropriate event pattern based on communication scope.

| Scope            | Pattern           | When to Use                              |
| ---------------- | ----------------- | ---------------------------------------- |
| Within component | RxJS Streams      | Complex reactive logic, multiple sources |
| Across systems   | Custom DOM Events | Plugin communication, renderer events    |
| DOM interaction  | Direct Listeners  | Simple button clicks, native events      |

**Examples**:

```typescript
// Internal component logic - RxJS
const displayState$ = combineLatest([celestials$, renderables$]).pipe(
  debounceTime(0),
  tap(([celestials, renderables]) => this.updateDisplay()),
);

// Cross-system communication - Custom DOM Events
document.dispatchEvent(
  new CustomEvent("renderer-focus-changed", {
    detail: { objectId: "sun-001" },
  }),
);

// Native DOM events - Direct listeners
button.addEventListener("click", () => this.handleClick());
```

### 10. Trail Optimization Pattern

**Rule**: Use pre-allocated buffers and batch processing for performance-critical operations.

```typescript
// Pre-allocate buffer pools
const trailDataPool = new TrailDataPool(100, 10000); // 100 objects × 10k points

// Batch processing with intervals
const BATCH_INTERVAL = 100; // Process every 100ms

// Distance filtering to skip redundant points
const MIN_DISTANCE_SQ_TO_ADD = 1e-10;
if (dx * dx + dy * dy + dz * dz < MIN_DISTANCE_SQ_TO_ADD) {
  continue; // Skip duplicate point
}
```

**Benefits**: Reduces GC pressure, improves frame rate stability, efficient memory usage.

## Documentation Standards

### Package Documentation

- **README.md**: What, Why, Where, When, How for each package
- **ARCHITECTURE.md**: Detailed technical architecture with Mermaid diagrams
- **CHANGELOG.md**: Follow "Keep a Changelog" format

### Code Documentation

- **JSDoc**: Include functionality descriptions but omit type annotations
- **Architecture Comments**: Explain complex algorithms and design decisions
- **Performance Notes**: Document performance-critical sections

## Troubleshooting

### Common Issues

- **Circular Dependencies**: Use `@teskooano/data-types` for shared types
- **Plugin Loading**: Ensure plugin exports named `plugin` constant
- **State Synchronization**: Use reactive patterns, not manual DOM updates
- **Renderer Issues**: Check LOD distances and material updates

### Debug Tools

- **Core Debug**: Use `@teskooano/core-debug` for debugging utilities
- **Plugin Manager**: Use plugin-manager panel to inspect loaded plugins
- **State Inspection**: Use browser dev tools to inspect RxJS streams

## Security Considerations

- **No Hardcoded Secrets**: Use environment variables for sensitive data
- **Input Validation**: Validate all user inputs and external data
- **XSS Prevention**: Use proper DOM sanitization for dynamic content
- **CSP Compliance**: Follow Content Security Policy guidelines

## Large Monorepo Tips

- **Use moon commands**: `moon run <package>:<task>` for specific operations
- **Path aliases**: Use `@teskooano/*` aliases for clean imports
- **Package boundaries**: Respect package boundaries and dependencies
- **Build order**: Dependencies are handled automatically by moon
- **Hot reloading**: Development server supports HMR for plugins
