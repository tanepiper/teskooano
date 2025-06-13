import * as THREE from "three";
import { Field } from "../core/Field";
import { NebulaFieldOptions } from "./types";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

/**
 * A Field that renders a procedural nebula using a custom shader.
 * It's represented as a large, textured sphere.
 */
export class NebulaField extends Field {
  private material: THREE.ShaderMaterial;
  private rotationSpeed: number;
  private time: number = 0;

  /**
   * Constructs a new NebulaField.
   */
  constructor(options: NebulaFieldOptions) {
    super(options);
    this.rotationSpeed = options.rotationSpeed ?? 0.000000005;

    const geometry = new THREE.IcosahedronGeometry(options.size, 10);

    this.material = new THREE.ShaderMaterial({
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
        uNoiseSeed: { value: Math.random() * 100 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
    });

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.position.set(0, 0, 0); // Center it
    this.object.add(mesh);

    // Position the entire field object
    this.object.position.set(
      0,
      0,
      -options.baseDistance * (1 + (Math.random() - 0.5) * 0.2),
    );
  }

  /**
   * Updates the nebula's rotation and shader time uniform.
   */
  public update(deltaTime: number): void {
    this.time += deltaTime;
    this.material.uniforms.uTime.value = this.time;
    this.object.rotation.y += this.rotationSpeed * deltaTime;
  }

  /**
   * This field does not have a specific debug view.
   */
  public toggleDebug(debug: boolean): void {
    this.isDebugMode = debug;
    // No specific debug visualization for the nebula
  }

  /**
   * Cleans up the nebula's resources.
   */
  public dispose(): void {
    const mesh = this.object.children[0] as THREE.Mesh;
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
    this.object.remove(mesh);
  }
}
