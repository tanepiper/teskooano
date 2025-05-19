## App: Teskooano

# Changelog - @teskooano/teskooano

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **@teskooano/core-physics:** Introduced `createSimulationStream` in `simulation/simulation.ts`, an RxJS-based function to create an Observable stream of simulation step results. This replaces the previous imperative `runSimulation` function.
- **@teskooano/core-physics:** Added `SimulationParameters` interface to group parameters for the `updateSimulation` function.
- **@teskooano/systems-procedural-generation:** `generatePlanetObservable` function in `generators/planet.ts`: Returns an RxJS `Observable` to emit generated planet and associated ring system data reactively.
- **@teskooano/data-types:** `CelestialObjectProperties` interface to `celestial.ts`.
- **@teskooano/data-types:** `SliderValueChangePayload` interface to `events.ts`.

### Changed

- **@teskooano/web-apis:** Refactored various API utility modules for code clarity and conciseness, removing redundant comments and logging (including `idle-detection`, `invoker-commands`, `media-recorder`, `network`, `observers`, `popover`, `remote-playback`, `screen-capture`, `storage`, `workers`).
- **@teskooano/web-apis:** Updated `resizeObserver.ts` to use `RxJS BehaviorSubject` for state management, replacing `nanostores`.
- **@teskooano/web-apis:** Simplified type definitions and internal logic in several modules for better maintainability.
- **@teskooano/renderer-threejs:** Updated `RendererStateAdapter.ts` to consume RxJS Observables (`celestialObjects$`, `simulationState$`) from `@teskooano/core-state`.
- **@teskooano/renderer-threejs:** Modified `RendererStateAdapter.ts` to use `renderableActions.setAllRenderableObjects` and `visualSettings.next()` for state updates, aligning with RxJS patterns.
- **@teskooano/renderer-threejs:** Added `seed` and `temperature` properties to `RenderableCelestialObject` within `RendererStateAdapter.ts`.
- **@teskooano/renderer-threejs-core:** Updated `StateManager.ts` to use RxJS Observables (`celestialObjects$`, `simulationState$`) and helper functions (`getCelestialObjects`, `getSimulationState`) from `@teskooano/core-state`.
- **@teskooano/renderer-threejs-core:** Subscription logic in `StateManager.ts` now uses RxJS `pipe`, `pairwise`, and `startWith` for more robust state diffing.
- **@teskooano/renderer-threejs-core:** Unsubscribe logic now uses RxJS `Subscription` objects.
- **@teskooano/renderer-threejs-core:** Exported `RendererCelestialObject` type from `index.ts`.
- **@teskooano/renderer-threejs-core:** Extensive comment removal and minor code cleanup across various files, including `SceneManager.ts`, test files (`__tests__/*`), `events.ts`, `index.ts`, and `setup.ts`.
- **@teskooano/renderer-threejs-effects:** Major Refactor (`LightManager.ts`):
  - Now subscribes to `celestialObjects$` from `@teskooano/core-state` using RxJS (`pipe`, `map`, `filter`, `pairwise`).
  - Star lights are now added, updated (position, intensity), and removed reactively based on changes to star objects in the core state.
  - Intensity is now partly derived from star temperature via a new `calculateIntensity` placeholder method.
  - Removed the manual `updateStarLight` method.
  - Improved `dispose` method to correctly unsubscribe and dispose of light resources.
- **@teskooano/renderer-threejs-effects:** Added `distance` and `decay` parameters to `LightManager.addStarLight`.
- **@teskooano/renderer-threejs-effects:** `EffectComposerManager.update` now checks if `this.composer` exists before rendering.
- **@teskooano/renderer-threejs-effects:** Added `../threejs` to `tsconfig.json` references.
- **@teskooano/renderer-threejs-interaction:** `ControlsManager.ts` now uses `getSimulationState` and `setSimulationState` from `@teskooano/core-state` for camera state updates.
- **@teskooano/renderer-threejs-interaction:** `CSS2DManager.ts`:
  - Added pre-render checks to find and remove orphaned labels and to hide any `CSS2DObject` in the scene without a parent, improving stability.
  - Simplified internal logic for managing `pointer-events`.
