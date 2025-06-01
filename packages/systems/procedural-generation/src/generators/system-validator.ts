import type { CelestialObject } from "@teskooano/data-types";
import { Observable, from, mergeMap, toArray, catchError } from "rxjs";
import { validateAndCorrectHierarchy } from "../validation";

/**
 * Takes an observable stream of generated celestial objects, collects them,
 * validates the hierarchy, and then re-emits the validated objects as a stream.
 * @param objects$ Observable stream of CelestialObjects.
 * @returns An Observable stream of validated CelestialObjects.
 */
export function validateSystemObjects(
  objects$: Observable<CelestialObject>,
): Observable<CelestialObject> {
  return objects$.pipe(
    toArray(),
    mergeMap((allObjects) => {
      console.log(
        `[validateSystemObjects] Collected ${allObjects.length} objects. Validating hierarchy...`,
      );
      const validatedObjects = validateAndCorrectHierarchy(allObjects);
      console.log(
        `[validateSystemObjects] Validation complete. Emitting ${validatedObjects.length} validated objects.`,
      );
      return from(validatedObjects);
    }),
    catchError((err) => {
      console.error("[validateSystemObjects] Error during validation:", err);
      // Rethrow or return an error observable if needed by the caller
      throw err;
    }),
  );
}
