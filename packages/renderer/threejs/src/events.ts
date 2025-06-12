import { type CelestialObject } from "@teskooano/data-types";
import { Subject } from "rxjs";

/**
 * Defines the shape of the payload for a destruction event.
 */
export interface DestructionPayload {
  /** The object that was destroyed. */
  object: CelestialObject;
  /** An array of debris objects created as a result of the destruction. */
  debris: CelestialObject[];
}

/**
 * A centralized, type-safe event bus for renderer-specific events, powered by RxJS.
 *
 * This replaces the previous simple event emitter with robust, observable streams,
 * ensuring type safety and consistency with the rest of the application's state
 * management.
 */
export const rendererEvents = {
  /**
   * Emits when a celestial object is destroyed and creates visual debris.
   * Components like the ObjectManager can subscribe to this to trigger
   * explosion or particle effects.
   */
  destruction$: new Subject<DestructionPayload>(),
};