- **@teskooano/renderer-threejs-interaction:** Extensive comment removal and minor code cleanup across various files, including test files and `setup.ts`.
- **@teskooano/renderer-threejs-interaction:** Removed Playwright and Vitest browser-specific triple-slash directives from `setup.ts`.
- **@teskooano/renderer-threejs-objects:** Major Refactor (Mesh Creation):
  - Deleted the monolithic `MeshFactory.ts` class.
  - Introduced a new `object-manager/mesh-creators/` directory with dedicated functions for creating meshes for specific celestial object types (e.g., `createStarMesh`, `createPlanetMesh`, `createRingSystemMesh`, etc.).
  - Each creator function now handles fetching appropriate LOD levels from `CelestialRenderer` instances and constructing `THREE.LOD` objects.
  - Added `createFallbackSphere.ts` for consistent fallback mesh generation.
- **@teskooano/renderer-threejs-objects:** Updated exports in `object-manager/index.ts` to include new managers like `AccelerationVisualizer`, `DebrisEffectManager`, `ObjectLifecycleManager`, and the new mesh creator exports.
- **@teskooano/renderer-threejs-objects:** Refactored `RendererUpdater.ts`:
  - Simplified update logic for standard and specialized renderers.
  - The `dispose()` method is now empty, indicating a change in how renderer resources are managed or disposed of.
  - General comment cleanup.
- **@teskooano/renderer-threejs-orbits:** Dependency Update: Replaced `nanostores` with `rxjs` for state management.
- **@teskooano/renderer-threejs-orbits:** RxJS Integration:
  - `OrbitManager.ts` and `orbit-manager/keplerian-manager.ts` now consume `renderableStore.renderableObjects$` (an RxJS Observable) and `getCelestialObjects()` from `@teskooano/core-state` (note: `getCelestialObjects()` is part of `gameStateService`).
  - Both managers subscribe to `renderableStore.renderableObjects$` to get the latest data for orbit calculations.
  - `OrbitManager.ts` subscription to `RendererStateAdapter.$visualSettings` now uses RxJS `subscribe` and `unsubscribe` methods.
  - The `dispose` method in `KeplerianOrbitManager` now correctly unsubscribes from the `renderableStore.renderableObjects$` observable.
- **@teskooano/renderer-threejs-orbits:** Extensive comment removal and minor code cleanup across most files, including `OrbitManager.ts`, `orbit-manager/keplerian-manager.ts`, `orbit-manager/orbit-calculator.ts`, and `orbit-manager/verlet-predictor.ts`.
- **@teskooano/core-physics:** Refactored various modules (`orbital/orbital.ts`, `spatial/octree.ts`, `units/*`, `utils/*`) for code clarity and conciseness by removing redundant comments and performing minor cleanup.
- **@teskooano/core-physics:** Simplified parameter passing to `updateSimulation` by using the new `SimulationParameters` interface.
- **@teskooano/core-state:** Major Refactor: Migrated core game state management (`simulationState`, `celestialObjectsStore`, `celestialHierarchyStore`, `renderableObjectsStore`, `panelState`) from Nanostores (`atom`, `map`) to RxJS `BehaviorSubject`.
  - State stores now expose an Observable (e.g., `simulationState$`) for reactive subscriptions and getter functions (e.g., `getSimulationState()`) for direct access.
  - Setter functions (e.g., `setSimulationState()`) and specific action dispatchers are now used for state modification.
- **@teskooano/core-state:** Updated `physics.ts` to use new RxJS-based state accessors (`getSimulationState`, `getCelestialObjects`).
- **@teskooano/core-state:** Refactored `factory.ts` to use new state setters (`setSimulationState`, `setCelestialHierarchy`) and getters, and removed redundant comments.
- **@teskooano/core-state:** Simplified `stores.ts`, `panelRegistry.ts`, and `panelState.ts` by removing unnecessary comments and adapting to RxJS.
- **@teskooano/core-state:** Updated `currentSeed` in `stores.ts` to use `BehaviorSubject`.
- **@teskooano/core-state:** Introduced `accelerationVectors$` observable in `stores.ts`.
- **@teskooano/core-state:** Revised exports in `packages/core/state/src/game/index.ts` to reflect the new RxJS structure.
- **@teskooano/systems-celestial:** Major Refactor (Materials & Textures):
  - Removed the entire old procedural texture generation system (deleted `textures/` directory including `TextureFactory.ts`, `TextureGeneratorBase.ts`, and individual generator classes like `GasGiantTextureGenerator.ts`, `TerrestrialTextureGenerator.ts`, etc.).
  - Removed the old material management system (deleted `MaterialFactory.ts` and individual material classes like `PlanetMaterial.ts`, `StarMaterial.ts`, etc.).
  - Introduced a new `materials/` directory with dedicated functions for material creation:
    - `createProceduralPlanetMaterial.ts`: For generating planet materials, likely using shaders and uniforms defined in `types/procedural.ts`.
    - `createRingMaterial.ts`: For ring system materials.
    - `createStarMaterial.ts`: For star materials.
  - Updated `BaseTerrestrialRenderer.ts`, `RingSystemRenderer.ts`, and `BaseStarRenderer.ts` to use these new material creation functions instead of the old factories.
