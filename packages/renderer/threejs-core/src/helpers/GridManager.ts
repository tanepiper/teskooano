import * as THREE from "three";

/**
 * @interface GridLevel
 * @description Defines the properties for a single level of detail for the grid.
 */
interface GridLevel {
  /** The maximum camera distance (from origin) for this level to be active. */
  maxDistance: number;
  /** The total size of the grid plane. */
  size: number;
  /** The number of divisions across the grid. */
  divisions: number;
}

/**
 * @const GRID_LEVELS
 * @description An array of grid configurations, sorted by distance.
 * This allows the grid to dynamically adjust its scale and density
 * based on the camera's zoom level.
 */
const GRID_LEVELS: GridLevel[] = [
  { maxDistance: 1e1, size: 1e2, divisions: 100 },
  { maxDistance: 1e2, size: 1e3, divisions: 100 },
  { maxDistance: 1e3, size: 1e4, divisions: 100 },
  { maxDistance: 1e4, size: 1e5, divisions: 100 },
  { maxDistance: 1e5, size: 1e6, divisions: 100 },
  { maxDistance: 1e6, size: 1e7, divisions: 100 },
  { maxDistance: 1e7, size: 1e8, divisions: 100 },
  { maxDistance: Infinity, size: 1e9, divisions: 100 },
];

/**
 * @const GRID_COLORS
 * @description Centralizes the color constants for the grid for easy theming.
 */
const GRID_COLORS = {
  COLOR_CENTER_LINE: 0xff0000,
  COLOR_GRID: 0x444444,
};

/**
 * Manages the `THREE.GridHelper` for a scene.
 *
 * This class encapsulates the creation, visibility control, and disposal
 * of a grid helper. It dynamically adjusts the grid's scale and density
 * based on the camera's distance from the origin to maintain a sensible
 * visual appearance at all zoom levels.
 *
 * This manager is designed to be used by the ModularSpaceRenderer and
 * other high-level renderer components, not directly by SceneManager.
 */
export class GridManager {
  private scene: THREE.Scene;
  private gridHelper: THREE.GridHelper | null = null;
  private currentLevel = -1;
  private isGridVisible = true;

  /**
   * Creates a new GridManager instance.
   * @param scene The `THREE.Scene` to which the grid will be added.
   * @param initialVisibility The initial visibility state of the grid.
   */
  constructor(scene: THREE.Scene, initialVisibility = true) {
    this.scene = scene;
    this.isGridVisible = initialVisibility;

    // Create initial grid if visibility is enabled
    if (this.isGridVisible) {
      this._create();
    }
  }

  /**
   * Updates the grid based on the camera's position.
   * This method should be called in the main render loop. It determines the
   * appropriate level of detail for the grid and recreates it if necessary.
   * @param camera The scene's active camera.
   */
  public update(camera: THREE.PerspectiveCamera): void {
    if (!this.isGridVisible) {
      if (this.gridHelper) {
        this.dispose();
      }
      return;
    }

    const distance = camera.position.length();
    const newLevel = this._getGridLevel(distance);

    if (newLevel !== this.currentLevel) {
      this._recreateGrid(newLevel);
    }
  }

  /**
   * Sets the visibility of the grid.
   * @param visible True to show the grid, false to hide it.
   */
  public setVisible(visible: boolean): void {
    this.isGridVisible = visible;
    if (!visible && this.gridHelper) {
      this.dispose();
    } else if (visible && !this.gridHelper) {
      this._create();
    }
  }

  /**
   * Toggles the visibility of the grid.
   */
  public toggle(): void {
    this.setVisible(!this.isGridVisible);
  }

  /**
   * Gets the current visibility of the grid.
   * @returns True if the grid is visible, false otherwise.
   */
  public isVisible(): boolean {
    return this.isGridVisible;
  }

  /**
   * Disposes of the grid helper's resources and removes it from the scene.
   */
  public dispose(): void {
    if (this.gridHelper) {
      this.scene.remove(this.gridHelper);
      this.gridHelper.geometry.dispose();
      (this.gridHelper.material as THREE.Material).dispose();
      this.gridHelper = null;
      this.currentLevel = -1;
    }
  }

  /**
   * Determines the appropriate grid level based on camera distance.
   * @param distance The camera's distance from the origin.
   * @returns The index of the appropriate grid level in `GRID_LEVELS`.
   */
  private _getGridLevel(distance: number): number {
    return GRID_LEVELS.findIndex((level) => distance < level.maxDistance);
  }

  /**
   * Disposes the current grid and creates a new one for the specified level.
   * @param newLevel The index of the new grid level.
   */
  private _recreateGrid(newLevel: number): void {
    this.dispose();
    this.currentLevel = newLevel;
    this._create();
  }

  /**
   * Creates the `THREE.GridHelper` based on the current level.
   */
  private _create(): void {
    if (this.gridHelper || this.currentLevel === -1) return;

    const config = GRID_LEVELS[this.currentLevel];
    if (!config) return;

    this.gridHelper = new THREE.GridHelper(
      config.size,
      config.divisions,
      GRID_COLORS.COLOR_CENTER_LINE,
      GRID_COLORS.COLOR_GRID,
    );
    this.scene.add(this.gridHelper);
    this.gridHelper.visible = this.isGridVisible;
  }
}
