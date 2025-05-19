import {
  CelestialType,
  type OortCloudProperties as CentralOortCloudProperties,
  SCALE,
} from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import { CelestialMeshOptions, CelestialRenderer, LODLevel } from "..";
import { renderableStore, getSimulationState } from "@teskooano/core-state";

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
export class OortCloudRenderer implements CelestialRenderer {
  private objectId: string | null = null;
  private particles: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.ShaderMaterial | null = null;
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
        innerRadiusAU: 190,
        outerRadiusAU: 210,
        composition: ["ice"],
        visualDensity: 0.1,
        visualParticleCount: 5000,
        visualParticleColor: "#A0C0FF",
      };

      if (!properties.innerRadiusAU) properties.innerRadiusAU = 190;
      if (!properties.outerRadiusAU) properties.outerRadiusAU = 210;
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
        innerRadiusAU: 190,
        outerRadiusAU: 210,
        composition: ["ice"],
        visualDensity: 0.1,
        visualParticleCount: 5000,
        visualParticleColor: "#A0C0FF",
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

    const visualCount = Math.min(properties.visualParticleCount, 10000);

    const visualColorHex = properties.visualParticleColor ?? "#A0C0FF";

    if (
      !Number.isFinite(visualRadius) ||
      !Number.isFinite(visualThickness) ||
      !Number.isFinite(visualCount) ||
      visualThickness <= 0
    ) {
      console.error(
        `OortCloudRenderer: Invalid visualRadius (${visualRadius}), visualThickness (${visualThickness}), or visualCount (${visualCount}) before loop for object ${object.celestialObjectId}. Returning empty geometry/material.`,
      );

      const material = this._createShaderMaterial(object);
      return { geometry: new THREE.BufferGeometry(), material };
    }

    for (let i = 0; i < visualCount; i++) {
      const angle = (i / visualCount) * Math.PI * 2;
      const r = visualRadius + visualThickness * 0.5;

      const x = r * Math.cos(angle);
      const y = 0;
      const z = r * Math.sin(angle);

      positions.push(x, y, z);

      const baseColor = new THREE.Color(visualColorHex);
      const hsl = { h: 0, s: 0, l: 0 };
      baseColor.getHSL(hsl);

      const newColor = new THREE.Color().setHSL(
        hsl.h,
        hsl.s,
        Math.min(1.0, hsl.l * 1.5),
      );

      colors.push(newColor.r, newColor.g, newColor.b);

      sizes.push(10 + Math.random() * 20);
      initialRotations.push(Math.random() * Math.PI * 2);
    }

    positions.length = 0;
    colors.length = 0;
    sizes.length = 0;
    initialRotations.length = 0;

    for (let i = 0; i < visualCount; i++) {
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
        hsl.h,
        hsl.s,
        Math.min(1.0, hsl.l * 1.5),
      );

      colors.push(newColor.r, newColor.g, newColor.b);

      sizes.push(1.0 + Math.random() * 0.5);
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

    const material = this._createShaderMaterial(object);

    return { geometry: this.geometry, material };
  }

  /**
   * Creates the shader material for the Oort cloud.
   */
  private _createShaderMaterial(
    object: RenderableCelestialObject,
  ): THREE.ShaderMaterial {
    if (!this.cloudTexture) {
      const texturePath = "space/textures/asteroids/asteroid_1.png";

      this.textureLoader = new THREE.TextureLoader();
      this.textureLoader.load(
        `${window.location.href}${texturePath}`,
        (texture) => {
          if (this.material) {
            this.material.uniforms.cloudTexture.value = texture;
            this.material.needsUpdate = true;
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

    const material = new THREE.ShaderMaterial({
      uniforms: {
        cloudTexture: { value: this.cloudTexture },
        alphaTest: { value: 0.1 },
        pointSizeScale: { value: 0.5 },
        time: { value: 0.0 },
        cloudRotationAngleX: { value: 0.0 },
        cloudRotationAngleY: { value: 0.0 },
        cloudRotationAngleZ: { value: 0.0 },
        particleRotationSpeed: { value: this.particleRotationSpeed },
      },
      vertexShader: oortCloudVertexShader,
      fragmentShader: oortCloudFragmentShader,
      transparent: true,
      vertexColors: true,

      depthWrite: true,
      blending: THREE.NormalBlending,

      alphaTest: 0.1,
      opacity: 1.0,
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

    this.material = material;
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

    const detailedParticles = this.createMesh(object, options);
    const level0: LODLevel = { object: detailedParticles, distance: 0 };

    const lodLevels = [level0];

    if (options?.parentLODDistances && options.parentLODDistances.length > 0) {
      options.parentLODDistances.forEach((distance, index) => {
        if (distance > 0) {
          const emptyGroup = new THREE.Group();
          emptyGroup.name = `${object.celestialObjectId}-oortcloud-lod-${index + 1}-empty`;
          lodLevels.push({ object: emptyGroup, distance: distance });
        } else if (index > 0) {
          console.warn(
            `[OortCloudRenderer] Parent LOD distance ${index} is 0, creating empty group anyway.`,
          );
          const emptyGroup = new THREE.Group();
          emptyGroup.name = `${object.celestialObjectId}-oortcloud-lod-${index + 1}-empty`;
          lodLevels.push({ object: emptyGroup, distance: 0.001 * (index + 1) });
        }
      });
    } else {
      console.warn(
        `[OortCloudRenderer] No parentLODDistances provided for ${object.celestialObjectId}. Oort Cloud will always render at high detail.`,
      );
    }

    return lodLevels;
  }

  update(time: number): void {
    if (!this.particles || !this.objectId || !this.material) {
      console.warn(
        `[OortCloudRenderer] Update called but missing required properties: particles=${!!this.particles}, objectId=${!!this.objectId}, material=${!!this.material}`,
      );
      return;
    }

    const timeScale = getSimulationState().timeScale;

    const currentTime = Date.now();

    let timeDelta: number;
    let timeResetDetected = false;

    if (time < this.previousSimTime) {
      this.resetCounter++;
      timeResetDetected = true;

      this.cumulativeRotation.x = this.cloudRotationAngles.x;
      this.cumulativeRotation.y = this.cloudRotationAngles.y;
      this.cumulativeRotation.z = this.cloudRotationAngles.z;
      timeDelta = 0;
    } else {
      timeDelta = time - this.previousSimTime;

      this.cumulativeParticleTime += timeDelta;
    }

    if (!timeResetDetected) {
      this.cloudRotationAngles.x =
        this.cumulativeRotation.x +
        time * this.cloudRotationSpeed * 0.7 * timeScale;
      this.cloudRotationAngles.y =
        this.cumulativeRotation.y +
        time * this.cloudRotationSpeed * 1.0 * timeScale;
      this.cloudRotationAngles.z =
        this.cumulativeRotation.z +
        time * this.cloudRotationSpeed * 0.5 * timeScale;
    }

    this.cloudRotationAngles.x %= Math.PI * 2;
    this.cloudRotationAngles.y %= Math.PI * 2;
    this.cloudRotationAngles.z %= Math.PI * 2;

    this.previousSimTime = time;

    if (currentTime - this.lastLogTime > 5000) {
      this.lastLogTime = currentTime;
    }

    this.material.uniforms.time.value = this.cumulativeParticleTime;
    this.material.uniforms.particleRotationSpeed.value =
      this.particleRotationSpeed * timeScale;
    this.material.uniforms.cloudRotationAngleX.value =
      this.cloudRotationAngles.x;
    this.material.uniforms.cloudRotationAngleY.value =
      this.cloudRotationAngles.y;
    this.material.uniforms.cloudRotationAngleZ.value =
      this.cloudRotationAngles.z;
    this.material.uniformsNeedUpdate = true;

    if (this.particles && !this.particles.visible) {
      this.particles.visible = true;
    }

    const currentRenderableObjects = renderableStore.getRenderableObjects();
    const currentObject = currentRenderableObjects[this.objectId];

    if (!currentObject) {
      console.warn(
        `[OortCloudRenderer Update] Object ${this.objectId} not found in store.`,
      );
      return;
    }

    const parentId = currentObject.parentId;
    let parentPosition: THREE.Vector3 | null = null;

    if (parentId) {
      const parentObject = currentRenderableObjects[parentId];
      if (parentObject && parentObject.position) {
        parentPosition = parentObject.position;
      } else {
        console.warn(
          `[OortCloudRenderer Update] Parent object ${parentId} or its position not found for ${this.objectId}.`,
        );
      }
    }

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
