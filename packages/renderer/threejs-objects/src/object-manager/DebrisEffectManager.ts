import type { DestructionEvent } from "@teskooano/core-physics";
import { METERS_TO_SCENE_UNITS } from "@teskooano/data-types";
import * as THREE from "three";

// New structure for active debris effects using InstancedMesh
interface ActiveInstancedDebris {
  mesh: THREE.InstancedMesh;
  startTime: number;
  lifetime: number;
  // Material might need updating (uniforms)
  material: THREE.ShaderMaterial; // Or RawShaderMaterial
}

/**
 * @internal
 * Configuration for DebrisEffectManager.
 */
export interface DebrisEffectManagerConfig {
  scene: THREE.Scene;
}

// Placeholder basic shaders - These will need significant work
const debrisVertexShader = `
  attribute vec3 instancePositionOffset;
  attribute vec4 instanceQuaternion;
  attribute vec3 instanceScale;
  attribute vec3 instanceVelocity;
  attribute vec4 instanceColor;
  attribute vec2 instanceLifetime; // x: startTime, y: lifetime

  uniform float uTime;
  varying vec4 vColor;

  // Function to apply quaternion rotation
  vec3 applyQuaternion(vec3 pos, vec4 q) {
    return pos + 2.0 * cross(q.xyz, cross(q.xyz, pos) + q.w * pos);
  }

  void main() {
    float elapsedTime = uTime - instanceLifetime.x;
    vec3 currentPosition = position * instanceScale;
    currentPosition = applyQuaternion(currentPosition, instanceQuaternion); // Apply initial rotation/orientation if needed
    currentPosition += instancePositionOffset + instanceVelocity * elapsedTime;
    vColor = instanceColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(currentPosition, 1.0);
  }
`;

const debrisFragmentShader = `
  varying vec4 vColor;
  uniform float uOpacity;

  void main() {
    // Basic fragment shader, just uses color and uniform opacity
    gl_FragColor = vec4(vColor.rgb, vColor.a * uOpacity);
  }
`;

/**
 * @internal
 * Manages the visual effects for object destruction using InstancedMesh.
 */
export class DebrisEffectManager {
  private scene: THREE.Scene;
  private debrisClock = new THREE.Clock();
  private activeDebrisEffects: ActiveInstancedDebris[] = [];
  private _enableDebrisEffects: boolean = true;

  constructor(config: DebrisEffectManagerConfig) {
    this.scene = config.scene;
  }

  /**
   * Sets whether debris effects should be shown when objects are destroyed.
   * @param enabled - Whether to enable debris effects.
   */
  public setDebrisEffectsEnabled(enabled: boolean): void {
    this._enableDebrisEffects = enabled;
  }

  /**
   * Toggles debris effects on/off.
   * @returns The new state (true if enabled, false if disabled).
   */
  public toggleDebrisEffects(): boolean {
    this._enableDebrisEffects = !this._enableDebrisEffects;
    return this._enableDebrisEffects;
  }

