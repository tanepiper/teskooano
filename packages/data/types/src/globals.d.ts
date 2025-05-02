import type { ModularSpaceRenderer } from "@teskooano/renderer-threejs";

declare global {
  interface Window {
    renderer?: ModularSpaceRenderer;
    _saveTimeout?: ReturnType<typeof setTimeout>;
  }

  interface Performance {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
  }
}

export {};
