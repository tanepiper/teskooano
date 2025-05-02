# @teskooano/app-web-apis

This package provides utility functions, reactive stores (Nanostores), and RxJS Observables built on top of standard browser Web APIs.
The goal is to simplify common tasks, improve performance by using reactive patterns, and provide consistent interfaces for interacting with browser features within Teskooano engine applications.

## Features

This package offers wrappers and helpers for a wide range of Web APIs, categorized below:

- **Observers:**
  - Callback helpers: `observeResize`, `observeIntersection`, `observePerformance`, `observeMutations`.
  - RxJS Observable factories: `observeResize$`, `observeIntersection$`, `observePerformance$`, `observeMutations$`. (Module: `ObserversAPI`)
- **Storage:**
  - Wrappers for `localStorage` and `sessionStorage` with automatic JSON handling: `safeLocalStorage`, `safeSessionStorage`. (Module: `StorageAPI`)
- **Network:**
  - A basic wrapper around the `fetch` API: `enhancedFetch`. (Module: `NetworkAPI`)
- **Workers:**
  - Helper for creating and terminating Web Workers: `createWorker`. (Module: `WorkersAPI`)
- **Animation:**
  - Helper for `requestAnimationFrame` loops: `createAnimationLoop`.
  - RxJS Observable for frame timestamps: `animationFrames$`. (Module: `AnimationAPI`)
- **Fullscreen:**
  - Helper functions: `requestFullscreen`, `exitFullscreen`, `toggleFullscreen`, `isFullscreenActive`, `isFullscreenSupported`.
  - RxJS Observable for state changes: `fullscreenChange$`. (Module: `FullscreenAPI`)
- **Clipboard:**
  - Async helpers for reading/writing text: `writeTextToClipboard`, `readTextFromClipboard`, `isClipboardSupported`. (Module: `ClipboardAPI`)
- **Battery:**
  - Reactive Nanostore for device battery status: `batteryStore`. (Module: `BatteryAPI`)
- **Device Orientation:**
  - RxJS Observable for device orientation events (handles iOS 13+ permissions): `deviceOrientation$`, `requestDeviceOrientationPermission`. (Module: `DeviceOrientationAPI`)
- **Idle Detection (Experimental):**
  - Callback helper, permission request function, and RxJS Observable: `observeIdleState`, `requestIdleDetectionPermission`, `idleState$`. (Module: `IdleDetectionAPI`)
- **Device Memory (Experimental):**
  - Reactive Nanostore providing `deviceMemory` and `effectiveMemory`: `deviceMemoryStore`. (Module: `DeviceMemoryAPI`)
- **Background Tasks (Experimental):**
  - Helpers for `requestIdleCallback`: `requestBackgroundTasksPermission`, `runInBackground`. (Module: `BackgroundTasksAPI`)
- **Gamepad:**
  - RxJS Observable for connection events: `gamepadConnection$`.
  - Nanostore for button/axis state: `gamepadStateStore`. (Module: `GamepadAPI`)
- **Drag and Drop:**
  - Helper functions for managing HTML Drag and Drop: `createDraggable`, `createDropZone`. (Module: `DragAndDropAPI`)
- **Invoker Commands (Experimental):**
  - Helper functions for the experimental Invoker API: `invokeAction`. (Module: `InvokerCommandsAPI`)
- **Media Recorder:**
  - Helper functions: `startRecording`, `stopRecording`, `requestMediaPermissions`.
  - RxJS Observable for state: `mediaRecorderState$`. (Module: `MediaRecorderAPI`)
- **Remote Playback (Experimental):**
  - Helper functions: `requestRemotePlayback`, `watchAvailability`.
  - RxJS Observable for availability: `remotePlaybackAvailability$`. (Module: `RemotePlaybackAPI`)
- **Screen Capture:**
  - Helper functions: `startScreenCapture`, `stopScreenCapture`.
  - RxJS Observable for state: `screenCaptureState$`. (Module: `ScreenCaptureAPI`)
- **Popover (Experimental):**
  - Utilities related to the Popover API. (Module: `PopoverAPI`)

## Installation

This package is intended for internal use within the Teskooano monorepo and is typically included via workspace dependencies.

## Usage

Import the desired API modules. Each module exports relevant functions, stores, or observables.

