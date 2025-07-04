import * as THREE from "three";
import { LightSourcesMap } from "..";

import type { RenderableCelestialObject } from "@teskooano/data-types";
import {
  CelestialType,
  SCALE,
  type AsteroidFieldProperties as CentralAsteroidFieldProperties,
} from "@teskooano/data-types";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import { BaseCelestialRenderer } from "../base/BaseCelestialRenderer";
import { CelestialMeshOptions } from "../base";

const MAX_LIGHTS = 4;

const asteroidVertexShader = `
  attribute float size;
  attribute float textureIndex;
  attribute float initialRotation;
  
  uniform float beltRotationAngle;
  uniform float renderScale;
  
  varying vec3 vColor;
  varying float vTextureIndex;
  varying float vInitialRotation;
  varying vec3 vWorldPosition;

  void main() {
    vColor = color;
    vTextureIndex = textureIndex;
    vInitialRotation = initialRotation;
    
    
    float cosAngle = cos(beltRotationAngle);
    float sinAngle = sin(beltRotationAngle);
    vec3 rotatedPosition = vec3(
      position.x * cosAngle - position.z * sinAngle,
      position.y,
      position.x * sinAngle + position.z * cosAngle
    );
    
    vec4 worldPosition = modelMatrix * vec4(rotatedPosition, 1.0);
    vWorldPosition = worldPosition.xyz;

    vec4 mvPosition = viewMatrix * worldPosition;

    gl_Position = projectionMatrix * mvPosition;
    
    // Scale point size based on distance to camera
    float distance = length(mvPosition.xyz);
    float calculatedPointSize = size * (1.0 / distance) * renderScale * 350.0;
    
    gl_PointSize = max(1.5, calculatedPointSize);
  }
`;

const asteroidFragmentShader = `
  #define MAX_LIGHTS 4

  struct Light {
    vec3 position;
    vec3 color;
    float intensity;
  };

  varying vec3 vColor;
  varying float vTextureIndex;
  varying float vInitialRotation;
  uniform sampler2D asteroidTextures[5];
  uniform float alphaTest;
  uniform float time;
  uniform float particleRotationSpeed; 
  uniform Light uLights[MAX_LIGHTS];
  uniform int uNumLights;
  varying vec3 vWorldPosition;

  void main() {
    vec4 texColor;
    
    float angle = vInitialRotation + time * particleRotationSpeed;
    mat2 rotationMatrix = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    
    vec2 center = vec2(0.5, 0.5);
    vec2 uv = gl_PointCoord - center;
    vec2 rotatedUV = rotationMatrix * uv + center;

    /*
    if (rotatedUV.x < 0.0 || rotatedUV.x > 1.0 || rotatedUV.y < 0.0 || rotatedUV.y > 1.0) {
        discard;
    }
    */

    if (vTextureIndex < 0.5) {
        texColor = texture2D(asteroidTextures[0], rotatedUV);
    } else if (vTextureIndex < 1.5) {
        texColor = texture2D(asteroidTextures[1], rotatedUV);
    } else if (vTextureIndex < 2.5) {
        texColor = texture2D(asteroidTextures[2], rotatedUV);
    } else if (vTextureIndex < 3.5) {
        texColor = texture2D(asteroidTextures[3], rotatedUV);
    } else {
        texColor = texture2D(asteroidTextures[4], rotatedUV);
    }

    if (texColor.a < alphaTest) discard; 

    // Remap gl_PointCoord to -1 to 1 range to represent a sphere's surface
    vec2 fromCenter = gl_PointCoord * 2.0 - 1.0;
    float len = length(fromCenter);
    if (len > 1.0) discard; // Discard fragments outside the circle to ensure round particles

    // Calculate a pseudo-normal for a sphere
    vec3 normal = vec3(fromCenter.x, fromCenter.y, sqrt(1.0 - len * len));
    
    // Lighting Calculation
    vec3 totalLighting = vec3(0.15); // Ambient light

    for (int i = 0; i < MAX_LIGHTS; i++) {
        if (i >= uNumLights) break;
        
        vec3 lightDirection = normalize(uLights[i].position - vWorldPosition);
        float diffuse = max(dot(normal, lightDirection), 0.0);
        
        vec3 lightContribution = uLights[i].color * uLights[i].intensity * diffuse;
        totalLighting += lightContribution;
    }
    
    totalLighting = clamp(totalLighting, 0.0, 1.0);
    
    // Final color combines texture, vertex color, and lighting
    vec3 finalColor = texColor.rgb * vColor * totalLighting;
    
    gl_FragColor = vec4(finalColor, texColor.a);
  }
`;

