import * as THREE from "three";
import type {
  LODLevel,
  CelestialPhysicalProperties,
  CelestialBillboardConfig,
  BillboardVisualOptions,
  BillboardLightParameters,
  Billboard,
} from "./types";

/**
 * Optional parameters for customizing the `DefaultBillboard` instance.
 * These options allow overriding the default fallback values used during billboard creation
 * if specific configurations are not provided through `CelestialBillboardConfig`.
 */
export interface DefaultBillboardOptions {
  /** @default 0.05 */
  defaultSpriteSize?: number;
  /** @default 0.85 */
  defaultOpacity?: number;
  /** @default 5.0 */
  defaultLightIntensity?: number;
  /** @default 2.0 */
  defaultLightDecay?: number;
  /** @default 0.03 */
  minSpriteSize?: number;
  /** @default 0.15 */
  maxSpriteSize?: number;
  /** @default 0.0001 */
  radiusToSpriteSizeFactor?: number;
  /** @default 64 */
  textureWidth?: number;
  /** @default 64 */
  textureHeight?: number;
}

/**
 * Default implementation of the `Billboard` interface.
 * Creates a standard billboard representation for celestial objects, typically used for far LODs.
 * It consists of a screen-space sprite with a radial gradient texture and an optional point light.
 * The appearance and behavior can be configured via `DefaultBillboardOptions` at construction,
 * and further customized per-instance via `CelestialBillboardConfig` passed to `createLOD`.
 * Provides various protected methods for extensibility, allowing subclasses to override specific parts of the generation process.
 */
export class DefaultBillboard implements Billboard {
  /** Default screen-space size for the billboard sprite if not otherwise specified. */
  protected readonly defaultSpriteSize: number;
  /** Default opacity for the billboard sprite. */
  protected readonly defaultOpacity: number;
  /** Default intensity for the associated point light. */
  protected readonly defaultLightIntensity: number;
  /** Default decay factor for the point light. */
  protected readonly defaultLightDecay: number;
  /** Minimum calculated screen-space size for the sprite when sized by radius. */
  protected readonly minSpriteSize: number;
  /** Maximum calculated screen-space size for the sprite when sized by radius. */
  protected readonly maxSpriteSize: number;
  /** Factor to convert object radius to sprite size if no explicit size is given. */
  protected readonly radiusToSpriteSizeFactor: number;
  /** Default width for the procedurally generated billboard texture. */
  protected readonly textureWidth: number;
  /** Default height for the procedurally generated billboard texture. */
  protected readonly textureHeight: number;

  /**
   * Constructs a `DefaultBillboard` instance.
   * @param options Optional configuration to override the default internal values used by this billboard generator.
   */
  constructor(options?: DefaultBillboardOptions) {
    this.defaultSpriteSize = options?.defaultSpriteSize ?? 0.05;
    this.defaultOpacity = options?.defaultOpacity ?? 0.85;
    this.defaultLightIntensity = options?.defaultLightIntensity ?? 5.0;
    this.defaultLightDecay = options?.defaultLightDecay ?? 2.0;
    this.minSpriteSize = options?.minSpriteSize ?? 0.03;
    this.maxSpriteSize = options?.maxSpriteSize ?? 0.15;
    this.radiusToSpriteSizeFactor = options?.radiusToSpriteSizeFactor ?? 0.0001;
    this.textureWidth = options?.textureWidth ?? 64;
    this.textureHeight = options?.textureHeight ?? 64;
  }

  /**
   * Creates a default procedural radial gradient texture for the billboard.
   * The gradient is white at the center and fades to transparent at the edges.
   * @param width The desired width of the canvas texture.
   * @param height The desired height of the canvas texture.
   * @returns A `THREE.CanvasTexture` with the radial gradient.
   */
  protected _createProceduralTexture(
    width: number,
    height: number,
  ): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
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
   * Creates or retrieves the texture for the billboard sprite.
   * If a texture is provided in `visualOptions`, it is used directly.
   * Otherwise, a default procedural texture is generated.
   * @param visualOptions Optional configuration for visuals, which might include a pre-defined texture.
   * @returns A `THREE.Texture` to be used for the billboard sprite.
   */
  protected createTexture(
    visualOptions: BillboardVisualOptions | undefined,
  ): THREE.Texture {
    if (visualOptions?.texture) {
      return visualOptions.texture;
    }
    return this._createProceduralTexture(this.textureWidth, this.textureHeight);
  }

