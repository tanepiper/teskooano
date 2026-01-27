import {
  actions,
  celestialManager,
  seed,
  StateAccessor,
} from "@teskooano/core-state";
import { CelestialType, type CelestialObject } from "@teskooano/data-types";
import {
  EventBus,
  Events,
  type SystemEventPayload,
} from "@teskooano/ui-plugin/patterns";
import { generateSystem as generateSystemObservable } from "@teskooano/systems-procedural-generation";
import { catchError, finalize, lastValueFrom, tap, throwError } from "rxjs";

/**
 * A service dedicated to the complex process of procedurally generating a
 * new star system. It orchestrates the flow from getting a seed to processing
 * the stream of generated celestial objects and updating the application state.
 *
 * This service is UI-framework-agnostic and does not depend on any UI-specific
 * APIs. It uses EventBus for semantic UI communication and does not require
 * any UI framework dependencies.
 */
export class SystemGenerator {
  /**
   * Constructs the SystemGenerator service.
   */
  constructor() {}

  /**
   * Generates a new solar system based on a seed, updates the state,
   * and handles the overall generation pipeline. This is the primary
   * entry point for creating a new system.
   *
   * The process involves:
   * 1. Emitting EventBus events to signal generation start.
   * 2. Clearing the current state.
   * 3. Calling the procedural generation library (`@teskooano/procedural-generation`).
   * 4. Processing the resulting stream of `CelestialObject`s, adding them to the state.
   * 5. Finalizing the process by emitting EventBus events with system metadata.
   *
   * @param {string} inputSeed - The seed string to use for generation.
   * @returns {Promise<boolean>} A promise that resolves to `true` if generation
   * and state update succeeded, or `false` otherwise.
   */
  public async generateAndLoadSystem(inputSeed: string): Promise<boolean> {
    const eventBus = EventBus.getInstance();

    // Emit EventBus event to signal generation start
    // Use "system" as panelId for global/system-level events
    eventBus.emit(Events.INFO_DISPLAYED, {
      message: "Generating new star system...",
      severity: "info",
      source: "system-generator",
      panelId: "system",
    } as any);

    seed.updateSeed(inputSeed);
    const finalSeed = StateAccessor.getCurrentSeed();

    // Reset the application state before generating a new system.
    celestialManager.clearState();
    actions.resetTime();

    try {
      // Invoke the core procedural generation function.
      const { objects$ } = await generateSystemObservable(finalSeed);

      let isSystemInitialized = false;

      // Create an RxJS pipeline to process the stream of generated objects.
      const processingPipeline$ = objects$.pipe(
        tap(async (celestialObject: CelestialObject) => {
          const creationInput = {
            ...celestialObject,
            atmosphere: celestialObject.atmosphere as any,
          };

          // Handle stars properly using createSolarSystem
          if (celestialObject.type === CelestialType.STAR) {
            if (!isSystemInitialized) {
              // First star: initialize the system and clear state
              celestialManager.createSolarSystem(creationInput);
              isSystemInitialized = true;
            } else {
              // Subsequent stars: add to existing system without clearing state
              celestialManager.addObject(creationInput);
            }
          } else {
            // All other objects (planets, moons, etc.) use addCelestial
            celestialManager.addCelestial(creationInput);
          }

          // Note: Renderable objects are automatically created by the renderer system
          // when celestial objects are added to the state via celestialManager
        }),
        catchError((error) => {
          console.error(
            "[SystemGenerator] Error during object processing stream:",
            error,
          );
          return throwError(() => error);
        }),
        finalize(() => {
          actions.resetTime();

          // Emit EventBus event with system metadata
          const finalEventBus = EventBus.getInstance();
          const objects = StateAccessor.getCelestialObjects();
          const objectCount = Object.keys(objects).length;
          const currentSeed = StateAccessor.getCurrentSeed();

          finalEventBus.emit(Events.SYSTEM_GENERATED, {
            metadata: {
              seed: currentSeed || undefined,
              objectCount,
              generatedAt: Date.now(),
            },
            source: "system-generator",
            panelId: "system", // Global/system-level event
          } as SystemEventPayload);
        }),
      );

      // Wait for the entire pipeline to complete.
      await lastValueFrom(processingPipeline$, { defaultValue: undefined });
      return true;
    } catch (error) {
      console.error(
        "[SystemGenerator] Overall error in generateAndLoadSystem:",
        error,
      );

      // Emit EventBus error event
      const errorEventBus = EventBus.getInstance();
      errorEventBus.emit(Events.ERROR_OCCURRED, {
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate star system",
        severity: "error",
        error: error instanceof Error ? error : new Error(String(error)),
        source: "system-generator",
        panelId: "system", // Global/system-level event
      } as any);

      return false;
    }
  }
}
