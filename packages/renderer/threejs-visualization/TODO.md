# TODO

- **Testing:** Add comprehensive unit tests (`.spec.ts`) for:
  - `ObjectManager`: State synchronization, object add/update/remove, mesh factory logic, renderer updates, LOD integration, destruction effects.
  - `OrbitManager`: Mode switching, Keplerian calculations, Verlet trail updates, Verlet prediction logic, cleanup, highlighting.
  - `BackgroundManager`: Layer creation, parallax updates, animation.
- **`ObjectManager` Renderer Initialization:** Explicitly initialize _all_ required renderer types (Star, Terrestrial, etc.) in `initCelestialRenderers` or document clearly why `MeshFactory` handles them dynamically.
- **`ObjectManager` Lensing:** Fully implement and test `GravitationalLensingHandler` if lensing is a required feature.
- **`ObjectManager` Debug Mode:** Ensure `setDebugMode` correctly handles existing meshes if toggled mid-simulation.
- **`OrbitManager` Performance:** Profile Verlet trail/prediction updates, especially with many objects, and optimize further if needed.
- **Configuration:** Externalize magic numbers and configuration values (e.g., orbit colors, trail lengths, prediction steps/duration, arrow scaling) into a configuration object or constants file.
- **Error Handling:** Add more robust error handling (e.g., missing parent objects for orbits, failed mesh creation).
- **Documentation:** Add JSDoc comments to all public methods/properties and refine `README.md`/`ARCHITECTURE.md`.
- **Deprecated `LabelManager`:** Remove `LabelManager` entirely and ensure `ObjectManager` uses `CSS2DManager` directly (check if `ObjectManager` constructor dependency is correct).
- **Performance:** General performance profiling, especially `ObjectManager` synchronization and `OrbitManager` updates.
- **Debris Effects:** Refine debris visuals and performance.
