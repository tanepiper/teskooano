import * as THREE from "three";
import { Field } from "../core/Field";
import { NebulaFieldOptions } from "./types";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

/**
 * A `Field` that renders a procedural nebula using a custom GLSL shader.
 * It's represented as a large, textured sphere that surrounds the scene,
 * providing a dynamic and colorful backdrop.
 */
export class NebulaField extends Field {
  /** The custom shader material used to render the nebula. */
  private material: THREE.ShaderMaterial;

  /** The speed at which the nebula rotates on its Y-axis. */
  private rotationSpeed: number;

  /** A time counter passed to the shader to drive procedural animation. */
  private time: number = 0;

  /**
   * Constructs a new NebulaField instance.
   * @param options The configuration for the nebula.
   */
  constructor(options: NebulaFieldOptions) {
    super(options);
    this.rotationSpeed = options.rotationSpeed ?? 0.000000005;

    const geometry = this.createGeometry(options.size);
    this.material = this.createMaterial(options);

    const mesh = new THREE.Mesh(geometry, this.material);
    this.object.add(mesh);

    // Position the entire field object at its base distance.
    // A small random offset is added to prevent z-fighting if multiple
    // full-sphere fields are present.
    this.object.position.set(
      0,
      0,
      -options.baseDistance * (1 + (Math.random() - 0.5) * 0.1),
    );
  }

  /**
   * Creates the geometry for the nebula sphere.
   * @param size The radius of the sphere.
   * @returns A high-resolution `IcosahedronGeometry`.
   */
  private createGeometry(size: number): THREE.IcosahedronGeometry {
    return new THREE.IcosahedronGeometry(size, 7);
  }

  /**
   * Creates the custom shader material for the nebula effect.
   * @param options The nebula configuration options.
   * @returns A `THREE.ShaderMaterial` configured with the nebula shaders and uniforms.
   */
  private createMaterial(options: NebulaFieldOptions): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uAlpha: { value: options.alpha },
        uColors: { value: options.colors },
        uNoiseScale: { value: options.noiseConfig.scale },
        uNoiseOctaves: { value: options.noiseConfig.octaves },
        uNoisePersistence: { value: options.noiseConfig.persistence },
        uNoiseLacunarity: { value: options.noiseConfig.lacunarity },
        uNoiseSeed: { value: options.noiseConfig.seed * 100 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
    });
  }

  /**
   * Updates the nebula's rotation and increments the shader's time uniform
   * to create a slow, evolving animation.
   * @param deltaTime The time elapsed since the last frame, in seconds.
   */
  public update(deltaTime: number): void {
    this.time += deltaTime;
    this.material.uniforms.uTime.value = this.time;
    this.object.rotation.y += this.rotationSpeed * deltaTime;
  }

  /**
   * This field does not currently have a specific debug visualization.
   * @param debug The new debug state.
   */
  public toggleDebug(debug: boolean): void {
    this.isDebugMode = debug;
    // No specific debug visualization for the nebula
  }

  /**
   * Disposes of the Three.js resources used by the nebula field to free up memory.
   */
  public dispose(): void {
    if (this.object.children.length > 0) {
      const mesh = this.object.children[0] as THREE.Mesh;
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.object.remove(mesh);
    }
  }
}
