# Migration Plan: Refactoring `systems/celestial`

## 1. Goal

Refactor the `systems/celestial` package to align with the defined architectural blueprint. This involves separating concerns like rendering, type definitions, and potentially generation logic into dedicated packages to improve modularity, testability, and maintainability.

## 2. Problem

The current `systems/celestial` package mixes responsibilities:

- Core celestial object definitions and potentially generation logic.
- Rendering code (renderers, shaders, textures).
- Shared type definitions.
- Utility functions spanning different domains (math, physics, rendering).

This violates the separation of concerns outlined in the architecture, making the package overly large and tightly coupled.

## 3. Proposed Solution: Package Reorganization

We will move components from `systems/celestial` into the following target packages, aligning with the `ARCHITECTURE.md`:

- **`data/types`**: Will house all shared TypeScript interfaces and type definitions currently in `systems/celestial/src/types`.
- **`renderer/threejs`**: Will take over all rendering-related code:
  - `systems/celestial/src/renderers`
  - `systems/celestial/src/shaders`
  - `systems/celestial/src/textures` (or potentially a separate top-level `assets` package)
  - `systems/celestial/src/shims-glsl.d.ts`
  - Rendering-specific utilities from `systems/celestial/src/utils`.
- **`core/math` / `core/physics`**: Relevant utility functions currently in `systems/celestial/src/utils` will be moved here.
- **`systems/celestial` (Retained & Refocused)**: Will retain code specifically related to:
  - Defining the core properties and components of celestial objects (e.g., `Star`, `Planet`, `Moon`, base `CelestialObject`).
  - Procedural generation logic found in `systems/celestial/src/generation` (unless deemed complex enough for its own `systems/generation` package later).
  - Utilities specific to celestial object definition or generation.

## 4. Migration Steps

1.  **Package Setup**: Ensure target packages (`data/types`, `renderer/threejs`, `core/math`, `core/physics`) exist with the standard monorepo configuration (`package.json`, `tsconfig.json`, `moon.yml`).
2.  **Move Types**:
    - Action: Move contents of `packages/systems/celestial/src/types` to `packages/data/types/src`.
    - Update: Modify imports referencing these types across _all_ packages.
3.  **Move Rendering Assets & Code**:
    - Action: Move `renderers`, `shaders`, `textures`, and `shims-glsl.d.ts` from `packages/systems/celestial/src` to appropriate subdirectories within `packages/renderer/threejs/src` (e.g., `src/renderers/celestial`, `src/shaders/celestial`, `assets/textures/celestial`).
    - Update: Adjust imports in the moved rendering code and any code that used them.
4.  **Refactor Utilities**:
    - Action: Analyze each file in `packages/systems/celestial/src/utils`. Move functions to `core/math`, `core/physics`, `renderer/threejs`, or keep them in `systems/celestial` based on their specific purpose.
    - Update: Update imports wherever these utilities were used.
5.  **Clean `systems/celestial`**:
    - Action: Remove the now-empty `types`, `renderers`, `shaders`, `textures` directories and the moved `utils` files.
    - Action: Update `packages/systems/celestial/src/index.ts` to only export the remaining components (definitions, generation).
    - Action: Refactor `packages/systems/celestial/src/index.spec.ts` to test only the remaining functionality.
6.  **Update Dependencies**:
    - Action: Modify `package.json` files in all affected packages (`systems/celestial`, `renderer/threejs`, `data/types`, potentially others) to correctly declare dependencies on each other using `file:` paths (e.g., `"@openspace/data-types": "file:../../data/types"`).
    - Action: Run `npm install` in the monorepo root.
7.  **Testing**:
    - Action: Run `npm run test` (or the equivalent `moon` command) in the root or individually within each affected package.
    - Action: Fix any broken tests resulting from the refactoring.
8.  **Documentation**:
    - Action: Update `README.md` and `ARCHITECTURE.md` files in `systems/celestial`, `renderer/threejs`, and `data/types` to accurately reflect their new, focused responsibilities.

## 5. Rollback Plan

If significant issues arise, we can revert the changes using Git. Committing before starting the migration and after each major step (e.g., after moving types, after moving renderers) is crucial.
