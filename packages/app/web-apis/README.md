# @teskooano/app-web-apis

This package provides utility functions and reactive stores built on top of standard browser Web APIs.
The goal is to simplify common tasks, improve performance, and provide consistent interfaces for interacting with browser features within the Teskooano engine applications.

## Features

*   **Observers:** Callback helpers and RxJS Observable factories (`observeResize$`, etc.) for `ResizeObserver`, `IntersectionObserver`, `PerformanceObserver`, and `MutationObserver`.
*   **Storage:** Wrappers for `localStorage` and `sessionStorage` with automatic JSON handling.
*   **Network:** A basic wrapper around the `fetch` API.
*   **Workers:** Helper for creating and terminating Web Workers (`createWorker`).
*   **Animation:** Helper (`createAnimationLoop`) and RxJS Observable (`animationFrames$`) for `requestAnimationFrame`.
*   **Fullscreen:** Helpers and RxJS Observable (`fullscreenChange$`) for managing browser fullscreen mode.
*   **Clipboard:** Async helpers for reading/writing text to the clipboard.
*   **Battery:** Reactive Nanostore (`batteryStore`) for device battery status.
*   **Device Orientation:** RxJS Observable (`deviceOrientation$`) for device orientation events (handles iOS 13+ permissions).
*   **Idle Detection (Experimental):** Callback helper, permission request function, and RxJS Observable (`idleState$`) for detecting user/screen idle state.

## Installation

This package is intended for internal use within the Teskooano monorepo.

## Usage

Import the desired utilities directly:

```typescript
import {
  // Observers (Callbacks)
  observeResize,
  observeIntersection,
  observePerformance,
  observeMutations,
  // Observers (Observables)
  observeResize$,
  observeIntersection$,
  observePerformance$,
  observeMutations$,
  // Storage
  safeLocalStorage,
  safeSessionStorage,
  // Network
  enhancedFetch,
  // Workers
  createWorker,
  // Animation
  createAnimationLoop,
  animationFrames$,
  // Fullscreen
  requestFullscreen,
  exitFullscreen,
  toggleFullscreen,
  isFullscreenActive,
  isFullscreenSupported,
  fullscreenChange$,
  // Clipboard
  writeTextToClipboard,
  readTextFromClipboard,
  isClipboardSupported,
  // Mobile / Sensor
  batteryStore,
  deviceOrientation$,
  requestDeviceOrientationPermission,
  observeIdleState,
  requestIdleDetectionPermission,
  idleState$, // Note: Default instance uses 60s threshold
} from '@teskooano/app-web-apis';

// Example: Using ResizeObserver observable
const elementToWatch = document.getElementById('resizable-thing');
if (elementToWatch) {
  const resizeSub = observeResize$(elementToWatch)
    .pipe(
      // Maybe debounce or throttle here?
      // import { debounceTime } from 'rxjs/operators';
      // debounceTime(100)
    )
    .subscribe((entries) => {
      const entry = entries[0];
      console.log('Element resized (via Observable):', entry.contentRect);
    });
  // Later...
  // resizeSub.unsubscribe();
}

// Example: Using animationFrames$ observable
const frameSub = animationFrames$.subscribe((timestamp) => {
  // console.log('Frame time:', timestamp);
});
// Later...
// frameSub.unsubscribe();

// Example: Using idleState$ observable
const idleSub = idleState$.subscribe((state) => {
  if (state.error) {
    console.error('Idle State Error:', state.error);
    return;
  }
  console.log(`Idle State (Observable): User=${state.user}, Screen=${state.screen}, Permission=${state.permissionState}`);
});
// Later...
// idleSub.unsubscribe();

// Example: Using localStorage wrapper
safeLocalStorage.setItem('userPreferences', { theme: 'dark' });
const prefs = safeLocalStorage.getItem<{ theme: string }>('userPreferences');
console.log(prefs?.theme); // 'dark'

// Example: Using Worker helper
const workerControls = createWorker('./my-worker.js');
if (workerControls) {
  workerControls.worker.postMessage({ command: 'start', data: {} });
  // Later...
  // workerControls.terminate();
}

// Example: Using Animation loop helper
const animationControls = createAnimationLoop((timestamp) => {
  console.log('Animation frame at:', timestamp);
  // Stop after 5 seconds
  if (timestamp > 5000) {
    animationControls.stop();
  }
});
animationControls.start();

// Example: Using PerformanceObserver helper
const disconnectPerf = observePerformance(
  (list, observer) => {
    list.getEntries().forEach((entry) => {
      console.log(`Performance entry: ${entry.name} - ${entry.entryType}`);
    });
  },
  { entryTypes: ['mark', 'measure'] }
);
// Later...
// if(disconnectPerf) disconnectPerf();

// Example: Using MutationObserver helper
const targetNode = document.getElementById('some-id');
if (targetNode) {
  const disconnectMutations = observeMutations(
    targetNode,
    (mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          console.log('A child node has been added or removed.');
        } else if (mutation.type === 'attributes') {
          console.log(
            `The ${mutation.attributeName} attribute was modified.`
          );
        }
      }
    },
    { attributes: true, childList: true, subtree: true }
  );
  // Later...
  // disconnectMutations();
}

// Example: Using Fullscreen API helpers
const fullscreenButton = document.getElementById('fullscreen-btn');
const gameView = document.getElementById('game-view');
if (fullscreenButton && gameView && isFullscreenSupported()) {
  fullscreenButton.addEventListener('click', () => {
    toggleFullscreen(gameView).catch((err) =>
      console.error('Fullscreen toggle failed:', err)
    );
  });
}

// Example: Using Clipboard API helpers
async function copyData() {
  if (isClipboardSupported()) {
    try {
      await writeTextToClipboard('Some data to copy');
      console.log('Text copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  }
}

async function pasteData() {
  if (isClipboardSupported()) {
    try {
      const text = await readTextFromClipboard();
      console.log('Pasted text:', text);
    } catch (err) {
      console.error('Failed to read text from clipboard:', err);
    }
  }
}

// Example: Using Battery Status store
const unsubscribeBattery = batteryStore.subscribe((state) => {
  console.log(`Battery: ${state.level * 100}%, Charging: ${state.charging}`);
});
// Later...
// unsubscribeBattery();

// Example: Using Device Orientation observable
// On iOS 13+, call requestDeviceOrientationPermission() on user interaction first!
deviceOrientation$.subscribe((orientation) => {
  if (orientation.error) {
    console.error('Orientation Error:', orientation.error);
    return;
  }
  if (orientation.permissionState === 'prompt') {
    console.log('Orientation permission required.');
    return;
  }
  console.log(`Orientation: alpha=${orientation.alpha?.toFixed(2)}, beta=${orientation.beta?.toFixed(2)}, gamma=${orientation.gamma?.toFixed(2)}`);
});

// Example: Using Idle Detection
async function setupIdleDetection() {
  // Ideally call requestIdleDetectionPermission() on user interaction first
  const permission = await requestIdleDetectionPermission();
  if (permission !== 'granted') {
    console.log('Idle detection permission not granted.');
    return;
  }

  const idleControls = await observeIdleState((state) => {
    console.log(`User state: ${state.user}, Screen state: ${state.screen}`);
    if (state.user === 'idle') {
      // Maybe reduce background activity?
    }
  });

  if (idleControls) {
    console.log('Idle observer started.');
    // Later, to stop:
    // idleControls.stop();
  }
}
setupIdleDetection();
``` 