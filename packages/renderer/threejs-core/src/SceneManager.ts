import * as THREE from "three";
import { AU_METERS, METERS_TO_SCENE_UNITS } from "@teskooano/data-types";
import { simulationStateService } from "@teskooano/core-state";
import { rendererEvents } from "./events";

/** Default camera Field of View (FOV) in degrees. */
const DEFAULT_FOV = 75;

/**
 * Manages the core Three.js components: the scene, camera, and renderer.
 *
 * This class is responsible for the initial setup of the 3D environment,
 * handling resizing, and providing the main `render` method. It also manages
 * optional visual helpers like a grid and AU distance markers.
 */
export class SceneManager {
  /** The root `THREE.Scene` object. */
  public scene: THREE.Scene;
  /** The primary `THREE.PerspectiveCamera` for the scene. */
  public camera: THREE.PerspectiveCamera;
  /** The `THREE.WebGLRenderer` instance. */
  public renderer: THREE.WebGLRenderer;

  private fov: number;
  private debugSphere: THREE.Mesh | null = null;
  private gridHelper: THREE.GridHelper | null = null;
  private showGrid: boolean = true;
  private auDistanceMarkers: THREE.Group | null = null;
  private showAuMarkers: boolean = true;
  private backgroundColor: THREE.Color | THREE.Texture;
  private width: number;
  private height: number;

  /**
   * Creates a new SceneManager instance.
   *
   * @param container The HTML element where the renderer's canvas will be appended.
   * @param options Configuration options for the scene and renderer.
   */
  constructor(
    container: HTMLElement,
    options: {
      antialias?: boolean;
      shadows?: boolean;
      hdr?: boolean;
      background?: string | THREE.Texture;
      showGrid?: boolean;
      showAuMarkers?: boolean;
      fov?: number;
    } = {},
  ) {
    this.width = container.clientWidth;
    this.height = container.clientHeight;
    this.scene = new THREE.Scene();

    // Initialize core components
    this.fov = this._initializeFov(options.fov);
    this.camera = this._initializeCamera();
    this.renderer = this._initializeRenderer(container, options);

    // Configure scene features
    this.backgroundColor = this._parseBackground(options.background);
    this.showGrid = options.showGrid !== false;
    this.showAuMarkers = options.showAuMarkers !== false;

    if (this.showGrid) {
      this._createGridHelper();
    }
    if (this.showAuMarkers) {
      this._createAuDistanceMarkers();
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    this.scene.add(ambientLight);
  }

  /**
   * Determines the initial Field of View.
   * @param fovOption The FOV from constructor options.
   * @returns The resolved FOV value.
   */
  private _initializeFov(fovOption?: number): number {
    const initialState = simulationStateService.getCurrentState();
    return fovOption ?? initialState.camera?.fov ?? DEFAULT_FOV;
  }

  /**
   * Sets up the main perspective camera based on initial state or defaults.
   * @returns The configured `PerspectiveCamera`.
   */
  private _initializeCamera(): THREE.PerspectiveCamera {
    const initialState = simulationStateService.getCurrentState();
    const camera = new THREE.PerspectiveCamera(
      this.fov,
      this.width / this.height,
      0.0001,
      10000000,
    );

    if (initialState?.camera) {
      camera.position.set(
        initialState.camera.position.x,
        initialState.camera.position.y,
        initialState.camera.position.z,
      );
      camera.lookAt(
        initialState.camera.target.x,
        initialState.camera.target.y,
        initialState.camera.target.z,
      );
    }
    return camera;
  }

  /**
   * Sets up the WebGL renderer, configures its features, and appends it to the DOM.
   * @param container The host element for the renderer's canvas.
   * @param options The constructor options.
   * @returns The configured `WebGLRenderer`.
   */
  private _initializeRenderer(
    container: HTMLElement,
    options: { shadows?: boolean; hdr?: boolean; antialias?: boolean },
  ): THREE.WebGLRenderer {
    const initialState = simulationStateService.getCurrentState();
    const profile = initialState.performanceProfile;
    let powerPref: "default" | "high-performance" | "low-power" = "default";
    switch (profile) {
      case "low":
        powerPref = "low-power";
        break;
      case "high":
      case "cosmic":
        powerPref = "high-performance";
        break;
    }

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: options.antialias ?? true,
      stencil: false,
      logarithmicDepthBuffer: false,
      preserveDrawingBuffer: false,
      powerPreference: powerPref,
    });

