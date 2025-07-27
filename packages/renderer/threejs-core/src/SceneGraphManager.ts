import * as THREE from "three";
import { RenderableCelestialObject, CelestialType } from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";
import { StateSubscriptionMixin } from "@teskooano/core-state";

/**
 * Defines the structure for celestial system hierarchies
 */
export interface CelestialSystemNode {
  /** The celestial object this node represents */
  object: RenderableCelestialObject;
  /** The Three.js group for this celestial body */
  bodyGroup: THREE.Group;
  /** The Three.js group that handles orbital motion around the parent */
  orbitGroup?: THREE.Group;
  /** Child nodes (moons, satellites, etc.) */
  children: Map<string, CelestialSystemNode>;
  /** Parent node reference */
  parent?: CelestialSystemNode;
}

/**
 * Defines spatial partitioning quadrants
 */
export interface SpatialQuadrant {
  /** Unique identifier for this quadrant */
  id: string;
  /** Three.js group containing all objects in this quadrant */
  group: THREE.Group;
  /** Bounding box for frustum culling */
  boundingBox: THREE.Box3;
  /** Center position of the quadrant */
  center: THREE.Vector3;
  /** Size of the quadrant */
  size: number;
  /** Objects currently in this quadrant */
  objects: Set<string>;
}

/**
 * Manages the hierarchical scene graph structure for celestial objects.
 * 
 * This class creates a logical hierarchy that mirrors orbital relationships,
 * enabling efficient culling, LOD management, and spatial partitioning.
 * 
 * The hierarchy follows this pattern:
 * - Root Scene
 *   - Universe Group
 *     - Solar System Groups
 *       - Star Groups (with orbit groups for binary systems)
 *       - Planet Groups
 *         - Planet Body Group
 *         - Planet Orbit Group (for moons)
 *           - Moon Groups
 *             - Moon Body Group
 *             - Satellite Orbit Groups
 */
export class SceneGraphManager extends StateSubscriptionMixin {
  private scene: THREE.Scene;
  private universeGroup: THREE.Group;
  
  /** Map of all celestial system nodes by object ID */
  private systemNodes: Map<string, CelestialSystemNode> = new Map();
  
  /** Map of solar system groups by system ID */
  private solarSystemGroups: Map<string, THREE.Group> = new Map();
  
  /** Spatial partitioning quadrants for large-scale culling */
  private spatialQuadrants: Map<string, SpatialQuadrant> = new Map();
  
  /** Configuration for spatial partitioning */
  private readonly QUADRANT_SIZE = 1000; // AU units
  private readonly MAX_QUADRANT_OBJECTS = 100;
  
  constructor(scene: THREE.Scene) {
    super();
    this.scene = scene;
    this.initializeRootHierarchy();
  }

  /**
   * Initializes the root hierarchy structure
   */
  private initializeRootHierarchy(): void {
    // Create the main universe group that contains everything
    this.universeGroup = new THREE.Group();
    this.universeGroup.name = "Universe";
    this.universeGroup.userData = { type: "universe" };
    this.scene.add(this.universeGroup);
  }

  /**
   * Creates or updates the scene graph hierarchy for a set of celestial objects
   */
  public updateHierarchy(objects: Record<string, RenderableCelestialObject>): void {
    // Clear existing hierarchy
    this.clearHierarchy();
    
    // Group objects by solar system
    const systemGroups = this.groupObjectsBySolarSystem(objects);
    
    // Create hierarchy for each solar system
    systemGroups.forEach((systemObjects, systemId) => {
      this.createSolarSystemHierarchy(systemId, systemObjects);
    });
    
    // Update spatial partitioning
    this.updateSpatialPartitioning(objects);
  }

  /**
   * Groups celestial objects by their solar system
   */
  private groupObjectsBySolarSystem(
    objects: Record<string, RenderableCelestialObject>
  ): Map<string, RenderableCelestialObject[]> {
    const systems = new Map<string, RenderableCelestialObject[]>();
    
    // First pass: identify stars and their systems
    Object.values(objects).forEach(obj => {
      if (obj.type === CelestialType.STAR) {
        const systemId = obj.solarSystemId || obj.celestialObjectId;
        if (!systems.has(systemId)) {
          systems.set(systemId, []);
        }
        systems.get(systemId)!.push(obj);
      }
    });
    
    // Second pass: assign other objects to their solar systems
    Object.values(objects).forEach(obj => {
      if (obj.type !== CelestialType.STAR) {
        const systemId = obj.solarSystemId || 'default';
        if (!systems.has(systemId)) {
          systems.set(systemId, []);
        }
        systems.get(systemId)!.push(obj);
      }
    });
    
    return systems;
  }

