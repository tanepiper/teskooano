/**
 * @fileoverview Entry point for the @teskooano/app-web-apis library.
 * Exports various reactive stores and functions based on browser Web APIs.
 */

export * as ResizeObserverAPI from "./resizeObserver";
// Add other exports here as we create them, e.g.:
// export * from './breakpoint';
// export * from './deviceOrientation';

// Export observer utilities
export * as ObserversAPI from "./observers";

// Export storage utilities
export * as StorageAPI from "./storage";

// Export network utilities
export * as NetworkAPI from "./network";

// Export worker utilities
export * as WorkersAPI from "./workers";

// Export animation utilities
export * as AnimationAPI from "./animation";

// Export fullscreen utilities
export * as FullscreenAPI from "./fullscreen";

// Export clipboard utilities
export * as ClipboardAPI from "./clipboard";

// -- Mobile / Sensor APIs --
export * as BatteryAPI from "./battery";
export * as DeviceOrientationAPI from "./device-orientation";
export * as IdleDetectionAPI from "./idle-detection";

// -- Performance & Capabilities --
export * as DeviceMemoryAPI from "./device-memory";
export * as BackgroundTasksAPI from "./background-tasks";
export * as GamepadAPI from "./gamepad";

// -- UI & Interaction --
export * as DragAndDropAPI from "./drag-and-drop";
export * as InvokerCommandsAPI from "./invoker-commands";

// -- Media --
export * as MediaRecorderAPI from "./media-recorder";

// -- Casting & Remote Display --
export * as RemotePlaybackAPI from "./remote-playback";

// -- Screen & Window --
export * as ScreenCaptureAPI from "./screen-capture";

export * as PopoverAPI from "./popover";
