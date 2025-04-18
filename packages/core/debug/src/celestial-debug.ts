/**
 * Celestial body debug utilities
 *
 * This module provides specialized debug tools for celestial objects
 * in the Teskooano engine.
 */
import { OSVector3 } from "@teskooano/core-math";
import {
  threeVectorDebug,
  isVisualizationEnabled,
  createLogger,
} from "./index";
import { vectorDebug } from "./vector-debug";
import { ThreeVector3 } from "./three-vector-debug";

/**
 * Types of debug data that can be stored for celestial objects
 */
export enum CelestialDebugDataType {
  VECTORS = "vectors",
  ORBITAL = "orbital",
  PHYSICS = "physics",
  MATERIAL = "material",
  LIGHTING = "lighting",
}

/**
 * Interface for debug vector pairs commonly used in celestial renderers
 */
export interface CelestialVectorPairs {
  lightDirection?: ThreeVector3;
  parentPosition?: ThreeVector3;
  orbitNormal?: ThreeVector3;
  velocity?: ThreeVector3;
  angularMomentum?: ThreeVector3;
}

/**
 * Interface for orbital debug data
 */
export interface OrbitalDebugData {
  semiMajorAxis?: number;
  eccentricity?: number;
  inclination?: number;
  longitudeAscendingNode?: number;
  argumentOfPeriapsis?: number;
  meanAnomaly?: number;
  period?: number;
}

/**
 * Debug options for material properties
 */
export interface MaterialDebugData {
  type?: string;
  shaderType?: string;
  parameters?: Record<string, any>;
  textures?: string[];
}

/**
 * Physics debug data for celestial objects
 */
export interface PhysicsDebugData {
  mass?: number;
  density?: number;
  radius?: number;
  gravity?: number;
  escapeVelocity?: number;
}

/**
 * Lighting debug data
 */
export interface LightingDebugData {
  primaryLightSource?: string;
  intensity?: number;
  color?: string;
  effectiveTemperature?: number;
}

/**
 * Helper class for debugging celestial objects
 */
export class CelestialDebugger {
  private readonly logger = createLogger("CelestialDebug");

  /**
   * Set debug vectors for a celestial object
   *
   * @param objectId The celestial object ID
   * @param vectors The vector pairs to store
   */
  public setVectors(objectId: string, vectors: CelestialVectorPairs): void {
    if (!isVisualizationEnabled()) return;

    const debugName = `celestial-${objectId}`;

    // Store each vector if provided
    if (vectors.lightDirection) {
      threeVectorDebug.setVector(
        debugName,
        "lightDirection",
        vectors.lightDirection,
      );
    }

    if (vectors.parentPosition) {
      threeVectorDebug.setVector(
        debugName,
        "parentPosition",
        vectors.parentPosition,
      );
    }

    if (vectors.orbitNormal) {
      threeVectorDebug.setVector(debugName, "orbitNormal", vectors.orbitNormal);
    }

    if (vectors.velocity) {
      threeVectorDebug.setVector(debugName, "velocity", vectors.velocity);
    }

    if (vectors.angularMomentum) {
      threeVectorDebug.setVector(
        debugName,
        "angularMomentum",
        vectors.angularMomentum,
      );
    }
  }

  /**
   * Set orbital data for a celestial object
   *
   * @param objectId The celestial object ID
   * @param data The orbital data to store
   */
  public setOrbitalData(objectId: string, data: OrbitalDebugData): void {
    if (!isVisualizationEnabled()) return;

    const debugName = `celestial-${objectId}-orbital`;

    // Store as a custom property in localStorage for the UI to read
    try {
      localStorage.setItem(debugName, JSON.stringify(data));
    } catch (e) {
      this.logger.warn("Failed to store orbital debug data:", e);
    }
  }

  /**
   * Set material debug data for a celestial object
   *
   * @param objectId The celestial object ID
   * @param data The material data to store
   */
  public setMaterialData(objectId: string, data: MaterialDebugData): void {
    if (!isVisualizationEnabled()) return;

    const debugName = `celestial-${objectId}-material`;

    try {
      localStorage.setItem(debugName, JSON.stringify(data));
    } catch (e) {
      this.logger.warn("Failed to store material debug data:", e);
    }
  }

  /**
   * Set physics debug data for a celestial object
   *
   * @param objectId The celestial object ID
   * @param data The physics data to store
   */
  public setPhysicsData(objectId: string, data: PhysicsDebugData): void {
    if (!isVisualizationEnabled()) return;

    const debugName = `celestial-${objectId}-physics`;

    try {
      localStorage.setItem(debugName, JSON.stringify(data));
    } catch (e) {
      this.logger.warn("Failed to store physics debug data:", e);
    }
  }

  /**
   * Set lighting debug data for a celestial object
   *
   * @param objectId The celestial object ID
   * @param data The lighting data to store
   */
  public setLightingData(objectId: string, data: LightingDebugData): void {
    if (!isVisualizationEnabled()) return;

    const debugName = `celestial-${objectId}-lighting`;

    try {
      localStorage.setItem(debugName, JSON.stringify(data));
    } catch (e) {
      this.logger.warn("Failed to store lighting debug data:", e);
    }
  }

  /**
   * Get all debug vector names for celestial objects
   *
   * @returns Array of celestial debug names
   */
  public getCelestialDebugNames(): string[] {
    return vectorDebug
      .getNames()
      .filter((name) => name.startsWith("celestial-"));
  }

  /**
   * Clear all debug data for a specific celestial object
   *
   * @param objectId The celestial object ID to clear
   */
  public clearObjectDebugData(objectId: string): void {
    // Clear vectors
    threeVectorDebug.clearVectors(`celestial-${objectId}`);

    // Clear localStorage data
    try {
      localStorage.removeItem(`celestial-${objectId}-orbital`);
      localStorage.removeItem(`celestial-${objectId}-material`);
      localStorage.removeItem(`celestial-${objectId}-physics`);
      localStorage.removeItem(`celestial-${objectId}-lighting`);
    } catch (e) {
      this.logger.warn("Failed to clear debug data from localStorage:", e);
    }
  }

  /**
   * Clear all celestial debug data
   */
  public clearAllCelestialDebugData(): void {
    // Get all celestial debug names
    const celestialDebugNames = this.getCelestialDebugNames();

    // Clear all vectors
    celestialDebugNames.forEach((name) => {
      threeVectorDebug.clearVectors(name);
    });

    // Clear all localStorage data for celestial objects
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith("celestial-"))
        .forEach((key) => {
          localStorage.removeItem(key);
        });
    } catch (e) {
      this.logger.warn(
        "Failed to clear all celestial debug data from localStorage:",
        e,
      );
    }
  }
}

/**
 * Singleton instance of the CelestialDebugger
 */
export const celestialDebugger = new CelestialDebugger();
