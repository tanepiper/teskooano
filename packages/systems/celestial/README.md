# @teskooano/systems-celestial

## What is it?

The `@teskooano/systems-celestial` library provides concrete **renderer implementations** for different types of celestial objects within the Open Space engine. It bridges the gap between the abstract data definitions in `@teskooano/data-types` and their visual representation using `THREE.js`. It includes systems for:

- **Rendering**: Creating `THREE.Object3D` representations (meshes, materials, etc.) for various celestial object types.
- **Procedural Generation**: Generating procedural textures (color, normal maps) using techniques like 3D Simplex Noise.
- **Texture Management**: A framework for generating and caching textures.
- **Shaders**: Custom GLSL shaders for visual effects, lighting, and procedural patterns.
- **Common Utilities**: Reusable components like gravitational lensing and event dispatchers.

**Note:** This package **focuses primarily on rendering and visual generation**. Core data structures are defined in `@teskooano/data-types`, and physics/state are handled by `@teskooano/core-physics` and `@teskooano/core-state`.

## Where is it?

**Physical Location:** `/packages/systems/celestial`

**System Context:** This package sits between the data definitions and the main visualization layer, providing the specific visual implementations.

```mermaid
graph TD
    subgraph Application
        A[Application Logic]
    end

    subgraph Core State ["@teskooano/core-state"]
        B(State Stores)
    end

    subgraph Data Types ["@teskooano/data-types"]
        C(Data Contracts)
    end

    subgraph This Package ["@teskooano/systems-celestial"]
        D(Celestial Object Classes)
        E(Renderer Classes)
    end

    subgraph Lighting ["@teskooano/renderer-threejs-lighting"]
        F(Lighting System)
    end

    subgraph LOD ["@teskooano/renderer-threejs-lod"]
        G(LOD System)
    end

    A --> B
    D --> B
    D --> C
    subgraph ObjectsManager ["<b>@teskooano/renderer-threejs-objects</b><br/><i>ObjectManager</i>"]
        OM(ObjectManager)
    end
    subgraph SysCelestial ["@teskooano/systems-celestial"]
        direction LR
        CRenderer{{CelestialRenderer Interface}}
        Renderers[Specific Renderers<br/>(Star, Planet, GasGiant...)]
        TexGen[Texture Generation]
        Shaders[GLSL Shaders]
    end

    Data --> SysCelestial;
    Data --> ObjectsManager;
    State --> ObjectsManager;
    Effects --> ObjectsManager;
    SysCelestial -->|Provides Renderers| ObjectsManager;

    style SysCelestial fill:#ccf,stroke:#333,stroke-width:2px
    style ObjectsManager fill:#ffc,stroke:#333,stroke-width:2px
```

## When is it used?

The components in this package are used by visualization managers (like `ObjectManager` in `@teskooano/renderer-threejs-objects`) when:

1.  **Creating a new celestial object mesh:** The `ObjectManager` (or a factory it uses) determines the object type (`Star`, `Planet`, `GasGiant`, etc.) from the state data (`@teskooano/data-types`).
2.  \*\*Generating procedural textures for objects that require them.
3.  \*\*Updating the visual appearance of an object over time (e.g., updating shader uniforms, handling LOD).

## How does it work?

This package uses a combination of specialized renderers, procedural generation techniques, and custom shaders to create the visual representation of celestial bodies.

### Core Concepts

1.  **Renderers (`src/renderers/`)**: Each major category of celestial object (terrestrial, star, gas giant, etc.) has a dedicated renderer or set of renderers. These classes are responsible for generating the appropriate `THREE.Object3D` for a given celestial object from `@teskooano/data-types`.

    - The key method is `getLODLevels()`, which returns an array of `LODLevel` objects. Each level contains a `THREE.Object3D` and a distance threshold. This array is consumed by `@teskooano/renderer-threejs-lod` to handle automatic Level of Detail switching.
    - **Instantiation is now partially unified via a factory pattern**:
      - For **Stars** and **Gas Giants**, factory functions (`createStarMesh`, `createGasGiantMesh`) are provided. These are the intended entry points, which internally select and instantiate the correct renderer based on the object's properties.
      - For other types like **Terrestrial Planets** and **Particles**, the consumer must still manually choose and instantiate the correct renderer class (e.g., `BaseTerrestrialRenderer`).

2.  **GPU-Based Procedural Generation**: The system has moved away from CPU-based texture generation towards a more powerful, shader-based approach.

    - **Terrestrial Planets**: A single, complex shader (`procedural.fragment.glsl`) generates the entire planet surface on the fly. Its appearance is controlled by a large set of uniforms defined in the `ProceduralPlanetMaterial`.
    - **Gas Giants & Stars**: Also rely heavily on procedural shaders for their dynamic, turbulent surfaces.