  /**
   * Creates the hierarchical structure for a solar system
   */
  private createSolarSystemHierarchy(
    systemId: string,
    objects: RenderableCelestialObject[]
  ): void {
    // Create the solar system group
    const systemGroup = new THREE.Group();
    systemGroup.name = `SolarSystem_${systemId}`;
    systemGroup.userData = { 
      type: "solar_system", 
      systemId,
      objectCount: objects.length 
    };
    this.universeGroup.add(systemGroup);
    this.solarSystemGroups.set(systemId, systemGroup);

    // Separate stars from other objects
    const stars = objects.filter(obj => obj.type === CelestialType.STAR);
    const otherObjects = objects.filter(obj => obj.type !== CelestialType.STAR);

    // Create star hierarchy (handles single stars and binary systems)
    this.createStarHierarchy(systemGroup, stars);

    // Create planetary hierarchy
    this.createPlanetaryHierarchy(systemGroup, otherObjects, stars[0]);
  }

  /**
   * Creates the hierarchy for stars (single or binary/multiple star systems)
   */
  private createStarHierarchy(systemGroup: THREE.Group, stars: RenderableCelestialObject[]): void {
    if (stars.length === 0) return;

    if (stars.length === 1) {
      // Single star system
      const starNode = this.createCelestialNode(stars[0], systemGroup);
      this.systemNodes.set(stars[0].celestialObjectId, starNode);
    } else {
      // Binary or multiple star system
      const binaryGroup = new THREE.Group();
      binaryGroup.name = "BinaryStarSystem";
      binaryGroup.userData = { type: "binary_system" };
      systemGroup.add(binaryGroup);

      stars.forEach(star => {
        const starOrbitGroup = new THREE.Group();
        starOrbitGroup.name = `${star.name}_OrbitGroup`;
        starOrbitGroup.userData = { type: "star_orbit_group", parentId: star.celestialObjectId };
        binaryGroup.add(starOrbitGroup);

        const starNode = this.createCelestialNode(star, starOrbitGroup);
        starNode.orbitGroup = starOrbitGroup;
        this.systemNodes.set(star.celestialObjectId, starNode);
      });
    }
  }

  /**
   * Creates the hierarchy for planets, moons, and other objects
   */
  private createPlanetaryHierarchy(
    systemGroup: THREE.Group,
    objects: RenderableCelestialObject[],
    primaryStar?: RenderableCelestialObject
  ): void {
    // Separate planets from moons and other objects
    const planets = objects.filter(obj => 
      obj.type === CelestialType.PLANET || obj.type === CelestialType.GAS_GIANT
    );
    const moons = objects.filter(obj => obj.type === CelestialType.MOON);
    const others = objects.filter(obj => 
      obj.type !== CelestialType.PLANET && 
      obj.type !== CelestialType.GAS_GIANT && 
      obj.type !== CelestialType.MOON
    );

    // Create planet hierarchy
    planets.forEach(planet => {
      const planetOrbitGroup = new THREE.Group();
      planetOrbitGroup.name = `${planet.name}_OrbitGroup`;
      planetOrbitGroup.userData = { 
        type: "planet_orbit_group", 
        parentId: primaryStar?.celestialObjectId || "system_center" 
      };
      systemGroup.add(planetOrbitGroup);

      const planetNode = this.createCelestialNode(planet, planetOrbitGroup);
      planetNode.orbitGroup = planetOrbitGroup;
      this.systemNodes.set(planet.celestialObjectId, planetNode);

      // Add moons to this planet
      const planetMoons = moons.filter(moon => moon.parentId === planet.celestialObjectId);
      planetMoons.forEach(moon => {
        const moonOrbitGroup = new THREE.Group();
        moonOrbitGroup.name = `${moon.name}_OrbitGroup`;
        moonOrbitGroup.userData = { 
          type: "moon_orbit_group", 
          parentId: planet.celestialObjectId 
        };
        planetNode.bodyGroup.add(moonOrbitGroup);

        const moonNode = this.createCelestialNode(moon, moonOrbitGroup);
        moonNode.orbitGroup = moonOrbitGroup;
        moonNode.parent = planetNode;
        planetNode.children.set(moon.celestialObjectId, moonNode);
        this.systemNodes.set(moon.celestialObjectId, moonNode);
      });
    });

    // Handle other objects (asteroids, comets, etc.)
    others.forEach(obj => {
      const objOrbitGroup = new THREE.Group();
      objOrbitGroup.name = `${obj.name}_OrbitGroup`;
      objOrbitGroup.userData = { 
        type: "object_orbit_group", 
        parentId: obj.parentId || primaryStar?.celestialObjectId || "system_center" 
      };
      systemGroup.add(objOrbitGroup);

      const objNode = this.createCelestialNode(obj, objOrbitGroup);
      objNode.orbitGroup = objOrbitGroup;
      this.systemNodes.set(obj.celestialObjectId, objNode);
    });
  }

  /**
   * Creates a celestial node with proper group structure
   */
  private createCelestialNode(
    object: RenderableCelestialObject, 
    parentGroup: THREE.Group
  ): CelestialSystemNode {
    // Create the body group that will contain the actual mesh
    const bodyGroup = new THREE.Group();
    bodyGroup.name = `${object.name}_Body`;
    bodyGroup.userData = {
      type: object.type,
      celestialObjectId: object.celestialObjectId,
      name: object.name
    };
    
    // Set the position from the object
    if (object.position) {
      bodyGroup.position.set(object.position.x, object.position.y, object.position.z);
    }
    
    parentGroup.add(bodyGroup);

    return {
      object,
      bodyGroup,
      children: new Map(),
    };
  }

