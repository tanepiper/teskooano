/**
 * @fileoverview Entry point for the @teskooano/app-web-apis library.
 * Exports various reactive stores and functions based on browser Web APIs.
 */

export * from './resizeObserver';
// Add other exports here as we create them, e.g.:
// export * from './breakpoint';
// export * from './deviceOrientation';

// Export observer utilities
export * from './observers';

// Export storage utilities
export * from './storage';

// Export network utilities
export * from './network';

// Export worker utilities
export * from './workers';

// Export animation utilities
export * from './animation';

// Export fullscreen utilities
export * from './fullscreen';

// Export clipboard utilities
export * from './clipboard';

// -- Mobile / Sensor APIs --
export * from './battery';
export * from './device-orientation';
export * from './idle-detection';

// -- Performance & Capabilities --
export * from './device-memory';
export * from './background-tasks';
export * from './gamepad';

// -- UI & Interaction --
export * from './drag-and-drop';
export * from './invoker-commands'; 