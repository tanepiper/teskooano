# Target Architecture: Compositional Celestial Rendering (v4 - Final)

This document proposes a new target architecture for the celestial rendering system. The goal is to move away from the current deep and rigid inheritance hierarchy (`ClassIGasGiantRenderer` -> `BaseGasGiantRenderer` -> `BaseCelestialRenderer`) towards a flexible, component-based model based on **composition over inheritance**. This version refines the factory pattern to handle the project's complexity gracefully and promote maximum code reuse, while preserving the benefits of centralized orbital data management.

## 1. Problems with the Current Architecture

As documented in `ARCHITECTURE.md`, the current system's weaknesses are:

1.  **Rigid Hierarchy:** Difficult to extend for objects with mixed features (e.g., a terrestrial planet with rings).
2.  **Poor Separation of Concerns:** Base classes are responsible for too many distinct tasks (body rendering, rings, LODs, lighting).
3.  **Encapsulation Breaking:** The `update` method has a "kitchen sink" signature, tightly coupling renderers to the entire scene state.

**However, the current system has one major strength that we must preserve:**

4.  **Centralized Orbital Data Management:** The `OrbitalManager` provides efficient, LOD-based orbital data management that should be maintained in the new architecture.

## 2. Proposed Architecture: A Unified Component Model

The new architecture is founded on a three-tier principle:

1.  **Render Layers:** Self-contained components that render a single visual aspect (e.g., `BodyLayer`, `RingSystemLayer`, `AtmosphereLayer`).
2.  **Composite Renderer:** An orchestrator that combines multiple `RenderLayer`s into a single `THREE.LOD` object.
3.  **Celestial Component:** A top-level container that manages all aspects of an object's presence in the scene (3D mesh, UI labels, orbital data, etc.).

### 2.1. The `RenderLayer` Interface

This remains the core building block. Each layer is responsible for a single piece of the visual puzzle.

```typescript
// A context object to be passed down, avoiding "kitchen sink" method signatures.
interface RenderingContext {
  time: number;
  timeScale: number;
  camera: THREE.Camera;
  lights: CalculatedLight[]; // Pre-calculated light data
  shadowCasters: CalculatedShadowCaster[]; // Pre-calculated shadow data
  orbitalData?: OrbitalData; // Optional orbital data from OrbitalManager
}

interface RenderLayer {
  getLODLevels(
    object: RenderableCelestialObject,
    context: RenderingContext,
  ): LODLevel[];
  update(object: RenderableCelestialObject, context: RenderingContext): void;
  dispose(): void;
}
```

### 2.2. The `CompositeMeshRenderer`

This class has a single, focused job: to take a collection of `RenderLayer`s and compose them into one renderable `THREE.Object3D`.

```typescript
class CompositeMeshRenderer {
  private layers: RenderLayer[];
  public mesh: THREE.LOD;

  constructor(object: RenderableCelestialObject, layers: RenderLayer[], context: RenderingContext) {
    this.layers = layers;
    this.mesh = this._buildLOD(object, layers, context);
  }

  private _buildLOD(...) {
    // Logic to get LODLevels from all layers, combine them into single groups per distance,
    // and create the final THREE.LOD object.
  }

  public update(object: RenderableCelestialObject, context: RenderingContext): void {
    // Delegate update calls to each layer.
    for (const layer of this.layers) {
      layer.update(object, context);
    }
    this.mesh.update(context.camera);
  }

  public dispose(): void {
    // Delegate dispose calls to each layer.
  }
}
```

### 2.3. The `CelestialObjectComponent`

This is the new top-level orchestrator. It represents the **entirety** of an object's manifestation in the simulation. It is the only object the main engine loop will interact with for a given celestial.