  /**
   * Calculates the screen-space size of the billboard sprite.
   * If `visualOptions.size` is provided, it's used directly.
   * Otherwise, size is calculated based on the object's physical radius, clamped within min/max limits.
   * @param physicalProperties Physical properties of the celestial object (e.g., radius).
   * @param visualOptions Optional configuration for visuals, which might specify a size.
   * @returns The calculated sprite size (screen-space units).
   */
  protected calculateSpriteSize(
    physicalProperties: CelestialPhysicalProperties,
    visualOptions: BillboardVisualOptions | undefined,
  ): number {
    if (visualOptions?.size !== undefined) {
      return visualOptions.size;
    }
    const calculatedSpriteSize =
      physicalProperties.radius * this.radiusToSpriteSizeFactor;
    return Math.max(
      this.minSpriteSize,
      Math.min(this.maxSpriteSize, calculatedSpriteSize),
    );
  }

  /**
   * Creates the `THREE.SpriteMaterial` for the billboard.
   * Configures the material with the provided texture, color, blending, and opacity.
   * @param texture The texture to apply to the sprite material.
   * @param visualOptions Optional visual configuration which can specify color and opacity.
   * @param baseObjectColor Fallback color if not specified in `visualOptions`.
   * @returns A configured `THREE.SpriteMaterial`.
   */
  protected _createSpriteMaterial(
    texture: THREE.Texture,
    visualOptions: BillboardVisualOptions | undefined,
    baseObjectColor: THREE.Color,
  ): THREE.SpriteMaterial {
    const spriteColor =
      visualOptions?.color instanceof THREE.Color
        ? visualOptions.color
        : visualOptions?.color
          ? new THREE.Color(visualOptions.color)
          : baseObjectColor;

    return new THREE.SpriteMaterial({
      map: texture,
      color: spriteColor,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: false,
      transparent: true,
      opacity: visualOptions?.opacity ?? this.defaultOpacity,
    });
  }

  /**
   * Creates the `THREE.Sprite` for the billboard.
   * Uses a helper method `_createSpriteMaterial` to create the material.
   * @param celestialId ID of the celestial object, used for naming the sprite.
   * @param texture Texture for the sprite.
   * @param size Calculated screen-space size of the sprite.
   * @param visualOptions Optional visual configuration for color and opacity, passed to material creation.
   * @param baseObjectColor Base color of the celestial object, used as a fallback for tinting.
   * @returns A configured `THREE.Sprite` instance.
   */
  protected createSprite(
    celestialId: string,
    texture: THREE.Texture,
    size: number,
    visualOptions: BillboardVisualOptions | undefined,
    baseObjectColor: THREE.Color,
  ): THREE.Sprite {
    const spriteMaterial = this._createSpriteMaterial(
      texture,
      visualOptions,
      baseObjectColor,
    );
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.name = `${celestialId}-distant-sprite`;
    sprite.scale.set(size, size, 1.0);
    return sprite;
  }

  /**
   * Calculates the final intensity for the billboard's point light.
   * Considers explicit configuration, derivation from star material glow, default intensity, and albedo scaling.
   * @param lightParams Optional light configuration from `CelestialBillboardConfig`.
   * @param physicalProperties Physical properties of the celestial object (radius, albedo).
   * @param starMaterial Optional shader material of the main star object, used to derive glow intensity.
   * @returns The calculated light intensity, or `null` if the light should be disabled.
   */
  protected _calculateLightIntensity(
    lightParams: BillboardLightParameters | undefined,
    physicalProperties: CelestialPhysicalProperties,
    starMaterial?: THREE.ShaderMaterial,
  ): number | null {
    const lightIntensityConfig = lightParams?.intensity;

    if (lightIntensityConfig === 0) {
      return null;
    }

    let finalIntensity: number;
    if (lightIntensityConfig !== undefined) {
      finalIntensity = lightIntensityConfig;
    } else if (starMaterial?.uniforms?.glowIntensity?.value) {
      const materialGlowIntensity = starMaterial.uniforms.glowIntensity.value;
      finalIntensity = materialGlowIntensity * 10.0;
      finalIntensity = Math.max(0.5, Math.min(finalIntensity, 20.0));
    } else {
      finalIntensity = this.defaultLightIntensity;
      if (
        physicalProperties.albedo !== undefined &&
        physicalProperties.albedo > 0
      ) {
        const albedoFactor = 0.5 + physicalProperties.albedo * 0.5;
        finalIntensity *= albedoFactor;
      }
    }
    return finalIntensity > 0 ? finalIntensity : null;
  }

