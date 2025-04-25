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
    subgraph Data ["@teskooano/data-types"]
        CTypes[CelestialObject Types]
    end
    subgraph State ["@teskooano/core-state"]
        SimState[simulationState]
        ObjStore[renderableObjectsStore]
    end
    subgraph Effects ["@teskooano/renderer-threejs-effects"]
        LODM[LODManager]
        LightM[LightManager]
        LensH[GravitationalLensingHandler]
    end
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

1.  **Renderers (`src/renderers/`)**: Each major category of celestial object (terrestrial, star, gas giant, etc.) has a dedicated renderer or set of renderers. These implement a common conceptual interface (`CelestialRenderer`) with methods like `createMesh`, `update`, and `dispose`.

    - They are responsible for creating Three.js geometry, applying scaling, instantiating materials (often custom `ShaderMaterial` subclasses), loading textures or triggering generation, and assembling the final `Object3D`.
    - Specific renderers exist for unique objects like Earth or handle classifications like gas giant types or star spectral classes.
    - Particle systems (`THREE.Points`) are used for asteroid fields and Oort clouds.
    - Renderers may incorporate common helpers (like `GravitationalLensingHelper`) or modular components (like the `rings` renderer).
    - Factory functions (e.g., `createTerrestrialRenderer`, `createStarRenderer`) are often provided for easier instantiation.

2.  **Procedural Texture Generation (`src/generation/`)**: Primarily uses 3D Simplex noise (`simplex-noise` library) mapped onto a sphere to generate seamless color and normal map textures (`OffscreenCanvas`) for planets and moons.

    - Includes sophisticated logic (`getColorForHeight`) to map noise values to realistic color bands based on planetary surface properties.

3.  **Texture System (`src/textures/`)**: Provides a `TextureFactory` facade to access different texture generators (`TerrestrialTextureGenerator`, etc.).

    - While a `TextureGeneratorBase` exists for potential GPU/shader-based generation, the current terrestrial generation uses the CPU/Canvas method from `src/generation`.
    - Uses typed options (`TextureTypes.ts`) for configuring texture generation.

4.  **Shaders (`src/shaders/`)**: Contains the GLSL code defining the visual appearance.
    - Organized by object type.
    - Implements various techniques: procedural noise (Simplex, FBM), different lighting models, texturing (day/night, specular, normal maps), atmospheric effects (Fresnel), shadows (rings), distortion (lensing).
    - Configured via uniforms set by the materials in the renderers.

```typescript
import { ObjectManager } from '@teskooano/renderer-threejs-objects'; // Hypothetical manager
import { CelestialObject, CelestialType } from '@teskooano/data-types';
import {
  createTerrestrialRenderer,
  createStarRenderer,
  // ... other factories
  CelestialRenderer // Assuming common interface/type export
} from '@teskooano/systems-celestial';
import { CelestialMeshOptions } from './src/renderers';

// Inside ObjectManager or similar...
const objectData: CelestialObject = /* ... get object data ... */;
const lodOptions: CelestialMeshOptions = { detailLevel: 'high' }; // Example LOD
let mesh: THREE.Object3D;
let renderer: CelestialRenderer;

// Example: Get the appropriate renderer using a factory
switch (objectData.type) {
  case CelestialType.PLANET:
  case CelestialType.MOON:
    renderer = createTerrestrialRenderer(objectData);
    break;
  case CelestialType.STAR:
    // Factory might use spectralClass or stellarType from objectData.properties
    renderer = createStarRenderer(objectData.properties.spectralClass, objectData.properties.stellarType);
    break;
  // ... other types based on objectData.type or properties
  default:
    throw new Error(`Unsupported celestial type: ${objectData.type}`);
}

// Create the visual mesh using the selected renderer
mesh = renderer.createMesh(objectData, lodOptions);

// Store the renderer instance alongside the mesh to call its update/dispose methods later
// manager.storeObject(objectData.id, mesh, renderer);

// Add mesh to scene, set position using physicsToThreeJSPosition, etc.
// scene.add(mesh);
```

## Installation

```bash
# Assuming usage within the monorepo
npm install @teskooano/systems-celestial --workspace=@your-app-or-package
```

## Status & Roadmap

_(See [CHANGELOG.md](./CHANGELOG.md) for version history)_

**Current Features (v0.1.0):**

- Renderers for Terrestrial Planets, Moons, Stars (Main Sequence + Exotics), Gas Giants (Class I-V), Planetary Rings, Asteroid Fields, Oort Clouds, and a specialized Earth renderer.
- Procedural texture generation (Color + Normal maps) using 3D Simplex Noise for terrestrial bodies.
- Texture generation framework and factory.
- Custom shaders for various effects (procedural noise, lighting, day/night cycles, atmospheres, shadows, lensing).
- Common helper for Gravitational Lensing.
- Event dispatch system for texture generation progress.
- Basic LOD handling implemented inconsistently across different renderers.
- IndexedDB caching for terrestrial procedural textures.

**Planned / Future Work:**

- Unify renderer structure (Interface/Base Class).
- Consolidate texture generation strategies.
- Standardize shader loading (remove embedded star shaders).
- Decouple dependencies (IndexedDB caching, `celestialObjectsStore` access).
- Implement a consistent LOD strategy.
- Refine atmosphere rendering (address transparency issues).
- Improve procedural normal map quality.
- Add renderers for Comets, Stations, Ships.
- Improve test coverage (Vitest).
- Review static class usage.
- Remove legacy code (`diamond-square.ts`).

## Contributing

1.  Fork the repository
2.  Create your feature branch
3.  Commit your changes
4.  Push to the branch
5.  Create a new Pull Request

## License

MIT License - see LICENSE file for details
