import { renderableObjectsStore } from "@teskooano/core-state";
import { simulationState } from "@teskooano/core-state";
import * as THREE from "three";
import { CelestialMeshOptions, CelestialRenderer, LODLevel } from "..";

import {
  CelestialType,
  SCALE,
  AU_METERS,
  type AsteroidFieldProperties as CentralAsteroidFieldProperties,
} from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";

// --- Shaders --- // TODO: Move to separate .glsl files
const asteroidVertexShader = `
  attribute float size;
  attribute float textureIndex;
  attribute float initialRotation;
  // attribute vec3 color; // REMOVE: Provided by Three.js when vertexColors is true
  
  // For belt rotation
  uniform float beltRotationAngle;
  
  varying vec3 vColor;
  varying float vTextureIndex;
  varying float vInitialRotation;
  uniform float pointSizeScale; // New uniform for size attenuation
  // uniform float scale; // Screen height / 2.0 - Needed for manual size attenuation

  void main() {
    vColor = color;
    vTextureIndex = textureIndex;
    vInitialRotation = initialRotation;
    
    // Apply belt rotation to position (only around Y axis)
    float cosAngle = cos(beltRotationAngle);
    float sinAngle = sin(beltRotationAngle);
    vec3 rotatedPosition = vec3(
      position.x * cosAngle - position.z * sinAngle,
      position.y,
      position.x * sinAngle + position.z * cosAngle
    );
    
    vec4 mvPosition = modelViewMatrix * vec4(rotatedPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    // Manual Size Attenuation (Approximate)
    float calculatedPointSize = size * ( pointSizeScale / -mvPosition.z );
    // Clamp point size to avoid zero/negative values
    gl_PointSize = max(1.0, calculatedPointSize); 
    // gl_PointSize = size * ( pointSizeScale / -mvPosition.z ); // Revert this
  }
`;

const asteroidFragmentShader = `
  varying vec3 vColor;
  varying float vTextureIndex;
  varying float vInitialRotation;
  uniform sampler2D asteroidTextures[5];
  uniform float alphaTest;
  uniform float time;
  uniform float particleRotationSpeed; // Add uniform for particle rotation speed

  void main() {
    vec4 texColor;

    // Calculate rotation - now using the uniform rotation speed
    // We use a smaller coefficient to make rotation smoother
    float angle = vInitialRotation + time * particleRotationSpeed;
    mat2 rotationMatrix = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));

    // Rotate texture coordinates
    vec2 center = vec2(0.5, 0.5);
    vec2 uv = gl_PointCoord - center;
    vec2 rotatedUV = rotationMatrix * uv + center;

    // Discard if rotated UV is out of bounds [0, 1]
    if (rotatedUV.x < 0.0 || rotatedUV.x > 1.0 || rotatedUV.y < 0.0 || rotatedUV.y > 1.0) {
        discard;
    }

    // Use if/else chain for broad GLSL compatibility
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

    if ( texColor.a < alphaTest ) discard; // Manual alpha test

    // Modulate texture color with vertex color
    gl_FragColor = texColor * vec4(vColor, 1.0);
  }
`;
// --- End Shaders ---

/**
 * Renders an asteroid field using a particle system with LOD support.
 */
export class AsteroidFieldRenderer implements CelestialRenderer {
  private objectId: string | null = null;
  // Store generated geometries for disposal
  private lodGeometries: THREE.BufferGeometry[] = [];
  // Store the single shared ShaderMaterial
  private sharedMaterial: THREE.ShaderMaterial | null = null;
  private asteroidTextures: THREE.Texture[] = [];
  private time: number = 0;
  private textureLoader = new THREE.TextureLoader();
  private loadedTextureCount = 0;
  private materialReady = false; // Flag to track material readiness
  private beltRotationSpeed = 0.00005; // Make the belt rotation noticeably faster
  private particleRotationSpeed = 1.0 + Math.random() * 2; // Reduced to prevent jankiness
  private beltRotationAngle = 0;
  private lastLogTime = 0; // For throttling logs
  private previousSimTime = 0; // Track previous simulation time to detect resets
  private cumulativeRotation = 0; // Track accumulated rotation across time resets
  private resetCounter = 0; // Count resets for debugging
  private cumulativeParticleTime = 0; // Track accumulated particle rotation time