  /**
   * Determines the color for the billboard's point light.
   * Uses color from `lightParams` if provided, otherwise falls back to `baseObjectColor`.
   * @param lightParams Optional light configuration from `CelestialBillboardConfig`.
   * @param baseObjectColor The base color of the celestial object.
   * @returns The determined `THREE.Color` for the light.
   */
  protected _getLightColor(
    lightParams: BillboardLightParameters | undefined,
    baseObjectColor: THREE.Color,
  ): THREE.Color {
    return lightParams?.color instanceof THREE.Color
      ? lightParams.color
      : lightParams?.color
        ? new THREE.Color(lightParams.color)
        : baseObjectColor;
  }

  /**
   * Creates the point light associated with the billboard, if applicable.
   * Uses helper methods to determine intensity and color.
   * @param celestialId ID of the celestial object, used for naming the light.
   * @param lightParams Optional light configuration from `CelestialBillboardConfig`.
   * @param baseObjectColor The base color of the celestial object, used as a fallback for light color.
   * @param physicalProperties Physical properties of the celestial object (radius, albedo).
   * @param starMaterial Optional shader material of the main star object, used to derive glow intensity.
   * @returns A `THREE.PointLight` instance or `null` if no light is created.
   */
  protected createPointLight(
    celestialId: string,
    lightParams: BillboardLightParameters | undefined,
    baseObjectColor: THREE.Color,
    physicalProperties: CelestialPhysicalProperties,
    starMaterial?: THREE.ShaderMaterial,
  ): THREE.PointLight | null {
    const finalIntensity = this._calculateLightIntensity(
      lightParams,
      physicalProperties,
      starMaterial,
    );
    if (finalIntensity === null || finalIntensity <= 0) {
      return null;
    }

    const lightColor = this._getLightColor(lightParams, baseObjectColor);

    const pointLight = new THREE.PointLight(
      lightColor,
      finalIntensity,
      0,
      lightParams?.decay ?? this.defaultLightDecay,
    );
    pointLight.name = `${celestialId}-billboard-light`;
    return pointLight;
  }

  /**
   * Creates the `LODLevel` object for the billboard.
   * This method orchestrates the creation of the texture, sprite, and optional point light,
   * then groups them into a `THREE.Group` for the LOD level.
   * @param celestialId The ID of the celestial object, for naming purposes.
   * @param physicalProperties Physical properties of the celestial object (e.g., radius, albedo).
   * @param billboardConfig Specific configuration for this billboard's appearance and light.
   * @param baseObjectColor The primary color of the celestial object, used as a default for billboard/light color.
   * @param lodDistance The distance at which this billboard LOD becomes active.
   * @param starMaterial Optional shader material of the main star object, used for effects like deriving glow intensity.
   * @returns An `LODLevel` object representing the billboard.
   */
  public createLOD(
    celestialId: string,
    physicalProperties: CelestialPhysicalProperties,
    billboardConfig: CelestialBillboardConfig | undefined,
    baseObjectColor: THREE.Color,
    lodDistance: number,
    starMaterial?: THREE.ShaderMaterial,
  ): LODLevel {
    const visualOptions = billboardConfig?.visuals;
    const lightOptions = billboardConfig?.light;

    const texture = this.createTexture(visualOptions);
    const size = this.calculateSpriteSize(physicalProperties, visualOptions);
    const sprite = this.createSprite(
      celestialId,
      texture,
      size,
      visualOptions,
      baseObjectColor,
    );

    const pointLight = this.createPointLight(
      celestialId,
      lightOptions,
      baseObjectColor,
      physicalProperties,
      starMaterial,
    );

    const billboardGroup = new THREE.Group();
    billboardGroup.name = `${celestialId}-billboard-lod`;
    billboardGroup.add(sprite);
    if (pointLight) {
      billboardGroup.add(pointLight);
    }

    return {
      object: billboardGroup,
      distance: lodDistance,
    };
  }
}