  /**
   * Creates and animates visual debris based on a destruction event.
   * @param event - The destruction event data.
   */
  public createDebrisEffect(event: DestructionEvent): void {
    if (!this._enableDebrisEffects) {
      return;
    }

    const impactScenePos = new THREE.Vector3(
      event.impactPosition.x * METERS_TO_SCENE_UNITS,
      event.impactPosition.y * METERS_TO_SCENE_UNITS,
      event.impactPosition.z * METERS_TO_SCENE_UNITS,
    );

    const debrisCount = 100;
    const debrisBaseSize = event.destroyedRadius * METERS_TO_SCENE_UNITS * 0.15;
    const debrisLifetime = 10.0; // Shorter lifetime might be better
    const speedMultiplier = 0.3;

    // Base geometry and material for instancing
    const geometry = new THREE.IcosahedronGeometry(1, 0);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: this.debrisClock.getElapsedTime() },
        uOpacity: { value: 1.0 },
      },
      vertexShader: debrisVertexShader,
      fragmentShader: debrisFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      // vertexColors: true, // Handled by instanceColor attribute now
    });

    const instancedMesh = new THREE.InstancedMesh(
      geometry,
      material,
      debrisCount,
    );
    instancedMesh.name = `DebrisInstanced_${event.destroyedId}`;

    // Buffers for instance attributes
    const positionOffsets = new Float32Array(debrisCount * 3);
    const quaternions = new Float32Array(debrisCount * 4);
    const scales = new Float32Array(debrisCount * 3);
    const velocities = new Float32Array(debrisCount * 3);
    const colors = new Float32Array(debrisCount * 4);
    const lifetimes = new Float32Array(debrisCount * 2); // x: startTime, y: lifetime

    const tempMatrix = new THREE.Matrix4();
    const tempPos = new THREE.Vector3();
    const tempQuat = new THREE.Quaternion();
    const tempScale = new THREE.Vector3();
    const tempColor = new THREE.Color();
    const baseVel = new THREE.Vector3(
      event.relativeVelocity.x,
      event.relativeVelocity.y,
      event.relativeVelocity.z,
    ).multiplyScalar(METERS_TO_SCENE_UNITS * speedMultiplier);
    const randomDir = new THREE.Vector3();
    const startTime = this.debrisClock.getElapsedTime();

    for (let i = 0; i < debrisCount; i++) {
      const idx3 = i * 3;
      const idx4 = i * 4;
      const idx2 = i * 2;

      // Initial Position Offset (relative to impact point)
      randomDir
        .set(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
        )
        .normalize()
        .multiplyScalar(Math.random() * debrisBaseSize * 3); // Spread out a bit
      tempPos.copy(impactScenePos).add(randomDir);
      positionOffsets[idx3] = tempPos.x;
      positionOffsets[idx3 + 1] = tempPos.y;
      positionOffsets[idx3 + 2] = tempPos.z;

      // Initial Rotation (random)
      tempQuat.setFromAxisAngle(
        randomDir
          .set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
          .normalize(),
        Math.random() * Math.PI * 2,
      );
      quaternions[idx4] = tempQuat.x;
      quaternions[idx4 + 1] = tempQuat.y;
      quaternions[idx4 + 2] = tempQuat.z;
      quaternions[idx4 + 3] = tempQuat.w;

      // Scale
      const scale = debrisBaseSize * (0.5 + Math.random() * 0.9);
      scales[idx3] = scale;
      scales[idx3 + 1] = scale;
      scales[idx3 + 2] = scale;

      // Velocity (base + random component)
      randomDir
        .set(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
        )
        .normalize();
      const randomVelFactor = 0.5 + Math.random() * 0.8;
      const finalVel = baseVel
        .clone()
        .lerp(randomDir, 0.7)
        .multiplyScalar(randomVelFactor);
      velocities[idx3] = finalVel.x;
      velocities[idx3 + 1] = finalVel.y;
      velocities[idx3 + 2] = finalVel.z;

      // Color (variation of orange/yellow)
      const hue = Math.random() * 0.1 + 0.05;
      tempColor.setHSL(
        hue,
        0.8 + Math.random() * 0.2,
        0.5 + Math.random() * 0.1,
      );
      colors[idx4] = tempColor.r;
      colors[idx4 + 1] = tempColor.g;
      colors[idx4 + 2] = tempColor.b;
      colors[idx4 + 3] = 0.9; // Alpha

      // Lifetime / Start time
      lifetimes[idx2] = startTime;
      lifetimes[idx2 + 1] = debrisLifetime * (0.8 + Math.random() * 0.4); // Vary lifetime slightly
    }

    // Set instance attributes
    instancedMesh.geometry.setAttribute(
      "instancePositionOffset",
      new THREE.InstancedBufferAttribute(positionOffsets, 3),
    );
    instancedMesh.geometry.setAttribute(
      "instanceQuaternion",
      new THREE.InstancedBufferAttribute(quaternions, 4),
    );
    instancedMesh.geometry.setAttribute(
      "instanceScale",
      new THREE.InstancedBufferAttribute(scales, 3),
    );
    instancedMesh.geometry.setAttribute(
      "instanceVelocity",
      new THREE.InstancedBufferAttribute(velocities, 3),
    );
    instancedMesh.geometry.setAttribute(
      "instanceColor",
      new THREE.InstancedBufferAttribute(colors, 4),
    );
    instancedMesh.geometry.setAttribute(
      "instanceLifetime",
      new THREE.InstancedBufferAttribute(lifetimes, 2),
    );

    // Important: The InstancedMesh position itself should be (0,0,0) as positions are handled by offsets
    instancedMesh.position.set(0, 0, 0);

    this.scene.add(instancedMesh);
    this.activeDebrisEffects.push({
      mesh: instancedMesh,
      startTime: startTime,
      lifetime: debrisLifetime, // Use max lifetime for the system
      material: material,
    });

    // No need to dispose template geometry/material here, it's used by the InstancedMesh
  }

  /**
   * Updates the position and opacity of active debris effects and removes expired ones.
   * @param delta - Time delta since the last frame.
   */
  public update(delta: number): void {
    const currentTime = this.debrisClock.getElapsedTime();
    const remainingDebris: ActiveInstancedDebris[] = [];

    for (const effect of this.activeDebrisEffects) {
      const elapsedTime = currentTime - effect.startTime;

      if (elapsedTime >= effect.lifetime) {
        // Effect expired, remove from scene and dispose resources
        this.scene.remove(effect.mesh);
        effect.mesh.geometry.dispose();
        // Dispose material uniforms/textures if necessary
        effect.material.dispose();
      } else {
        // Effect still active, update shader uniforms
        effect.material.uniforms.uTime.value = currentTime;
        // Calculate overall opacity based on progress (can be refined in shader)
        const progress = elapsedTime / effect.lifetime;
        effect.material.uniforms.uOpacity.value = Math.max(0.0, 1.0 - progress);

        remainingDebris.push(effect); // Keep active effect
      }
    }

    this.activeDebrisEffects = remainingDebris;
  }

  /**
   * Cleans up all active debris effects.
   */
  dispose(): void {
    this.activeDebrisEffects.forEach((effect) => {
      this.scene.remove(effect.mesh);
      effect.mesh.geometry.dispose();
      effect.material.dispose();
    });
    this.activeDebrisEffects = [];
  }
}
