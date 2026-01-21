# TODO

- **Schema Validation**: Implement JSON Schema generation or validation logic based on these TypeScript types to validate system configuration files.
- **Refine Scaling**: The `SCALE.SIZE` and `SCALE.DISTANCE` factors are now 1.0 for consistent scaling across all bodies. Type-specific multipliers are applied via scaleSize() for GAS_GIANT_SIZE (1.0), STAR_SIZE (1.0), and MOON_DISTANCE (50.0) as needed. This approach supports the logarithmic depth buffer system.
- **UI Type Usage**: Determine how the generic UI types in `ui.ts` will be concretely implemented or adapted by specific UI libraries (e.g., a potential Web Component library).
- **Ship Types**: Define types for player ships, including properties for navigation, warp drives, docking, internal systems, etc.
- **Serialization/Deserialization**: Add specific types or helper functions related to saving and loading simulation state and system configurations.
- **Event System Types**: Expand `events.ts` with more specific event payload types for simulation events (e.g., collisions, entering orbit, docking).
- **Documentation**: Add more detailed JSDoc comments, especially explaining the rationale behind certain scaling choices or complex type structures.
- **Modularization**: Consider if very large interfaces (like `CelestialObject`) could be broken down further, perhaps separating visual/rendering concerns more explicitly if needed.
