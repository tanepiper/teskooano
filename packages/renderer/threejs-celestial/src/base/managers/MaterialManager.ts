import * as THREE from "three";

/**
 * Manages materials for celestial renderers, providing tracking, registration, and disposal functionality.
 * This centralizes material lifecycle management to prevent memory leaks.
 */
export class MaterialManager {
  /**
   * A map of materials used by the renderer, keyed by a unique identifier
   * (typically the celestial object ID). This is used for tracking and proper disposal.
   */
  public materials: Map<string, THREE.Material | THREE.Material[]> = new Map();

  /**
   * Registers a material with the manager for tracking and later disposal.
   * If a material with the same ID already exists, it is disposed of before
   * the new one is added.
   * @param id A unique identifier for the material.
   * @param material The material instance to register.
   */
  public registerMaterial(id: string, material: THREE.Material): void {
    const existingMaterial = this.materials.get(id);
    if (existingMaterial) {
      this.disposeMaterial(existingMaterial);
    }
    this.materials.set(id, material);
  }

  /**
   * Registers an array of materials with the manager.
   * @param id A unique identifier for the material array.
   * @param materials The array of materials to register.
   */
  public registerMaterials(id: string, materials: THREE.Material[]): void {
    const existingMaterial = this.materials.get(id);
    if (existingMaterial) {
      this.disposeMaterial(existingMaterial);
    }
    this.materials.set(id, materials);
  }

  /**
   * Gets a material by its registered ID.
   * @param id The unique identifier for the material.
   * @returns The material or material array, or undefined if not found.
   */
  public getMaterial(
    id: string,
  ): THREE.Material | THREE.Material[] | undefined {
    return this.materials.get(id);
  }

  /**
   * Safely applies a texture to a material property or uniform.
   * Handles both standard THREE.Material and THREE.ShaderMaterial types.
   * @param material The material to which the texture will be applied.
   * @param textureKey The name of the property or uniform to set.
   * @param texture The texture to apply.
   */
  public applyTexture(
    material: THREE.Material,
    textureKey: string,
    texture: THREE.Texture | null,
  ): void {
    if (!texture) return;

    if (material instanceof THREE.ShaderMaterial) {
      if (material.uniforms && material.uniforms[textureKey] !== undefined) {
        material.uniforms[textureKey].value = texture;
      }
    } else {
      (material as any)[textureKey] = texture;
    }
  }

  /**
   * Disposes of a specific material or material array.
   * @param material The material or materials to dispose.
   * @private
   */
  private disposeMaterial(material: THREE.Material | THREE.Material[]): void {
    const materialsToDispose = Array.isArray(material) ? material : [material];

    materialsToDispose.forEach((mat) => {
      // Dispose of textures within the material
      Object.keys(mat).forEach((key) => {
        const value = (mat as any)[key];
        if (value instanceof THREE.Texture) {
          value.dispose();
        }
      });

      // Dispose of textures in shader uniforms
      if (mat instanceof THREE.ShaderMaterial) {
        Object.keys(mat.uniforms || {}).forEach((key) => {
          const value = mat.uniforms[key].value;
          if (value instanceof THREE.Texture) {
            value.dispose();
          }
        });
      }

      mat.dispose();
    });
  }

  /**
   * Removes and disposes of a material by its ID.
   * @param id The unique identifier for the material to remove.
   * @returns True if the material was found and disposed, false otherwise.
   */
  public removeMaterial(id: string): boolean {
    const material = this.materials.get(id);
    if (material) {
      this.disposeMaterial(material);
      this.materials.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Checks if a material with the given ID is registered.
   * @param id The unique identifier to check.
   * @returns True if a material with the ID exists.
   */
  public hasMaterial(id: string): boolean {
    return this.materials.has(id);
  }

  /**
   * Gets the number of registered materials.
   * @returns The count of registered materials.
   */
  public getMaterialCount(): number {
    return this.materials.size;
  }

  /**
   * Cleans up all registered materials and textures to prevent memory leaks.
   * This should be called when the manager is no longer needed.
   */
  public dispose(): void {
    this.materials.forEach((material) => {
      this.disposeMaterial(material);
    });
    this.materials.clear();
  }

  /**
   * Gets all registered material IDs.
   * @returns An array of all material IDs.
   */
  public getMaterialIds(): string[] {
    return Array.from(this.materials.keys());
  }
}
