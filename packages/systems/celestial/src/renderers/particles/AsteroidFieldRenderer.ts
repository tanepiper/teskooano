import * as THREE from "three";
import { CelestialMeshOptions, CelestialRenderer, LODLevel } from "..";

import {
  CelestialType,
  SCALE,
  AU_METERS,
  type AsteroidFieldProperties as CentralAsteroidFieldProperties,
} from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { getSimulationState } from "@teskooano/core-state";

const asteroidVertexShader = `
  attribute float size;
  attribute float textureIndex;
  attribute float initialRotation;
  
  
  
  uniform float beltRotationAngle;
  
  varying vec3 vColor;
  varying float vTextureIndex;
  varying float vInitialRotation;
  uniform float pointSizeScale; 
  

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
    
    vec4 mvPosition = modelViewMatrix * vec4(rotatedPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    float calculatedPointSize = size * ( pointSizeScale / -mvPosition.z );
    
    gl_PointSize = max(1.0, calculatedPointSize); 
    
  }
`;

const asteroidFragmentShader = `
  varying vec3 vColor;
  varying float vTextureIndex;
  varying float vInitialRotation;
  uniform sampler2D asteroidTextures[5];
  uniform float alphaTest;
  uniform float time;
  uniform float particleRotationSpeed; 

  void main() {
    vec4 texColor;

    
    
    float angle = vInitialRotation + time * particleRotationSpeed;
    mat2 rotationMatrix = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));

    
    vec2 center = vec2(0.5, 0.5);
    vec2 uv = gl_PointCoord - center;
    vec2 rotatedUV = rotationMatrix * uv + center;

    
    if (rotatedUV.x < 0.0 || rotatedUV.x > 1.0 || rotatedUV.y < 0.0 || rotatedUV.y > 1.0) {
        discard;
    }

    
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

    if ( texColor.a < alphaTest ) discard; 

    
    gl_FragColor = texColor * vec4(vColor, 1.0);
  }
`;

/**
 * Renders an asteroid field using a particle system with LOD support.
 */
export class AsteroidFieldRenderer implements CelestialRenderer {
  private objectId: string | null = null;

  private lodGeometries: THREE.BufferGeometry[] = [];

  private sharedMaterial: THREE.ShaderMaterial | null = null;
  private asteroidTextures: THREE.Texture[] = [];
  private time: number = 0;
  private textureLoader = new THREE.TextureLoader();
  private loadedTextureCount = 0;
  private materialReady = false;
  private beltRotationSpeed = 0.00005;
  private particleRotationSpeed = 1.0 + Math.random() * 2;
  private beltRotationAngle = 0;
  private lastLogTime = 0;
  private previousSimTime = 0;
  private cumulativeRotation = 0;
  private resetCounter = 0;
  private cumulativeParticleTime = 0;