- **@teskooano/systems-celestial:** Added `types/procedural.ts` defining `ProceduralPlanetUniforms` for shader-based planet rendering.
- **@teskooano/systems-celestial:** General comment cleanup and minor refactoring in `utils/event-dispatch.ts` and `vitest.config.ts`.
- **@teskooano/systems-procedural-generation:** Major Refactor (Planet Surface Properties):
  - Renamed `createDetailedSurfaceProperties` to `createProceduralSurfaceProperties` in `utils.ts`.
  - `createProceduralSurfaceProperties` now consistently returns a `ProceduralSurfaceProperties` object for all planet types.
  - This function now defines specific procedural parameters (noise settings, bump scale) and detailed color palettes (low, mid1, mid2, high) tailored for each `PlanetType` (TERRESTRIAL, ROCKY, BARREN, DESERT, ICE, LAVA, OCEAN).
  - Added `shininess` and `specularStrength` to the `ProceduralSurfaceProperties` output, supporting more unified shader-based rendering.
- **@teskooano/systems-procedural-generation:** `generators/planet.ts` now uses the new `generatePlanetObservable` and `createProceduralSurfaceProperties`.
- **@teskooano/systems-procedural-generation:** Extensive comment removal and minor code cleanup in `generators/star.ts`, `name-generator.ts`, `seeded-random.ts`, and `utils.ts`.
- **@teskooano/data-types:** Significantly reduced comments across most files for brevity (`celestial.ts`, `events.ts`, `globals.d.ts`, `index.spec.ts`, `main.ts`, `scaling.ts`, `ui.ts`).
- **@teskooano/data-types:** Reordered exports in `index.ts` and added `globals.d.ts` to the exports.

### Removed

- **@teskooano/systems-celestial:** Deleted `AtmosphereMaterial.ts`, `BaseCelestialMaterial.ts`, `GasGiantMaterial.ts`, `SpaceRockMaterial.ts`, `SunMaterial.ts` as part of the material system overhaul.
- **@teskooano/systems-celestial:** Deleted `textures/RingTextureGenerator.ts` (and other texture generators as noted above).

## [0.2.0] - 2025-05-01

### Added

- New core UI components: `Button`, `Card`, `Modal`, `OutputDisplay`, `Select`, `Slider`, `Tooltip`.
- New `ModalManager` for handling application modals.
- New `EngineToolbar` and `EngineToolbarManager` for contextual actions within engine panels.
- New `TourController` and `TourModal` for guided application tours (initial intro tour added).
- New `CameraManager` plugin for managing camera state and transitions.
- New `CelestialInfo` plugin with detailed displays for various celestial body types.
- New `EngineInfo` plugin for displaying renderer/simulation info.
- New `EngineSettings` plugin.
- New `ExternalLinks` plugin.
- Refined `FocusControl` plugin with improved list management and interactions.
- Enhanced `SettingsPanel` plugin.

### Changed

- Refactored `DockviewController` with `GroupManager` and `OverlayManager` for better layout control.
- Refactored `ToolbarController` with dedicated handler and template files.
- Updated `UiPanel` and associated controls (placeholder, celestial info, engine info).
- Updated `EnginePanel` plugin structure, separating simulation/system controls.
- Updated `CompositeEnginePanel` and `ProgressPanel` within engine panel plugin.
- Major refactor of core application structure, moving components and controllers into `core/` subdirectory.
- Integrated `@teskooano/ui-plugin` for plugin management.
- Updated dependencies.

