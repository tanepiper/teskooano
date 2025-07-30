import { CelestialType } from "@teskooano/data-types";
import * as THREE from "three";

/**
 * Centralized manager for consistent render order across all 3D objects.
 *
 * This ensures proper depth sorting and rendering order to prevent
 * visual artifacts like objects appearing through others.
 */
export class RenderOrderManager {
  /**
   * Render order constants for different object types.
   * Lower values render first (background), higher values render last (foreground).
   */
  private static readonly RENDER_ORDERS = {
    // Background elements (render first)
    BACKGROUND_SKYBOX: -1000,
    BACKGROUND_STARFIELD: -900,
    BACKGROUND_NEBULA: -800,

    // Distant particle fields
    OORT_CLOUD: -500,
    DISTANT_PARTICLES: -400,

    // Main celestial bodies (solid objects that write to depth buffer)
    STAR: 0,
    GAS_GIANT: 0,
    PLANET: 0,
    DWARF_PLANET: 0,
    MOON: 0,
    ASTEROID: 0,
    COMET_NUCLEUS: 0,
    SATELLITE: 0,

    // Volumetric effects around celestial bodies
    STELLAR_CORONA: 100,
    ATMOSPHERIC_EFFECTS: 200,
    RING_SYSTEM: 300,

    // Dynamic path visualizations (render AFTER celestial objects)
    ORBITAL_LINES_KEPLERIAN: 400,
    ORBITAL_LINES_TRAIL: 500,
    ORBITAL_LINES_PREDICTION: 600,

    // Particle effects
    COMET_TAIL: 700,
    COMET_JETS: 800,
    ASTEROID_FIELD_PARTICLES: 900,

    // Billboards and sprites
    STAR_BILLBOARD: -1000,
    DISTANCE_MARKERS: 1100, // Render AFTER celestial objects

    // UI and overlays (render last)
    DEBUG_HELPERS: 2000,
    UI_ELEMENTS: 3000,
  } as const;

  /**
   * Gets the appropriate render order for a celestial object type.
   */
  public static getRenderOrderForCelestialType(type: CelestialType): number {
    switch (type) {
      case CelestialType.STAR:
        return this.RENDER_ORDERS.STAR;
      case CelestialType.GAS_GIANT:
        return this.RENDER_ORDERS.GAS_GIANT;
      case CelestialType.PLANET:
        return this.RENDER_ORDERS.PLANET;
      case CelestialType.DWARF_PLANET:
        return this.RENDER_ORDERS.DWARF_PLANET;
      case CelestialType.MOON:
        return this.RENDER_ORDERS.MOON;
      case CelestialType.ASTEROID:
        return this.RENDER_ORDERS.ASTEROID;
      case CelestialType.COMET:
        return this.RENDER_ORDERS.COMET_NUCLEUS;
      case CelestialType.SATELLITE:
        return this.RENDER_ORDERS.SATELLITE;
      case CelestialType.ASTEROID_FIELD:
        return this.RENDER_ORDERS.ASTEROID_FIELD_PARTICLES;
      case CelestialType.OORT_CLOUD:
        return this.RENDER_ORDERS.OORT_CLOUD;
      case CelestialType.RING_SYSTEM:
        return this.RENDER_ORDERS.RING_SYSTEM;
      default:
        console.warn(
          `[RenderOrderManager] Unknown celestial type: ${type}, using default order`,
        );
        return 0;
    }
  }

  /**
   * Gets render order for specific effect types.
   */
  public static getRenderOrderForEffect(effectType: string): number {
    switch (effectType) {
      case "stellar-corona":
        return this.RENDER_ORDERS.STELLAR_CORONA;
      case "atmosphere":
        return this.RENDER_ORDERS.ATMOSPHERIC_EFFECTS;
      case "comet-tail":
        return this.RENDER_ORDERS.COMET_TAIL;
      case "comet-jets":
        return this.RENDER_ORDERS.COMET_JETS;
      case "star-billboard":
        return this.RENDER_ORDERS.STAR_BILLBOARD;
      case "distance-markers":
        return this.RENDER_ORDERS.DISTANCE_MARKERS;
      case "debug-helpers":
        return this.RENDER_ORDERS.DEBUG_HELPERS;
      default:
        return 0;
    }
  }

  /**
   * Gets render order for orbital visualization types.
   */
  public static getRenderOrderForOrbit(orbitType: string): number {
    switch (orbitType) {
      case "keplerian":
        return this.RENDER_ORDERS.ORBITAL_LINES_KEPLERIAN;
      case "trail":
        return this.RENDER_ORDERS.ORBITAL_LINES_TRAIL;
      case "prediction":
        return this.RENDER_ORDERS.ORBITAL_LINES_PREDICTION;
      default:
        return this.RENDER_ORDERS.ORBITAL_LINES_KEPLERIAN;
    }
  }

  /**
   * Applies the correct render order to a Three.js object based on its type.
   */
  public static applyRenderOrder(
    object: THREE.Object3D,
    type: CelestialType | string,
    subType?: string,
  ): void {
    let renderOrder: number;

    if (typeof type === "string") {
      // Handle string-based types (effects, orbits, etc.)
      if (subType) {
        renderOrder = this.getRenderOrderForEffect(`${type}-${subType}`);
      } else {
        renderOrder = this.getRenderOrderForEffect(type);
      }
    } else {
      // Handle CelestialType enum
      renderOrder = this.getRenderOrderForCelestialType(type);
    }

    // Apply render order recursively to all children
    object.traverse((child) => {
      child.renderOrder = renderOrder;
    });
  }

  /**
   * Validates that an object has a proper render order set.
   */
  public static validateRenderOrder(object: THREE.Object3D): boolean {
    return object.renderOrder !== undefined && object.renderOrder !== 0;
  }

  /**
   * Debug method to log all render orders in a scene.
   */
  public static debugRenderOrders(scene: THREE.Scene): void {
    const renderOrderMap = new Map<number, string[]>();

    scene.traverse((object) => {
      const order = object.renderOrder || 0;
      if (!renderOrderMap.has(order)) {
        renderOrderMap.set(order, []);
      }
      renderOrderMap.get(order)!.push(object.name || object.type || "unnamed");
    });

    console.group("[RenderOrderManager] Scene Render Orders:");
    Array.from(renderOrderMap.keys())
      .sort((a, b) => a - b)
      .forEach((order) => {
        console.log(`Order ${order}: ${renderOrderMap.get(order)!.join(", ")}`);
      });
    console.groupEnd();
  }
}