  /**
   * Creates the shared ShaderMaterial, loading textures asynchronously.
   * @internal
   */
  private _createSharedMaterial(): THREE.ShaderMaterial {
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
          `${window.location.href}${path}`,
          (texture) => {
            this.asteroidTextures[index] = texture;
            this.loadedTextureCount++;

            if (this.sharedMaterial) {
              if (this.sharedMaterial.uniforms.asteroidTextures.value) {
                this.sharedMaterial.uniforms.asteroidTextures.value[index] =
                  texture;

                if (this.loadedTextureCount === 5) {
                  this.sharedMaterial.uniforms.asteroidTextures.value =
                    this.asteroidTextures;
                  this.sharedMaterial.needsUpdate = true;
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

    const material = new THREE.ShaderMaterial({
      uniforms: {
        asteroidTextures: { value: this.asteroidTextures },
        alphaTest: { value: 0.1 },
        pointSizeScale: { value: 600.0 },
        time: { value: 0.0 },
        beltRotationAngle: { value: 0.0 },
        particleRotationSpeed: { value: this.particleRotationSpeed },
      },
      vertexShader: asteroidVertexShader,
      fragmentShader: asteroidFragmentShader,
      transparent: true,
      vertexColors: true,
      depthWrite: true,
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

    this.sharedMaterial = material;
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

      sizes.push(4 + Math.random() * 8);
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
    this.objectId = object.celestialObjectId;
    this.lodGeometries = [];
    this.beltRotationAngle = 0;
    this.cumulativeRotation = 0;
    this.resetCounter = 0;

    if (options?.beltRotationSpeed !== undefined) {
      this.beltRotationSpeed = options.beltRotationSpeed;
    }

    if (!this.sharedMaterial) {
      this._createSharedMaterial();
    }

    const distancesAU = [0, 1, 4, 10];
    const distancesSceneUnits = distancesAU.map(
      (au) => au * SCALE.RENDER_SCALE_AU,
    );

    const particleCounts = [20000, 10000, 5000, 1000];

    const lodLevels: LODLevel[] = [];

    `[AsteroidFieldRenderer] Creating ${distancesSceneUnits.length} LOD levels for asteroid field`;

    for (let i = 0; i < distancesSceneUnits.length; i++) {
      const distance = distancesSceneUnits[i];

      const count = particleCounts[Math.min(i, particleCounts.length - 1)];

      const geometry = this._createAsteroidGeometry(object, count);

      const points = new THREE.Points(geometry, this.sharedMaterial!);
      points.name = `${object.celestialObjectId}-asteroidfield-lod-${i}`;
      points.frustumCulled = true;

      lodLevels.push({ object: points, distance: distance });
    }

    if (lodLevels.length === 0) {
      console.error(
        `[AsteroidFieldRenderer] Failed to generate any LOD levels for ${object.celestialObjectId}.`,
      );

      const fallbackGeom = this._createAsteroidGeometry(object, 1000);
      const fallbackPoints = new THREE.Points(
        fallbackGeom,
        this.sharedMaterial!,
      );
      return [{ object: fallbackPoints, distance: 0 }];
    }

    return lodLevels;
  }

  update(time: number): void {
    const currentTime = Date.now();

    const timeScale = getSimulationState().timeScale;

    let timeDelta: number;
    let timeResetDetected = false;

    if (time < this.previousSimTime) {
      this.resetCounter++;
      timeResetDetected = true;

      this.cumulativeRotation = this.beltRotationAngle;
      timeDelta = 0;
    } else {
      timeDelta = time - this.previousSimTime;

      this.cumulativeParticleTime += timeDelta;
    }

    if (!timeResetDetected) {
      this.beltRotationAngle =
        this.cumulativeRotation +
        time * this.beltRotationSpeed * 10 * timeScale;
    }

    this.beltRotationAngle %= Math.PI * 2;

    this.previousSimTime = time;

    if (currentTime - this.lastLogTime > 1000) {
      this.lastLogTime = currentTime;
    }

    if (this.sharedMaterial) {
      this.sharedMaterial.uniforms.time.value = this.cumulativeParticleTime;

      this.sharedMaterial.uniforms.particleRotationSpeed.value =
        this.particleRotationSpeed * timeScale;

      this.sharedMaterial.uniforms.beltRotationAngle.value =
        this.beltRotationAngle;

      this.sharedMaterial.uniformsNeedUpdate = true;
    }

    this.time = time;
  }

  dispose(): void {
    if (this.sharedMaterial) {
      this.sharedMaterial.dispose();
      this.sharedMaterial = null;
    }

    this.asteroidTextures.forEach((texture) => {
      if (texture) texture.dispose();
    });
    this.asteroidTextures = [];

    this.lodGeometries.forEach((geometry) => {
      geometry.dispose();
    });
    this.lodGeometries = [];
    this.objectId = null;
    this.materialReady = false;
    this.beltRotationAngle = 0;
    this.previousSimTime = 0;
    this.cumulativeRotation = 0;
    this.resetCounter = 0;
    this.cumulativeParticleTime = 0;
  }
}
