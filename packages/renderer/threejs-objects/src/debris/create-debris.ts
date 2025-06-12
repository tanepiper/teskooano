import type { CelestialObject } from "@teskooano/data-types";
import * as THREE from "three";

const DEBRIS_COUNT = 500;
const DEBRIS_LIFETIME = 2; // seconds

export interface DebrisParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}

interface PositionAndRadius {
  position: THREE.Vector3;
  radius: number;
}

function hasPositionAndRadius(obj: any): obj is PositionAndRadius {
  return (
    obj &&
    obj.position instanceof THREE.Vector3 &&
    typeof obj.radius === "number"
  );
}

/**
 * Creates a particle explosion effect for a destroyed celestial object.
 * @param object The celestial object that was destroyed.
 * @param scene The THREE.Scene to add the debris to.
 * @param renderer The THREE.WebGLRenderer instance.
 * @returns An array of debris particle objects.
 */
export function createDebris(
  object: CelestialObject,
  scene: THREE.Scene,
  _renderer: THREE.WebGLRenderer,
): DebrisParticle[] {
  if (!hasPositionAndRadius(object)) {
    console.warn("Debris effect skipped: object lacks position or radius.", {
      id: object.id,
    });
    return [];
  }

  const debrisParticles: DebrisParticle[] = [];
  const debrisGeometry = new THREE.BufferGeometry();
  const debrisMaterial = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 2,
    transparent: true,
    opacity: 0.8,
  });

  const vertices = [];
  for (let i = 0; i < DEBRIS_COUNT; i++) {
    const particle = new THREE.Vector3();
    particle.x = THREE.MathUtils.randFloatSpread(object.radius * 2);
    particle.y = THREE.MathUtils.randFloatSpread(object.radius * 2);
    particle.z = THREE.MathUtils.randFloatSpread(object.radius * 2);

    const velocity = particle.clone().normalize().multiplyScalar(50);

    vertices.push(particle.x, particle.y, particle.z);

    const debrisMesh = new THREE.Mesh(
      new THREE.SphereGeometry(Math.random() * 0.5 + 0.1, 4, 4),
      new THREE.MeshBasicMaterial({ color: 0x888888 }),
    );
    debrisMesh.position.copy(object.position).add(particle);

    debrisParticles.push({
      mesh: debrisMesh,
      velocity: velocity,
      life: DEBRIS_LIFETIME,
    });
  }

  const points = new THREE.Points(debrisGeometry, debrisMaterial);
  points.position.copy(object.position);

  // Animate debris
  const clock = new THREE.Clock();
  function animateDebris() {
    const delta = clock.getDelta();
    let aliveParticles = false;

    debrisParticles.forEach((p) => {
      if (p.life > 0) {
        aliveParticles = true;
        p.life -= delta;
        p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
      } else {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        if (Array.isArray(p.mesh.material)) {
          p.mesh.material.forEach((m) => m.dispose());
        } else {
          p.mesh.material.dispose();
        }
      }
    });

    if (aliveParticles) {
      requestAnimationFrame(animateDebris);
    }
  }

  requestAnimationFrame(animateDebris);

  return debrisParticles;
}
