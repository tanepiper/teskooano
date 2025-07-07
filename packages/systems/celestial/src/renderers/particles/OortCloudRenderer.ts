import {
  CelestialType,
  type OortCloudProperties as CentralOortCloudProperties,
  SCALE,
} from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import {
  BaseCelestialRenderer,
  CelestialMeshOptions,
  LightSourcesMap,
} from "@teskooano/renderer-threejs-celestial";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";

const oortCloudVertexShader = `
  attribute float size;
  attribute float initialRotation;
  
  
  uniform float cloudRotationAngleX;
  uniform float cloudRotationAngleY;
  uniform float cloudRotationAngleZ;
  
  varying vec3 vColor;
  varying float vInitialRotation;
  uniform float pointSizeScale;

  void main() {
    vColor = color;
    vInitialRotation = initialRotation;
    
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    
    gl_PointSize = size * pointSizeScale;
  }
`;

const oortCloudFragmentShader = `
  varying vec3 vColor;
  varying float vInitialRotation;
  uniform sampler2D cloudTexture;
  uniform float alphaTest;
  uniform float time;
  uniform float particleRotationSpeed;

  void main() {
    
    vec4 texColor = texture2D(cloudTexture, gl_PointCoord);
    
    
    if (texColor.a < alphaTest) discard;

    
    gl_FragColor = texColor * vec4(vColor, 1.0);
  }
`;

/**
 * Renders an Oort cloud using a particle system
 */
export class OortCloudRenderer extends BaseCelestialRenderer<THREE.ShaderMaterial> {
  private objectId: string | null = null;
  private particles: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private cloudTexture: THREE.Texture | null = null;
  private time: number = 0;
  private invalidParticleLogged: Set<string> = new Set();

  private cloudRotationSpeed = 0.00002;
  private particleRotationSpeed = 0.5 + Math.random() * 1.0;
  private cloudRotationAngles = { x: 0, y: 0, z: 0 };
  private lastLogTime = 0;
  private previousSimTime = 0;
  private cumulativeRotation = { x: 0, y: 0, z: 0 };
  private resetCounter = 0;
  private cumulativeParticleTime = 0;
  private textureLoader: THREE.TextureLoader | null = null;

  constructor() {
    super();
  }

