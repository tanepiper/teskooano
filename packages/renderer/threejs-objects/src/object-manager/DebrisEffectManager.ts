import * as THREE from "three";
import { createSeededRandomSync } from "@teskooano/core-math";
import { StateAccessor } from "@teskooano/core-state";
import { METERS_TO_SCENE_UNITS } from "@teskooano/data-values";
import {
  attribute,
  uniform,
  vec3,
  vec4,
  positionLocal,
  mul,
  add,
  sub,
  instanceIndex,
  color,
  float,
  MeshBasicNodeMaterial,
} from "three/tsl";

// New structure for active debris effects using InstancedMesh
interface ActiveInstancedDebris {
  mesh: THREE.InstancedMesh;
  startTime: number;
  lifetime: number;
  material: MeshBasicNodeMaterial;
}

/**
 * @internal
 * Configuration for DebrisEffectManager.
 */
export interface DebrisEffectManagerConfig {
  scene: THREE.Scene;
}

/**
 * @internal
 * Manages the visual effects for object destruction using InstancedMesh with WebGPU TSL.
 */
export class DebrisEffectManager {
  private scene: THREE.Scene;
  private debrisClock = new THREE.Clock();
  private activeDebrisEffects: ActiveInstancedDebris[] = [];
  private _enableDebrisEffects: boolean = true;
  private random: () => number;

  constructor(config: DebrisEffectManagerConfig, seed?: string) {
    this.scene = config.scene;

    console.log("[DebrisEffectManager] Initialized with WebGPU TSL renderer");

    // Get seed from state if not provided
    const effectiveSeed = seed ?? `debris-${StateAccessor.getCurrentSeed()}`;
    this.random = createSeededRandomSync(effectiveSeed);
  }

  /**
   * Creates a TSL-based material for debris particles using WebGPU.
   */
  private createDebrisMaterial(): MeshBasicNodeMaterial {
    // Create instance attributes for TSL
    const instancePositionOffset = attribute("instancePositionOffset", "vec3");
    const instanceVelocity = attribute("instanceVelocity", "vec3");
    const instanceColor = attribute("instanceColor", "vec4");
    const instanceLifetime = attribute("instanceLifetime", "vec2"); // x: startTime, y: lifetime

    // Uniforms
    const uTime = uniform(this.debrisClock.getElapsedTime());
    const uOpacity = uniform(1.0);

    // Calculate elapsed time and animated position
    const elapsedTime = sub(uTime, instanceLifetime.x);
    const animatedOffset = mul(instanceVelocity, elapsedTime);
    const finalPosition = add(
      positionLocal,
      add(instancePositionOffset, animatedOffset),
    );

    // Create material with TSL nodes
    const material = new MeshBasicNodeMaterial();
    material.positionNode = finalPosition;
    material.colorNode = mul(instanceColor, vec4(1, 1, 1, uOpacity));
    material.transparent = true;
    material.depthWrite = true;
    material.blending = THREE.AdditiveBlending;

    console.log("[DebrisEffectManager] Created WebGPU TSL material");

    return material;
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
  public createDebrisEffect(event: any): void {
    if (!this._enableDebrisEffects) {
      return;
    }

    // Use setFromArray for more efficient vector initialization
    const impactScenePos = new THREE.Vector3();
    const impactArray = [
      event.impactPosition.x * METERS_TO_SCENE_UNITS,
      event.impactPosition.y * METERS_TO_SCENE_UNITS,
      event.impactPosition.z * METERS_TO_SCENE_UNITS,
    ];
    impactScenePos.fromArray(impactArray);

    const debrisCount = 100;
    const debrisBaseSize = event.destroyedRadius * METERS_TO_SCENE_UNITS * 0.15;
    const debrisLifetime = 10.0; // Shorter lifetime might be better
    const speedMultiplier = 0.3;

    // Base geometry and material for instancing
    const geometry = new THREE.IcosahedronGeometry(1, 0);

    // Create renderer-aware material
    const material = this.createDebrisMaterial();

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

    // Use setFromArray for more efficient base velocity initialization
    const baseVel = new THREE.Vector3();
    const baseVelArray = [
      event.relativeVelocity.x * METERS_TO_SCENE_UNITS * speedMultiplier,
      event.relativeVelocity.y * METERS_TO_SCENE_UNITS * speedMultiplier,
      event.relativeVelocity.z * METERS_TO_SCENE_UNITS * speedMultiplier,
    ];
    baseVel.fromArray(baseVelArray);

    const randomDir = new THREE.Vector3();
    const startTime = this.debrisClock.getElapsedTime();

    for (let i = 0; i < debrisCount; i++) {
      const idx3 = i * 3;
      const idx4 = i * 4;
      const idx2 = i * 2;

      // Initial Position Offset (relative to impact point)
      randomDir
        .set(
          (this.random() - 0.5) * 2,
          (this.random() - 0.5) * 2,
          (this.random() - 0.5) * 2,
        )
        .normalize()
        .multiplyScalar(this.random() * debrisBaseSize * 3); // Spread out a bit
      tempPos.copy(impactScenePos).add(randomDir);
      positionOffsets[idx3] = tempPos.x;
      positionOffsets[idx3 + 1] = tempPos.y;
      positionOffsets[idx3 + 2] = tempPos.z;

      // Initial Rotation (random)
      tempQuat.setFromAxisAngle(
        randomDir
          .set(this.random() - 0.5, this.random() - 0.5, this.random() - 0.5)
          .normalize(),
        this.random() * Math.PI * 2,
      );
      quaternions[idx4] = tempQuat.x;
      quaternions[idx4 + 1] = tempQuat.y;
      quaternions[idx4 + 2] = tempQuat.z;
      quaternions[idx4 + 3] = tempQuat.w;

      // Scale
      const scale = debrisBaseSize * (0.5 + this.random() * 0.9);
      scales[idx3] = scale;
      scales[idx3 + 1] = scale;
      scales[idx3 + 2] = scale;

      // Velocity (base + random component)
      randomDir
        .set(
          (this.random() - 0.5) * 2,
          (this.random() - 0.5) * 2,
          (this.random() - 0.5) * 2,
        )
        .normalize();
      const randomVelFactor = 0.5 + this.random() * 0.8;
      const finalVel = baseVel
        .clone()
        .lerp(randomDir, 0.7)
        .multiplyScalar(randomVelFactor);
      velocities[idx3] = finalVel.x;
      velocities[idx3 + 1] = finalVel.y;
      velocities[idx3 + 2] = finalVel.z;

      // Color (variation of orange/yellow)
      const hue = this.random() * 0.1 + 0.05;
      tempColor.setHSL(
        hue,
        0.8 + this.random() * 0.2,
        0.5 + this.random() * 0.1,
      );
      colors[idx4] = tempColor.r;
      colors[idx4 + 1] = tempColor.g;
      colors[idx4 + 2] = tempColor.b;
      colors[idx4 + 3] = 0.9; // Alpha

      // Lifetime / Start time
      lifetimes[idx2] = startTime;
      lifetimes[idx2 + 1] = debrisLifetime * (0.8 + this.random() * 0.4); // Vary lifetime slightly
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
        effect.material.dispose();
      } else {
        // Effect still active, update TSL uniforms
        const progress = elapsedTime / effect.lifetime;

        // Update time and opacity uniforms (TSL automatically handles these)
        // The material's uniform nodes are updated via their references
        effect.material.opacity = Math.max(0.0, 1.0 - progress);

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