3.  **Shaders (`src/shaders/`)**: Contains the GLSL code defining the visual appearance.
    - Organized by object type.
    - Implements various techniques: procedural noise (Simplex, FBM), different lighting models, atmospheric effects (Fresnel), shadows (rings), and distortion (lensing).
    - **Inconsistency**: Most shaders are loaded from external `.glsl` files, but star and gravitational lensing shaders are embedded as strings within their TypeScript files.

### Example Usage

The functions from this package are not intended to be consumed directly by the application, but rather by a `MeshFactory` that is part of the core rendering engine. The factory is responsible for holding renderer instances and creating the final `THREE.Object3D`.

```typescript
import {
  type RenderableCelestialObject,
  CelestialType,
  GasGiantClass,
  StellarType,
} from "@teskooano/data-types";
import {
  createStarMesh,
  createGasGiantMesh,
  createPlanetMesh, // Hypothetical future factory
  type CelestialRenderer,
} from "@teskooano/systems-celestial";
import { LODManager } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";

// Hypothetical usage within a high-level factory/manager
class MeshFactory {
  private lodManager: LODManager;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  // Maps to store created renderers to call their update/dispose methods
  private celestialRenderers: Map<string, CelestialRenderer> = new Map();

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.lodManager = new LODManager(camera, scene);
  }

  // The main factory method
  public createMesh(objectData: RenderableCelestialObject): THREE.Object3D {
    let mesh: THREE.Object3D | undefined;

    // Dependencies passed to the create...Mesh functions
    const deps = {
      // The factory holds the map of active renderers
      celestialRenderers: this.celestialRenderers,
      // It provides a callback for creating the final LOD object
      createLodCallback: (obj: RenderableCelestialObject, levels: any[]) => {
        const lod = this.lodManager.createLOD(levels);
        // The renderer instance is stored for the update loop
        this.celestialRenderers.set(obj.celestialObjectId, rendererInstance);
        return lod;
      },
      // Pass down core scene components for advanced effects
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
    };

    // 1. Select the appropriate factory function
    switch (objectData.type) {
      case CelestialType.GAS_GIANT:
        mesh = createGasGiantMesh(objectData, deps);
        break;
      case CelestialType.STAR:
        mesh = createStarMesh(objectData, deps);
        break;
      // case CelestialType.PLANET:
      //   mesh = createPlanetMesh(objectData, deps);
      //   break;
      default:
        // Fallback or error
        console.error(`No mesh factory found for type: ${objectData.type}`);
        mesh = new THREE.Object3D(); // Return empty object
    }

    mesh.position.copy(objectData.position);
    this.scene.add(mesh);
    return mesh;
  }

  update(time: number, timeScale: number, lightSources: any) {
    // In the main loop, update all registered renderers
    this.celestialRenderers.forEach((renderer, objectId) => {
      // Here you would get the latest objectData from a state store
      const objectData = getObjectById(objectId);
      if (objectData && renderer) {
        // Pass all required params for the update signature
        renderer.update(
          objectData,
          time,
          timeScale,
          lightSources,
          this.camera,
          this.renderer, // Pass renderer for advanced effects
          this.scene, // Pass scene for advanced effects
        );
      }
    });
    // LODManager is also updated here
    this.lodManager.update();
  }
}
```

## Installation

```bash
# Assuming usage within the monorepo
npm install @teskooano/systems-celestial --workspace=@your-app-or-package
```

## Status & Roadmap

_(See [CHANGELOG.md](./CHANGELOG.md) for version history)_

**Current Features:**

- **Renderers**: Comprehensive set of renderers for Terrestrial Planets, Moons, Stars (Main Sequence + Exotics like Black Holes and Neutron Stars), Gas Giants (Class I-V), Planetary Rings, Asteroid Fields, and Oort Clouds.
- **Procedural Generation**: Advanced GPU-based procedural generation for terrestrial and gas giant surfaces via shaders.
- **Shaders**: A rich library of custom GLSL shaders for various effects (procedural noise, lighting, day/night cycles, atmospheres, shadows, lensing).
- **Advanced Effects**: Includes complex, reusable helpers for effects like Gravitational Lensing.
- **LOD System**: All renderers integrate with the `LODManager` by providing LOD levels, though implementation strategies vary.

**Planned / Future Work:**

- **Unify Renderer Architecture**: Create standard factory functions for the remaining renderer types (Terrestrial, Particles) and standardize `update` method signatures.
- **Standardize Shader Handling**: Refactor all renderers to load shaders from external `.glsl` files, removing all embedded GLSL strings.
- **Decouple from Global State**: Remove direct dependencies on `@teskooano/core-state` from within renderer `update` loops.
- **Implement a Consistent LOD Strategy**: Unify the different LOD implementation methods into a single, consistent pattern.
- **Refactor into Services**: Continue to extract logic into reusable services to reduce code duplication, following the pattern in the terrestrial renderer.
- **Add New Renderers**: Comets, Stations, Ships.
- **Improve Test Coverage** (Vitest).

## Contributing

1.  Fork the repository
2.  Create your feature branch
3.  Commit your changes
4.  Push to the branch
5.  Create a new Pull Request

## License

MIT License - see LICENSE file for details
