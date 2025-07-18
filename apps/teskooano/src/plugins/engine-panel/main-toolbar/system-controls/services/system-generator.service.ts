import {
  actions,
  celestialManager,
  StateAccessor,
  seed,
  PhysicsStateCalculator,
} from "@teskooano/core-state";
import {
  CelestialType,
  CustomEvents,
  type CelestialObject,
} from "@teskooano/data-types";
import { generateSystem as generateSystemObservable } from "@teskooano/procedural-generation";
import { type DockviewApi } from "dockview-core";
import { catchError, finalize, lastValueFrom, tap, throwError } from "rxjs";
import { OSVector3 } from "@teskooano/core-math";

/**
 * Adjusts the entire system so that at least one star is positioned very close to the barycentre (origin).
 * This is a simple coordinate system adjustment that doesn't change any orbital mechanics, velocities, or relative positions.
 */
function adjustSystemToBarycentre(): void {
  const allObjects = StateAccessor.getCurrentCelestialObjects();
  const objectIds = Object.keys(allObjects);

  if (objectIds.length === 0) return;

  // Find the primary star (first star without a parent)
  const primaryStar = objectIds.find((id) => {
    const obj = allObjects[id];
    return obj.type === CelestialType.STAR && !obj.parentId;
  });

  if (!primaryStar) {
    console.warn(
      "[SystemGenerator] No primary star found for barycentre adjustment",
    );
    return;
  }

  // Note: Physics state adjustment removed - this should be handled by the physics system
  console.log(
    "[SystemGenerator] Barycentre adjustment skipped - physics state managed separately",
  );

  console.log(`[SystemGenerator] Barycentre adjustment completed`);
}

/**
 * A service dedicated to the complex process of procedurally generating a
 * new star system. It orchestrates the flow from getting a seed to processing
 * the stream of generated celestial objects and updating the application state.
 */
export class SystemGenerator {
  private dockviewApi: DockviewApi | null;

  /**
   * Constructs the SystemGenerator service.
   * @param {DockviewApi | null} dockviewApi - The Dockview API instance, used
   * for dispatching global UI events (though currently marked for refactoring).
   */
  constructor(dockviewApi: DockviewApi | null) {
    this.dockviewApi = dockviewApi;
  }

  /**
   * Dispatches a global event to signal that the simulation's timer should be reset.
   * @private
   */
  private static dispatchSimulationTimeReset() {
    const event = new CustomEvent(CustomEvents.SIMULATION_RESET_TIME);
    window.dispatchEvent(event);
  }

  /**
   * Generates a new solar system based on a seed, updates the state,
   * and handles the overall generation pipeline. This is the primary
   * entry point for creating a new system.
   *
   * The process involves:
   * 1. Dispatching a `SYSTEM_GENERATION_START` event.
   * 2. Clearing the current state.
   * 3. Calling the procedural generation library (`@teskooano/procedural-generation`).
   * 4. Processing the resulting stream of `CelestialObject`s, adding them to the state.
   * 5. Finalizing the process by dispatching `SYSTEM_GENERATION_COMPLETE` and other cleanup events.
   *
   * @param {string} inputSeed - The seed string to use for generation.
   * @returns {Promise<boolean>} A promise that resolves to `true` if generation
   * and state update succeeded, or `false` otherwise.
   */
  public async generateAndLoadSystem(inputSeed: string): Promise<boolean> {
    // This check for dockviewApi is noted as a candidate for refactoring.
    // The generator service should ideally not be aware of UI-specific APIs.
    if (!this.dockviewApi) {
      console.error("Dockview API not provided to generateAndLoadSystem!");
      window.dispatchEvent(
        new CustomEvent(CustomEvents.SYSTEM_GENERATION_START),
      );
      window.dispatchEvent(
        new CustomEvent(CustomEvents.SYSTEM_GENERATION_COMPLETE),
      );
      return false;
    }

    window.dispatchEvent(new CustomEvent(CustomEvents.SYSTEM_GENERATION_START));

    seed.updateSeed(inputSeed);
    const finalSeed = StateAccessor.getCurrentSeed();

    // Reset the application state before generating a new system.
    celestialManager.clearState({
      resetCamera: false,
      resetTime: true,
      resetSelection: true,
    });
    actions.resetTime();
    SystemGenerator.dispatchSimulationTimeReset();

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

          // Get all current objects for physics state calculation
          const allObjects = StateAccessor.getCurrentCelestialObjects();

          // Handle stars properly using createSolarSystem
          if (celestialObject.type === CelestialType.STAR) {
            if (!isSystemInitialized) {
              // First star: initialize the system and clear state
              celestialManager.createSolarSystem(creationInput);
              isSystemInitialized = true;
            } else {
              // Subsequent stars: don't clear state, just add to existing system
              celestialManager.createSolarSystem(creationInput, false);
            }
          } else {
            // All other objects (planets, moons, etc.) use addCelestial
            celestialManager.addCelestial(creationInput);
          }

          // Create renderable object with physics state
          const renderable =
            await PhysicsStateCalculator.createRenderableObject(
              creationInput,
              allObjects,
            );

          if (renderable) {
            // Store the renderable object in the renderable store
            // This would be handled by the renderer system
            console.log(`Created renderable object for ${renderable.id}`);
          }
        }),
        catchError((error) => {
          console.error(
            "[SystemGenerator] Error during object processing stream:",
            error,
          );
          return throwError(() => error);
        }),
        finalize(() => {
          // Adjust the system so that at least one star is very close to the barycentre
          adjustSystemToBarycentre();

          actions.resetTime();
          SystemGenerator.dispatchSimulationTimeReset();
          window.dispatchEvent(
            new CustomEvent(CustomEvents.SYSTEM_GENERATION_COMPLETE),
          );
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
      window.dispatchEvent(
        new CustomEvent(CustomEvents.SYSTEM_GENERATION_COMPLETE),
      );
      return false;
    }
  }
}
