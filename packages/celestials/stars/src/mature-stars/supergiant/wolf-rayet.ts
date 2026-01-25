import * as THREE from "three";
import type { StarProperties } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { BaseStarRenderer } from "../../base/base-star";
import { RealisticStarMaterial } from "../../materials/realistic-star.material";
import type { LODLevel } from "@teskooano/renderer-threejs-celestial";
import {
  BaseCelestialRendererOptions,
  CelestialMeshOptions,
  LightSourcesMap,
} from "@teskooano/renderer-threejs-celestial";

/**
 * Wolf-Rayet star renderer
 * Uses dual-layer volumetric ray-marching materials for realistic appearance:
 * - Core star: Dense, bright blue-white
 * - Stellar wind: Diffuse outer layer representing massive mass loss
 *
 * Characteristics:
 * - Temperature: 30,000-200,000 K
 * - Color: Blue-white
 * - Typical mass: 10-25 M☉
 * - Strong stellar winds with high mass loss rates
 * - Rapidly losing mass (10⁻⁵ to 10⁻⁴ M☉/year)
 * - Helium-burning phase with exposed core
 * - Strong emission lines
 * - Precursor to supernovae
 * - Examples: WR 124, γ² Velorum
 */
export class WolfRayetRenderer extends BaseStarRenderer<RealisticStarMaterial> {
  private coreMaterialCache: Map<string, RealisticStarMaterial> = new Map();
  private windMaterialCache: Map<string, RealisticStarMaterial> = new Map();
  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, options);
  }

  /**
   * Creates the core star material (bright, dense)
   */
  protected createMaterial(
    object: RenderableCelestialObject<StarProperties>,
  ): RealisticStarMaterial {
    if (this.coreMaterialCache.has(object.id)) {
      return this.coreMaterialCache.get(object.id)!;
    }
    const color = this.getStarColor(object);
    const material = new RealisticStarMaterial(object, color);
    this.coreMaterialCache.set(object.id, material);
    return material;
  }

  /**
   * Creates the stellar wind material (diffuse, outer layer)
   */
  protected createWindMaterial(
    object: RenderableCelestialObject<StarProperties>,
  ): RealisticStarMaterial {
    if (this.windMaterialCache.has(object.id)) {
      return this.windMaterialCache.get(object.id)!;
    }
    // Slightly cooler, more cyan color for the wind
    const windColor = new THREE.Color(0x80b8ff);
    const material = new RealisticStarMaterial(object, windColor);
    // Wind layer is inherently more diffuse due to the volumetric shader
    // The shader handles transparency through ray-marching
    this.windMaterialCache.set(object.id, material);
    return material;
  }

  protected getCustomLODs(
    object: RenderableCelestialObject<StarProperties>,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    // Create core star material
    const coreMaterial = this.createAndRegisterMaterial(object);

    // Core star - very compact and bright
    const coreBoxSize = object.radius * 2.0;
    const coreGeometry = new THREE.BoxGeometry(
      coreBoxSize,
      coreBoxSize,
      coreBoxSize,
    );
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    coreMesh.name = `${object.id}-core-volume`;

    // Single unified stellar wind cloud - MASSIVE teardrop
    const windCloudSize = object.radius * 20.0;
    const windCloudGeometry = new THREE.SphereGeometry(windCloudSize, 32, 32);
    const windCloudMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        color: { value: new THREE.Color(0x80b8ff) },
        opacity: { value: 0.12 },
      },
      vertexShader: `
        #include <common>
        #include <logdepthbuf_pars_vertex>

        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          #include <logdepthbuf_vertex>
        }
      `,
      fragmentShader: `
        #include <logdepthbuf_pars_fragment>

        uniform vec3 color;
        uniform float opacity;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          // Fade based on view angle
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          // Additional fade at the top (narrow end of teardrop)
          float heightFade = smoothstep(1.0, 0.3, vPosition.y / length(vPosition));
          gl_FragColor = vec4(color, intensity * opacity * heightFade);
          #include <logdepthbuf_fragment>
        }
      `,
    });

    const windCloud = new THREE.Mesh(windCloudGeometry, windCloudMaterial);
    windCloud.name = `${object.id}-stellar-wind`;
    // Dramatic teardrop shape stretching far from the star
    windCloud.scale.set(1.4, 3.5, 1.4);
    windCloud.position.y = windCloudSize * 0.6;

    // High LOD group with core and single wind cloud
    const highLodGroup = new THREE.Group();
    highLodGroup.name = `${object.id}-high-lod-group`;
    highLodGroup.add(windCloud); // Add wind cloud
    highLodGroup.add(coreMesh); // Add core

    // Medium LOD - simplified wind
    const mediumWindGeometry = new THREE.SphereGeometry(
      windCloudSize * 0.6,
      16,
      16,
    );
    const mediumWindMesh = new THREE.Mesh(
      mediumWindGeometry,
      windCloudMaterial,
    );
    mediumWindMesh.scale.set(1.3, 2.5, 1.3);
    mediumWindMesh.position.y = windCloudSize * 0.4;

    const mediumCoreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    mediumCoreMesh.name = `${object.id}-medium-lod-volume`;

    const mediumGroup = new THREE.Group();
    mediumGroup.name = `${object.id}-medium-lod-group`;
    mediumGroup.add(mediumWindMesh);
    mediumGroup.add(mediumCoreMesh);

    return [
      { object: highLodGroup, distance: 0 },
      { object: mediumGroup, distance: object.radius * 150 },
    ];
  }

  protected getBillboardLODDistance(
    object: RenderableCelestialObject<StarProperties>,
  ): number {
    return object.radius * 2000;
  }

  /**
   * Wolf-Rayet stars are intense blue-white
   */
  protected getStarColor(
    star: RenderableCelestialObject<StarProperties>,
  ): THREE.Color {
    const properties = star.properties!;

    if (properties && properties.color) {
      if (Array.isArray(properties.color)) {
        return new THREE.Color(
          Number(properties.color[0]),
          Number(properties.color[1]),
          Number(properties.color[2]),
        );
      }
      return new THREE.Color(properties.color);
    }

    // Intense blue-white for Wolf-Rayet core
    return new THREE.Color(0xa0c8ff);
  }

  public override update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    super.update(
      object,
      time,
      timeScale,
      lightSources,
      camera,
      allObjects,
      allMeshes,
    );
  }
}