```typescript
// Import specific modules
import { AnimationAPI, StorageAPI, GamepadAPI } from "@teskooano/app-web-apis";

// Example: Using AnimationAPI
const frameSub = AnimationAPI.animationFrames$.subscribe((timestamp) => {
  // console.log('Frame time:', timestamp);
});
// Later...
// frameSub.unsubscribe();

const animLoop = AnimationAPI.createAnimationLoop((ts) => {
  console.log("Loop time:", ts);
  if (ts > 3000) animLoop.stop();
});
animLoop.start();

// Example: Using StorageAPI
StorageAPI.safeLocalStorage.setItem("settings", { volume: 0.8 });
const settings = StorageAPI.safeLocalStorage.getItem<{ volume: number }>(
  "settings",
);
console.log(settings?.volume); // 0.8

// Example: Using GamepadAPI
const padSub = GamepadAPI.gamepadStateStore.subscribe((state) => {
  if (state.connected[0]) {
    console.log("Gamepad 0 buttons:", state.buttons[0]);
    console.log("Gamepad 0 axes:", state.axes[0]);
  }
});
// Later...
// padSub(); // Unsubscribe function returned by RxJS
```

### Available API Modules

(See `src/index.ts` for the full list of exported modules like `ResizeObserverAPI`, `ObserversAPI`, `NetworkAPI`, `WorkersAPI`, `FullscreenAPI`, `ClipboardAPI`, `BatteryAPI`, `DeviceOrientationAPI`, `IdleDetectionAPI`, `DeviceMemoryAPI`, `BackgroundTasksAPI`, `DragAndDropAPI`, `InvokerCommandsAPI`, `MediaRecorderAPI`, `RemotePlaybackAPI`, `ScreenCaptureAPI`, `PopoverAPI`)

### Specific Examples

_(Keeping some detailed examples for common or complex APIs)_

#### Observers

```typescript
import { ObserversAPI } from "@teskooano/app-web-apis";

// Example: Using ResizeObserver observable
const elementToWatch = document.getElementById("resizable-thing");
if (elementToWatch) {
  const resizeSub = ObserversAPI.observeResize$(elementToWatch).subscribe(
    (entries) => {
      const entry = entries[0];
      console.log("Element resized (via Observable):", entry.contentRect);
    },
  );
  // Later...
  // resizeSub.unsubscribe();
}

// Example: Using PerformanceObserver helper
const disconnectPerf = ObserversAPI.observePerformance(
  (list, observer) => {
    list.getEntries().forEach((entry) => {
      console.log(`Performance entry: ${entry.name} - ${entry.entryType}`);
    });
  },
  { entryTypes: ["mark", "measure"] },
);
// Later...
// if(disconnectPerf) disconnectPerf();
```

#### Idle Detection

```typescript
import { IdleDetectionAPI } from "@teskooano/app-web-apis";

// Request permission on user interaction
async function setupIdleDetection() {
  try {
    const permission = await IdleDetectionAPI.requestIdleDetectionPermission();
    if (permission === "granted") {
      console.log("Idle detection permission granted.");
      // Now safe to subscribe or use observeIdleState
      const idleSub = IdleDetectionAPI.idleState$.subscribe((state) => {
        if (state.error) {
          console.error("Idle State Error:", state.error);
          return;
        }
        console.log(`Idle State: User=${state.user}, Screen=${state.screen}`);
      });
      // idleSub.unsubscribe(); // Later
    } else {
      console.warn("Idle detection permission denied.");
    }
  } catch (error) {
    console.error("Failed to request idle permission:", error);
  }
}

// Call setupIdleDetection() from a button click or similar
```

#### Device Orientation

```typescript
import { DeviceOrientationAPI } from "@teskooano/app-web-apis";

// On iOS 13+, call requestDeviceOrientationPermission() on user interaction first!
async function enableOrientation() {
  try {
    const permission =
      await DeviceOrientationAPI.requestDeviceOrientationPermission();
    if (permission === "granted") {
      console.log("Device orientation permission granted.");
      // Now safe to subscribe
      DeviceOrientationAPI.deviceOrientation$.subscribe((orientation) => {
        if (orientation.error) {
          console.error("Orientation Error:", orientation.error);
          return;
        }
        console.log(
          `Orientation: alpha=${orientation.alpha?.toFixed(2)}, beta=${orientation.beta?.toFixed(2)}, gamma=${orientation.gamma?.toFixed(2)}`,
        );
      });
    } else {
      console.warn("Device orientation permission denied.");
    }
  } catch (error) {
    console.error("Failed to request orientation permission:", error);
  }
}

// Call enableOrientation() from a button click or similar
```

_(Other examples like Fullscreen, Clipboard, Battery, etc., follow similar patterns of importing the specific module and using its exports)_

---

_Remember to commit often! `git commit -m "docs(web-apis): update README for v0.1.0"`_
