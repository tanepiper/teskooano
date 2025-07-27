import * as THREE from "three";

/**
 * Helper class for creating individual THREE.Light instances with consistent configuration.
 * This is a utility factory for creating lights that can be used with the existing
 * @teskooano/renderer-threejs-lighting system.
 */
export class LightingHelper {
  /**
   * Creates an ambient light with consistent configuration.
   *
   * @param color - Light color (default: 0xffffff)
   * @param intensity - Light intensity (default: 0.3)
   * @returns The created ambient light
   */
  static createAmbientLight(
    color: number = 0xffffff,
    intensity: number = 0.3,
  ): THREE.AmbientLight {
    return new THREE.AmbientLight(color, intensity);
  }

  /**
   * Creates a directional light with consistent configuration.
   *
   * @param color - Light color (default: 0xffffff)
   * @param intensity - Light intensity (default: 0.7)
   * @param position - Light position (default: [10, 10, 5])
   * @param castShadow - Whether to enable shadow casting (default: true)
   * @param shadowMapSize - Shadow map resolution (default: 2048)
   * @returns The created directional light
   */
  static createDirectionalLight(
    color: number = 0xffffff,
    intensity: number = 0.7,
    position: [number, number, number] = [10, 10, 5],
    castShadow: boolean = true,
    shadowMapSize: number = 2048,
  ): THREE.DirectionalLight {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(...position);

    if (castShadow) {
      light.castShadow = true;
      light.shadow.mapSize.width = shadowMapSize;
      light.shadow.mapSize.height = shadowMapSize;
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = 500;
    }

    return light;
  }

  /**
   * Creates a hemisphere light for natural outdoor lighting.
   *
   * @param skyColor - Sky color (default: 0x87ceeb)
   * @param groundColor - Ground color (default: 0x8b4513)
   * @param intensity - Light intensity (default: 0.6)
   * @param position - Light position (default: [0, 20, 0])
   * @returns The created hemisphere light
   */
  static createHemisphereLight(
    skyColor: number = 0x87ceeb,
    groundColor: number = 0x8b4513,
    intensity: number = 0.6,
    position: [number, number, number] = [0, 20, 0],
  ): THREE.HemisphereLight {
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    light.position.set(...position);
    return light;
  }

  /**
   * Creates a point light for localized illumination.
   *
   * @param color - Light color (default: 0xffffff)
   * @param intensity - Light intensity (default: 1.0)
   * @param distance - Light distance (default: 0 - infinite)
   * @param decay - Light decay factor (default: 2)
   * @param position - Light position (default: [0, 0, 0])
   * @param castShadow - Whether to enable shadow casting (default: false)
   * @param shadowMapSize - Shadow map resolution (default: 1024)
   * @returns The created point light
   */
  static createPointLight(
    options: {
      color?: number;
      intensity?: number;
      distance?: number;
      decay?: number;
      position?: [number, number, number];
      castShadow?: boolean;
      shadowMapSize?: number;
      name?: string;
    } = {},
  ): THREE.PointLight {
    const {
      color = 0xffffff,
      intensity = 1.0,
      distance = 0,
      decay = 2,
      position = [0, 0, 0],
      castShadow = false,
      shadowMapSize = 1024,
      name,
    } = options;

    const light = new THREE.PointLight(color, intensity, distance, decay);
    light.position.set(...position);
    light.name =
      name ?? `point-light-${color}-${intensity}-${distance}-${decay}`;
    if (castShadow) {
      light.castShadow = true;
      light.shadow.mapSize.width = shadowMapSize;
      light.shadow.mapSize.height = shadowMapSize;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 5000;
    }

    return light;
  }

  /**
   * Creates a spot light for focused directional illumination.
   *
   * @param color - Light color (default: 0xffffff)
   * @param intensity - Light intensity (default: 1.0)
   * @param distance - Light distance (default: 0 - infinite)
   * @param angle - Light angle in radians (default: Math.PI / 3)
   * @param penumbra - Penumbra factor (default: 0)
   * @param decay - Light decay factor (default: 2)
   * @param position - Light position (default: [0, 10, 0])
   * @param castShadow - Whether to enable shadow casting (default: true)
   * @param shadowMapSize - Shadow map resolution (default: 1024)
   * @returns The created spot light
   */
  static createSpotLight(
    color: number = 0xffffff,
    intensity: number = 1.0,
    distance: number = 0,
    angle: number = Math.PI / 3,
    penumbra: number = 0,
    decay: number = 2,
    position: [number, number, number] = [0, 10, 0],
    castShadow: boolean = true,
    shadowMapSize: number = 1024,
  ): THREE.SpotLight {
    const light = new THREE.SpotLight(
      color,
      intensity,
      distance,
      angle,
      penumbra,
      decay,
    );
    light.position.set(...position);

    if (castShadow) {
      light.castShadow = true;
      light.shadow.mapSize.width = shadowMapSize;
      light.shadow.mapSize.height = shadowMapSize;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 100;
    }

    return light;
  }

  /**
   * Creates a rect area light for rectangular illumination.
   *
   * @param color - Light color (default: 0xffffff)
   * @param intensity - Light intensity (default: 1.0)
   * @param width - Light width (default: 10)
   * @param height - Light height (default: 10)
   * @param position - Light position (default: [0, 10, 0])
   * @returns The created rect area light
   */
  static createRectAreaLight(
    color: number = 0xffffff,
    intensity: number = 1.0,
    width: number = 10,
    height: number = 10,
    position: [number, number, number] = [0, 10, 0],
  ): THREE.RectAreaLight {
    const light = new THREE.RectAreaLight(color, intensity, width, height);
    light.position.set(...position);
    return light;
  }

  /**
   * Creates a light probe for environment lighting.
   *
   * @param sphericalHarmonics - Spherical harmonics for the light probe (optional)
   * @param intensity - Light intensity (default: 1.0)
   * @returns The created light probe
   */
  static createLightProbe(
    sphericalHarmonics?: THREE.SphericalHarmonics3,
    intensity: number = 1.0,
  ): THREE.LightProbe {
    return new THREE.LightProbe(sphericalHarmonics, intensity);
  }

  /**
   * Creates lighting helpers for debugging light positions and properties.
   *
   * @param lights - Array of lights to create helpers for
   * @param helperSize - Size of the helper (default: 1)
   * @param showHelpers - Whether to show helpers (default: true)
   * @returns Array of created helpers
   */
  static createLightHelpers(
    lights: THREE.Light[],
    helperSize: number = 1,
    showHelpers: boolean = true,
  ): THREE.Object3D[] {
    const helpers: THREE.Object3D[] = [];

    for (const light of lights) {
      let helper: THREE.Object3D;

      if (light instanceof THREE.DirectionalLight) {
        helper = new THREE.DirectionalLightHelper(light, helperSize);
      } else if (light instanceof THREE.PointLight) {
        helper = new THREE.PointLightHelper(light, helperSize);
      } else if (light instanceof THREE.SpotLight) {
        helper = new THREE.SpotLightHelper(light);
      } else if (light instanceof THREE.HemisphereLight) {
        helper = new THREE.HemisphereLightHelper(light, helperSize);
      } else {
        // For ambient lights and other types, create a simple marker
        const geometry = new THREE.SphereGeometry(helperSize * 0.1);
        const material = new THREE.MeshBasicMaterial({ color: light.color });
        helper = new THREE.Mesh(geometry, material);
        helper.position.copy(light.position);
      }

      helper.visible = showHelpers;
      helpers.push(helper);
    }

    return helpers;
  }
}