### Removed

- Removed old component/controller locations now in `core/`.
- Removed redundant placeholder components.

### Fixed

- Various fixes related to component integration and state management after refactoring.

## [0.1.0] - 2025-04-24

### Added

- **Initial Release**
- Main application entry point (`main.ts`).
- Dockview-based UI layout management (`controllers/dockviewController.ts`).
  - Support for multiple tabbed engine views.
  - Support for dedicated controls/info group.
  - Factory for creating Dockview components (`EnginePanel`, `UiPanel`, `SettingsPanel`, `ProgressPanel`).
  - State integration for active panel (`core-state/activePanelApi`).
  - Ability to maximize/restore view groups.
- Toolbar controller (`controllers/toolbarController.ts`) with:
  - Button to add new engine/UI panel pairs.
  - Button to toggle floating settings panel.
  - Simulation controls component (`components/toolbar/SimulationControls`).
  - Seed form component (`components/toolbar/SeedForm`).
- Core UI Components:
  - `EnginePanel`: Displays a 3D simulation instance.
  - `UiPanel`: Hosts controls associated with an `EnginePanel`.
  - `SettingsPanel`: Floating panel for global settings.
  - `ProgressPanel`: Displays progress/status.
- Specific UI Control Components (`components/ui-controls/`):
  - `FocusControl`
  - `RendererInfoDisplay`
  - `CelestialInfo`
- Shared Components (`components/shared/`): e.g., `TeskooanoButton`.
- Integration with core packages: `@teskooano/app-simulation`, `@teskooano/core-state`, `@teskooano/renderer-threejs`, `@teskooano/procedural-generation`.
- Basic Vite build setup (`vite.config.ts`).

## Package: Core Math

### Added

- Initial release of the core math package.
- `OSVector3`: Custom 3D vector class with common operations (add, sub, dot, cross, normalize, etc.) and Three.js interoperability (`toThreeJS`, `applyQuaternion`).
- `constants`: Essential mathematical constants (`PI`, `EPSILON`, `DEG_TO_RAD`, etc.).
- `utils`: Namespace containing various utility functions:
  - Mathematical helpers (`clamp`, `lerp`, `degToRad`, `equals`, power-of-two functions).
  - General utilities (`generateUUID`).
  - Function modifiers (`debounce`, `throttle`, `memoize`).
- Basic project setup (`package.json`, `tsconfig.json`, `moon.yml`).
- Initial `README.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, and `TODO.md`.

## [0.2.0] - 2025-05-01

### Changed

- Updated dependencies.

## Package: App Design System

## [0.1.0] - 2025-04-24

### Added

- Initial release of the `@teskooano/design-system` package.
- CSS Custom Properties (Tokens) for colors, typography, spacing, borders, shadows, etc. defined in `src/tokens.css`.
- Base HTML element styling (reset, typography, forms, buttons) in `src/styles.css`.
- Specific styles for application layout elements (`#toolbar`, `.composite-engine-panel`).
- Theming overrides for Dockview (`.dockview-theme-abyss`) integrated into `src/tokens.css` and `src/styles.css`.
- Responsive design adjustments using media queries in `src/styles.css`.
- Export configuration in `package.json` for `styles.css` and `colors.css`.

## Package: App Web APIs

## [0.2.0] - 2025-05-01

### Changed

- Minor internal updates to media recorder and remote playback modules.
- Updated dependencies.

## [0.1.0] - 2025-04-24

### Added

