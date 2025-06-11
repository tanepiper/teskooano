# Placeholder Manager (`@teskooano/engine-panel/panels/placeholder-manager`)

This directory contains the `PlaceholderManager` class, a utility responsible for managing the display of a placeholder UI within the `CompositeEnginePanel`.

## Purpose

To provide visual feedback and options to the user when the 3D engine view is not active (e.g., when no celestial system is loaded) or when a system is in the process of being generated.

## Architecture

The `PlaceholderManager` is a simple, stateless utility class. It is instantiated by the `CompositeEnginePanel` and given references to the necessary DOM elements (`placeholderWrapper`, `placeholderMessage`, `placeholderActionArea`, `engineContainer`).

It exposes two primary methods:

- **`showMessage(isGenerating: boolean)`**: Updates the content of the placeholder (e.g., "Load a System" or "Generating...") and makes the placeholder visible, hiding the main engine container.
- **`hide()`**: Hides the placeholder and makes the main engine container visible.

This manager does not hold any subscriptions or complex logic; it simply manipulates the visibility and content of pre-existing DOM elements based on external triggers (primarily from the `PanelLifecycleManager`).
