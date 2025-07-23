import * as THREE from "three";

/**
 * Helper class for configuring shadows on Three.js lights with consistent settings.
 * Provides specialized shadow configuration for different light types and use cases.
 */
export class ShadowHelper {
  /**
   * Configures shadows for a directional light with optimized settings.
   *
   * @param light - The directional light to configure
   * @param options - Shadow configuration options
   * @param options.mapSize - Shadow map resolution (default: 2048)
   * @param options.cameraNear - Shadow camera near plane (default: 0.5)
   * @param options.cameraFar - Shadow camera far plane (default: 500)
   * @param options.cameraLeft - Shadow camera left boundary (default: -50)
   * @param options.cameraRight - Shadow camera right boundary (default: 50)
   * @param options.cameraTop - Shadow camera top boundary (default: 50)
   * @param options.cameraBottom - Shadow camera bottom boundary (default: -50)
   * @param options.bias - Shadow bias to prevent shadow acne (default: -0.0001)
   * @param options.normalBias - Normal bias for shadow mapping (default: 0)
   * @param options.radius - Shadow blur radius (default: 1)
   */
  static configureDirectionalLightShadows(
    light: THREE.DirectionalLight,
    options: {
      mapSize?: number;
      cameraNear?: number;
      cameraFar?: number;
      cameraLeft?: number;
      cameraRight?: number;
      cameraTop?: number;
      cameraBottom?: number;
      bias?: number;
      normalBias?: number;
      radius?: number;
    } = {},
  ): void {
    const {
      mapSize = 2048,
      cameraNear = 0.5,
      cameraFar = 500,
      cameraLeft = -50,
      cameraRight = 50,
      cameraTop = 50,
      cameraBottom = -50,
      bias = -0.0001,
      normalBias = 0,
      radius = 1,
    } = options;

    light.castShadow = true;
    light.shadow.mapSize.width = mapSize;
    light.shadow.mapSize.height = mapSize;
    light.shadow.camera.near = cameraNear;
    light.shadow.camera.far = cameraFar;
    light.shadow.camera.left = cameraLeft;
    light.shadow.camera.right = cameraRight;
    light.shadow.camera.top = cameraTop;
    light.shadow.camera.bottom = cameraBottom;
    light.shadow.bias = bias;
    light.shadow.normalBias = normalBias;
    light.shadow.radius = radius;
  }

  /**
   * Configures shadows for a point light with optimized settings.
   *
   * @param light - The point light to configure
   * @param options - Shadow configuration options
   * @param options.mapSize - Shadow map resolution (default: 1024)
   * @param options.cameraNear - Shadow camera near plane (default: 0.1)
   * @param options.cameraFar - Shadow camera far plane (default: 100)
   * @param options.bias - Shadow bias to prevent shadow acne (default: -0.0001)
   * @param options.normalBias - Normal bias for shadow mapping (default: 0)
   * @param options.radius - Shadow blur radius (default: 1)
   */
  static configurePointLightShadows(
    light: THREE.PointLight,
    options: {
      mapSize?: number;
      cameraNear?: number;
      cameraFar?: number;
      bias?: number;
      normalBias?: number;
      radius?: number;
    } = {},
  ): void {
    const {
      mapSize = 1024,
      cameraNear = 0.1,
      cameraFar = 100,
      bias = -0.0001,
      normalBias = 0,
      radius = 1,
    } = options;

    light.castShadow = true;
    light.shadow.mapSize.width = mapSize;
    light.shadow.mapSize.height = mapSize;
    light.shadow.camera.near = cameraNear;
    light.shadow.camera.far = cameraFar;
    light.shadow.bias = bias;
    light.shadow.normalBias = normalBias;
    light.shadow.radius = radius;
  }