```typescript
class CelestialObjectComponent {
  public readonly objectId: string;
  private meshRenderer: CompositeMeshRenderer;
  private labelRenderer: LabelLayer; // Manages the 2D CSS label
  private orbitalManager: OrbitalManager; // Preserves orbital data management

  public get mesh(): THREE.Object3D {
    return this.meshRenderer.mesh;
  }

  constructor(object: RenderableCelestialObject, context: RenderingContext) {
    this.objectId = object.celestialObjectId;

    // Initialize orbital manager (preserved from current architecture)
    this.orbitalManager = new OrbitalManager(
      object.celestialObjectId,
      context.orbitalConfig,
    );

    // Use the factory to get the correct layers for this object type.
    const layers = getCelestialLayers(object, context);

    this.meshRenderer = new CompositeMeshRenderer(object, layers, context);
    this.labelRenderer = new LabelLayer(object, context);
  }

  public update(
    object: RenderableCelestialObject,
    context: RenderingContext,
  ): void {
    // Update orbital data first
    this.orbitalManager.update(object, context.time);

    // Enhance context with orbital data for layers that need it
    const enhancedContext = {
      ...context,
      orbitalData: {
        currentPosition: this.orbitalManager.getCurrentPosition(),
        positionHistory: this.orbitalManager.getPositionHistory(),
        shouldShowOrbitLines: this.orbitalManager.shouldShowOrbitLines(
          context.camera.position.distanceTo(object.position),
          object.type,
        ),
        shouldShowTrailLines: this.orbitalManager.shouldShowTrailLines(
          context.camera.position.distanceTo(object.position),
          object.type,
        ),
        isHighlighted: this.orbitalManager.isObjectHighlighted(),
      },
    };

    this.meshRenderer.update(object, enhancedContext);
    this.labelRenderer.update(object, enhancedContext);
  }

  public dispose(): void {
    this.meshRenderer.dispose();
    this.labelRenderer.dispose();
    this.orbitalManager.dispose();
  }

  // Public API for external systems to interact with orbital data
  public getOrbitalData(): OrbitalData {
    return {
      currentPosition: this.orbitalManager.getCurrentPosition(),
      positionHistory: this.orbitalManager.getPositionHistory(),
      shouldShowOrbitLines: this.orbitalManager.shouldShowOrbitLines(
        0,
        CelestialType.STAR,
      ),
      shouldShowTrailLines: this.orbitalManager.shouldShowTrailLines(
        0,
        CelestialType.STAR,
      ),
      isHighlighted: this.orbitalManager.isObjectHighlighted(),
    };
  }

  public setHighlighted(highlighted: boolean): void {
    this.orbitalManager.setHighlighted(highlighted);
  }

  public setShowPredictionLines(show: boolean): void {
    this.orbitalManager.setShowPredictionLines(show);
  }
}
```

## 3. The Hierarchical Factory System

To handle the simulation's complexity, we will use a hierarchical factory system. The top-level factory is a "router" that determines the object's primary type and delegates the creation of its _core, unique layers_ to a specialized sub-factory. The router then enhances this by composing the result with _common, optional layers_ and _standard, required layers_.

### 3.1. The Main `createCelestialComponent` Factory

This remains the single entry point for the rest of the application.

```typescript
// factory/celestial.factory.ts
function createCelestialComponent(
  object: RenderableCelestialObject,
  context: RenderingContext,
): CelestialObjectComponent {
  return new CelestialObjectComponent(object, context);
}
```

### 3.2. The `getCelestialLayers` Router

This function's responsibility is now three-fold:

1.  Delegate to a specialized factory to get the object's unique core layers.
2.  Check for common, optional properties (`rings`, etc.) and append the corresponding shared `RenderLayer`.
3.  Append the REQUIRED standardized low-LOD billboard layer.

```typescript
// factory/celestial.factory.ts
function getCelestialLayers(
  object: RenderableCelestialObject,
  context: RenderingContext,
): RenderLayer[] {
  // 1. Delegate to a specialized factory to get the unique CORE layers for the object.
  const coreLayers = getCelestialCoreLayers(object, context);

  // 2. Append common, OPTIONAL layers based on object properties.
  const optionalLayers: RenderLayer[] = [];
  if (object.properties.rings && object.properties.rings.length > 0) {
    optionalLayers.push(new RingSystemLayer(object));
  }
  // Other universal optional layers could be added here.

  // 3. Append the REQUIRED standardized low-LOD billboard layer. This logic lives in ONE place.
  const billboardLayer = new BillboardLayer(object, {
    color: getBaseColorForObject(object),
    albedo: object.albedo,
  });

  // 4. Return the complete, composed list of layers.
  return [...coreLayers, ...optionalLayers, billboardLayer];
}

// The getCelestialCoreLayers function is the simple router that delegates to a sub-factory.
function getCelestialCoreLayers(
  object: RenderableCelestialObject,
  context: RenderingContext,
): RenderLayer[] {
  switch (object.type) {
    case CelestialType.STAR:
      return getStarCoreLayers(object, context);
    case CelestialType.GAS_GIANT:
      return getGasGiantCoreLayers(object, context);
    case CelestialType.PLANET:
      return getPlanetCoreLayers(object, context);
    default:
      return [new DefaultBodyLayer(object)];
  }
}
```

### 3.3. Specialized Sub-Factories

The responsibility of the specialized factories is now even clearer: **create only the layers that are truly unique to that sub-type.** They no longer need to know about rings or other shared features.

