import * as THREE from "three";

/**
 * Determines if the current display is mobile-width for material sizing
 */
const isMobileWidth = window.innerWidth < 1024;

/**
 * Shared materials used across the orbit visualization system.
 *
 * Using a central repository of materials reduces memory usage by
 * avoiding unnecessary material duplication.
 */
export const SharedMaterials = {
  /**
   * Material for rendering trail lines that show an object's recent path.
   */
  TRAIL: new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: isMobileWidth ? 2 : 5,
    transparent: true,
    opacity: 1,
    depthTest: true,
  }),

  /**
   * Material for rendering prediction lines that show an object's future path.
   */
  PREDICTION: new THREE.LineBasicMaterial({
    color: 0xff0000,
    linewidth: isMobileWidth ? 2 : 5,
    transparent: true,
    opacity: 1,
    depthTest: true,
  }),

  /**
   * Material for rendering Keplerian orbit lines.
   */
  KEPLERIAN: new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: isMobileWidth ? 1 : 3,
    transparent: true,
    opacity: 0.7,
    depthTest: true,
  }),

  /**
   * Material for rendering Keplerian orbit lines for moons.
   */
  KEPLERIAN_MOON: new THREE.LineBasicMaterial({
    color: 0xcccccc,
    linewidth: isMobileWidth ? 1 : 2,
    transparent: true,
    opacity: 0.5,
    depthTest: true,
  }),

  /**
   * Creates a clone of the specified material type.
   *
   * @param type - The material type to clone
   * @returns A new instance of the material
   */
  clone(
    type: "TRAIL" | "PREDICTION" | "KEPLERIAN" | "KEPLERIAN_MOON",
  ): THREE.LineBasicMaterial {
    return this[type].clone();
  },
};