  /**
   * Configures shadows for a spot light with optimized settings.
   *
   * @param light - The spot light to configure
   * @param options - Shadow configuration options
   * @param options.mapSize - Shadow map resolution (default: 1024)
   * @param options.cameraNear - Shadow camera near plane (default: 0.1)
   * @param options.cameraFar - Shadow camera far plane (default: 100)
   * @param options.bias - Shadow bias to prevent shadow acne (default: -0.0001)
   * @param options.normalBias - Normal bias for shadow mapping (default: 0)
   * @param options.radius - Shadow blur radius (default: 1)
   */
  static configureSpotLightShadows(
    light: THREE.SpotLight,
    options: {
      mapSize?: number;
      cameraNear?: number;
      cameraFar?: number;
      bias?: number;
      normalBias?: number;
      radius?: number;
    } = {},
  ): void {
    const {
      mapSize = 1024,
      cameraNear = 0.1,
      cameraFar = 100,
      bias = -0.0001,
      normalBias = 0,
      radius = 1,
    } = options;

    light.castShadow = true;
    light.shadow.mapSize.width = mapSize;
    light.shadow.mapSize.height = mapSize;
    light.shadow.camera.near = cameraNear;
    light.shadow.camera.far = cameraFar;
    light.shadow.bias = bias;
    light.shadow.normalBias = normalBias;
    light.shadow.radius = radius;
  }

  /**
   * Configures high-quality shadows for space scenes with larger shadow maps.
   *
   * @param light - The light to configure (directional, point, or spot)
   * @param options - Shadow configuration options
   * @param options.mapSize - Shadow map resolution (default: 4096 for space scenes)
   * @param options.cameraFar - Shadow camera far plane (default: 1000 for space scenes)
   */
  static configureSpaceShadows(
    light: THREE.DirectionalLight | THREE.PointLight | THREE.SpotLight,
    options: {
      mapSize?: number;
      cameraFar?: number;
    } = {},
  ): void {
    const { mapSize = 4096, cameraFar = 1000 } = options;

    if (light instanceof THREE.DirectionalLight) {
      this.configureDirectionalLightShadows(light, {
        mapSize,
        cameraFar,
        cameraLeft: -100,
        cameraRight: 100,
        cameraTop: 100,
        cameraBottom: -100,
      });
    } else if (light instanceof THREE.PointLight) {
      this.configurePointLightShadows(light, { mapSize, cameraFar });
    } else if (light instanceof THREE.SpotLight) {
      this.configureSpotLightShadows(light, { mapSize, cameraFar });
    }
  }

  /**
   * Configures performance-optimized shadows for mobile or low-end devices.
   *
   * @param light - The light to configure (directional, point, or spot)
   * @param options - Shadow configuration options
   * @param options.mapSize - Shadow map resolution (default: 512 for performance)
   * @param options.disableShadows - Whether to disable shadows entirely (default: false)
   */
  static configurePerformanceShadows(
    light: THREE.DirectionalLight | THREE.PointLight | THREE.SpotLight,
    options: {
      mapSize?: number;
      disableShadows?: boolean;
    } = {},
  ): void {
    const { mapSize = 512, disableShadows = false } = options;

    if (disableShadows) {
      light.castShadow = false;
      return;
    }

    if (light instanceof THREE.DirectionalLight) {
      this.configureDirectionalLightShadows(light, {
        mapSize,
        cameraLeft: -25,
        cameraRight: 25,
        cameraTop: 25,
        cameraBottom: -25,
      });
    } else if (light instanceof THREE.PointLight) {
      this.configurePointLightShadows(light, { mapSize });
    } else if (light instanceof THREE.SpotLight) {
      this.configureSpotLightShadows(light, { mapSize });
    }
  }