/**
 * Renders an asteroid field using a particle system with LOD support.
 */
export class AsteroidFieldRenderer extends BaseCelestialRenderer {
  private lodGeometries: THREE.BufferGeometry[] = [];

  private asteroidTextures: THREE.Texture[] = [];
  private readonly textureLoader: THREE.TextureLoader;
  private loadedTextureCount = 0;
  private materialReady = false;
  private beltRotationSpeed = 0.00005;
  private particleRotationSpeed = 1.0 + Math.random() * 2;
  private beltRotationAngle = 0;
  private previousSimTime = 0;
  private cumulativeParticleTime = 0;
  private renderScale = 1.0;

  constructor() {
    super();
    this.textureLoader = new THREE.TextureLoader();
  }

  /**
   * Creates the shared ShaderMaterial, loading textures asynchronously.
   * @internal
   */
  private _createSharedMaterial(objectId: string): THREE.ShaderMaterial {
    if (this.asteroidTextures.length === 0) {
      const texturePaths = [
        "space/textures/asteroids/asteroid_1.png",
        "space/textures/asteroids/asteroid_2.png",
        "space/textures/asteroids/asteroid_3.png",
        "space/textures/asteroids/asteroid_4.png",
        "space/textures/asteroids/asteroid_5.png",
      ];

      this.asteroidTextures = new Array(5).fill(null);
      this.loadedTextureCount = 0;
      this.materialReady = false;

      texturePaths.forEach((path, index) => {
        this.textureLoader.load(
          path,
          (texture) => {
            this.asteroidTextures[index] = texture;
            this.loadedTextureCount++;

            const material = this.materials.get(
              objectId,
            ) as THREE.ShaderMaterial;

            if (material) {
              if (material.uniforms.asteroidTextures.value) {
                material.uniforms.asteroidTextures.value[index] = texture;

                if (this.loadedTextureCount === 5) {
                  material.uniforms.asteroidTextures.value =
                    this.asteroidTextures;
                  material.needsUpdate = true;
                  this.materialReady = true;
                }
              } else {
                console.warn(
                  "[AsteroidFieldRenderer] Material uniform array not ready for texture update.",
                );
              }
            }
          },
          undefined,
          (error) => {
            console.error(`Failed to load texture: ${path}`, error);
          },
        );
      });
    }

    const lights: {
      position: THREE.Vector3;
      color: THREE.Color;
      intensity: number;
    }[] = [];
    for (let i = 0; i < MAX_LIGHTS; i++) {
      lights.push({
        position: new THREE.Vector3(),
        color: new THREE.Color(),
        intensity: 0,
      });
    }

    const material = new THREE.ShaderMaterial({
      uniforms: {
        asteroidTextures: { value: this.asteroidTextures },
        alphaTest: { value: 0.2 },
        renderScale: { value: this.renderScale },
        time: { value: 0.0 },
        beltRotationAngle: { value: 0.0 },
        particleRotationSpeed: { value: this.particleRotationSpeed },
        uLights: { value: lights },
        uNumLights: { value: 0 },
      },
      vertexShader: asteroidVertexShader,
      fragmentShader: asteroidFragmentShader,
      transparent: false,
      vertexColors: true,
      depthWrite: true,
      depthTest: true,
      blending: THREE.NormalBlending,
    });

    material.onBeforeCompile = (shader) => {
      const gl = material.userData.renderer?.getContext();
      if (gl) {
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        if (vertexShader) {
          gl.shaderSource(vertexShader, shader.vertexShader);
          gl.compileShader(vertexShader);
          if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error(
              "[AsteroidFieldRenderer] Vertex shader compile error:",
              gl.getShaderInfoLog(vertexShader),
            );
          }
          gl.deleteShader(vertexShader);
        }
      }
    };

