# TODO - @teskooano/app-simulation

Items to address for future development:

- **Refactor Large System Files**: Files like `systems/allCelestialsSystem.ts` (over 1000 lines) should be broken down into smaller, more manageable modules or potentially loaded from data files.
- **Review Rotation Update**: The direct manipulation of object rotation quaternions in `loop.ts` works, but consider if this logic belongs more appropriately within the physics engine update or a dedicated rotation system for better separation of concerns.
- **Optimize N-Body Calculation**: The current direct summation in `core-physics` (used by `loop.ts`) is O(n^2). Implement optimization techniques like Barnes-Hut or use GPU acceleration for larger numbers of bodies.
- **System Loading/Saving**: Implement robust loading of system definitions from external files (e.g., JSON) instead of hardcoding them in TypeScript modules.
- **Add Tests**: Increase test coverage, particularly for the `loop.ts` logic and different system initialization scenarios.
- **Improve Event Handling**: Consider a more structured event bus if communication needs become more complex.
- **Integrate Ship Physics**: Add support for simulating player/NPC ships with their own propulsion and physics interactions.
