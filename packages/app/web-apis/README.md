# @teskooano/app-web-apis

This package provides utility functions and reactive stores built on top of standard browser Web APIs.
The goal is to simplify common tasks, improve performance, and provide consistent interfaces for interacting with browser features within the Teskooano engine applications.

## Features

*   **Observers:** Helpers for using `ResizeObserver` and `IntersectionObserver`.
*   **Storage:** Wrappers for `localStorage` and `sessionStorage` with automatic JSON handling.
*   **Network:** A basic wrapper around the `fetch` API.
*   **Workers:** Helper for creating and terminating Web Workers (`createWorker`).
*   **Animation:** Helper for creating controllable `requestAnimationFrame` loops (`createAnimationLoop`).

## Installation

This package is intended for internal use within the Teskooano monorepo.

## Usage

Import the desired utilities directly:

```typescript
import {
  observeResize,
  observeIntersection,
  safeLocalStorage,
  safeSessionStorage,
  enhancedFetch,
  createWorker,
  createAnimationLoop,
} from '@teskooano/app-web-apis';

// Example: Using ResizeObserver helper
const element = document.getElementById('my-element');
if (element) {
  const disconnect = observeResize(element, (entry) => {
    console.log('Element resized:', entry.contentRect);
  });

  // To stop observing later:
  // disconnect();
}

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
``` 