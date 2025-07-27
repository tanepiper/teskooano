import * as THREE from "three";
import { RenderableCelestialObject, CelestialType } from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";
import { StateSubscriptionMixin } from "@teskooano/core-state";

/**
 * Configuration for an instanced object type
 */
export interface InstancedObjectConfig {
  /** The geometry to use for all instances */
  geometry: THREE.BufferGeometry;
  /** The material to use for all instances */
  material: THREE.Material;
  /** Maximum number of instances */
  maxInstances: number;
  /** The celestial type this manages */
  celestialType: CelestialType;
  /** Whether to enable frustum culling per instance */
  enableCulling: boolean;
  /** LOD distance for this instance type */
  lodDistance?: number;
}

/**
 * Data for a single instance
 */
export interface InstanceData {
  /** Unique identifier */
  id: string;
  /** World position */
  position: THREE.Vector3;
  /** Rotation quaternion */
  rotation: THREE.Quaternion;
  /** Scale vector */
  scale: THREE.Vector3;
  /** Whether this instance is currently visible */
  visible: boolean;
  /** Distance from camera (for sorting) */
  distance?: number;
  /** Custom data for this instance */
  userData?: any;
}

/**
 * Manages large numbers of similar objects using THREE.InstancedMesh for optimal performance.
 * 
 * This is ideal for:
 * - Asteroid belts (thousands of asteroids)
 * - Debris fields
 * - Particle effects
 * - AU markers
 * - Star fields
 */
export class InstancedObjectManager extends StateSubscriptionMixin {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  
  /** Map of instanced meshes by celestial type */
  private instancedMeshes: Map<CelestialType, THREE.InstancedMesh> = new Map();
  
  /** Map of instance data by celestial type */
  private instanceData: Map<CelestialType, InstanceData[]> = new Map();
  
  /** Map of configurations by celestial type */
  private configs: Map<CelestialType, InstancedObjectConfig> = new Map();
  
  /** Temporary objects for matrix calculations */
  private tempMatrix = new THREE.Matrix4();
  private tempPosition = new THREE.Vector3();
  private tempQuaternion = new THREE.Quaternion();
  private tempScale = new THREE.Vector3();
  
  /** Frustum for culling calculations */
  private frustum = new THREE.Frustum();
  private cameraMatrix = new THREE.Matrix4();
  
