import { CelestialObject, CelestialType } from '@teskooano/data-types';
import { RenderableCelestialObject } from 'packages/renderer/threejs/src';

/**
 * Interface for LOD distance thresholds
 */
export interface LODDistances {
  closeDistance: number;
  mediumDistance: number;
  farDistance: number;
}

/**
 * Calculate LOD distances based on object type and radius
 */
export function calculateLODDistances(object: RenderableCelestialObject): LODDistances {
  // Get object radius (default to 1 if not provided)
  const radius = object.radius || 1;
  
  // Base distances relative to object size
  let farDistance = radius * 1000;    // Very far - lowest detail
  let mediumDistance = radius * 100;  // Medium distance
  let closeDistance = radius * 10;    // Close up - high detail

  // Adjust distances based on object type
  switch (object.type) {
    case CelestialType.MOON:
      // Moons switch detail sooner (smaller objects)
      farDistance *= 0.5;
      mediumDistance *= 0.5;
      closeDistance *= 0.5;
      break;
      
    case CelestialType.SPACE_ROCK:
      // Asteroids switch detail very soon (smallest objects)
      farDistance *= 0.25;
      mediumDistance *= 0.25;
      closeDistance *= 0.25;
      break;
      
    case CelestialType.STAR:
      // Stars are seen from farther away
      farDistance *= 2.0;
      mediumDistance *= 2.0;
      closeDistance *= 2.0;
      break;
    

    case CelestialType.GAS_GIANT:
      // Gas giants need larger LOD distances due to their size and complexity
      farDistance *= 3.0;    // Much further for low detail
      mediumDistance *= 2.0; // Further for medium detail
      closeDistance *= 1.5;  // Slightly further for high detail
      break;
      
    // Default distances for planets, etc.
  }
  
  return {
    closeDistance,
    mediumDistance,
    farDistance
  };
}

/**
 * Get the number of detail segments for different LOD levels
 */
export function getDetailSegments(objectType: CelestialType, detailLevel: 'high' | 'medium' | 'low' | 'very-low'): number {
  // Base segment counts for each detail level
  const segmentsByDetail = {
    'high': 256,
    'medium': 64,
    'low': 16,
    'very-low': 8
  };
  
  // Adjust segment counts based on object type
  switch (objectType) {
    case CelestialType.PLANET:
    case CelestialType.GAS_GIANT:
      return {
        'high': 256,      // Drastically reduced
        'medium': 128,       // Reduced
        'low': 64,        // Reduced
        'very-low': 32     // Reduced
      }[detailLevel];
      
    case CelestialType.MOON:
      return {
        'high': 256,       // Reduced (slightly less than planets)
        'medium': 128,      // Reduced
        'low': 64,        // Reduced
        'very-low': 32     // Reduced
      }[detailLevel];
      
    case CelestialType.SPACE_ROCK:
      return {
        'high': 64,
        'medium': 32,
        'low': 16,
        'very-low': 8
      }[detailLevel];
      
    default:
      return segmentsByDetail[detailLevel];
  }
} 