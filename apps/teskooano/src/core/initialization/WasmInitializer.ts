import {
  testWasmLibrary,
  CelestialDistanceService,
} from "@teskooano/core-physics";
import { AU_METERS } from "@teskooano/data-values";

/**
 * Service responsible for initializing WASM libraries during application startup.
 * This ensures WASM is ready before any simulation components are created.
 *
 * IMPORTANT: This initializer does two things:
 * 1. Tests that the WASM library works (testWasmLibrary)
 * 2. Pre-initializes the CelestialDistanceService singleton so it's ready when simulation starts
 *
 * This prevents race conditions where the simulation tries to use WASM before it's ready.
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
   * Performs the actual WASM initialization:
   * 1. Tests that WASM library works
   * 2. Pre-initializes CelestialDistanceService singleton
   */
  private async performInitialization(): Promise<boolean> {
    try {
      console.log("[WasmInitializer] Starting WASM library initialization...");

      // Step 1: Test that WASM library works
      const testSuccess = await testWasmLibrary();
      if (!testSuccess) {
        console.warn("[WasmInitializer] WASM library test failed");
        return false;
      }
      console.log("[WasmInitializer] WASM library test passed");

      // Step 2: Pre-initialize the CelestialDistanceService singleton
      // This ensures WASM spatial partitioning is ready before any simulation starts
      console.log(
        "[WasmInitializer] Pre-initializing CelestialDistanceService...",
      );
      const celestialDistanceService = CelestialDistanceService.getInstance();
      const serviceInitialized = await celestialDistanceService.initialize({
        neighborDistance: 1000 * AU_METERS, // Same config used by SimulationManager
      });

      if (!serviceInitialized) {
        console.warn(
          "[WasmInitializer] CelestialDistanceService initialization failed",
        );
        return false;
      }

      console.log(
        "[WasmInitializer] WASM and CelestialDistanceService initialized successfully",
      );
      this.initialized = true;
      return true;
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