  /**
   * Creates the shared ShaderMaterial, loading textures asynchronously.
   * @internal
   */
  private _createSharedMaterial(): THREE.ShaderMaterial {
    // Load textures if not already loaded/loading
    if (this.asteroidTextures.length === 0) {
      const texturePaths = [
        "/space/textures/asteroids/asteroid_1.png",
        "/space/textures/asteroids/asteroid_2.png",
        "/space/textures/asteroids/asteroid_3.png",
        "/space/textures/asteroids/asteroid_4.png",
        "/space/textures/asteroids/asteroid_5.png",
      ];

      this.asteroidTextures = new Array(5).fill(null);
      this.loadedTextureCount = 0;
      this.materialReady = false; // Mark material as not ready

      texturePaths.forEach((path, index) => {
        this.textureLoader.load(
          path,
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
                  this.materialReady = true; // Mark material as ready
                }
              } else {
                console.warn(
                  "[AsteroidFieldRenderer] Material uniform array not ready for texture update."
                );
              }
            }
          },
          undefined,
          (error) => {
            console.error(`Failed to load texture: ${path}`, error);
            // Consider setting materialReady = true even on error, using fallback?
          }
        );
      });
    }

    // Create ShaderMaterial instance
    const material = new THREE.ShaderMaterial({
      uniforms: {
        asteroidTextures: { value: this.asteroidTextures },
        alphaTest: { value: 0.1 },
        pointSizeScale: { value: 600.0 },
        time: { value: 0.0 },
        beltRotationAngle: { value: 0.0 },
        particleRotationSpeed: { value: this.particleRotationSpeed }, // Add uniform for particle rotation
      },
      vertexShader: asteroidVertexShader,
      fragmentShader: asteroidFragmentShader,
      transparent: true,
      vertexColors: true,
      depthWrite: true,
      blending: THREE.NormalBlending,
    });

    // Debug shader compilation errors
    material.onBeforeCompile = (shader) => {
      // Check for WebGL compile errors
      const gl = material.userData.renderer?.getContext();
      if (gl) {
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        if (vertexShader) {
          gl.shaderSource(vertexShader, shader.vertexShader);
          gl.compileShader(vertexShader);
          if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error(
              "[AsteroidFieldRenderer] Vertex shader compile error:",
              gl.getShaderInfoLog(vertexShader)
            );
          }
          gl.deleteShader(vertexShader);
        }
      }
    };

    this.sharedMaterial = material; // Store reference
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
    targetParticleCount: number
  ): THREE.BufferGeometry {
    let properties: CentralAsteroidFieldProperties | null = null;

    if (
      object.properties &&
      object.properties.type === CelestialType.ASTEROID_FIELD
    ) {
      properties = object.properties as CentralAsteroidFieldProperties;
    } else {
      console.error(
        `[AsteroidFieldRenderer] Invalid properties for ${object.celestialObjectId}. Using defaults.`
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

    // Basic validation (can be expanded)
    if (!properties) {
      throw new Error(
        "[AsteroidFieldRenderer] Failed to get valid properties for geometry generation."
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
        hsl.l * (0.8 + Math.random() * 0.4)
      );
      colors.push(newColor.r, newColor.g, newColor.b);

      sizes.push(4 + Math.random() * 8); // ADJUSTED: increased from 2-6 to 4-12 to make particles more visible
      textureIndices.push(i % 5);
      initialRotations.push(Math.random() * Math.PI * 2);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute(
      "textureIndex",
      new THREE.Float32BufferAttribute(textureIndices, 1)
    );
    geometry.setAttribute(
      "initialRotation",
      new THREE.Float32BufferAttribute(initialRotations, 1)
    );

    // Store geometry for disposal
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
    }
  ): LODLevel[] {
    this.objectId = object.celestialObjectId;
    this.lodGeometries = []; // Clear previous geometries
    this.beltRotationAngle = 0; // Reset rotation angle on new belt creation
    this.cumulativeRotation = 0; // Reset cumulative rotation
    this.resetCounter = 0; // Reset counter

    // Check if rotation speed is provided in options
    if (options?.beltRotationSpeed !== undefined) {
      this.beltRotationSpeed = options.beltRotationSpeed;
    }

    // Ensure shared material is created (or loading has started)
    if (!this.sharedMaterial) {
      this._createSharedMaterial();
    }

    // Define LOD distances in AU and convert to scene units
    const distancesAU = [0, 1, 4, 10]; // Start distances for each LOD level in AU
    const distancesSceneUnits = distancesAU.map(
      (au) => au * SCALE.RENDER_SCALE_AU
    );

    // Define particle counts for each LOD level (highest to lowest)
    const particleCounts = [20000, 10000, 5000, 1000]; // Matches the AU distance ranges

    const lodLevels: LODLevel[] = [];

    `[AsteroidFieldRenderer] Creating ${distancesSceneUnits.length} LOD levels for asteroid field`;

    // Create geometry and points for each LOD level
    for (let i = 0; i < distancesSceneUnits.length; i++) {
      const distance = distancesSceneUnits[i];
      // Ensure particleCounts array is long enough, use last value if not
      const count = particleCounts[Math.min(i, particleCounts.length - 1)];

      // Create geometry for this level
      const geometry = this._createAsteroidGeometry(object, count);

      // Create Points object using the geometry and shared material
      const points = new THREE.Points(geometry, this.sharedMaterial!);
      points.name = `${object.celestialObjectId}-asteroidfield-lod-${i}`;
      points.frustumCulled = true;

      lodLevels.push({ object: points, distance: distance });
    }

    if (lodLevels.length === 0) {
      console.error(
        `[AsteroidFieldRenderer] Failed to generate any LOD levels for ${object.celestialObjectId}.`
      );
      // Maybe return a fallback single level?
      const fallbackGeom = this._createAsteroidGeometry(object, 1000);
      const fallbackPoints = new THREE.Points(
        fallbackGeom,
        this.sharedMaterial!
      );
      return [{ object: fallbackPoints, distance: 0 }];
    }

    return lodLevels;
  }

  update(time: number): void {
    // Debug: Log time values every second to avoid console spam
    const currentTime = Date.now();

    // Get current simulation time scale
    const timeScale = simulationState.get().timeScale;

    // Calculate time delta, handling potential resets
    let timeDelta: number;
    let timeResetDetected = false;

    if (time < this.previousSimTime) {
      // Simulation time reset detected
      this.resetCounter++;
      timeResetDetected = true;

      // Store current rotation angle in our cumulative tracker before reset
      this.cumulativeRotation = this.beltRotationAngle;
      timeDelta = 0; // No movement on reset frame
    } else {
      // Normal time progression
      timeDelta = time - this.previousSimTime;

      // Update cumulative particle time to make sprite rotations smooth
      // We use a separate accumulator to make particle rotation independent of belt rotation
      this.cumulativeParticleTime += timeDelta;
    }

    // Calculate asteroid field rotation based on simulation time and time scale
    if (!timeResetDetected) {
      // Only increment rotation on non-reset frames
      // Apply the timeScale to make rotation speed adjust with simulation speed
      this.beltRotationAngle =
        this.cumulativeRotation +
        time * this.beltRotationSpeed * 10 * timeScale;
    }

    // Keep angle in reasonable range for precision
    this.beltRotationAngle %= Math.PI * 2;

    // Store current time for next frame comparison
    this.previousSimTime = time;

    if (currentTime - this.lastLogTime > 1000) {
      this.lastLogTime = currentTime;
    }

    // Update the material time uniform for particle texture rotation
    if (this.sharedMaterial) {
      // Pass the cumulative particle time for smoother rotation
      this.sharedMaterial.uniforms.time.value = this.cumulativeParticleTime;

      // Update the particleRotationSpeed uniform with the current time scale
      this.sharedMaterial.uniforms.particleRotationSpeed.value =
        this.particleRotationSpeed * timeScale;

      // Apply current rotation angle (combines cumulative + current time)
      this.sharedMaterial.uniforms.beltRotationAngle.value =
        this.beltRotationAngle;

      // Force material update
      this.sharedMaterial.uniformsNeedUpdate = true;
    }

    // Store current time
    this.time = time;
  }

  dispose(): void {
    // Dispose shared material
    if (this.sharedMaterial) {
      this.sharedMaterial.dispose();
      this.sharedMaterial = null;
    }
    // Dispose textures
    this.asteroidTextures.forEach((texture) => {
      if (texture) texture.dispose();
    });
    this.asteroidTextures = [];
    // Dispose generated geometries
    this.lodGeometries.forEach((geometry) => {
      geometry.dispose();
    });
    this.lodGeometries = [];
    this.objectId = null;
    this.materialReady = false; // Reset flag
    this.beltRotationAngle = 0;
    this.previousSimTime = 0;
    this.cumulativeRotation = 0;
    this.resetCounter = 0;
    this.cumulativeParticleTime = 0;
  }
}