- Helper functions (`startRecording`, `stopRecording`, `requestMediaPermissions`) and Observable (`mediaRecorderState$`) for the MediaRecorder API.
- Helper functions (`requestRemotePlayback`, `watchAvailability`) and Observable (`remotePlaybackAvailability$`) for the Remote Playback API.
- Helper functions (`startScreenCapture`, `stopScreenCapture`) and Observable (`screenCaptureState$`) for the Screen Capture API.
- Helper functions for `ResizeObserver` (`observeResize`) and `IntersectionObserver` (`observeIntersection`).
- Wrapper classes (`safeLocalStorage`, `safeSessionStorage`) for `localStorage` and `sessionStorage` with automatic JSON serialization/parsing.
- Basic `enhancedFetch` wrapper for the native Fetch API.
- Helper function `createWorker` for managing Web Workers.
- Helper function `createAnimationLoop` for managing `requestAnimationFrame` loops.
- Helper function `observePerformance` for `PerformanceObserver`.
- Helper function `observeMutations` for `MutationObserver`.
- Helper functions for Fullscreen API (`requestFullscreen`, `exitFullscreen`, `toggleFullscreen`, etc.).
- Helper functions for Clipboard API (`writeTextToClipboard`, `readTextFromClipboard`).
- Reactive Nanostore (`batteryStore`) for Battery Status API.
- RxJS Observable (`deviceOrientation$`) for Device Orientation Events, including permission handling for iOS 13+.
- Helper functions (`observeIdleState`, `requestIdleDetectionPermission`) and Observable (`idleState$`) for the experimental Idle Detection API.
- RxJS Observable (`animationFrames$`) for `requestAnimationFrame` timestamps.
- RxJS Observable (`fullscreenChange$`) for fullscreen state changes.
- RxJS Observable factories (`observeIntersection$`, `observeMutations$`, `observePerformance$`, `observeResize$`) as alternatives for Observer APIs.

## Package: App Simulation

# Changelog

All notable changes to the `@teskooano/app-simulation` package will be documented in this file.

## [0.2.0] - 2025-05-01

### Changed

- Internal update to `loop.ts`.
- Updated dependencies.

## [0.1.0] - 2025-04-24

### Added

- Initial implementation of the simulation package.
- Core `simulationLoop` integrating physics updates (`@teskooano/core-physics`) and state management (`@teskooano/core-state`).
- `Simulation` class for initializing the ThreeJS renderer (`@teskooano/renderer-threejs`).
- Support for simulation time scaling and pausing via `simulationState`.
- Basic N-body physics calculation (direct summation).
- Collision detection and handling (including destruction/annihilation statuses).
- Direct calculation and application of object rotations based on sidereal periods.
- Event emission for destruction (`rendererEvents`) and orbit updates (`CustomEvents`).
- `resetSystem` utility function for clearing and reloading simulation state.
- Example system initializers in the `systems/` directory (e.g., `redDwarfSystem`, `blueGiantSystem`, etc.).

## Package: Core State

# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-05-01

### Changed

- Internal update to `game/simulation.ts`.
- Updated dependencies.

## [0.1.0] - 2025-04-24

### Added

- Initial release of the core state management package.
- **Foundation**: Uses `RxJS` for reactive state management.
- **Core Stores**:
  - `celestialObjectsStore`: Map store for all `CelestialObject` data (including `physicsStateReal`).
  - `celestialHierarchyStore`: Map store for parent-child object relationships.
  - `simulationState`: Atom store for global simulation settings (time, pause state, camera, etc.).
- **State Modification**: Provided actions (`simulationActions`, `celestialActions`) for controlled updates to simulation settings and celestial objects (add, remove, update).
- **Object Creation**: Implemented `celestialFactory` to create initial `CelestialObject` states from input data, including calculating initial physics state from orbital parameters using `@teskooano/core-physics`.
- **Physics Integration**: Logic in `game/physics.ts` to synchronize state updates from the physics engine back into the `celestialObjectsStore`, including calculation of derived scaled positions and rotations.
- **Panel State**: Basic stores and registry for UI panel management (`panelState.ts`, `panelRegistry.ts`).
- Initial documentation (`README.md`, `ARCHITECTURE.md`) and project setup.

## Package: Core Physics

# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-04-24

### Added

- Initial release of the core physics engine package.
- **Core Concepts**: Established `PhysicsStateReal` using SI units (meters, kg, seconds).
- **Force Calculation**: Implemented Newtonian gravity, with placeholders for relativistic and non-gravitational forces.
- **Numerical Integration**: Provided Velocity Verlet (default), standard Euler, and symplectic Euler integrators.
- **Optimization**: Integrated Barnes-Hut algorithm via `Octree` for O(N log N) gravitational force approximation.
- **Collision Handling**: Added detection and basic resolution (momentum conservation, destruction) for celestial bodies.
- **Simulation Loop**: Core `updateSimulation` orchestrates force calculation, integration, and collision handling.
- **Orbital Mechanics**: Utilities for converting between state vectors and orbital elements.
- **Units**: Defined physical constants and unit conversion utilities.
- **Utilities**: `VectorPool` for optimizing vector allocations.
- Initial documentation (`README.md`, `ARCHITECTURE.md`) and project setup.

