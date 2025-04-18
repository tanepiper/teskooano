import { renderableObjectsStore } from "@teskooano/core-state";
import { simulationState } from "@teskooano/core-state";
import { CelestialType, type OortCloudProperties as CentralOortCloudProperties, SCALE } from '@teskooano/data-types';
import type { RenderableCelestialObject } from '@teskooano/renderer-threejs';
import * as THREE from 'three';
import { CelestialMeshOptions, CelestialRenderer, LODLevel } from '..';

// --- Shaders --- // TODO: Move to separate .glsl files
const oortCloudVertexShader = `
  attribute float size;
  attribute float initialRotation;
  
  // For cloud rotation
  uniform float cloudRotationAngleX;
  uniform float cloudRotationAngleY;
  uniform float cloudRotationAngleZ;
  
  varying vec3 vColor;
  varying float vInitialRotation;
  uniform float pointSizeScale;

  void main() {
    vColor = color;
    vInitialRotation = initialRotation;
    
    // Simplified position calculation - temporarily skip rotation to verify basic rendering
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Make points very small
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
    // Simplified approach - just use point coordinates directly first to check if texture works
    vec4 texColor = texture2D(cloudTexture, gl_PointCoord);
    
    // Apply alpha test
    if (texColor.a < alphaTest) discard;

    // Modulate texture color with vertex color
    gl_FragColor = texColor * vec4(vColor, 1.0);
  }
`;
// --- End Shaders ---

/**
 * Renders an Oort cloud using a particle system
 */
export class OortCloudRenderer implements CelestialRenderer {
  private objectId: string | null = null;
  private particles: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private cloudTexture: THREE.Texture | null = null;
  private time: number = 0;
  private invalidParticleLogged: Set<string> = new Set(); // Track logged warnings
  
  // Rotation control variables
  private cloudRotationSpeed = 0.00002; // Slower than asteroid field
  private particleRotationSpeed = 0.5 + Math.random() * 1.0; // Reduced for smoother rotation
  private cloudRotationAngles = { x: 0, y: 0, z: 0 };
  private lastLogTime = 0; // For throttling logs
  private previousSimTime = 0; // Track previous simulation time for reset detection
  private cumulativeRotation = { x: 0, y: 0, z: 0 }; // Track accumulated rotation across time resets
  private resetCounter = 0; // Count resets for debugging
  private cumulativeParticleTime = 0; // Track accumulated particle rotation time
  private textureLoader: THREE.TextureLoader | null = null;

