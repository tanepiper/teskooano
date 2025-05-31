/**
 * Defines the payload for the orbit update event stream.
 */
export interface OrbitUpdatePayload {
  positions: Record<string, { x: number; y: number; z: number }>;
}