## Package: Core Debug

# Changelog

All notable changes to the `@teskooano/core-debug` package will be documented in this file.

## [0.1.0] - 2025-04-24

### Added

- Initial implementation of the debug utilities package.
- Central `debugConfig` for global control of logging level and visualization.
- `DebugLevel` enum and helper functions (`isDebugEnabled`, `isVisualizationEnabled`, `setVisualizationEnabled`).
- Custom logger (`logger.ts`) with multiple levels, named logger support (`createLogger`), and basic timing (`logger.time`).
- Vector debugging utilities (`vector-debug.ts`) for storing/retrieving `OSVector3` instances.
- THREE.js vector debugging utilities (`three-vector-debug.ts`) for storing/retrieving `THREE.Vector3` instances.
- Placeholder for celestial object debugging utilities (`celestial-debug.ts`).

## Package: Data Types

## [0.1.0] - 2025-04-24

### Added

- Initial release of the `@teskooano/data-types` package.
- Comprehensive TypeScript definitions for celestial objects (`CelestialObject`, `StarProperties`, `PlanetProperties`, `GasGiantProperties`, `CometProperties`, `AsteroidFieldProperties`, `OortCloudProperties`, `RingSystemProperties`).
- Detailed enumerations for classifying celestial types, planetary surfaces, stellar classes, atmospheres, etc.
- Definition of `OrbitalParameters` using real-world SI units.
- Discriminated unions for specific properties (`CelestialSpecificPropertiesUnion`) and surface types (`SurfacePropertiesUnion`).
- Core physics state definition (`PhysicsStateReal`) using real-world units.
- Scaling constants (`SCALE`, `RENDER_SCALE_AU`, etc.) and utility functions (`scaleSize`, `scaleDistance`, etc.) in `scaling.ts` for converting between real-world and visual units.
- Top-level simulation state (`SimulationState`) and physics function types (`PairForceCalculator`, `Integrator`) in `main.ts`.
- Extensive UI type definitions (`UIComponentType`, `BaseUIComponent`, `UIEventType`, etc.) in `ui.ts`.
- Basic physics type definitions (`PhysicsStateReal`) in `physics.ts`.
- Event type definitions (`events.ts`).
- Global type definitions (`globals.d.ts`).

## Package: Renderer ThreeJS

## [0.1.0] - 2025-04-24

### Added

- Initial release of the Three.js renderer **integrator** package.
- `ModularSpaceRenderer` class facade for initializing and coordinating components from `core`, `visualization`, `interaction`, and `effects` packages.
- `RendererStateAdapter` for managing shared visual state.
- Basic visualization components: Grid helper, background management.
- Object management for celestial bodies based on state changes (creation, updates, removal).
- Orbit line visualization.
- Label rendering using CSS2DRenderer.
- Camera follow functionality.
- Event system (`rendererEvents`).
- Basic setup and utility functions.

### Changed

- Updated `README.md` and `ARCHITECTURE.md` to accurately reflect the package's role as an integrator, correcting previous documentation that implied it contained all logic.

## [0.2.0] - 2025-05-01

### Changed

- Internal updates to `ModularSpaceRenderer.ts`.
- Updated dependencies.

## Package: Systems Procedural Generation

# Changelog - @teskooano/systems-procedural-generation

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-04-24

### Added

- **Initial Release**
- Deterministic star system generation from a string seed (`generateSystem`).
- Support for single, binary, trinary, and quaternary star systems with barycentric orbit calculations (`core-physics`).
- Generation of Planets (Rocky, Terrestrial, Gas Giant, Ice, Desert, Lava, Barren) with physical properties, basic atmosphere, and color.
- Generation of Moons (0-4 per planet) with orbital parameters.
- Generation of Asteroid Belts.
- Generation of Planetary Rings.
- Placement logic using exponential distribution for realistic body spacing.
- Calculation of initial physics state (`position`, `velocity`) for all generated objects.
- Seeded PRNG implementation (`seeded-random.ts`).
- Modular generator structure (`generators/` directory).
- Utility functions and constants (`utils.ts`, `constants.ts`).
- Basic unit tests for the generator (`generator.spec.ts`).

