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

- Install [moon](https://moonrepo.dev/) for task running and dependency management
- Node.js 24.2.0 (specified in package.json engines)

### Installation & Development

```bash
# Clone and setup
git clone https://github.com/tanepiper/teskooano.git
cd teskooano

# Install dependencies and start the main app
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

### Key Commands

**Application Commands** (run from apps/teskooano/):
- **Start dev server**: `npm run dev`
- **Build**: `npm run build`
- **Run tests**: `npm run test`

**Monorepo Commands** (run from root):
- **Format code**: `npm run format` (prettier)
- **Run all tests**: `moon run :test` (runs all package tests)
- **Run specific package tests**: `moon run <package-id>:test` (e.g., `moon run core-math:test`)
- **Build specific package**: `moon run <package-id>:build`

**Package IDs for Moon Commands:**
- Core: `core-math`, `core-physics`, `core-state`, `core-debug`
- Data: `data-types`, `data-values`
- Renderer: `renderer-threejs`, `renderer-threejs-core`, `renderer-threejs-celestial`, etc.
- Systems: `systems-procedural-generation`, `systems-solar-system`
- Celestials: `celestials-terrestrial`, `celestials-stars`, etc.
- App: `app-simulation`, `app-ui-plugin`, `design-system`

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

### Data Packages (`@teskooano/data-*`)

- **Purpose**: Shared type definitions and constant values used across the application
- **Dependencies**: Minimal dependencies, often only core packages
- **Examples**: `data-types` (shared TypeScript interfaces), `data-values` (physical constants, enums)

### Renderer Packages (`@teskooano/renderer-*`)

- **Purpose**: Three.js rendering modules with specific responsibilities
- **Pattern**: Compositional architecture with LOD management
- **Examples**: `renderer-threejs-core`, `renderer-threejs-celestial`, `renderer-threejs-orbits`, `renderer-threejs-background`, `renderer-threejs-camera`, `renderer-threejs-controls`, `renderer-threejs-helpers`, `renderer-threejs-labels`, `renderer-threejs-lighting`, `renderer-threejs-objects`

### Systems Packages (`@teskooano/systems-*`)

- **Purpose**: Domain-specific logic for celestial systems and procedural generation
- **Examples**: `systems-procedural-generation`, `systems-solar-system`

### Celestials Packages (`@teskooano/celestials-*`)

- **Purpose**: Specialized rendering logic for different types of celestial objects
- **Pattern**: Individual packages for each celestial body type (planets, stars, etc.)
- **Examples**: `celestials-terrestrial` (planets and moons), `celestials-stars`, `celestials-gas-giants`, `celestials-rings`, `celestials-asteroid-field`, `celestials-comet`, `celestials-oort-cloud`, `celestials-satellite`

### App Packages (`@teskooano/app-*`)

- **Purpose**: Application-specific functionality and UI components
- **Examples**: `app-simulation`, `app-ui-plugin`, `design-system`, `notifications`, `web-apis`

## Plugin Development Patterns

### MVC Architecture

All UI plugins follow a strict **Model-View-Controller (MVC)** pattern:

```
plugin-name/
├── controller/
│   └── PluginName.controller.ts    # Business logic and state management
├── view/
│   ├── PluginName.view.ts          # Custom element (dumb view)
│   └── PluginName.template.ts      # HTML template
├── bodies/                         # Specialized components for different celestial types
├── cards/                          # Reusable card components for displaying data
├── utils/                          # Utility functions (formatters, helpers)
├── index.ts                        # Plugin registration and component exports
└── README.md                       # Architecture documentation
```

### Plugin Registration

Teskooano uses a centralized plugin registry system for managing UI plugins:

**Plugin Registry Pattern:**
- **Registry Configuration**: Plugins are registered in `apps/teskooano/src/config/pluginRegistry.ts`
- **Plugin Definition**: Each plugin exports a `plugin` constant that defines the plugin configuration
- **Automatic Registration**: The `PluginManager` handles component registration automatically
- **No Manual Registration**: Never call `customElements.define()` manually in plugin code

**Plugin Definition Structure:**
```typescript
export const plugin = createPanelPlugin({
  id: "plugin-id",
  name: "Plugin Name",
  description: "Plugin description",
  componentName: ComponentClass.componentName,
  panelClass: ComponentClass,
  defaultTitle: "Panel Title",
  iconSvg: IconSvg,
  order: 35,
  additionalComponents: [/* additional component configs */],
  target: "engine-toolbar",
});
```

### Key Patterns

- **View**: "Dumb" custom elements that only manage DOM and delegate to controllers
- **Controller**: Contains all business logic, uses `StateSubscriptionMixin` for reactive state management, handles events
- **Services**: Reusable, injectable classes for complex business logic (e.g., `CelestialInfoViewManager`)
- **Dependency Injection**: Pass dependencies through constructors, not global state
- **State Management**: Controllers use `StateSubscriptionMixin` for automatic RxJS subscription cleanup

## Testing Strategy

### Test Organization

- **File Convention**: Test files (`<filename>.spec.ts`) adjacent to source files
- **Unit Tests**: Use Vitest for both backend and frontend
- **Integration Tests**: Use Playwright for complex UI features
- **Test Data**: Use fixed random values for deterministic tests

### Test Commands

- **All tests**: `moon run :test` (runs all package tests)
- **Specific package**: `moon run <package-id>:test` (e.g., `moon run core-math:test`)
- **Application tests**: `npm run test` from `apps/teskooano/` directory
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
- **Scene Units**: 1 scene unit = 1 AU of distance
- **Scaling**: Use `AU_METERS` constant across entire codebase
- **Vector Math**: Use `OSVector3` for physics, convert to `THREE.Vector3` for rendering

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
- **Build system**: Each package has its own `moon.yml` with build/test tasks
- **Documentation**: Each package needs README.md and ARCHITECTURE.md
- **Testing**: Use `moon run <package-id>:test` to run package-specific tests

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

- **Use moon commands**: `moon run <package-id>:<task>` for specific operations (e.g., `moon run core-math:test`)
- **Path aliases**: Use `@teskooano/*` aliases for clean imports
- **Package boundaries**: Respect package boundaries and dependencies
- **Build system**: Each package has individual `moon.yml` configuration
- **Hot reloading**: Development server supports HMR for plugins
- **Development workflow**: Run `npm run dev` from `apps/teskooano/` for development