  /**
   * Updates spatial partitioning for large-scale culling
   */
  private updateSpatialPartitioning(objects: Record<string, RenderableCelestialObject>): void {
    // Clear existing quadrants
    this.spatialQuadrants.clear();

    // Create quadrants based on object distribution
    Object.values(objects).forEach(obj => {
      if (!obj.position) return;

      const quadrantId = this.getQuadrantId(obj.position);
      
      if (!this.spatialQuadrants.has(quadrantId)) {
        this.createQuadrant(quadrantId, obj.position);
      }

      this.spatialQuadrants.get(quadrantId)!.objects.add(obj.celestialObjectId);
    });
  }

  /**
   * Creates a spatial quadrant
   */
  private createQuadrant(id: string, position: OSVector3): void {
    const quadrantGroup = new THREE.Group();
    quadrantGroup.name = `Quadrant_${id}`;
    quadrantGroup.userData = { type: "quadrant", quadrantId: id };
    
    const center = new THREE.Vector3(
      Math.floor(position.x / this.QUADRANT_SIZE) * this.QUADRANT_SIZE,
      Math.floor(position.y / this.QUADRANT_SIZE) * this.QUADRANT_SIZE,
      Math.floor(position.z / this.QUADRANT_SIZE) * this.QUADRANT_SIZE
    );
    
    const boundingBox = new THREE.Box3(
      center.clone().subScalar(this.QUADRANT_SIZE / 2),
      center.clone().addScalar(this.QUADRANT_SIZE / 2)
    );

    this.spatialQuadrants.set(id, {
      id,
      group: quadrantGroup,
      boundingBox,
      center,
      size: this.QUADRANT_SIZE,
      objects: new Set()
    });

    this.universeGroup.add(quadrantGroup);
  }

  /**
   * Gets the quadrant ID for a given position
   */
  private getQuadrantId(position: OSVector3): string {
    const x = Math.floor(position.x / this.QUADRANT_SIZE);
    const y = Math.floor(position.y / this.QUADRANT_SIZE);
    const z = Math.floor(position.z / this.QUADRANT_SIZE);
    return `${x}_${y}_${z}`;
  }

  /**
   * Gets the scene node for a celestial object
   */
  public getNode(objectId: string): CelestialSystemNode | undefined {
    return this.systemNodes.get(objectId);
  }

  /**
   * Gets the body group for a celestial object (where the mesh should be added)
   */
  public getBodyGroup(objectId: string): THREE.Group | undefined {
    return this.systemNodes.get(objectId)?.bodyGroup;
  }

  /**
   * Gets the orbit group for a celestial object (for orbital animations)
   */
  public getOrbitGroup(objectId: string): THREE.Group | undefined {
    return this.systemNodes.get(objectId)?.orbitGroup;
  }

  /**
   * Gets a solar system group by ID
   */
  public getSolarSystemGroup(systemId: string): THREE.Group | undefined {
    return this.solarSystemGroups.get(systemId);
  }

  /**
   * Performs hierarchical frustum culling
   */
  public performSpatialCulling(camera: THREE.PerspectiveCamera): void {
    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(matrix);

    // Cull entire solar systems if they're outside the frustum
    this.solarSystemGroups.forEach((systemGroup) => {
      const boundingBox = new THREE.Box3().setFromObject(systemGroup);
      systemGroup.visible = frustum.intersectsBox(boundingBox);
    });

    // Cull spatial quadrants
    this.spatialQuadrants.forEach((quadrant) => {
      quadrant.group.visible = frustum.intersectsBox(quadrant.boundingBox);
    });
  }

  /**
   * Updates orbital positions based on physics state
   */
  public updateOrbitalPositions(objects: Record<string, RenderableCelestialObject>): void {
    Object.values(objects).forEach(obj => {
      const node = this.systemNodes.get(obj.celestialObjectId);
      if (!node || !obj.position) return;

      // Update the body group position
      node.bodyGroup.position.set(obj.position.x, obj.position.y, obj.position.z);
      
      // Update rotation if available
      if (obj.rotation) {
        node.bodyGroup.quaternion.set(
          obj.rotation.x, 
          obj.rotation.y, 
          obj.rotation.z, 
          obj.rotation.w
        );
      }
    });
  }

  /**
   * Clears the entire hierarchy
   */
  private clearHierarchy(): void {
    this.systemNodes.clear();
    this.solarSystemGroups.clear();
    this.spatialQuadrants.clear();
    
    // Remove all children from universe group
    this.universeGroup.clear();
  }

  /**
   * Disposes of all resources
   */
  public dispose(): void {
    this.clearHierarchy();
    this.scene.remove(this.universeGroup);
    super.dispose();
  }
}