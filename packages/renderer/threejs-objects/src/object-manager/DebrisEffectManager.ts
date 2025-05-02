import type { DestructionEvent } from "@teskooano/core-physics";
import { METERS_TO_SCENE_UNITS } from "@teskooano/data-types";
import * as THREE from "three";

interface ActiveDebris {
  group: THREE.Group;
  velocities: Map<string, THREE.Vector3>;
  rotations: Map<string, { axis: THREE.Vector3; speed: number }>;
  startTime: number;
  lifetime: number;
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
 * Manages the visual effects for object destruction, creating, animating,
 * and cleaning up debris particle systems.
 */
export class DebrisEffectManager {
  private scene: THREE.Scene;
  private debrisClock = new THREE.Clock();
  private activeDebrisEffects: ActiveDebris[] = [];
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
    const debrisLifetime = 15.0;
    const speedMultiplier = 0.3;
    const initialSpreadFactor =
      event.destroyedRadius * METERS_TO_SCENE_UNITS * 1.5;

    const debrisGroup = new THREE.Group();
    debrisGroup.name = `Debris_${event.destroyedId}`;
    const debrisVelocities = new Map<string, THREE.Vector3>();
    const debrisRotations = new Map<
      string,
      { axis: THREE.Vector3; speed: number }
    >();

    // Reusable geometry and materials
    const geometry = new THREE.IcosahedronGeometry(1, 0);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff7700,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff5500,
      transparent: true,
      opacity: 0.5,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < debrisCount; i++) {
      const hue = Math.random() * 0.1 + 0.05;
      const debrisColor = new THREE.Color(0xff7700);
      debrisColor.offsetHSL(hue, 0, Math.random() * 0.2);

      const debrisMaterialInstance = material.clone();
      debrisMaterialInstance.color = debrisColor;

      const mesh = new THREE.Mesh(geometry, debrisMaterialInstance);
      mesh.scale.setScalar(debrisBaseSize * (0.5 + Math.random() * 0.9));

      const glowMatInstance = glowMaterial.clone();
      glowMatInstance.color = debrisColor.clone().multiplyScalar(1.5);
      const glowMesh = new THREE.Mesh(geometry, glowMatInstance); // Use same geometry
      glowMesh.scale.setScalar(1.5);
      mesh.add(glowMesh);

      const randomOffset = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      )
        .normalize()
        .multiplyScalar(Math.random() * initialSpreadFactor * 1.2);
      mesh.position.copy(impactScenePos).add(randomOffset);

      const baseVel = new THREE.Vector3(
        event.relativeVelocity.x,
        event.relativeVelocity.y,
        event.relativeVelocity.z,
      ).multiplyScalar(METERS_TO_SCENE_UNITS);

      const randomDir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      ).normalize();

      const randomVelFactor = 0.8 + Math.random() * 0.6;
      const finalVel = baseVel
        .clone()
        .lerp(randomDir, 0.6) // Blend base velocity with random direction
        .normalize()
        .multiplyScalar(baseVel.length() * speedMultiplier * randomVelFactor);

      debrisVelocities.set(mesh.uuid, finalVel);

      const rotationAxis = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      ).normalize();
      const rotationSpeed = // Radians per second
        (Math.random() * 1.5 + 0.5) * THREE.MathUtils.DEG2RAD * 60;
      debrisRotations.set(mesh.uuid, {
        axis: rotationAxis,
        speed: rotationSpeed,
      });

      debrisGroup.add(mesh);
    }

    this.scene.add(debrisGroup);
    this.activeDebrisEffects.push({
      group: debrisGroup,
      velocities: debrisVelocities,
      rotations: debrisRotations,
      startTime: this.debrisClock.getElapsedTime(),
      lifetime: debrisLifetime,
    });

    // Dispose of the template geometry and materials after loop
    geometry.dispose();
    // material.dispose(); // Basic material, might not need disposal if shared?
    // glowMaterial.dispose(); // Same as above
  }

  /**
   * Updates the position and opacity of active debris effects and removes expired ones.
   * @param delta - Time delta since the last frame.
   */
  public update(delta: number): void {
    const currentTime = this.debrisClock.getElapsedTime();
    const remainingDebris: ActiveDebris[] = [];

    for (const effect of this.activeDebrisEffects) {
      const elapsedTime = currentTime - effect.startTime;

      if (elapsedTime >= effect.lifetime) {
        // Effect expired, remove from scene and dispose resources
        this.scene.remove(effect.group);
        effect.group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose(); // Assumes unique geometry per mesh instance if needed
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat?.dispose());
            } else if (child.material) {
              child.material.dispose();
            }
          }
        });
        // Clear maps associated with this effect to free memory
        effect.velocities.clear();
        effect.rotations.clear();
      } else {
        // Effect still active, update particles
        const progress = elapsedTime / effect.lifetime;
        const opacity = Math.min(1.0, (1.0 - progress) * 1.3); // Fade out

        effect.group.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            const velocity = effect.velocities.get(child.uuid);
            if (velocity) {
              child.position.addScaledVector(velocity, delta);
            }

            const rotationData = effect.rotations.get(child.uuid);
            if (rotationData) {
              // Apply incremental rotation
              const deltaRotation = new THREE.Quaternion().setFromAxisAngle(
                rotationData.axis,
                rotationData.speed * delta,
              );
              child.quaternion.premultiply(deltaRotation);
            }

            // Update material opacity on the mesh and its children (glow)
            child.traverse((subChild) => {
              if (
                subChild instanceof THREE.Mesh &&
                subChild.material instanceof THREE.Material
              ) {
                if (subChild.material.transparent) {
                  subChild.material.opacity = opacity;
                }
              }
            });
          }
        });
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
      this.scene.remove(effect.group);
      effect.group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat?.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
      effect.velocities.clear();
      effect.rotations.clear();
    });
    this.activeDebrisEffects = [];
  }
}
