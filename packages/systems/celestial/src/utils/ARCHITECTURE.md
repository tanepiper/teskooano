## Utilities Analysis

This directory contains small helper modules and type definitions used across the `systems/celestial` package.

**Core Components:**

1.  **`event-dispatch.ts`**: Provides functions for dispatching custom DOM events related to texture generation progress.
    *   `dispatchTextureProgress(objectId, objectName, status, message)`: Dispatches a `CustomEvent` named `texture-progress`. The event `detail` object contains the ID and name of the celestial object, the status (`'pending'`, `'generating'`, `'cached'`, `'complete'`, `'error'`), and an optional message. This allows other parts of the application (e.g., UI components) to listen for and react to the progress of texture generation for specific objects (as seen used in `base-terrestrial.ts`).
    *   `dispatchTextureGenerationComplete(success, errorCount)`: Dispatches a `CustomEvent` named `texture-generation-complete`. The event `detail` indicates whether the overall generation process (presumably across multiple objects) was successful and how many errors occurred. This could be used for broader status updates.
    *   Both functions also log the event details to the console.

2.  **`types.ts`**: Defines TypeScript interfaces used by the utilities.
    *   `TextureProgressEventDetail`: Defines the structure of the `detail` object used in the `texture-progress` custom event, specifying the expected properties and the possible values for the `status` field.

**Key Characteristics & Design:**

*   **Event-Driven Communication**: Uses the browser's standard `CustomEvent` mechanism for decoupling. Components involved in texture generation (like `BaseTerrestrialRenderer`) can dispatch progress events without needing direct references to UI elements or other listeners.
*   **Simple Helpers**: Provides focused utility functions for a specific task (event dispatching).
*   **Type Definitions**: Centralizes the type definition for the event payload in `types.ts`. 