**Example: Gas Giant Factory**

```typescript
// factory/gas-giant.factory.ts
import { GasGiantClass } from "@teskooano/data-types";

// This router just delegates to the correct creator for the gas giant's class.
export function getGasGiantCoreLayers(
  object: RenderableCelestialObject,
  context: RenderingContext,
): RenderLayer[] {
  const properties = object.properties as GasGiantProperties;
  switch (properties.class) {
    case GasGiantClass.I:
      return createClassIGasGiantCoreLayers(object, context);
    // ... other cases
    default:
      return [new DefaultBodyLayer(object)];
  }
}

// This function cares ONLY about creating layers unique to a Class I gas giant.
// It does NOT know about rings. That is handled by the main router.
function createClassIGasGiantCoreLayers(
  object: RenderableCelestialObject,
  context: RenderingContext,
): RenderLayer[] {
  const bodyMaterial = new ClassIMaterial({
    /* ... */
  });
  const atmosphereMaterial = new ClassIAtmosphereMaterial({
    /* ... */
  }); // Atmospheres are often type-specific

  return [
    new BodyLayer(object, bodyMaterial),
    new AtmosphereLayer(object, atmosphereMaterial),
  ];
}
```

**Example: Star Factory**

```typescript
// factory/star.factory.ts
import { StellarType, MainSequenceClass } from "@teskooano/data-types";

export function getStarCoreLayers(
  object: RenderableCelestialObject,
  context: RenderingContext,
): RenderLayer[] {
  const properties = object.properties as StarProperties;
  switch (properties.stellarType) {
    case StellarType.MAIN_SEQUENCE:
      return getMainSequenceStarCoreLayers(object, context);
    case StellarType.BLACK_HOLE:
      return [new BlackHoleLensingLayer(object)];
    // ... other cases
  }
}

// Creates the unique body and corona for a main sequence star.
function getMainSequenceStarCoreLayers(
  object: RenderableCelestialObject,
  context: RenderingContext,
): RenderLayer[] {
  const properties = object.properties as MainSequenceStarProperties;
  let material;
  switch (properties.spectralClass) {
    case MainSequenceClass.G:
      material = new ClassGStarMaterial(object);
      break;
    // ... other cases
  }
  // The corona is considered a core part of a star's visual identity.
  return [new BodyLayer(object, material), new CoronaLayer(object)];
}
```

## 4. Orbital Data Integration in the New Architecture

The `OrbitalManager` will be preserved and enhanced in the new compositional architecture:

### 4.1. Orbital Data Flow

```typescript
// The OrbitalManager remains as a core component
class OrbitalManager {
  // ... existing implementation preserved
}

// Orbital data is made available to layers through the RenderingContext
interface OrbitalData {
  currentPosition: OSVector3;
  positionHistory: OSVector3[];
  shouldShowOrbitLines: boolean;
  shouldShowTrailLines: boolean;
  isHighlighted: boolean;
}

// Layers can access orbital data when needed
class TrailLayer implements RenderLayer {
  update(object: RenderableCelestialObject, context: RenderingContext): void {
    if (context.orbitalData?.shouldShowTrailLines) {
      const trailPoints = context.orbitalData.positionHistory;
      // Render trail using the position history
    }
  }
}
```

### 4.2. Benefits of Preserved Orbital Management

1. **Centralized Data**: Each celestial object still owns its orbital data
2. **LOD Integration**: Automatic visibility control based on camera distance
3. **Performance**: Efficient memory management and throttled updates
4. **Clean API**: Simple access to orbital data through the component interface
5. **Future-Proof**: Works seamlessly with both current and future architectures

## 5. Benefits of the Final Architecture

- **Maximum Reusability (DRY):** Logic for common components like rings and billboards exists in exactly one place: the main `getCelestialLayers` router.
- **Improved Scalability & Focus:** Developers can create highly specific renderers (e.g., for a lava planet) by implementing a single `createLavaPlanetCoreLayers` function. They don't need to know how rings, billboards, or other celestial types are implemented.
- **Clear Separation of Concerns:** The factory chain now perfectly distinguishes between what is _unique_ to a celestial type versus what is a _common, composable feature_.
- **Preserved Orbital Management:** The benefits of centralized orbital data management are maintained and enhanced in the new architecture.
- **Robustness:** The architecture is now extremely robust and provides a clear, scalable, and maintainable foundation for all future rendering development.

This compositional model provides a robust, scalable, and maintainable foundation that will allow the rendering engine to evolve with the simulation's complexity while preserving the performance and organizational benefits of centralized orbital data management.