  /** Performance tracking */
  private lastUpdateTime = 0;
  private updateInterval = 16; // ~60fps
  
  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    super();
    this.scene = scene;
    this.camera = camera;
  }

  /**
   * Registers a new instanced object type
   */
  public registerInstanceType(config: InstancedObjectConfig): void {
    this.configs.set(config.celestialType, config);
    
    // Create the instanced mesh
    const instancedMesh = new THREE.InstancedMesh(
      config.geometry,
      config.material,
      config.maxInstances
    );
    
    instancedMesh.name = `InstancedMesh_${CelestialType[config.celestialType]}`;
    instancedMesh.userData = { 
      type: "instanced_mesh", 
      celestialType: config.celestialType 
    };
    
    // Initially hide all instances
    instancedMesh.count = 0;
    
    this.instancedMeshes.set(config.celestialType, instancedMesh);
    this.instanceData.set(config.celestialType, []);
    
    this.scene.add(instancedMesh);
  }

  /**
   * Creates a standard asteroid belt configuration
   */
  public createAsteroidBelt(
    centerPosition: THREE.Vector3,
    innerRadius: number,
    outerRadius: number,
    count: number,
    verticalSpread: number = 10
  ): void {
    if (!this.configs.has(CelestialType.ASTEROID)) {
      throw new Error("Asteroid instance type not registered. Call registerInstanceType first.");
    }

    const instances: InstanceData[] = [];
    
    for (let i = 0; i < count; i++) {
      // Create random position in torus shape
      const angle = Math.random() * Math.PI * 2;
      const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * verticalSpread;
      
      const position = new THREE.Vector3(x, y, z).add(centerPosition);
      
      // Random rotation
      const rotation = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        )
      );
      
      // Random scale with some variation
      const baseScale = 0.5 + Math.random() * 2;
      const scale = new THREE.Vector3(baseScale, baseScale, baseScale);
      
      instances.push({
        id: `asteroid_${i}`,
        position,
        rotation,
        scale,
        visible: true
      });
    }
    
    this.setInstances(CelestialType.ASTEROID, instances);
  }

  /**
   * Creates a debris field around a position
   */
  public createDebrisField(
    centerPosition: THREE.Vector3,
    radius: number,
    count: number,
    expansionVelocity?: number
  ): void {
    const instances: InstanceData[] = [];
    
    for (let i = 0; i < count; i++) {
      // Random position within sphere
      const phi = Math.random() * Math.PI * 2;
      const costheta = Math.random() * 2 - 1;
      const u = Math.random();
      
      const theta = Math.acos(costheta);
      const r = radius * Math.cbrt(u);
      
      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(theta);
      
      const position = new THREE.Vector3(x, y, z).add(centerPosition);
      
      // Random rotation with some tumbling
      const rotation = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        )
      );
      
      // Varied scale for debris
      const scaleVariation = 0.1 + Math.random() * 0.8;
      const scale = new THREE.Vector3(scaleVariation, scaleVariation, scaleVariation);
      
      instances.push({
        id: `debris_${i}`,
        position,
        rotation,
        scale,
        visible: true,
        userData: { expansionVelocity }
      });
    }
    
    // Use comet type for debris (can register a separate DEBRIS type if needed)
    this.setInstances(CelestialType.COMET, instances);
  }

  /**
   * Sets all instances for a given celestial type
   */
  public setInstances(celestialType: CelestialType, instances: InstanceData[]): void {
    const config = this.configs.get(celestialType);
    const instancedMesh = this.instancedMeshes.get(celestialType);
    
    if (!config || !instancedMesh) {
      console.warn(`No configuration found for celestial type: ${CelestialType[celestialType]}`);
      return;
    }
    
    if (instances.length > config.maxInstances) {
      console.warn(`Too many instances (${instances.length}) for type ${CelestialType[celestialType]}. Max is ${config.maxInstances}`);
      instances = instances.slice(0, config.maxInstances);
    }
    
    // Store the instance data
    this.instanceData.set(celestialType, instances);
    
    // Update the instanced mesh
    this.updateInstancedMesh(celestialType);
  }

  /**
   * Updates a single instance
   */
  public updateInstance(
    celestialType: CelestialType,
    instanceId: string,
    updates: Partial<InstanceData>
  ): void {
    const instances = this.instanceData.get(celestialType);
    if (!instances) return;
    
    const index = instances.findIndex(instance => instance.id === instanceId);
    if (index === -1) return;
    
    // Apply updates
    Object.assign(instances[index], updates);
    
    // Update just this instance in the mesh
    this.updateSingleInstanceMatrix(celestialType, index, instances[index]);
  }

  /**
   * Updates the instanced mesh with current instance data
   */
  private updateInstancedMesh(celestialType: CelestialType): void {
    const instancedMesh = this.instancedMeshes.get(celestialType);
    const instances = this.instanceData.get(celestialType);
    
    if (!instancedMesh || !instances) return;
    
    // Count visible instances
    let visibleCount = 0;
    const visibleInstances: InstanceData[] = [];
    
    instances.forEach(instance => {
      if (instance.visible) {
        visibleInstances.push(instance);
        visibleCount++;
      }
    });
    
    // Update instance count
    instancedMesh.count = visibleCount;
    
    // Update matrices for visible instances
    visibleInstances.forEach((instance, index) => {
      this.updateSingleInstanceMatrix(celestialType, index, instance);
    });
    
    // Mark matrix as needing update
    instancedMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Updates the matrix for a single instance
   */
  private updateSingleInstanceMatrix(
    celestialType: CelestialType,
    index: number,
    instance: InstanceData
  ): void {
    const instancedMesh = this.instancedMeshes.get(celestialType);
    if (!instancedMesh) return;
    
    // Compose the matrix
    this.tempMatrix.compose(instance.position, instance.rotation, instance.scale);
    
    // Set the matrix for this instance
    instancedMesh.setMatrixAt(index, this.tempMatrix);
  }

  /**
   * Performs frustum culling and LOD management
   */
  public update(): void {
    const now = performance.now();
    if (now - this.lastUpdateTime < this.updateInterval) {
      return; // Skip frame to maintain performance
    }
    this.lastUpdateTime = now;
    
    // Update frustum
    this.updateFrustum();
    
    // Update each instanced type
    this.instancedMeshes.forEach((instancedMesh, celestialType) => {
      this.updateInstanceType(celestialType);
    });
  }

  /**
   * Updates the camera frustum for culling
   */
  private updateFrustum(): void {
    this.cameraMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.cameraMatrix);
  }

  /**
   * Updates a specific instance type (culling, LOD, etc.)
   */
  private updateInstanceType(celestialType: CelestialType): void {
    const config = this.configs.get(celestialType);
    const instances = this.instanceData.get(celestialType);
    const instancedMesh = this.instancedMeshes.get(celestialType);
    
    if (!config || !instances || !instancedMesh) return;
    
    // Calculate distances and perform culling
    let visibleCount = 0;
    instances.forEach((instance, index) => {
      // Calculate distance from camera
      instance.distance = this.camera.position.distanceTo(instance.position);
      
      // LOD check
      let lodVisible = true;
      if (config.lodDistance && instance.distance > config.lodDistance) {
        lodVisible = false;
      }
      
      // Frustum culling check (if enabled)
      let frustumVisible = true;
      if (config.enableCulling) {
        // Create a simple bounding sphere for the instance
        const boundingSphere = new THREE.Sphere(instance.position, instance.scale.x);
        frustumVisible = this.frustum.intersectsSphere(boundingSphere);
      }
      
      // Update visibility
      const wasVisible = instance.visible;
      instance.visible = lodVisible && frustumVisible;
      
      if (instance.visible) {
        visibleCount++;
      }
      
      // If visibility changed, mark for matrix update
      if (wasVisible !== instance.visible) {
        this.updateSingleInstanceMatrix(celestialType, visibleCount - 1, instance);
      }
    });
    
    // Update instance count
    instancedMesh.count = visibleCount;
    instancedMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Removes all instances of a specific type
   */
  public clearInstances(celestialType: CelestialType): void {
    const instances = this.instanceData.get(celestialType);
    if (instances) {
      instances.length = 0;
      this.updateInstancedMesh(celestialType);
    }
  }

  /**
   * Removes a specific instance
   */
  public removeInstance(celestialType: CelestialType, instanceId: string): void {
    const instances = this.instanceData.get(celestialType);
    if (!instances) return;
    
    const index = instances.findIndex(instance => instance.id === instanceId);
    if (index !== -1) {
      instances.splice(index, 1);
      this.updateInstancedMesh(celestialType);
    }
  }

  /**
   * Gets statistics for debugging
   */
  public getStats(): {
    totalTypes: number;
    totalInstances: number;
    visibleInstances: number;
    typeStats: Array<{
      type: string;
      total: number;
      visible: number;
      lodDistance?: number;
    }>;
  } {
    let totalInstances = 0;
    let visibleInstances = 0;
    const typeStats: Array<{
      type: string;
      total: number;
      visible: number;
      lodDistance?: number;
    }> = [];
    
    this.instanceData.forEach((instances, celestialType) => {
      const config = this.configs.get(celestialType);
      const visible = instances.filter(instance => instance.visible).length;
      
      totalInstances += instances.length;
      visibleInstances += visible;
      
      typeStats.push({
        type: CelestialType[celestialType],
        total: instances.length,
        visible,
        lodDistance: config?.lodDistance
      });
    });
    
    return {
      totalTypes: this.instancedMeshes.size,
      totalInstances,
      visibleInstances,
      typeStats
    };
  }

  /**
   * Gets all instances of a specific type
   */
  public getInstances(celestialType: CelestialType): InstanceData[] {
    return this.instanceData.get(celestialType) || [];
  }

  /**
   * Gets a specific instance by ID
   */
  public getInstance(celestialType: CelestialType, instanceId: string): InstanceData | undefined {
    const instances = this.instanceData.get(celestialType);
    return instances?.find(instance => instance.id === instanceId);
  }

  /**
   * Finds instances within a radius of a position
   */
  public findInstancesInRadius(
    position: THREE.Vector3,
    radius: number,
    celestialType?: CelestialType
  ): Array<{ type: CelestialType; instance: InstanceData; distance: number }> {
    const results: Array<{ type: CelestialType; instance: InstanceData; distance: number }> = [];
    const radiusSq = radius * radius;
    
    const typesToSearch = celestialType ? [celestialType] : Array.from(this.instanceData.keys());
    
    typesToSearch.forEach(type => {
      const instances = this.instanceData.get(type);
      if (!instances) return;
      
      instances.forEach(instance => {
        const distanceSq = position.distanceToSquared(instance.position);
        if (distanceSq <= radiusSq) {
          results.push({
            type,
            instance,
            distance: Math.sqrt(distanceSq)
          });
        }
      });
    });
    
    return results.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Animates instances (useful for debris expansion, rotation, etc.)
   */
  public animateInstances(deltaTime: number): void {
    this.instanceData.forEach((instances, celestialType) => {
      let needsUpdate = false;
      
      instances.forEach(instance => {
        // Handle expansion (for debris fields)
        if (instance.userData?.expansionVelocity) {
          const velocity = instance.userData.expansionVelocity;
          const direction = instance.position.clone().normalize();
          instance.position.add(direction.multiplyScalar(velocity * deltaTime));
          needsUpdate = true;
        }
        
        // Add tumbling rotation for debris
        if (celestialType === CelestialType.COMET) {
          const tumbleSpeed = 0.5; // radians per second
          const tumbleAxis = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
          ).normalize();
          
          const rotation = new THREE.Quaternion().setFromAxisAngle(
            tumbleAxis,
            tumbleSpeed * deltaTime
          );
          
          instance.rotation.multiply(rotation);
          needsUpdate = true;
        }
      });
      
      if (needsUpdate) {
        this.updateInstancedMesh(celestialType);
      }
    });
  }

  /**
   * Disposes of all resources
   */
  public dispose(): void {
    this.instancedMeshes.forEach((instancedMesh) => {
      this.scene.remove(instancedMesh);
      instancedMesh.geometry.dispose();
      if (Array.isArray(instancedMesh.material)) {
        instancedMesh.material.forEach(material => material.dispose());
      } else {
        instancedMesh.material.dispose();
      }
    });
    
    this.instancedMeshes.clear();
    this.instanceData.clear();
    this.configs.clear();
    
    super.dispose();
  }
}