## [0.2.0] - 2025-05-01

### Changed

- Minor internal update to `generator.ts`.
- Updated dependencies.

## Package: Systems Celestial

# Changelog - @teskooano/celestial

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-04-24

### Added

- **Core Renderer Interface (`CelestialRenderer`)**: Basic contract for creating, updating, and disposing celestial object meshes.
- **Terrestrial Planet/Moon Renderer (`BaseTerrestrialRenderer`)**: Unified renderer for terrestrial bodies.
  - Supports procedural texture generation using 3D Simplex Noise (`generation/procedural-texture.ts`).
  - Includes generation of color and normal map textures (`OffscreenCanvas`).
  - Implements detailed color mapping based on surface properties (`getColorForHeight`).
  - Integrates basic IndexedDB caching for generated textures.
  - Includes `AtmosphereMaterial` for atmospheric haze effect (Fresnel-based).
  - Uses external LOD helper (`@teskooano/threejs-effects`).
  - Dispatches `texture-progress` events (`utils/event-dispatch.ts`).
- **Star Renderers (`renderers/stars/`)**: Renderers for main sequence spectral types (O, B, A, F, G, K, M) and exotic objects.
  - `BaseStarRenderer` with common logic and embedded shaders (`star.vertex.glsl`, `star.fragment.glsl`).
  - Surface effects include turbulence, pulsing, metallic fluid look.
  - `CoronaMaterial` for billboarded corona effect.
  - Specific renderers for Neutron Stars (with jets), White Dwarfs, Wolf-Rayet, Schwarzschild & Kerr Black Holes.
  - Integration with `GravitationalLensingHelper` for relevant objects.
- **Gas Giant Renderers (`renderers/gas-giants/`)**: Class-based system (Sudarsky I-V).
  - `BaseGasGiantRenderer` with common logic.
  - Specific materials and external GLSL shaders per class using procedural noise.
  - Material-level LOD support (`updateLOD`).
  - Integration with `rings` renderer.
- **Planetary Ring Renderer (`renderers/rings/`)**: Modular system for creating rings.
  - Data-driven `createRings` function based on `RingProperties`.
  - Uses `RingGeometry` and `RingMaterial` with external shaders.
  - Includes basic lighting and parent body shadow casting on rings.
- **Particle Renderers (`renderers/particles/`)**: Uses `THREE.Points`.
  - `AsteroidFieldRenderer` for disk-shaped fields.
  - `OortCloudRenderer` for spherical shell clouds (includes particle count LOD).
  - Uses shared embedded point sprite texture.
- **Earth Renderer (`renderers/earth/`)**: Specialized renderer for Earth.
  - Uses specific textures (day, night, specular, bump, cloud).
  - Layered approach with `EarthMaterial` and `CloudMaterial`.
  - Utilizes external LOD helper (`createLODSphereMesh`).
  - Implements day/night cycle based on lighting.
- **Common Utilities (`renderers/common/`)**:
  - `GravitationalLensingHelper`: Reusable gravitational lensing effect using render-to-texture.
- **Texture Generation System (`textures/`)**:
  - `TextureFactory` facade.
  - Specific generator classes (`TerrestrialTextureGenerator`, etc.).
  - `TextureTypes.ts` defining configuration options.
  - `TextureGeneratorBase` for potential shader-based generation (currently mismatched with terrestrial).
- **Shaders (`shaders/`)**: Organized GLSL shaders for various effects mentioned above.
- **Utilities (`utils/`)**:
  - Event dispatching for texture progress.
  - Type definitions for events.

### Changed

- **Texture Generation System Refactor**:
  - Added `TextureResourceManager` for centralized WebGL resource management.
  - Refactored texture generators to use instance methods instead of static methods.
  - Standardized `TextureResult` interface for all texture generators.
  - Improved texture caching with built-in caching in base generator class.
  - Enhanced resource management for efficient WebGL context usage.
  - Added support for both WebGL shader-based and canvas-based generation approaches.

## [0.2.0] - 2025-05-01

### Changed

- Updated dependencies.

## Package: Renderer ThreeJS Visualization

# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-05-01

### Changed

- Updated dependencies.

## [0.1.0] - 2025-04-24

### Added

- **`ObjectManager`:** Manages creation, update, and removal of celestial object meshes based on `renderableObjectsStore`.
  - Integrates specialized renderers from `@teskooano/systems-celestial` (Gas Giants, Asteroid Fields, Rings).
  - Integrates `LODManager` from `@teskooano/renderer-threejs-effects`.
  - Handles basic label creation/removal via `CSS2DManager`.
  - Manages light source updates via `LightManager`.
  - Includes `GravitationalLensingHandler` for potential lensing effects.
  - Includes debris visualization effects on object destruction.
- **`OrbitManager`:** Manages orbit visualizations.
  - Supports `Keplerian` mode (static ellipses) and `Verlet` mode (dynamic trails/predictions).
  - Automatically switches mode based on `simulationState` (`physicsEngine`).
  - Includes throttling for Verlet prediction/trail updates.
  - Supports highlighting of selected object's orbit/trail.
- **`BackgroundManager`:** Creates and manages a multi-layered, animated starfield background with parallax effect.
- **Helper Modules:** Includes sub-modules (`object-manager/`, `orbit-manager/`, `background-manager/`) for specific logic (mesh creation, orbit calculation, star generation, etc.).
- **State Integration:** Deeply integrated with `@teskooano/core-state` for driving updates.
- **Architecture Update**: Refactored to export individual managers (`ObjectManager`, `OrbitManager`, `BackgroundManager`) instead of a single facade class.

## Package: Renderer ThreeJS Interaction

# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-05-01

### Changed

- Updated dependencies.

## [0.1.0] - 2025-04-24

### Added

- **`ControlsManager`:** Manages `THREE.OrbitControls` for camera interaction (zoom, pan, rotate).
- **Smooth Transitions:** Implemented GSAP-based animations for `moveToPosition`, `pointCameraAtTarget`, and `setFollowTarget` camera actions.
- **Object Following:** Enabled the camera to track a `THREE.Object3D` while maintaining user orbit control.
- **State Synchronization:** Updates `@teskooano/core-state` with camera position/target on user interaction.
- **`CSS2DManager`:** Manages HTML elements overlaid on the 3D scene using `THREE.CSS2DRenderer`.
- **Layered Labels:** Supports organizing CSS2D elements (like celestial object names and AU markers) into layers (`CELESTIAL_LABELS`, `AU_MARKERS`) with visibility controls.
- **Orphan Check:** `CSS2DManager` includes a check to remove labels whose parent object no longer exists in the scene.
- **Interaction Handling:** Explicitly sets `pointer-events: none` on CSS2D elements to prevent blocking underlying canvas interactions.
- **Basic Setup:** Includes `index.ts` for exporting managers, `setup.ts` (potentially for tests), and Vitest configuration (`vitest.config.ts`).

## Package: Renderer ThreeJS Effects

# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-05-01

### Changed

- Updated dependencies.

## [0.1.0] - 2025-04-24

### Added

- Initial release of the `@teskooano/renderer-threejs-effects` package.
- `EffectsManager`: Facade class to coordinate effects.
- `LightManager`: Manages ambient light and dynamic star point lights.
- `LODManager`: Manages Level of Detail for scene objects using `THREE.LOD`.
- Helper functions in `lod-manager/` for building LOD meshes, calculating distances, and debug visualization.

## Package: Renderer ThreeJS Core

# Changelog

All notable changes to the `@teskooano/renderer-threejs-core` package will be documented in this file.

## [0.2.0] - 2025-05-01

### Changed

- Updated dependencies.

## [0.1.0] - 2025-04-24

### Added

- Initial release of the core renderer package.
- `SceneManager`: Manages Three.js Scene, Camera, and WebGLRenderer.

## Package: UI Plugin (Refactored)

# Changelog - @teskooano/ui-plugin

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-05-01

### Changed

- **Refactored `pluginManager` to a singleton class.**
- Introduced RxJS `Subject` for observing plugin registration status.
- Updated exports and types accordingly.
- Added Vite plugin helper (`vite-plugin.ts`).
- Updated dependencies.

## [0.1.0] - 2025-04-24

### Added

- Initial functional implementation of plugin manager.