  /**
   * Creates and returns the geometry and material for the Oort cloud particles.
   * @returns An object containing the geometry and material.
   */
  getMeshComponents(object: RenderableCelestialObject, options?: CelestialMeshOptions): { geometry: THREE.BufferGeometry; material: THREE.ShaderMaterial } {
    let properties: CentralOortCloudProperties | null = null;
    
    // Check if properties is an object with oortCloudProperties
    if (object.properties &&
        object.properties.type === CelestialType.OORT_CLOUD) {
      properties = object.properties as CentralOortCloudProperties;
    } else {
      console.error(`[OortCloudRenderer] Could not find 'oortCloudProperties' in object properties for ${object.celestialObjectId}. Using defaults.`);
      properties = null;
    }
    
    // Force default properties if null
    if (!properties) {
        console.error('Invalid OortCloudProperties:', properties);
        properties = {
            type: CelestialType.OORT_CLOUD,
            innerRadiusAU: 190,
            outerRadiusAU: 210,
            composition: ['ice'],
            visualDensity: 0.1,
            visualParticleCount: 5000,
            visualParticleColor: '#A0C0FF'
        };

        // Also ensure the AU radii are set in the default object for scaling below
        if (!properties.innerRadiusAU) properties.innerRadiusAU = 190;
        if (!properties.outerRadiusAU) properties.outerRadiusAU = 210;
    }

    // Validate essential visual properties (ensure they exist and are numbers)
    if (typeof properties.visualParticleCount !== 'number' || isNaN(properties.visualParticleCount) ||
        typeof properties.innerRadiusAU !== 'number' || isNaN(properties.innerRadiusAU) ||
        typeof properties.outerRadiusAU !== 'number' || isNaN(properties.outerRadiusAU))
    {
        console.error('Invalid essential OortCloudProperties after default assignment:', properties);
        // Re-assign defaults if critical values are missing/invalid
        properties = {
            type: CelestialType.OORT_CLOUD,
            innerRadiusAU: 190,
            outerRadiusAU: 210,
            composition: ['ice'],
            visualDensity: 0.1,
            visualParticleCount: 5000,
            visualParticleColor: '#A0C0FF'
        };
    }

    this.geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const initialRotations: number[] = [];

    // --- Determine visual parameters by scaling AU values using RENDER_SCALE_AU ---
    const scaledInnerRadius = properties.innerRadiusAU * SCALE.RENDER_SCALE_AU;
    const scaledOuterRadius = properties.outerRadiusAU * SCALE.RENDER_SCALE_AU;
    const visualRadius = scaledInnerRadius; // Base visual radius on scaled inner AU radius
    const visualThickness = scaledOuterRadius - scaledInnerRadius; // Calculate thickness from scaled values
    
    // For debugging, reduce particle count to ensure the system is working
    const visualCount = Math.min(properties.visualParticleCount, 10000); // Increased for higher density
    
    const visualColorHex = properties.visualParticleColor ?? '#A0C0FF';
    

    // Additional validation before loop to ensure finite numbers
    if (!Number.isFinite(visualRadius) || !Number.isFinite(visualThickness) || !Number.isFinite(visualCount) || visualThickness <= 0) {
      console.error(`OortCloudRenderer: Invalid visualRadius (${visualRadius}), visualThickness (${visualThickness}), or visualCount (${visualCount}) before loop for object ${object.celestialObjectId}. Returning empty geometry/material.`);
      // Return placeholder empty geometry/material
      const material = this._createShaderMaterial(object);
      return { geometry: new THREE.BufferGeometry(), material };
    }

    // Create a much simpler test layout first - a ring of particles in the XZ plane
    for (let i = 0; i < visualCount; i++) {
      // Distribute particles in a uniform ring pattern for testing visibility
      const angle = (i / visualCount) * Math.PI * 2;
      const r = visualRadius + (visualThickness * 0.5); // Use middle of the shell
      
      const x = r * Math.cos(angle);
      const y = 0; // Keep all in same plane for now
      const z = r * Math.sin(angle);
      
      positions.push(x, y, z);
      
      // Make colors brighter for better visibility
      const baseColor = new THREE.Color(visualColorHex);
      const hsl = { h: 0, s: 0, l: 0 };
      baseColor.getHSL(hsl);
      
      const newColor = new THREE.Color().setHSL(
        hsl.h,
        hsl.s,
        Math.min(1.0, hsl.l * 1.5) // Make particles brighter
      );
      
      colors.push(newColor.r, newColor.g, newColor.b);
      
      // Make particles larger for visibility
      sizes.push(10 + Math.random() * 20);
      initialRotations.push(Math.random() * Math.PI * 2);
    }

    // Replace with spherical distribution
    positions.length = 0;
    colors.length = 0;
    sizes.length = 0;
    initialRotations.length = 0;

    // Create particles in a spherical shell formation
    for (let i = 0; i < visualCount; i++) {
      // Use spherical coordinates to create points uniformly distributed on a sphere
      const phi = Math.acos(2 * Math.random() - 1); // Polar angle [0, PI]
      const theta = Math.random() * Math.PI * 2;    // Azimuthal angle [0, 2*PI]
      
      // Random radius within the thickness of the shell
      const r = visualRadius + (Math.random() * visualThickness);
      
      // Convert spherical to cartesian coordinates
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      positions.push(x, y, z);
      
      // Make colors brighter for better visibility
      const baseColor = new THREE.Color(visualColorHex);
      const hsl = { h: 0, s: 0, l: 0 };
      baseColor.getHSL(hsl);
      
      const newColor = new THREE.Color().setHSL(
        hsl.h,
        hsl.s,
        Math.min(1.0, hsl.l * 1.5) // Make particles brighter
      );
      
      colors.push(newColor.r, newColor.g, newColor.b);
      
      // Make particles very small but vary slightly
      sizes.push(1.0 + Math.random() * 0.5);
      initialRotations.push(Math.random() * Math.PI * 2);
    }

    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    this.geometry.setAttribute('initialRotation', new THREE.Float32BufferAttribute(initialRotations, 1));

    // Create shader material
    const material = this._createShaderMaterial(object);

    return { geometry: this.geometry, material };
  }

