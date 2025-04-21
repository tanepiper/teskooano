import * as THREE from "three";
// Import constants from data-types
import { AU_METERS, METERS_TO_SCENE_UNITS } from "@teskooano/data-types";
import { simulationState } from "@teskooano/core-state";
// Import CSS2D types
import type { CSS2DManager } from "@teskooano/renderer-threejs-interaction";
import { CSS2DLayerType } from "@teskooano/renderer-threejs-interaction";
// --- Import simulation state ---
import { type PerformanceProfileType } from "@teskooano/core-state";
// --- End import ---

/**
 * Default FOV value if not provided or found in state.
 */
const DEFAULT_FOV = 75; // More conventional default FOV

/**
 * Manages the Three.js scene, camera, and renderer
 */
export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private fov: number; // Added FOV property
  private debugSphere: THREE.Mesh | null = null;
  private gridHelper: THREE.GridHelper | null = null;
  private showGrid: boolean = true;
  // New properties for AU markers
  private auDistanceMarkers: THREE.Group | null = null;
  private showAuMarkers: boolean = true; // Default to visible
  private backgroundColor: THREE.Color | THREE.Texture;
  private width: number;
  private height: number;
  // Add reference to CSS2DManager
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
      showAuMarkers?: boolean; // Option to control initial visibility
      fov?: number; // Added FOV option
    } = {},
  ) {
    // Initialize Three.js scene
    this.scene = new THREE.Scene();

    // Get initial camera state from global state if available
    const initialSimState = simulationState.get();
    const initialFov =
      options.fov ?? initialSimState.camera?.fov ?? DEFAULT_FOV;
    this.fov = initialFov; // Store initial FOV

    // Create camera with far clip plane suitable for space scenes
    this.camera = new THREE.PerspectiveCamera(
      this.fov, // Use the fov property
      container.clientWidth / container.clientHeight,
      0.0001, // Much closer near plane
      10000000, // Much further far plane
    );

    // Initial camera position from state
    const { camera } = initialSimState; // Use already retrieved state
    this.camera.position.set(
      camera.position.x,
      camera.position.y,
      camera.position.z,
    );
    this.camera.lookAt(camera.target.x, camera.target.y, camera.target.z);

    // --- Determine Power Preference based on Performance Profile ---
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
    // --- End Determination ---

    // Create renderer with options
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      stencil: false,
      logarithmicDepthBuffer: false,
      preserveDrawingBuffer: false,
      powerPreference: powerPref, // Apply determined preference
    });

    // Setup renderer
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Enable shadows if requested
    if (options.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Setup HDR if requested
    if (options.hdr) {
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.0;
    }

    // Setup background
    if (options.background) {
      if (typeof options.background === "string") {
        this.backgroundColor = new THREE.Color(options.background);
      } else {
        this.backgroundColor = options.background;
      }
    } else {
      // Default space background (very dark blue)
      this.backgroundColor = new THREE.Color(0x000510);
    }

    // Setup debug helpers
    this.showGrid = options.showGrid !== false;
    if (this.showGrid) {
      this.gridHelper = new THREE.GridHelper(10000, 100, 0xff0000, 0x444444);
      this.gridHelper.visible = this.showGrid;
      this.scene.add(this.gridHelper);
    }

    // Setup AU markers - REMOVE creation call from here
    this.showAuMarkers = options.showAuMarkers !== false; // Control initial state via options

    // Add stronger ambient light for better visibility
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
    if (this.fov === newFov) return; // No change needed

    this.fov = newFov;
    this.camera.fov = newFov;
    this.camera.updateProjectionMatrix(); // Crucial step to apply FOV change

    // Persist FOV change to global state (optional, but good practice)
    // TODO: Consider if this direct update is desired or should be handled higher up
    // simulationState.setKey("camera", {
    //   ...simulationState.get().camera,
    //   fov: newFov,
    // });
  }

  /**
   * Sets the CSS2DManager instance after initialization.
   * Used because SceneManager needs to be created before CSS2DManager,
   * but CSS2DManager needs the scene from SceneManager.
   */
  public setCSS2DManager(manager: CSS2DManager): void {
    this.css2DManager = manager;
    // --- Create AU markers now that we have the CSS2DManager ---
    this._clearAuDistanceMarkers(); // Clear any existing markers first
    this._createAuDistanceMarkers(); // Create lines and labels
    if (this.auDistanceMarkers) {
      this.auDistanceMarkers.visible = this.showAuMarkers; // Set initial visibility
    }
    // Set initial label visibility explicitly after creation
    this.css2DManager?.setLayerVisibility(
      CSS2DLayerType.AU_MARKERS,
      this.showAuMarkers,
    );
    // --- End marker creation ---
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
    // Direct camera updates should be avoided - ControlsManager.moveTo should be used instead
    // This method is kept primarily for initialization before ControlsManager is set up
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
    // Render with clear only on the first pass
    if (this.backgroundColor instanceof THREE.Color) {
      this.renderer.setClearColor(this.backgroundColor);
    } else if (this.backgroundColor instanceof THREE.Texture) {
      // For texture backgrounds, set them directly on the scene
      this.scene.background = this.backgroundColor;
    }

    this.renderer.setViewport(0, 0, this.width, this.height);

    try {
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error("Error during scene rendering:", error);
      // TODO: Implement more robust error handling or recovery if needed
      // For now, just log the error.
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
        this.addDebugSphere(); // Create if it doesn't exist
      }
      if (this.debugSphere) {
        // Check again in case creation failed
        this.debugSphere.visible = true;
      }
    } else {
      if (this.debugSphere) {
        this.debugSphere.visible = false; // Hide if it exists
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
      color: 0xff00ff, // Magenta
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

      // --- Create the XZ plane circle ---
      const geometry = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(
          new THREE.Vector3(
            Math.cos(theta) * radiusSceneUnits,
            0, // Keep in the XZ plane
            Math.sin(theta) * radiusSceneUnits,
          ),
        );
      }
      geometry.setFromPoints(points);
      const circleXZ = new THREE.LineLoop(geometry, material);
      circleXZ.name = `AU_Marker_XZ_${au}`;
      this.auDistanceMarkers?.add(circleXZ);
      // --- End Circle Creation ---

      // --- Add Labels in Cardinal Directions (XZ Plane) ---
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
      // --- End Label Creation ---
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
    // Also clear labels via the manager
    this.css2DManager?.clearLayer(CSS2DLayerType.AU_MARKERS);
  }

  /**
   * Clean up resources when the manager is no longer needed
   */
  dispose(): void {
    // Dispose AU markers if they exist
    if (this.auDistanceMarkers) {
      this.scene.remove(this.auDistanceMarkers);
      this._clearAuDistanceMarkers(); // Use the new helper method
    }

    // Dispose grid helper
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

    // Dispose debug sphere
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

    this.renderer.dispose();

    // Clear any remaining direct children of the scene (lights, etc.)
    while (this.scene.children.length > 0) {
      const child = this.scene.children[0];
      // Avoid removing things already handled (like grid/markers if somehow still present)
      if (
        child !== this.gridHelper &&
        child !== this.auDistanceMarkers &&
        child !== this.debugSphere
      ) {
        this.scene.remove(child);
        // Optionally dispose materials/geometries of other unknown objects if necessary
      } else {
        // If it's one we *thought* we removed, just remove it again to be safe.
        this.scene.remove(child);
      }
    }
  }

  /**
   * @param visible True to show the grid, false to hide.
   */
  setGridVisible(visible: boolean): void {
    this.showGrid = visible; // Update state first
    let currentGridHelper = this.gridHelper; // Assign to local variable

    if (visible) {
      if (!currentGridHelper) {
        // Create if needed
        currentGridHelper = new THREE.GridHelper(
          10000,
          100,
          0xff0000,
          0x444444,
        );
        this.scene.add(currentGridHelper);
        this.gridHelper = currentGridHelper; // Assign back to class property
      }
      // Now use the local variable which TypeScript knows is non-null here
      currentGridHelper.visible = true;
    } else {
      // Hide if it exists (use local variable for check and access)
      if (currentGridHelper) {
        currentGridHelper.visible = false;
      }
      // If hiding and it doesn't exist, do nothing
    }
  }

  /**
   * Sets the visibility of the AU distance markers (lines and labels).
   * @param visible True to show the markers, false to hide.
   */
  setAuMarkersVisible(visible: boolean): void {
    this.showAuMarkers = visible; // Update state first
    let currentAuMarkers = this.auDistanceMarkers; // Assign to local variable

    if (visible) {
      if (!currentAuMarkers) {
        // Create if needed
        this._createAuDistanceMarkers();
        currentAuMarkers = this.auDistanceMarkers; // Re-assign local var after creation
        // Check if creation succeeded
        if (!currentAuMarkers) {
          console.error(
            "[SceneManager] Failed to create AU markers for setVisible.",
          );
          this.showAuMarkers = false; // Revert state if creation failed
          return;
        }
      }
      // Now use the local variable which TypeScript knows is non-null here
      currentAuMarkers.visible = true;
    } else {
      // Hide if they exist (use local variable for check and access)
      if (currentAuMarkers) {
        currentAuMarkers.visible = false;
      }
      // If hiding and they don't exist, do nothing
    }
    // Toggle label visibility using CSS2DManager
    this.css2DManager?.setLayerVisibility(CSS2DLayerType.AU_MARKERS, visible);
  }

  // Add other methods as needed
}
