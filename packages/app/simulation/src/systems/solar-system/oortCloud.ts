import { AU } from '@teskooano/core-physics';
import { actions } from '@teskooano/core-state';
import {
  CelestialType
} from '@teskooano/data-types';

// --- Oort Cloud Constants (Estimates / Representative Values) ---
// Boundaries are highly uncertain and debated
const OORT_INNER_AU = 2000; // Approximate inner edge of the spherical cloud
const OORT_OUTER_AU = 100000; // Approximate outer edge (can extend further)
const OORT_TOTAL_MASS_KG = 1e25; // Highly uncertain estimate (could be several Earth masses)
const OORT_PARTICLE_COUNT = 50000; // Representative number for simulation/rendering

/**
 * Initializes the Oort Cloud using representative estimated data.
 */
export function initializeOortCloud(parentId: string): void {
  actions.addCelestial({
    id: 'oort-cloud',
    name: 'Oort Cloud',
    type: CelestialType.OORT_CLOUD,
    parentId: parentId,
    realMass_kg: OORT_TOTAL_MASS_KG,
    realRadius_m: OORT_OUTER_AU * AU, // Represents the outer boundary
    // Orbital parameters are not well-defined for the cloud as a whole
    // Objects within have highly varied, near-parabolic orbits.
    // We can set placeholder values for the "center" or ignore them.
    orbit: {
      realSemiMajorAxis_m: (OORT_INNER_AU + OORT_OUTER_AU) / 2 * AU,
      eccentricity: 0, // Not meaningful for the whole structure
      inclination: 0, // Cloud is spherical, so inclination isn't a useful single value
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: 1e13, // Extremely long period
    },
    temperature: 4, // Approx K (near background temperature of space)
    ignorePhysics: true, // Exclude from physics calculations
    properties: {
      type: CelestialType.OORT_CLOUD,
      composition: ['water ice', 'ammonia ice', 'methane ice'],
      innerRadiusAU: OORT_INNER_AU,
      outerRadiusAU: OORT_OUTER_AU,
      // Visual representation details
      visualDensity: 1e-15, // Extremely sparse visually
      visualParticleCount: OORT_PARTICLE_COUNT,
      visualParticleColor: '#B0C4DE', // Light Steel Blue / faint white
    },
  });
} 