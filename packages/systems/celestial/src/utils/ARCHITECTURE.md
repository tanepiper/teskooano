## Utilities Analysis

This directory contains small helper modules used across the `systems/celestial` package. After a refactor that removed CPU-based texture generation, this module has been simplified significantly.

**Core Components:**

1.  **`event-dispatch.ts`**: Provides a function for dispatching a global event to signal the completion of a major process.
    - `dispatchTextureGenerationComplete()`: Dispatches a `CustomEvent` named `texture-generation-complete` on the `document`. This event bubbles and is composed, allowing it to cross Shadow DOM boundaries. It is currently used by the `SystemGeneratorService` to signal when it has finished generating or clearing a system, allowing other parts of the application (like UI components) to react without being tightly coupled.

**Key Characteristics & Design:**

- **Event-Driven Communication**: Uses the browser's standard `CustomEvent` mechanism for decoupling. The `SystemGeneratorService` can signal completion without needing direct references to UI elements or other listeners.
- **Simplicity**: The module has been reduced to a single, focused utility function for a specific notification task. Obsolete code related to granular progress tracking has been removed.
