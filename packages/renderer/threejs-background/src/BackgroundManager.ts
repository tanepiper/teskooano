import * as THREE from "three";
import { createDebugVisuals, cleanupDebugVisuals } from "./background-manager";
import { Field } from "./fields/core/Field";
import { StarField } from "./fields/star-field/StarField";
import { StarFieldOptions } from "./fields/star-field/types";
import { NebulaField } from "./fields/nebula-field/NebulaField";
import { NebulaFieldOptions } from "./fields/nebula-field/types";
import { NEBULA_PALETTES } from "./fields/nebula-field/palettes";
import { GalaxyField } from "./fields/galaxy-field/GalaxyField";
import { GalaxyFieldOptions } from "./fields/galaxy-field/types";
import { createSeededRandomSync } from "@teskooano/core-math";
import { StateAccessor } from "@teskooano/core-state";

/**
 * Defines the base distance for star field layers, used as a reference
 * for creating parallax and depth effects.
 * Optimized for logarithmic depth buffer with 1000 AU far plane.
 */
const BASE_DISTANCE = 1e9; // 900 AU - well within 1000 AU far plane

/**
 * Manages the space background, which is composed of multiple `Field` layers.
 */
export class BackgroundManager {
  private group: THREE.Group;
  private debugGroup: THREE.Group;
  private camera: THREE.PerspectiveCamera | null = null;
  private scene: THREE.Scene;
  private isDebugMode: boolean = false;
  private fields: Field[] = [];
  private random: () => number;

  /**
   * Creates a new BackgroundManager.
   */
  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = "background-manager-group";
    this.debugGroup = new THREE.Group();
    this.debugGroup.name = "background-debug-group";
    this.group.add(this.debugGroup);
    scene.add(this.group);

    // Get seed from state instead of constructor parameter
    const currentSeed = StateAccessor.getCurrentSeed();

    this.random = createSeededRandomSync(currentSeed);

    this.createDefaultStarField();
    //this.createDefaultGalaxyField();
    this.createDefaultNebula();
  }

  /**
   * Creates the default nebula field and adds it to the manager.
   */
  private createDefaultNebula(): void {
    // Select a random palette
    const selectedPalette =
      NEBULA_PALETTES[Math.floor(this.random() * NEBULA_PALETTES.length)];

    const defaultOptions = {
      alpha: 0.9,
      noiseConfig: {
        scale: BASE_DISTANCE,
        octaves: 2,
        persistence: 0.5,
        lacunarity: 2.2,
        seed: this.random(),
      },
    };

    const nebulaOptions: NebulaFieldOptions = {
      name: "deep-space-nebula",
      baseDistance: BASE_DISTANCE, // 720 AU - safely within 1000 AU far plane
      size: BASE_DISTANCE, // 450 AU size - reasonable nebula scale
      colors: selectedPalette.map((color) => new THREE.Color(color)),
      ...defaultOptions,
    };

    const nebulaField = new NebulaField(nebulaOptions);
    this.addField(nebulaField);
  }

  /**
   * Creates the default star field and adds it to the manager.
   */
  private createDefaultStarField(): void {
    const starFieldOptions: StarFieldOptions = {
      name: "background-stars",
      baseDistance: BASE_DISTANCE,
      layers: [
        {
          count: 10000,
          distanceMultiplier: 1,
          distanceSpread: 50000, // Reduced to keep within 1000 AU far plane
          minBrightness: 0.9,
          maxBrightness: 1.0,
          size: 5.0,
          colorTint: new THREE.Color("#FFE4B5").multiplyScalar(0.3),
        },
        {
          count: 20000,
          distanceMultiplier: 1, // Slightly closer together
          distanceSpread: 40000, // Reduced spread
          minBrightness: 0.7,
          maxBrightness: 0.9,
          size: 4.0,
          colorTint: new THREE.Color("#B0C4DE").multiplyScalar(0.2),
        },
        {
          count: 50000,
          distanceMultiplier: 1, // Safe multiplier to stay under 1000 AU
          distanceSpread: 25000, // Conservative spread
          minBrightness: 0.5,
          maxBrightness: 0.7,
          size: 3.0,
          colorTint: new THREE.Color("#9370DB").multiplyScalar(0.2),
        },
      ],
    };

    const starField = new StarField(starFieldOptions);
    this.addField(starField);
  }

  /**
   * Creates the default galaxy field and adds it to the manager.
   */
  private createDefaultGalaxyField(): void {
    const galaxyFieldOptions: GalaxyFieldOptions = {
      name: "background-galaxies",
      count: 500,
      baseDistance: BASE_DISTANCE,
      distanceSpread: 20000, // Some variation in distance
      minSize: 800, // Large enough to be visible at distance
      maxSize: 2000,
      minOpacity: 0.2,
      maxOpacity: 0.5,
      parallaxStrength: 0, // No parallax - static background texture
    };

    const galaxyField = new GalaxyField(galaxyFieldOptions);
    this.addField(galaxyField);
  }

  /**
   * Adds a new field to the background.
   */
  public addField(field: Field): void {
    this.fields.push(field);
    this.group.add(field.object);
  }

  /**
   * Toggles debug visualization mode.
   */
  public toggleDebug(): void {
    this.isDebugMode = !this.isDebugMode;

    cleanupDebugVisuals(this.debugGroup);

    if (this.isDebugMode) {
      const newDebugGroup = createDebugVisuals(BASE_DISTANCE, [1, 0.5, 1.1]);
      while (newDebugGroup.children.length > 0) {
        this.debugGroup.add(newDebugGroup.children[0]);
      }
    }

    this.fields.forEach((field) => field.toggleDebug(this.isDebugMode));
  }

  /**
   * Sets the camera for parallax and positioning effects.
   */
  public setCamera(camera: THREE.PerspectiveCamera): void {
    this.camera = camera;
  }

  /**
   * Gets the main background group.
   */
  public getGroup(): THREE.Group {
    return this.group;
  }

  /**
   * Updates all fields and handles camera-based positioning.
   */
  public update(deltaTime: number): void {
    if (this.camera) {
      this.group.position.copy(this.camera.position);
    }

    this.fields.forEach((field) => field.update(deltaTime, this.camera!));
  }

  /**
   * Cleans up all resources used by the manager and its fields.
   */
  public dispose(): void {
    this.scene.remove(this.group);

    this.fields.forEach((field) => field.dispose());
    this.fields = [];

    cleanupDebugVisuals(this.debugGroup);
    this.group.remove(this.debugGroup);
  }
}
