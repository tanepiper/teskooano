import { Subject } from "rxjs";
import type { DestructionEvent } from "@teskooano/core-physics";

/**
 * Subject that emits when the simulation time should be reset.
 * No payload is expected.
 */
export const resetTime$ = new Subject<void>();

/**
 * Defines the payload for the orbit update event stream.
 */
export interface OrbitUpdatePayload {
  positions: Record<string, { x: number; y: number; z: number }>;
}

/**
 * Subject that emits frequently with the updated positions of celestial objects.
 * Used for updating orbit trails or other position-dependent visuals.
 */
export const orbitUpdate$ = new Subject<OrbitUpdatePayload>();

/**
 * Subject that emits when a destruction event occurs in the physics engine.
 */
export const destructionOccurred$ = new Subject<DestructionEvent>();
