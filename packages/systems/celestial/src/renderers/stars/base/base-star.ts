import type { StarProperties } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import type {
  CelestialMeshOptions,
  LightSourceData,
} from "../../common/CelestialRenderer";
import { CelestialRenderer, LODLevel } from "../../index";

/**
 * Material for corona effect around stars
 */
export class CoronaMaterial extends THREE.ShaderMaterial {
  constructor(
    color: THREE.Color = new THREE.Color(0xffff00),
    options: {
      scale?: number;
      opacity?: number;
      pulseSpeed?: number;
      noiseScale?: number;
      noiseEvolutionSpeed?: number;
      timeOffset?: number;
    } = {},
    vertexShader: string,
    fragmentShader: string,
  ) {
    super({
      uniforms: {
        time: { value: 0 },
        starColor: { value: color },
        opacity: { value: options.opacity ?? 0.6 },
        pulseSpeed: { value: options.pulseSpeed ?? 0.3 },
        noiseScale: { value: options.noiseScale ?? 3.0 },
        noiseEvolutionSpeed: { value: options.noiseEvolutionSpeed ?? 1.0 },
        timeOffset: { value: options.timeOffset ?? Math.random() * 1000.0 },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  /**
   * Update the material with the current time
   */
  update(time: number): void {
    this.uniforms.time.value = time;
  }

  /**
   * Dispose of any resources
   */
  dispose(): void {}
}

interface BillboardInfo {
  sprite: THREE.Sprite;
  activationDistance: number;
  maxFadeDistance: number; // Distance at which opacity reaches its minimum
}

/**
 * Abstract base class for star renderers, implementing the LOD system.
 */
export abstract class BaseStarRenderer implements CelestialRenderer {
  protected materials: Map<string, THREE.ShaderMaterial> = new Map();
  protected coronaMaterials: Map<string, CoronaMaterial[]> = new Map();
  private glowMaterials: Map<string, THREE.ShaderMaterial[]> = new Map();
  public startTime: number;
  protected elapsedTime: number = 0;
  protected billboardsInfo: Map<string, BillboardInfo> = new Map();

  protected object: RenderableCelestialObject;
  protected options?: CelestialMeshOptions;

  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    this.object = object;
    this.options = options;
    this.startTime = Date.now() / 1000;
  }

  /**
   * Get the custom LOD levels for the specific star type (high and medium detail).
   * Subclasses must implement this.
   */
  protected abstract getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[];

  /**
   * Get the distance at which the billboard LOD should activate for this star type.
   * Subclasses must implement this.
   */
  protected abstract getBillboardLODDistance(
    object: RenderableCelestialObject,
  ): number;

  protected abstract getCoronaVertexShader(
    object: RenderableCelestialObject,
  ): string;

  protected abstract getCoronaFragmentShader(
    object: RenderableCelestialObject,
  ): string;

  /**
   * Creates a canvas texture for the star billboard.
   * @returns A THREE.CanvasTexture.
   */
  private _createBillboardTexture(): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    if (context) {
      const gradient = context.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2,
      );
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Calculates the size for the distant sprite based on the star's radius.
   * @param object - The renderable celestial object.
   * @returns The calculated sprite size.
   */
  private _calculateDistantSpriteSize(
    object: RenderableCelestialObject,
  ): number {
    const minSpriteSize = 0.03;
    const maxSpriteSize = 0.15;
    const radiusScaleFactor = 0.0001;
    let calculatedSpriteSize = object.radius * radiusScaleFactor;
    return Math.max(
      minSpriteSize,
      Math.min(maxSpriteSize, calculatedSpriteSize),
    );
  }

  /**
   * Creates the sprite for the star billboard.
   * @param object - The renderable celestial object.
   * @param texture - The texture for the sprite.
   * @param size - The size of the sprite.
   * @returns A THREE.Sprite.
   */
  private _createBillboardSprite(
    object: RenderableCelestialObject,
    texture: THREE.Texture,
    size: number,
  ): THREE.Sprite {
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      color: this.getStarColor(object),
      blending: THREE.AdditiveBlending,
      sizeAttenuation: false, // Size is in screen space
      transparent: true,
      opacity: 0.85,
    });

    const distantSprite = new THREE.Sprite(spriteMaterial);
    distantSprite.name = `${object.celestialObjectId}-distant-sprite`;
    distantSprite.scale.set(size, size, 1.0);
    return distantSprite;
  }

  /**
   * Creates the point light for the star billboard.
   * @param object - The renderable celestial object.
   * @returns A THREE.PointLight.
   */
  private _createBillboardPointLight(
    object: RenderableCelestialObject,
  ): THREE.PointLight {
    const starMaterial = this.getMaterial(object) as any;
    let lightIntensity = 5.0;
    if (
      starMaterial &&
      starMaterial.uniforms &&
      starMaterial.uniforms.glowIntensity
    ) {
      const materialGlowIntensity = starMaterial.uniforms.glowIntensity.value;
      lightIntensity = materialGlowIntensity * 10.0;
      lightIntensity = Math.max(0.5, Math.min(lightIntensity, 20.0));
    }

    const pointLight = new THREE.PointLight(
      this.getStarColor(object),
      lightIntensity,
      0,
      2,
    );
    pointLight.name = `${object.celestialObjectId}-low-lod-light`;
    return pointLight;
  }

  /**
   * Creates the LODLevel for the star billboard.
   * @param object - The renderable celestial object.
   * @param sprite - The sprite for the billboard.
   * @param pointLight - The point light for the billboard.
   * @param billboardDistance - The distance at which this LOD becomes active.
   * @returns An LODLevel object.
   */
  private _createBillboardLODLevel(
    object: RenderableCelestialObject,
    sprite: THREE.Sprite,
    pointLight: THREE.PointLight,
    billboardDistance: number,
  ): LODLevel {
    const billboardGroup = new THREE.Group();
    billboardGroup.name = `${object.celestialObjectId}-billboard-lod`;
    billboardGroup.add(sprite);
    billboardGroup.add(pointLight);

    return {
      object: billboardGroup,
      distance: billboardDistance,
    };
  }

  /**
   * Creates and returns an array of LOD levels for the star object.
   * Combines custom LODs from subclasses with a base billboard LOD.
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const customLODs = this.getCustomLODs(object, options);
    const billboardDistance = this.getBillboardLODDistance(object);

    const circleTexture = this._createBillboardTexture();

    // Use calculateBillboardSize if the subclass has implemented it, otherwise fall back to default calculation
    let distantPointSize: number;
    if (typeof (this as any).calculateBillboardSize === "function") {
      distantPointSize = (this as any).calculateBillboardSize(object);
    } else {
      distantPointSize = this._calculateDistantSpriteSize(object);
    }

    const distantSprite = this._createBillboardSprite(
      object,
      circleTexture,
      distantPointSize,
    );
    const pointLight = this._createBillboardPointLight(object);
    const billboardLOD = this._createBillboardLODLevel(
      object,
      distantSprite,
      pointLight,
      billboardDistance,
    );

    // Store info for dynamic updates
    this.billboardsInfo.set(object.celestialObjectId, {
      sprite: distantSprite,
      activationDistance: billboardDistance,
      maxFadeDistance: billboardDistance * 5, // Fade out over 5x the activation distance
    });

    // Ensure LODs are sorted by distance, though typically customLODs will be closer.
    return [...customLODs, billboardLOD].sort(
      (a, b) => a.distance - b.distance,
    );
  }

  /**
   * Helper to create the high-detail group (Level 0 LOD).
   * Contains the logic previously in createMesh.
   * @internal
   */
  protected _createHighDetailGroup(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = `${object.celestialObjectId}-high-lod-group`;

    const segments =
      options?.segments ?? (options?.detailLevel === "high" ? 128 : 96);
    const geometry = new THREE.SphereGeometry(
      object.radius,
      segments,
      segments,
    );
    const material = this.getMaterial(object);
    this.materials.set(object.celestialObjectId, material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${object.celestialObjectId}-body`;
    group.add(mesh);
    this.addCorona(object, group);
    return group;
  }

  /**
   * Add corona effect to the star
   */
  protected addCorona(
    object: RenderableCelestialObject,
    group: THREE.Group,
  ): void {
    const starColor = this.getStarColor(object);
    const coronaMaterials: CoronaMaterial[] = [];

    this.coronaMaterials.set(object.celestialObjectId, coronaMaterials);

    const coronaScales = [1.1, 1.2];
    const opacities = [0.1, 0.05];

    const coronaVertexShader = this.getCoronaVertexShader(object);
    const coronaFragmentShaderToUse = this.getCoronaFragmentShader(object);

    coronaScales.forEach((scale, index) => {
      const coronaRadius = object.radius * scale;
      const coronaGeometry = new THREE.SphereGeometry(coronaRadius, 64, 64);
      const coronaMaterial = new CoronaMaterial(
        starColor,
        {
          scale: scale,
          opacity: opacities[index],
          pulseSpeed: 0.12 + index * 0.03,
          noiseScale: 1.2 + index * 0.3,
        },
        coronaVertexShader,
        coronaFragmentShaderToUse,
      );
      coronaMaterials.push(coronaMaterial);
      const coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
      coronaMesh.name = `${object.celestialObjectId}-corona-${index}`;
      coronaMesh.material.depthWrite = false;
      coronaMesh.material.side = THREE.DoubleSide;
      group.add(coronaMesh);
    });
  }

  /**
   * Get the appropriate material for the star type
   * Subclasses must implement this
   */
  protected abstract getMaterial(
    object: RenderableCelestialObject,
  ): THREE.ShaderMaterial;

  /**
   * Update the renderer with the current time
   */
  update(
    time: number,
    lightSources?: Map<string, LightSourceData>,
    camera?: THREE.Camera,
  ): void {
    this.elapsedTime = Date.now() / 1000 - this.startTime; // Always use total elapsed time

    // DIAGNOSTIC LOG
    // console.log(`[BaseStarRenderer] update. Input time: ${time}, Calculated elapsedTime: ${this.elapsedTime}`);

    this.materials.forEach((material: any) => {
      if (typeof material.update === "function") {
        material.update(this.elapsedTime);
      }
    });

    this.coronaMaterials.forEach((materials) => {
      materials.forEach((material) => {
        material.update(this.elapsedTime);
      });
    });

    this.glowMaterials.forEach((materials) => {
      materials.forEach((material: any) => {
        if (material.uniforms && material.uniforms.time) {
          material.uniforms.time.value = this.elapsedTime;
        }
      });
    });

    if (camera && this.billboardsInfo.size > 0) {
      const cameraPosition = new THREE.Vector3();
      camera.getWorldPosition(cameraPosition);

      this.billboardsInfo.forEach((info) => {
        const { sprite, activationDistance, maxFadeDistance } = info;

        const material = sprite.material as THREE.SpriteMaterial;
        if (!material) return;

        const spriteWorldPosition = new THREE.Vector3();
        sprite.getWorldPosition(spriteWorldPosition);
        const distanceToCamera = cameraPosition.distanceTo(spriteWorldPosition);

        // Determine target opacity for smooth fade-in/out of the billboard
        let targetOpacity;
        // The initial opacity set in _createBillboardSprite is 0.85
        const baseSpriteOpacity = 0.85;

        if (distanceToCamera >= activationDistance) {
          // Billboard LOD is active (camera is far enough),
          // maintain its standard visible opacity.
          targetOpacity = baseSpriteOpacity;
        } else {
          // Billboard LOD is not active (a closer LOD should be visible),
          // so fade the billboard out.
          targetOpacity = 0.0;
        }

        material.opacity = THREE.MathUtils.lerp(
          material.opacity,
          targetOpacity,
          0.1,
        );

        if (material.opacity > 0 && !sprite.visible) {
        }
      });
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.materials.forEach((material: any) => {
      if (typeof material.dispose === "function") {
        material.dispose();
      }
    });

    this.coronaMaterials.forEach((materials) => {
      materials.forEach((material) => {
        material.dispose();
      });
    });

    this.glowMaterials.forEach((materials) => {
      materials.forEach((material: any) => {
        if (typeof material.dispose === "function") {
          material.dispose();
        }
      });
    });

    this.materials.clear();
    this.coronaMaterials.clear();
    this.glowMaterials.clear();
    this.billboardsInfo.clear();
  }

  /**
   * Get the primary color for the star based on its properties
   * Subclasses can override this for specific star types
   */
  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    const starProps = object.properties as StarProperties;

    if (starProps?.color) {
      return new THREE.Color(starProps.color);
    }

    if (starProps?.spectralClass) {
      switch (starProps.spectralClass.toUpperCase()) {
        case "O":
          return new THREE.Color(0x9bb0ff);
        case "B":
          return new THREE.Color(0xaabfff);
        case "A":
          return new THREE.Color(0xf8f7ff);
        case "F":
          return new THREE.Color(0xfff4ea);
        case "G":
          return new THREE.Color(0xffcc00);
        case "K":
          return new THREE.Color(0xffaa55);
        case "M":
          return new THREE.Color(0xff6644);
      }
    }

    return new THREE.Color(0xffcc00);
  }

  /**
   * Adds gravitational lensing effects. Base implementation does nothing.
   * Subclasses like black hole or neutron star renderers should override this.
   */
  addGravitationalLensing(
    objectData: RenderableCelestialObject,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    mesh: THREE.Object3D,
  ): void {
    // Base stars do not typically have gravitational lensing of this type.
    // console.warn(`[BaseStarRenderer] addGravitationalLensing called for ${objectData.celestialObjectId}, but not implemented for this star type.`);
  }
}