    renderer.setSize(this.width, this.height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    if (options.shadows) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    if (options.hdr) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
    }
    return renderer;
  }

  /**
   * Parses the background option into a usable Color or Texture.
   * @param background The background option from the constructor.
   * @returns A `THREE.Color` or `THREE.Texture` object.
   */
  private _parseBackground(
    background?: string | THREE.Texture,
  ): THREE.Color | THREE.Texture {
    if (background) {
      if (typeof background === "string") {
        return new THREE.Color(background);
      }
      return background;
    }
    return new THREE.Color(0x000510);
  }

  /**
   * Sets the Field of View (FOV) of the camera.
   * @param newFov The new FOV value in degrees.
   */
  public setFov(newFov: number): void {
    if (this.fov === newFov) return;

    this.fov = newFov;
    this.camera.fov = newFov;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Handles window resize events.
   * @param width The new width of the render container.
   * @param height The new height of the render container.
   */
  onResize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    rendererEvents.resize$.next({ width, height });
  }

  /**
   * Renders a single frame of the scene.
   */
  render(): void {
    if (this.backgroundColor instanceof THREE.Color) {
      this.renderer.setClearColor(this.backgroundColor);
      this.scene.background = null;
    } else if (this.backgroundColor instanceof THREE.Texture) {
      this.scene.background = this.backgroundColor;
    }

    this.renderer.setViewport(0, 0, this.width, this.height);

    try {
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error("[SceneManager] Error during scene rendering:", error);
    }
  }

  /**
   * Sets the global debug mode for the scene manager.
   * This controls the visibility of the origin debug sphere.
   * @param enabled If true, shows the debug sphere; otherwise, hides it.
   */
  public setDebugMode(enabled: boolean): void {
    if (enabled) {
      if (!this.debugSphere) {
        this._createDebugSphere();
      }
      if (this.debugSphere) {
        this.debugSphere.visible = true;
      }
    } else if (this.debugSphere) {
      this.debugSphere.visible = false;
    }
  }

  /**
   * Toggles the visibility of the grid helper.
   */
  toggleGrid(): void {
    this.setGridVisible(!this.showGrid);
  }

  /**
   * Toggles the visibility of the AU distance markers.
   */
  toggleAuMarkers(): void {
    this.setAuMarkersVisible(!this.showAuMarkers);
  }

  /**
   * Sets the visibility of the grid helper.
   * @param visible True to show the grid, false to hide.
   */
  setGridVisible(visible: boolean): void {
    this.showGrid = visible;
    if (visible) {
      if (!this.gridHelper) {
        this._createGridHelper();
      }
      if (this.gridHelper) {
        this.gridHelper.visible = true;
      }
    } else if (this.gridHelper) {
      this.gridHelper.visible = false;
    }
  }

  /**
   * Sets the visibility of the AU distance markers (lines and labels).
   * @param visible True to show the markers, false to hide.
   */
  setAuMarkersVisible(visible: boolean): void {
    this.showAuMarkers = visible;
    if (this.auDistanceMarkers) {
      this.auDistanceMarkers.visible = visible;
    }
  }

  /**
   * Disposes of all resources used by the `SceneManager`.
   * This includes helpers, the renderer, and all objects in the scene.
   */
  dispose(): void {
    this._clearAuDistanceMarkers();
    this._clearGridHelper();
    this._clearDebugSphere();

    // Remove the canvas from the DOM before disposing the renderer itself
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();

    // Clear remaining scene children
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }

    rendererEvents.dispose$.next();
  }

  /** Creates the debug sphere at the origin. */
  private _createDebugSphere(): void {
    if (this.debugSphere) return;
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    this.debugSphere = new THREE.Mesh(geometry, material);
    this.debugSphere.position.set(0, 0, 0);
    this.scene.add(this.debugSphere);
  }

  /** Disposes of the debug sphere's resources. */
  private _clearDebugSphere(): void {
    if (this.debugSphere) {
      this.scene.remove(this.debugSphere);
      this.debugSphere.geometry.dispose();
      if (this.debugSphere.material instanceof Array) {
        this.debugSphere.material.forEach((m) => m.dispose());
      } else {
        this.debugSphere.material.dispose();
      }
      this.debugSphere = null;
    }
  }

  /** Creates the grid helper. */
  private _createGridHelper(): void {
    if (this.gridHelper) return;
    this.gridHelper = new THREE.GridHelper(10000, 100, 0xff0000, 0x444444);
    this.scene.add(this.gridHelper);
  }

  /** Disposes of the grid helper's resources. */
  private _clearGridHelper(): void {
    if (this.gridHelper) {
      this.scene.remove(this.gridHelper);
      this.gridHelper.geometry.dispose();
      (this.gridHelper.material as THREE.Material).dispose();
      this.gridHelper = null;
    }
  }

  /**
   * Creates the AU distance marker circles (XZ plane).
   * @internal
   */
  private _createAuDistanceMarkers(): void {
    if (this.auDistanceMarkers) return; // Already created
    this.auDistanceMarkers = new THREE.Group();
    this.auDistanceMarkers.name = "AU_Distance_Markers_Group";
    const auDistances = [1, 2, 3, 4, 5, 10, 20, 50, 100];
    const segments = 128;

    const material = new THREE.LineBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });

    auDistances.forEach((au) => {
      const radiusSceneUnits = au * AU_METERS * METERS_TO_SCENE_UNITS;
      if (!Number.isFinite(radiusSceneUnits) || radiusSceneUnits <= 0) {
        return;
      }

      const geometry = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(
          new THREE.Vector3(
            Math.cos(theta) * radiusSceneUnits,
            0,
            Math.sin(theta) * radiusSceneUnits,
          ),
        );
      }
      geometry.setFromPoints(points);
      const circleXZ = new THREE.LineLoop(geometry, material);
      circleXZ.name = `AU_Marker_XZ_${au}`;
      this.auDistanceMarkers?.add(circleXZ);
    });

    this.scene.add(this.auDistanceMarkers);
    this.auDistanceMarkers.visible = this.showAuMarkers;
  }

  /**
   * Disposes of AU distance markers.
   * @internal
   */
  private _clearAuDistanceMarkers(): void {
    if (this.auDistanceMarkers) {
      this.scene.remove(this.auDistanceMarkers);
      this.auDistanceMarkers.children.forEach((child) => {
        if (child instanceof THREE.LineLoop) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
      this.auDistanceMarkers = null;
    }
  }
}
