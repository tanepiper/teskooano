# Core Tour Controller Plugin

This plugin provides an interactive tour feature for the Teskooano application, guiding users through key interface elements.

## Features

- Uses `driver.js` to highlight elements and display descriptions.
- Provides functions to start, restart, and configure skipping the tour.
- Adds a "Restart Tour" button to the main toolbar.

## Registered Functions

- `tour:start`: Initiates the tour sequence.
- `tour:restart`: Resets and restarts the tour from the beginning.
- `tour:setSkip`: Configures whether the tour should be skipped on subsequent visits (expects `{ skip: boolean }` argument).

## Toolbar Items

- **Restart Tour**: Button added to the `main-toolbar` (ID: `core-tour-restart-button`) that triggers the `tour:restart` function.

## Usage

The tour typically starts automatically on the user's first visit. The `TourController` handles the logic.

Manual control can be achieved via the plugin manager:

```typescript
import { pluginManager } from "@teskooano/core"; // Adjust path

// Start the tour
pluginManager.executeFunction("tour:start");

// Restart the tour
pluginManager.executeFunction("tour:restart");

// Set the tour to be skipped next time
pluginManager.executeFunction("tour:setSkip", { skip: true });
```