  /**
   * Configures shadows for a light based on the target object's size and position.
   * Automatically adjusts shadow camera bounds to fit the target.
   *
   * @param light - The directional light to configure
   * @param targetObject - The object to focus shadows on
   * @param options - Shadow configuration options
   * @param options.padding - Padding around the target object (default: 10)
   * @param options.mapSize - Shadow map resolution (default: 2048)
   * @param options.cameraNear - Shadow camera near plane (default: 0.5)
   * @param options.cameraFar - Shadow camera far plane (default: 500)
   */
  static configureFocusedShadows(
    light: THREE.DirectionalLight,
    targetObject: THREE.Object3D,
    options: {
      padding?: number;
      mapSize?: number;
      cameraNear?: number;
      cameraFar?: number;
    } = {},
  ): void {
    const {
      padding = 10,
      mapSize = 2048,
      cameraNear = 0.5,
      cameraFar = 500,
    } = options;

    // Calculate bounding box of target object
    const box = new THREE.Box3().setFromObject(targetObject);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Calculate shadow camera bounds
    const maxDimension = Math.max(size.x, size.y, size.z);
    const halfSize = maxDimension / 2 + padding;

    this.configureDirectionalLightShadows(light, {
      mapSize,
      cameraNear,
      cameraFar,
      cameraLeft: -halfSize,
      cameraRight: halfSize,
      cameraTop: halfSize,
      cameraBottom: -halfSize,
    });

    // Position the light to cast shadows from above the target
    light.position.set(center.x, center.y + halfSize + 10, center.z);
    light.target.position.copy(center);
    light.target.updateMatrixWorld();
  }

  /**
   * Creates a shadow camera helper for debugging shadow boundaries.
   *
   * @param light - The light with shadows to create a helper for
   * @param color - Helper color (default: 0xff0000)
   * @returns The shadow camera helper
   */
  static createShadowCameraHelper(
    light: THREE.DirectionalLight | THREE.SpotLight,
    color: number = 0xff0000,
  ): THREE.CameraHelper {
    return new THREE.CameraHelper(light.shadow.camera);
  }

  /**
   * Updates shadow camera frustum for a directional light based on target objects.
   * Useful for dynamically adjusting shadow quality based on scene content.
   *
   * @param light - The directional light to update
   * @param objects - Array of objects to include in shadow frustum
   * @param options - Update configuration options
   * @param options.padding - Padding around objects (default: 5)
   * @param options.maxDistance - Maximum distance for shadow camera (default: 1000)
   */
  static updateShadowFrustum(
    light: THREE.DirectionalLight,
    objects: THREE.Object3D[],
    options: {
      padding?: number;
      maxDistance?: number;
    } = {},
  ): void {
    const { padding = 5, maxDistance = 1000 } = options;

    if (objects.length === 0) return;

    // Calculate combined bounding box
    const box = new THREE.Box3();
    objects.forEach((obj) => box.expandByObject(obj));

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Calculate shadow camera bounds
    const maxDimension = Math.max(size.x, size.y, size.z);
    const halfSize = Math.min(maxDimension / 2 + padding, maxDistance);

    light.shadow.camera.left = -halfSize;
    light.shadow.camera.right = halfSize;
    light.shadow.camera.top = halfSize;
    light.shadow.camera.bottom = -halfSize;
    light.shadow.camera.updateProjectionMatrix();

    // Update light position to cast shadows from above
    light.position.set(center.x, center.y + halfSize + 10, center.z);
    light.target.position.copy(center);
    light.target.updateMatrixWorld();
  }

  /**
   * Disables shadows on a light.
   *
   * @param light - The light to disable shadows on
   */
  static disableShadows(light: THREE.Light): void {
    light.castShadow = false;
  }

  /**
   * Enables shadows on a light with default configuration.
   *
   * @param light - The light to enable shadows on
   */
  static enableShadows(light: THREE.Light): void {
    if (light instanceof THREE.DirectionalLight) {
      this.configureDirectionalLightShadows(light);
    } else if (light instanceof THREE.PointLight) {
      this.configurePointLightShadows(light);
    } else if (light instanceof THREE.SpotLight) {
      this.configureSpotLightShadows(light);
    }
  }
}
