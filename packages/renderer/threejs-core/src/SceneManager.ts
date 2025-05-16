import * as THREE from "three";
import { AU_METERS, METERS_TO_SCENE_UNITS } from "@teskooano/data-types";
import { getSimulationState } from "@teskooano/core-state";
import type { CSS2DManager } from "@teskooano/renderer-threejs-interaction";
import { CSS2DLayerType } from "@teskooano/renderer-threejs-interaction";

/**
 * Default FOV value if not provided or found in state.
 */
const DEFAULT_FOV = 75;

/**
 * Manages the Three.js scene, camera, and renderer
 */
export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
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

  private css2DManager?: CSS2DManager;

  /**
   * Create a new SceneManager
   *
   * @param container The HTML element to render the scene into
   * @param options Configuration options for the scene
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
    this.scene = new THREE.Scene();

    const initialSimState = getSimulationState();
    const initialFov =
      options.fov ?? initialSimState.camera?.fov ?? DEFAULT_FOV;
    this.fov = initialFov;

    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      container.clientWidth / container.clientHeight,
      0.0001,
      10000000,
    );

    const { camera } = initialSimState;
    this.camera.position.set(
      camera.position.x,
      camera.position.y,
      camera.position.z,
    );
    this.camera.lookAt(camera.target.x, camera.target.y, camera.target.z);

    const profile = initialSimState.performanceProfile;
    let powerPref: "default" | "high-performance" | "low-power" = "default";
    switch (profile) {
      case "low":
        powerPref = "low-power";
        break;
      case "medium":
        powerPref = "default";
        break;
      case "high":
      case "cosmic":
        powerPref = "high-performance";
        break;
    }

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      stencil: false,
      logarithmicDepthBuffer: false,
      preserveDrawingBuffer: false,
      powerPreference: powerPref,
    });

    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    if (options.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    if (options.hdr) {
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.0;
    }

    if (options.background) {
      if (typeof options.background === "string") {
        this.backgroundColor = new THREE.Color(options.background);
      } else {
        this.backgroundColor = options.background;
      }
    } else {
      this.backgroundColor = new THREE.Color(0x000510);
    }

    this.showGrid = options.showGrid !== false;
    if (this.showGrid) {
      this.gridHelper = new THREE.GridHelper(10000, 100, 0xff0000, 0x444444);
      this.gridHelper.visible = this.showGrid;
      this.scene.add(this.gridHelper);
    }

    this.showAuMarkers = options.showAuMarkers !== false;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    this.scene.add(ambientLight);

    this.width = container.clientWidth;
    this.height = container.clientHeight;
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
   * Sets the CSS2DManager instance after initialization.
   * Used because SceneManager needs to be created before CSS2DManager,
   * but CSS2DManager needs the scene from SceneManager.
   */
  public setCSS2DManager(manager: CSS2DManager): void {
    this.css2DManager = manager;

    this._clearAuDistanceMarkers();
    this._createAuDistanceMarkers();
    if (this.auDistanceMarkers) {
      this.auDistanceMarkers.visible = this.showAuMarkers;
    }

    this.css2DManager?.setLayerVisibility(
      CSS2DLayerType.AU_MARKERS,
      this.showAuMarkers,
    );
  }

  /**
   * Update camera position and target
   * This is now only used for initialization or direct non-animated updates
   * WARNING: This should typically not be called directly, use ControlsManager.moveTo instead
   * to ensure proper transition handling
   */
  updateCamera(position: THREE.Vector3, target: THREE.Vector3): void {
    console.warn(
      "[SceneManager] Direct camera update called. This should only be used during initialization.",
    );

    if (position && target) {
      this.camera.position.set(position.x, position.y, position.z);
      this.camera.lookAt(target.x, target.y, target.z);
    }
  }

  /**
   * Handle window resize
   */
  onResize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.width = width;
    this.height = height;
  }

  /**
   * Renders the scene
   */
  render(): void {
    if (this.backgroundColor instanceof THREE.Color) {
      this.renderer.setClearColor(this.backgroundColor);
    } else if (this.backgroundColor instanceof THREE.Texture) {
      this.scene.background = this.backgroundColor;
    }

    this.renderer.setViewport(0, 0, this.width, this.height);

    try {
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error("Error during scene rendering:", error);
    }
  }

  /**
   * Add a debug sphere at the origin for reference
   */
  private addDebugSphere(): void {
    const debugSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff00ff }),
    );
    debugSphere.position.set(0, 0, 0);
    this.scene.add(debugSphere);
    this.debugSphere = debugSphere;
  }

  /**
   * Sets the global debug mode for the scene manager.
   * This controls the visibility of the origin debug sphere.
   * @param enabled - If true, shows the debug sphere; otherwise, hides it.
   */
  public setDebugMode(enabled: boolean): void {
    if (enabled) {
      if (!this.debugSphere) {
        this.addDebugSphere();
      }
      if (this.debugSphere) {
        this.debugSphere.visible = true;
      }
    } else {
      if (this.debugSphere) {
        this.debugSphere.visible = false;
      }
    }
  }

  /**
   * Toggle the visibility of the grid helper
   */
  toggleGrid(): void {
    const targetVisibility = !this.showGrid;
    this.setGridVisible(targetVisibility);
  }

  /**
   * @internal Creates the AU distance marker circles (XZ plane) and labels (cardinal directions).
   */
  private _createAuDistanceMarkers(): void {
    this.auDistanceMarkers = new THREE.Group();
    this.auDistanceMarkers.name = "AU_Distance_Markers_Group";
    const auDistances = [1, 2, 3, 4, 5, 10, 20, 50, 100];
    const segments = 128;

    const material = new THREE.LineBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      fog: false,
    });

    auDistances.forEach((au) => {
      const radiusMeters = au * AU_METERS;
      const radiusSceneUnits = radiusMeters * METERS_TO_SCENE_UNITS;

      if (!Number.isFinite(radiusSceneUnits) || radiusSceneUnits <= 0) {
        console.warn(
          `[SceneManager] Skipping AU marker for ${au} AU due to invalid calculated radius: ${radiusSceneUnits}`,
        );
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

      if (this.css2DManager) {
        const labelPositions = {
          Xpos: new THREE.Vector3(radiusSceneUnits, 0, 0),
          Xneg: new THREE.Vector3(-radiusSceneUnits, 0, 0),
          Zpos: new THREE.Vector3(0, 0, radiusSceneUnits),
          Zneg: new THREE.Vector3(0, 0, -radiusSceneUnits),
        };

        for (const [dir, pos] of Object.entries(labelPositions)) {
          const labelId = `au-label-${dir}-${au}`;
          this.css2DManager.createAuMarkerLabel(labelId, au, pos);
        }
      }
    });

    this.scene.add(this.auDistanceMarkers);
  }

  /**
   * Toggles the visibility of the AU distance markers.
   */
  toggleAuMarkers(): void {
    const targetVisibility = !this.showAuMarkers;
    this.setAuMarkersVisible(targetVisibility);
  }

  /**
   * @internal Clears existing AU distance markers and labels.
   */
  private _clearAuDistanceMarkers(): void {
    if (this.auDistanceMarkers) {
      this.scene.remove(this.auDistanceMarkers);
      this.auDistanceMarkers.children.forEach((child) => {
        if (child instanceof THREE.LineLoop) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.auDistanceMarkers = null;
    }

    this.css2DManager?.clearLayer(CSS2DLayerType.AU_MARKERS);
  }

  /**
   * Clean up resources when the manager is no longer needed
   */
  dispose(): void {
    if (this.auDistanceMarkers) {
      this.scene.remove(this.auDistanceMarkers);
      this._clearAuDistanceMarkers();
    }

    if (this.gridHelper) {
      this.scene.remove(this.gridHelper);
      this.gridHelper.geometry.dispose();
      if (Array.isArray(this.gridHelper.material)) {
        this.gridHelper.material.forEach((mat) => mat.dispose());
      } else {
        this.gridHelper.material.dispose();
      }
      this.gridHelper = null;
    }

    if (this.debugSphere) {
      this.scene.remove(this.debugSphere);
      this.debugSphere.geometry.dispose();
      if (Array.isArray(this.debugSphere.material)) {
        this.debugSphere.material.forEach((mat) => mat.dispose());
      } else {
        this.debugSphere.material.dispose();
      }
      this.debugSphere = null;
    }

    // Remove the canvas from the DOM before disposing the renderer itself
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();

    while (this.scene.children.length > 0) {
      const child = this.scene.children[0];

      if (
        child !== this.gridHelper &&
        child !== this.auDistanceMarkers &&
        child !== this.debugSphere
      ) {
        this.scene.remove(child);
      } else {
        this.scene.remove(child);
      }
    }
  }

  /**
   * @param visible True to show the grid, false to hide.
   */
  setGridVisible(visible: boolean): void {
    this.showGrid = visible;
    let currentGridHelper = this.gridHelper;

    if (visible) {
      if (!currentGridHelper) {
        currentGridHelper = new THREE.GridHelper(
          10000,
          100,
          0xff0000,
          0x444444,
        );
        this.scene.add(currentGridHelper);
        this.gridHelper = currentGridHelper;
      }

      currentGridHelper.visible = true;
    } else {
      if (currentGridHelper) {
        currentGridHelper.visible = false;
      }
    }
  }

  /**
   * Sets the visibility of the AU distance markers (lines and labels).
   * @param visible True to show the markers, false to hide.
   */
  setAuMarkersVisible(visible: boolean): void {
    this.showAuMarkers = visible;
    let currentAuMarkers = this.auDistanceMarkers;

    if (visible) {
      if (!currentAuMarkers) {
        this._createAuDistanceMarkers();
        currentAuMarkers = this.auDistanceMarkers;

        if (!currentAuMarkers) {
          console.error(
            "[SceneManager] Failed to create AU markers for setVisible.",
          );
          this.showAuMarkers = false;
          return;
        }
      }

      currentAuMarkers.visible = true;
    } else {
      if (currentAuMarkers) {
        currentAuMarkers.visible = false;
      }
    }

    this.css2DManager?.setLayerVisibility(CSS2DLayerType.AU_MARKERS, visible);
  }
}