  /**
   * Creates a fallback canvas texture for when the real texture doesn't load
   */
  private createFallbackCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Create a simple circular gradient
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.5, "rgba(200, 220, 255, 0.8)");
      gradient.addColorStop(1, "rgba(160, 192, 255, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }

    return canvas;
  }

  /**
   * Creates and returns the geometry and material for the Oort cloud particles.
   * @returns An object containing the geometry and material.
   */
  getMeshComponents(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): { geometry: THREE.BufferGeometry; material: THREE.ShaderMaterial } {
    let properties: CentralOortCloudProperties | null = null;

    if (
      object.properties &&
      object.properties.type === CelestialType.OORT_CLOUD
    ) {
      properties = object.properties as CentralOortCloudProperties;
    } else {
      console.error(
        `[OortCloudRenderer] Could not find 'oortCloudProperties' in object properties for ${object.celestialObjectId}. Using defaults.`,
      );
      properties = null;
    }

    if (!properties) {
      console.error("Invalid OortCloudProperties:", properties);
      properties = {
        type: CelestialType.OORT_CLOUD,
        innerRadiusAU: 2000, // More realistic Oort cloud distance
        outerRadiusAU: 20000, // Reasonable outer radius for proper sphere
        composition: ["ice"],
        visualDensity: 0.1,
        visualParticleCount: 150, // Much reduced for subtlety
        visualParticleColor: "#101011",
      };

      if (!properties.innerRadiusAU) properties.innerRadiusAU = 2000;
      if (!properties.outerRadiusAU) properties.outerRadiusAU = 20000;
    }

    if (
      typeof properties.visualParticleCount !== "number" ||
      isNaN(properties.visualParticleCount) ||
      typeof properties.innerRadiusAU !== "number" ||
      isNaN(properties.innerRadiusAU) ||
      typeof properties.outerRadiusAU !== "number" ||
      isNaN(properties.outerRadiusAU)
    ) {
      console.error(
        "Invalid essential OortCloudProperties after default assignment:",
        properties,
      );

      properties = {
        type: CelestialType.OORT_CLOUD,
        innerRadiusAU: 2000, // More realistic Oort cloud distance
        outerRadiusAU: 20000, // Reasonable outer radius for proper sphere
        composition: ["ice"],
        visualDensity: 0.1,
        visualParticleCount: 150, // Much reduced for subtlety
        visualParticleColor: "#161717",
      };
    }

    this.geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const initialRotations: number[] = [];

    const scaledInnerRadius = properties.innerRadiusAU * SCALE.RENDER_SCALE_AU;
    const scaledOuterRadius = properties.outerRadiusAU * SCALE.RENDER_SCALE_AU;
    const visualRadius = scaledInnerRadius;
    const visualThickness = scaledOuterRadius - scaledInnerRadius;

    const visualCount = Math.min(properties.visualParticleCount, 300);

    const visualColorHex = properties.visualParticleColor ?? "#353536";

    if (
      !Number.isFinite(visualRadius) ||
      !Number.isFinite(visualThickness) ||
      !Number.isFinite(visualCount) ||
      visualThickness <= 0
    ) {
      console.error(
        `OortCloudRenderer: Invalid visualRadius (${visualRadius}), visualThickness (${visualThickness}), or visualCount (${visualCount}) before loop for object ${object.celestialObjectId}. Returning empty geometry/material.`,
      );

      const material = this.createAndRegisterMaterial(object);
      return {
        geometry: new THREE.BufferGeometry(),
        material: material || new THREE.ShaderMaterial(),
      };
    }

    // Create particles in a spherical distribution (Oort cloud)
    for (let i = 0; i < visualCount; i++) {
      // Spherical coordinates for uniform distribution on sphere
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;

      // Radius varies between inner and outer radius
      const r = visualRadius + Math.random() * visualThickness;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions.push(x, y, z);

      const baseColor = new THREE.Color(visualColorHex);
      const hsl = { h: 0, s: 0, l: 0 };
      baseColor.getHSL(hsl);

      // Very subtle color variation - keep it very dark
      const newColor = new THREE.Color().setHSL(
        hsl.h + (Math.random() * 0.05 - 0.025),
        Math.max(0.05, hsl.s * (0.5 + Math.random() * 0.2)),
        Math.max(0.1, hsl.l * (0.3 + Math.random() * 0.2)),
      );

      colors.push(newColor.r, newColor.g, newColor.b);

      // Make particles very small and subtle
      sizes.push(0.5 + Math.random() * 1.0);
      initialRotations.push(Math.random() * Math.PI * 2);
    }

    this.geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    this.geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3),
    );
    this.geometry.setAttribute(
      "size",
      new THREE.Float32BufferAttribute(sizes, 1),
    );
    this.geometry.setAttribute(
      "initialRotation",
      new THREE.Float32BufferAttribute(initialRotations, 1),
    );

    const material = this.createAndRegisterMaterial(object);

    return {
      geometry: this.geometry,
      material: material || new THREE.ShaderMaterial(),
    };
  }

  /**
   * Creates the shader material for the Oort cloud.
   */
  protected createMaterial(
    object: RenderableCelestialObject,
  ): THREE.ShaderMaterial {
    if (!this.cloudTexture) {
      const texturePath = "space/textures/asteroids/asteroid_1.png";

      this.textureLoader = new THREE.TextureLoader();
      this.textureLoader.load(
        `${window.location.href}${texturePath}`,
        (texture) => {
          const material = this.getTypedMaterial(object.celestialObjectId);
          if (material) {
            material.uniforms.cloudTexture.value = texture;
            material.needsUpdate = true;
          }
        },
        undefined,
        (error) => {
          console.error(
            "[OortCloudRenderer] Error loading cloud texture:",
            error,
          );
        },
      );
    }

    // Create a fallback texture in case the real texture doesn't load
    const fallbackTexture = new THREE.CanvasTexture(
      this.createFallbackCanvas(),
    );

    const material = new THREE.ShaderMaterial({
      uniforms: {
        cloudTexture: { value: this.cloudTexture || fallbackTexture },
        alphaTest: { value: 0.5 },
        pointSizeScale: { value: 0.3 }, // Much smaller for subtle appearance
        time: { value: 0.0 },
        cloudRotationAngleX: { value: 0.0 },
        cloudRotationAngleY: { value: 0.0 },
        cloudRotationAngleZ: { value: 0.0 },
        particleRotationSpeed: { value: this.particleRotationSpeed },
      },
      vertexShader: oortCloudVertexShader,
      fragmentShader: oortCloudFragmentShader,
      transparent: false, // Changed to false like asteroid field
      vertexColors: true,

      depthWrite: true, // Changed to true for proper depth handling
      depthTest: true, // Added depth testing
      blending: THREE.NormalBlending,

      alphaTest: 0.2, // Increased to match asteroid field
    });

    material.needsUpdate = true;
    material.uniformsNeedUpdate = true;

    material.onBeforeCompile = (shader) => {
      const renderer = material.userData.renderer;
      if (renderer) {
        const gl = renderer.getContext();
        if (gl) {
          const vertexShader = gl.createShader(gl.VERTEX_SHADER);
          if (vertexShader) {
            gl.shaderSource(vertexShader, shader.vertexShader);
            gl.compileShader(vertexShader);
            if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
              console.error(
                "[OortCloudRenderer] Vertex shader compile error:",
                gl.getShaderInfoLog(vertexShader),
              );
            } else {
            }
            gl.deleteShader(vertexShader);
          }

          const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
          if (fragmentShader) {
            gl.shaderSource(fragmentShader, shader.fragmentShader);
            gl.compileShader(fragmentShader);
            if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
              console.error(
                "[OortCloudRenderer] Fragment shader compile error:",
                gl.getShaderInfoLog(fragmentShader),
              );
            } else {
            }
            gl.deleteShader(fragmentShader);
          }
        }
      }
    };

    return material;
  }

  /**
   * Creates the THREE.Object3D (Points) for the Oort cloud.
   * This represents the highest LOD level (Level 0).
   */
  createMesh(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): THREE.Object3D {
    const { geometry, material } = this.getMeshComponents(object, options);

    this.objectId = object.celestialObjectId;

    this.particles = new THREE.Points(geometry, material);
    this.particles.name = `${object.celestialObjectId}-oortcloud`;

    this.particles.visible = true;
    this.particles.frustumCulled = true; // Enable frustum culling like asteroid field
    this.particles.renderOrder = 10;

    return this.particles;
  }

  /**
   * Creates and returns an array of LOD levels for the Oort Cloud.
   * Like asteroid field, creates a single fixed spherical shell that's always visible.
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions & {
      parentLODDistances?: number[];
      cloudRotationSpeed?: number;
    },
  ): LODLevel[] {
    this.objectId = object.celestialObjectId;

    this.cloudRotationAngles = { x: 0, y: 0, z: 0 };
    this.cumulativeRotation = { x: 0, y: 0, z: 0 };
    this.resetCounter = 0;
    this.cumulativeParticleTime = 0;

    if (options?.cloudRotationSpeed !== undefined) {
      this.cloudRotationSpeed = options.cloudRotationSpeed;
    }

    // Create material
    const material = this.createAndRegisterMaterial(object);
    if (!material) {
      console.error(
        `[OortCloudRenderer] Could not create material for ${object.celestialObjectId}.`,
      );
      return []; // Return empty array if material fails
    }

    // Create fixed geometry like asteroid field
    const geometry = this._createOortCloudGeometry(object);

    const points = new THREE.Points(geometry, material);
    points.name = `${object.celestialObjectId}-oortcloud`;
    points.frustumCulled = true;

    // Single LOD level - always visible like asteroid field
    return [{ object: points, distance: 0 }];
  }

  /**
   * Creates BufferGeometry for the Oort cloud particles like asteroid field.
   * @param object - The renderable object data.
   * @returns The generated BufferGeometry.
   * @internal
   */
  private _createOortCloudGeometry(
    object: RenderableCelestialObject,
  ): THREE.BufferGeometry {
    // Get properties (reuse the logic from getMeshComponents)
    let properties = this.getOortCloudProperties(object);

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const initialRotations: number[] = [];

    const scaledInnerRadius = properties.innerRadiusAU * SCALE.RENDER_SCALE_AU;
    const scaledOuterRadius = properties.outerRadiusAU * SCALE.RENDER_SCALE_AU;
    const visualRadius = scaledInnerRadius;
    const visualThickness = scaledOuterRadius - scaledInnerRadius;

    const visualColorHex = properties.visualParticleColor ?? "#353536";
    const targetParticleCount = properties.visualParticleCount;

    // Create particles in a spherical distribution
    for (let i = 0; i < targetParticleCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = visualRadius + Math.random() * visualThickness;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions.push(x, y, z);

      const baseColor = new THREE.Color(visualColorHex);
      const hsl = { h: 0, s: 0, l: 0 };
      baseColor.getHSL(hsl);

      const newColor = new THREE.Color().setHSL(
        hsl.h + (Math.random() * 0.1 - 0.05),
        Math.max(0.1, hsl.s * (0.8 + Math.random() * 0.4)),
        Math.max(0.3, hsl.l * (0.8 + Math.random() * 0.4)),
      );

      colors.push(newColor.r, newColor.g, newColor.b);
      sizes.push(4 + Math.random() * 8);
      initialRotations.push(Math.random() * Math.PI * 2);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute(
      "initialRotation",
      new THREE.Float32BufferAttribute(initialRotations, 1),
    );

    return geometry;
  }

  /**
   * Extract properties logic for reuse
   */
  private getOortCloudProperties(object: RenderableCelestialObject) {
    let properties = null;

    if (
      object.properties &&
      object.properties.type === CelestialType.OORT_CLOUD
    ) {
      properties = object.properties;
    }

    if (!properties) {
      properties = {
        type: CelestialType.OORT_CLOUD,
        innerRadiusAU: 2000,
        outerRadiusAU: 20000,
        composition: ["ice"],
        visualDensity: 0.1,
        visualParticleCount: 1000,
        visualParticleColor: "#303031",
      };
    }

    return properties;
  }

  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.Camera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    // Call parent update to handle LOD and billboard updates
    super.update(
      object,
      time,
      timeScale,
      lightSources,
      camera,
      allObjects,
      allMeshes,
    );

    const material = this.getTypedMaterial(object.celestialObjectId);
    if (material) {
      material.uniforms.time.value = this.getElapsedTime() * 0.0001;
      material.uniformsNeedUpdate = true;
    }
  }

  dispose(): void {
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.cloudTexture) {
      this.cloudTexture.dispose();
    }
    this.particles = null;
    this.cloudTexture = null;
    this.textureLoader = null;
    this.invalidParticleLogged.clear();
    this.cloudRotationAngles = { x: 0, y: 0, z: 0 };
    this.cumulativeRotation = { x: 0, y: 0, z: 0 };
    this.resetCounter = 0;
    this.cumulativeParticleTime = 0;

    // Call parent dispose to clean up base class resources
    super.dispose();
  }
}
