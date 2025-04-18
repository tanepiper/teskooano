import type { ModularSpaceRenderer } from '@teskooano/renderer-threejs';

declare global {
  interface Window {
    renderer?: ModularSpaceRenderer;
    _saveTimeout?: ReturnType<typeof setTimeout>;
    // Add other custom global properties here if needed
  }

  interface Performance {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
  }
}

// Adding this export makes the file a module, which is required for ambient declarations
// when using module systems like ES Modules or CommonJS.
export {}; 