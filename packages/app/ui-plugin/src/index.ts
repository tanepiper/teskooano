/**
 * UI Plugin System
 *
 * This package provides a system for registering and loading UI plugins.
 * It includes types, functions, and utilities for managing plugins, components,
 * and toolbar items.
 *
 * ## New in v0.4.0: Improved Patterns
 *
 * This version introduces new patterns inspired by modern frameworks to make
 * plugin development more developer-friendly:
 *
 * - **Reactive State**: Automatic state management with computed properties
 * - **Event Bus**: Decoupled component communication
 * - **Typed Events**: Type-safe event system with payload validation
 *
 * @example Using New Patterns
 * ```typescript
 * import {
 *   ReactiveState,
 *   EventBus,
 *   Events
 * } from '@teskooano/ui-plugin/patterns';
 *
 * // Create reactive state
 * const state = new ReactiveState({ selectedObject: null });
 *
 * // Listen for events
 * EventBus.getInstance().on(Events.OBJECT_SELECTED, (event) => {
 *   state.set('selectedObject', event.payload.object);
 * });
 * ```
 *
 * Don't export the vite plugin here, it's handled in the vite config.
 */

export * from "./types.js";
export { pluginManager } from "./pluginManager.js";
export * from "./factories/plugin-factory.js";

// Export new patterns (Phase 1)
export * as Patterns from "./patterns/index.js";
