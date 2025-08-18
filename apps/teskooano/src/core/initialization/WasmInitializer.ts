import { testWasmLibrary } from "@teskooano/core-physics";

/**
 * Service responsible for initializing WASM libraries during application startup.
 * This ensures WASM is ready before any simulation components are created.
 */
export class WasmInitializer {
  private static instance: WasmInitializer;
  private initialized = false;
  private initializationPromise: Promise<boolean> | null = null;

  private constructor() {}

  public static getInstance(): WasmInitializer {
    if (!WasmInitializer.instance) {
      WasmInitializer.instance = new WasmInitializer();
    }
    return WasmInitializer.instance;
  }

  /**
   * Initializes the WASM library. This should be called during application startup.
   * @returns Promise that resolves to true if initialization was successful, false otherwise
   */
  public async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  /**
   * Performs the actual WASM initialization
   */
  private async performInitialization(): Promise<boolean> {
    try {
      console.log("[WasmInitializer] Starting WASM library initialization...");

      const success = await testWasmLibrary();

      if (success) {
        console.log("[WasmInitializer] WASM library initialized successfully");
        this.initialized = true;
        return true;
      } else {
        console.warn("[WasmInitializer] WASM library test failed");
        return false;
      }
    } catch (error) {
      console.error("[WasmInitializer] WASM initialization failed:", error);
      return false;
    }
  }

  /**
   * Checks if WASM has been initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Gets the initialization status as a promise
   */
  public getInitializationStatus(): Promise<boolean> {
    if (this.initialized) {
      return Promise.resolve(true);
    }
    return this.initializationPromise || Promise.resolve(false);
  }
}