    this.registerMaterial(objectId, material);
    return material;
  }

  /**
   * Creates BufferGeometry for the asteroid field particles with a specific count.
   * @param object - The renderable object data.
   * @param targetParticleCount - The number of particles to generate.
   * @returns The generated BufferGeometry.
   * @internal
   */
  private _createAsteroidGeometry(
    object: RenderableCelestialObject,
    targetParticleCount: number,
  ): THREE.BufferGeometry {
    let properties: CentralAsteroidFieldProperties | null = null;

    if (
      object.properties &&
      object.properties.type === CelestialType.ASTEROID_FIELD
    ) {
      properties = object.properties as CentralAsteroidFieldProperties;
    } else {
      console.error(
        `[AsteroidFieldRenderer] Invalid properties for ${object.celestialObjectId}. Using defaults.`,
      );
      properties = {
        /* Default properties */ type: CelestialType.ASTEROID_FIELD,
        innerRadiusAU: 2.0,
        outerRadiusAU: 3.0,
        heightAU: 0.2,
        count: 1000,
        color: "#8B7355",
        composition: ["rock"],
      };
    }

    if (!properties) {
      throw new Error(
        "[AsteroidFieldRenderer] Failed to get valid properties for geometry generation.",
      );
    }

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const textureIndices: number[] = [];
    const initialRotations: number[] = [];

    const visualInnerRadius = properties.innerRadiusAU * SCALE.RENDER_SCALE_AU;
    const visualOuterRadius = properties.outerRadiusAU * SCALE.RENDER_SCALE_AU;
    const visualHeight = properties.heightAU * SCALE.RENDER_SCALE_AU;
    const baseColorHex =
      properties.visualParticleColor ?? properties.color ?? "#8B7355";

    for (let i = 0; i < targetParticleCount; i++) {
      const r =
        visualInnerRadius +
        Math.random() * (visualOuterRadius - visualInnerRadius);
      const theta = Math.random() * Math.PI * 2;
      const h = (Math.random() - 0.5) * visualHeight;

      const x = r * Math.cos(theta);
      const y = h;
      const z = r * Math.sin(theta);
      positions.push(x, y, z);

      const baseColor = new THREE.Color(baseColorHex);
      const hsl = { h: 0, s: 0, l: 0 };
      baseColor.getHSL(hsl);
      const newColor = new THREE.Color().setHSL(
        hsl.h + (Math.random() * 0.1 - 0.05),
        hsl.s * (0.8 + Math.random() * 0.4),
        hsl.l * (0.8 + Math.random() * 0.4),
      );
      colors.push(newColor.r, newColor.g, newColor.b);

      sizes.push(8 + Math.random() * 12);
      textureIndices.push(i % 5);
      initialRotations.push(Math.random() * Math.PI * 2);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute(
      "textureIndex",
      new THREE.Float32BufferAttribute(textureIndices, 1),
    );
    geometry.setAttribute(
      "initialRotation",
      new THREE.Float32BufferAttribute(initialRotations, 1),
    );

    this.lodGeometries.push(geometry);
    return geometry;
  }

  /**
   * Creates and returns an array of LOD levels with varying particle counts.
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions & {
      parentLODDistances?: number[];
      beltRotationSpeed?: number;
    },
  ): LODLevel[] {
    this.lodGeometries = [];

    if (options?.beltRotationSpeed !== undefined) {
      this.beltRotationSpeed = options.beltRotationSpeed;
    }
    if (options?.renderScale !== undefined) {
      this.renderScale = options.renderScale;
    }

    let material = this.materials.get(
      object.celestialObjectId,
    ) as THREE.ShaderMaterial;
    if (!material) {
      material = this._createSharedMaterial(object.celestialObjectId);
    }

    const distancesAU = [0, 10, 20, 30];
    const distancesSceneUnits = distancesAU.map(
      (au) => au * SCALE.RENDER_SCALE_AU,
    );

    const particleCounts = [20000, 10000, 5000, 5000];

    const lodLevels: LODLevel[] = [];

    `[AsteroidFieldRenderer] Creating ${distancesSceneUnits.length} LOD levels for asteroid field`;

    for (let i = 0; i < distancesSceneUnits.length; i++) {
      const distance = distancesSceneUnits[i];

      const count = particleCounts[Math.min(i, particleCounts.length - 1)];

      const geometry = this._createAsteroidGeometry(object, count);

      const points = new THREE.Points(geometry, material);
      points.name = `${object.celestialObjectId}-asteroidfield-lod-${i}`;
      points.frustumCulled = true;

      lodLevels.push({ object: points, distance: distance });
    }

    if (lodLevels.length === 0) {
      console.error(
        `[AsteroidFieldRenderer] Failed to generate any LOD levels for ${object.celestialObjectId}.`,
      );

      const fallbackGeom = this._createAsteroidGeometry(object, 1000);
      const fallbackPoints = new THREE.Points(fallbackGeom, material);
      return [{ object: fallbackPoints, distance: 0 }];
    }

    return lodLevels;
  }

  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.Camera,
  ): void {
    super.update(object, time, timeScale, lightSources, camera);
    const material = this.materials.get(
      object.celestialObjectId,
    ) as THREE.ShaderMaterial;

    if (material && this.materialReady) {
      // Time-based rotation for the entire belt
      const deltaTime = (time - this.previousSimTime) * timeScale;
      this.beltRotationAngle += this.beltRotationSpeed * deltaTime;
      this.beltRotationAngle %= 2 * Math.PI; // Prevent precision loss
      material.uniforms.beltRotationAngle.value = this.beltRotationAngle;
      this.previousSimTime = time;

      // Slower, cumulative time for individual particle rotation
      this.cumulativeParticleTime += deltaTime * 0.05; // Scale down for slower rotation
      this.cumulativeParticleTime %= 2 * Math.PI; // Prevent precision loss
      material.uniforms.time.value = this.cumulativeParticleTime;
      material.uniforms.renderScale.value = this.renderScale;

      if (lightSources && lightSources.size > 0) {
        let lightIndex = 0;
        const lightsUniform = material.uniforms.uLights
          .value as typeof material.uniforms.uLights.value;

        lightSources.forEach((lightData) => {
          if (lightIndex < MAX_LIGHTS) {
            lightsUniform[lightIndex].position.copy(lightData.position);
            lightsUniform[lightIndex].color.copy(lightData.color);
            lightsUniform[lightIndex].intensity = lightData.intensity ?? 1.0;
            lightIndex++;
          }
        });
        material.uniforms.uNumLights.value = lightIndex;
      } else {
        material.uniforms.uNumLights.value = 0;
      }
    }
  }

  dispose(): void {
    super.dispose();

    this.asteroidTextures.forEach((texture) => {
      if (texture) texture.dispose();
    });
    this.asteroidTextures = [];

    this.lodGeometries.forEach((geometry) => {
      geometry.dispose();
    });
    this.lodGeometries = [];
    this.materialReady = false;
    this.beltRotationAngle = 0;
    this.previousSimTime = 0;
    this.cumulativeParticleTime = 0;
  }
}
