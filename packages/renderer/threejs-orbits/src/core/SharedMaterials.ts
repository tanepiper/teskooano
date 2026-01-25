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
    depthTest: true, // Respect depth so planets occlude trail lines
    depthWrite: false, // Trails should not write to depth buffer to avoid occlusion conflicts
    blending: THREE.NormalBlending, // Use normal blending for proper transparency
  }),

  /**
   * Material for rendering prediction lines that show an object's future path.
   */
  PREDICTION: new THREE.LineDashedMaterial({
    color: 0xffff00,
    linewidth: isMobileWidth ? 2 : 5,
    scale: 1,
    dashSize: 10,
    gapSize: 5,
    precision: "highp",
    transparent: true,
    opacity: 0.7,
    depthTest: true, // Respect depth so planets occlude prediction lines
    depthWrite: false, // Prediction lines should not write to depth buffer
    blending: THREE.NormalBlending, // Use normal blending for proper transparency
  }),

  /**
   * Material for rendering Keplerian orbit lines.
   */
  KEPLERIAN: new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: isMobileWidth ? 1 : 3,
    transparent: true,
    opacity: 1,
    depthTest: true, // Respect depth so planets occlude orbit lines
    depthWrite: false, // Keplerian orbits should not write to depth buffer
    blending: THREE.NormalBlending, // Use normal blending for proper transparency
  }),

  /**
   * Material for rendering Keplerian orbit lines for moons.
   */
  KEPLERIAN_MOON: new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: isMobileWidth ? 1 : 2,
    transparent: true,
    opacity: 0.5,
    depthTest: true,
    depthWrite: false, // Moon orbits should not write to depth buffer
    blending: THREE.NormalBlending, // Use normal blending for proper transparency
  }),

  /**
   * Shader material for rendering Keplerian orbit trails with per-vertex alpha.
   */
  KEPLERIAN_TRAIL: new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(0xffffff) },
    },
    vertexShader: `
      attribute float alpha;
      varying float vAlpha;
      void main() {
        vAlpha = alpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying float vAlpha;
      void main() {
        if (vAlpha <= 0.0) discard;
        gl_FragColor = vec4(color, vAlpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  }),

  /**
   * Creates a clone of the specified material type.
   *
   * @param type - The material type to clone
   * @returns A new instance of the material
   */
  clone(
    type:
      | "TRAIL"
      | "PREDICTION"
      | "KEPLERIAN"
      | "KEPLERIAN_MOON"
      | "KEPLERIAN_TRAIL",
  ): THREE.LineBasicMaterial | THREE.LineDashedMaterial | THREE.ShaderMaterial {
    // Built-in Three.js materials automatically inherit logarithmic depth
    // from the renderer's logarithmicDepthBuffer setting
    return this[type].clone();
  },
};
