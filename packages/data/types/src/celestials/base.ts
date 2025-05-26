import type { CelestialType, CelestialStatus } from "./common";
import type {
  PhysicalProperties,
  OrbitalProperties,
  PhysicsStateReal,
} from "./physics";
import type { RingProperties } from "./components";

/**
 * Base interface that every celestial body must implement.
 * Contains all the fundamental properties needed for physics simulation and rendering.
 */
export interface CelestialBase {
  // --- Core Identification & Status ---
  id: string;
  name: string;
  type: CelestialType;
  status: CelestialStatus;

  // --- Hierarchy & Physics Engine Flags ---
  parentId?: string; // What this object orbits (if anything)
  currentParentId?: string; // Current parent for dynamic systems
  ignorePhysics?: boolean; // Skip physics calculations (for static objects)

  // --- Universal Physical Properties ---
  physical: PhysicalProperties; // All the fundamental physical characteristics

  // --- Universal Orbital Properties ---
  orbit: OrbitalProperties; // Keplerian orbital elements

  // --- Real-time Physics State ---
  physicsState: PhysicsStateReal; // Current position, velocity, etc.

  // --- Ring System (Optional) ---
  rings?: RingProperties[]; // Ring system around this body (if any)

  // --- Procedural Generation ---
  seed?: string; // Seed for reproducible generation
}