  /**
   * Creates the shader material for the Oort cloud.
   */
  private _createShaderMaterial(object: RenderableCelestialObject): THREE.ShaderMaterial {
    
    // Load particle texture if needed
    if (!this.cloudTexture) {
      
      // Use file-based texture loading instead of base64 data
      const texturePath = '/space/textures/asteroids/asteroid_1.png'; // Use a known working texture
      
      this.textureLoader = new THREE.TextureLoader();
      this.textureLoader.load(
        texturePath,
        (texture) => {
          if (this.material) {
            this.material.uniforms.cloudTexture.value = texture;
            this.material.needsUpdate = true;
          }
        },
        undefined,
        (error) => {
          console.error('[OortCloudRenderer] Error loading cloud texture:', error);
        }
      );
    }

    // Create a simple material first - just to get particles rendering
    const material = new THREE.ShaderMaterial({
      uniforms: {
        cloudTexture: { value: this.cloudTexture },
        alphaTest: { value: 0.1 },
        pointSizeScale: { value: 0.5 },
        time: { value: 0.0 },
        cloudRotationAngleX: { value: 0.0 },
        cloudRotationAngleY: { value: 0.0 },
        cloudRotationAngleZ: { value: 0.0 },
        particleRotationSpeed: { value: this.particleRotationSpeed }
      },
      vertexShader: oortCloudVertexShader,
      fragmentShader: oortCloudFragmentShader,
      transparent: true,
      vertexColors: true,
      
      // Simpler rendering settings that match what worked for asteroid renderer
      depthWrite: true,
      blending: THREE.NormalBlending,
      
      // These flags may help with visibility
      alphaTest: 0.1,
      opacity: 1.0
    });
    
    // Set properties after creation to ensure they take effect
    material.needsUpdate = true;
    material.uniformsNeedUpdate = true;

    // Debug shader compilation errors
    material.onBeforeCompile = (shader) => {
      
      // Check for WebGL compile errors
      const renderer = material.userData.renderer;
      if (renderer) {
        const gl = renderer.getContext();
        if (gl) {
          // Check vertex shader
          const vertexShader = gl.createShader(gl.VERTEX_SHADER);
          if (vertexShader) {
            gl.shaderSource(vertexShader, shader.vertexShader);
            gl.compileShader(vertexShader);
            if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
              console.error('[OortCloudRenderer] Vertex shader compile error:', gl.getShaderInfoLog(vertexShader));
            } else {
            }
            gl.deleteShader(vertexShader);
          }
          
          // Check fragment shader
          const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
          if (fragmentShader) {
            gl.shaderSource(fragmentShader, shader.fragmentShader);
            gl.compileShader(fragmentShader);
            if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
              console.error('[OortCloudRenderer] Fragment shader compile error:', gl.getShaderInfoLog(fragmentShader));
            } else {
            }
            gl.deleteShader(fragmentShader);
          }
        }
      }
    };

    this.material = material;
    return material;
  }

  /**
   * Creates the THREE.Object3D (Points) for the Oort cloud.
   * This represents the highest LOD level (Level 0).
   */
  createMesh(object: RenderableCelestialObject, options?: CelestialMeshOptions): THREE.Object3D {
    const { geometry, material } = this.getMeshComponents(object, options);
    
    this.objectId = object.celestialObjectId;



    this.particles = new THREE.Points(geometry, material);
    this.particles.name = `${object.celestialObjectId}-oortcloud`;
    
    // Make sure the particles are visible
    this.particles.visible = true;
    
    // Try setting a higher renderOrder to ensure it renders above other objects
    this.particles.renderOrder = 10;

    return this.particles;
  }

  /**
   * Creates and returns an array of LOD levels for the Oort Cloud.
   * Level 0 contains the detailed particle system.
   * Subsequent levels are empty groups, using distances from parentLODDistances.
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions & { parentLODDistances?: number[], cloudRotationSpeed?: number }
  ): LODLevel[] {
    this.objectId = object.celestialObjectId;
    
    // Reset rotation values when creating a new cloud
    this.cloudRotationAngles = { x: 0, y: 0, z: 0 };
    this.cumulativeRotation = { x: 0, y: 0, z: 0 };
    this.resetCounter = 0;
    this.cumulativeParticleTime = 0;
    
    // Check if custom rotation speed is provided
    if (options?.cloudRotationSpeed !== undefined) {
      this.cloudRotationSpeed = options.cloudRotationSpeed;
    }

    // Level 0: The detailed particle system
    const detailedParticles = this.createMesh(object, options);
    const level0: LODLevel = { object: detailedParticles, distance: 0 };

    const lodLevels = [level0];

    // Levels 1+: Empty groups using parent distances (if provided)
    if (options?.parentLODDistances && options.parentLODDistances.length > 0) {
      options.parentLODDistances.forEach((distance, index) => {
        if (distance > 0) {
          const emptyGroup = new THREE.Group();
          emptyGroup.name = `${object.celestialObjectId}-oortcloud-lod-${index + 1}-empty`;
          lodLevels.push({ object: emptyGroup, distance: distance });
        } else if (index > 0) {
          console.warn(
            `[OortCloudRenderer] Parent LOD distance ${index} is 0, creating empty group anyway.`
          );
          const emptyGroup = new THREE.Group();
          emptyGroup.name = `${object.celestialObjectId}-oortcloud-lod-${index + 1}-empty`;
          lodLevels.push({ object: emptyGroup, distance: 0.001 * (index + 1) });
        }
      });
    } else {
      console.warn(
        `[OortCloudRenderer] No parentLODDistances provided for ${object.celestialObjectId}. Oort Cloud will always render at high detail.`
      );
    }
  

    return lodLevels;
  }

  update(time: number): void {
    if (!this.particles || !this.objectId || !this.material) {
      console.warn(`[OortCloudRenderer] Update called but missing required properties: particles=${!!this.particles}, objectId=${!!this.objectId}, material=${!!this.material}`);
      return;
    }

    // Get current simulation time scale
    const timeScale = simulationState.get().timeScale;
    
    // Debug: Log time values occasionally to avoid console spam
    const currentTime = Date.now();
    
    // Calculate time delta, handling potential resets
    let timeDelta: number;
    let timeResetDetected = false;
    
    if (time < this.previousSimTime) {
      // Simulation time reset detected
      this.resetCounter++;
      timeResetDetected = true;
      
  
      
      // Store current rotation angles in our cumulative tracker before reset
      this.cumulativeRotation.x = this.cloudRotationAngles.x;
      this.cumulativeRotation.y = this.cloudRotationAngles.y;
      this.cumulativeRotation.z = this.cloudRotationAngles.z;
      timeDelta = 0; // No movement on reset frame
    } else {
      // Normal time progression
      timeDelta = time - this.previousSimTime;
      
      // Update cumulative particle time for sprite rotations
      this.cumulativeParticleTime += timeDelta;
    }
    
    // Calculate cloud rotation based on simulation time and time scale
    if (!timeResetDetected) {
      // Only increment rotation on non-reset frames
      // Vary speeds on different axes for more natural look
      this.cloudRotationAngles.x = this.cumulativeRotation.x + (time * this.cloudRotationSpeed * 0.7 * timeScale);
      this.cloudRotationAngles.y = this.cumulativeRotation.y + (time * this.cloudRotationSpeed * 1.0 * timeScale);
      this.cloudRotationAngles.z = this.cumulativeRotation.z + (time * this.cloudRotationSpeed * 0.5 * timeScale);
    }
    
    // Keep angles in reasonable range for precision
    this.cloudRotationAngles.x %= (Math.PI * 2);
    this.cloudRotationAngles.y %= (Math.PI * 2);
    this.cloudRotationAngles.z %= (Math.PI * 2);
    
    // Store current time for next frame comparison
    this.previousSimTime = time;
    
    if (currentTime - this.lastLogTime > 5000) {
      this.lastLogTime = currentTime;
    }

    // Update material uniforms for cloud and particle rotation
    this.material.uniforms.time.value = this.cumulativeParticleTime;
    this.material.uniforms.particleRotationSpeed.value = this.particleRotationSpeed * timeScale;
    this.material.uniforms.cloudRotationAngleX.value = this.cloudRotationAngles.x;
    this.material.uniforms.cloudRotationAngleY.value = this.cloudRotationAngles.y;
    this.material.uniforms.cloudRotationAngleZ.value = this.cloudRotationAngles.z;
    this.material.uniformsNeedUpdate = true;

    // Make sure the particles are always visible
    if (this.particles && !this.particles.visible) {
      this.particles.visible = true;
    }

    // Oort cloud position is typically centered on the system origin (its parent)
    const currentRenderableObjects = renderableObjectsStore.get();
    const currentObject = currentRenderableObjects[this.objectId];

    if (!currentObject) {
      console.warn(`[OortCloudRenderer Update] Object ${this.objectId} not found in store.`);
      return;
    }

    const parentId = currentObject.parentId;
    let parentPosition: THREE.Vector3 | null = null;

    if (parentId) {
      const parentObject = currentRenderableObjects[parentId];
      if (parentObject && parentObject.position) {
        parentPosition = parentObject.position;
      } else {
        console.warn(`[OortCloudRenderer Update] Parent object ${parentId} or its position not found for ${this.objectId}.`);
      }
    }

    // Update position relative to parent IF parent exists
    if (parentPosition && this.particles) {
      this.particles.position.copy(parentPosition);
    }
  }

  dispose(): void {
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
    if (this.cloudTexture) {
      this.cloudTexture.dispose();
    }
    this.particles = null;
    this.material = null;
    this.cloudTexture = null;
    this.textureLoader = null;
    this.invalidParticleLogged.clear();
    this.cloudRotationAngles = { x: 0, y: 0, z: 0 };
    this.cumulativeRotation = { x: 0, y: 0, z: 0 };
    this.resetCounter = 0;
    this.cumulativeParticleTime = 0;
  }
} 