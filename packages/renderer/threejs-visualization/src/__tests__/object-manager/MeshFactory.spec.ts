import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import * as THREE from 'three';
import { MeshFactory } from '../../object-manager/mesh-factory';
import { CelestialObject, CelestialType, StellarType, PlanetType } from '@teskooano/data-types';
import { createMockStar, createMockPlanet, createMockMoon, createMockAsteroidField } from '../test-utils';

// Mock external renderers
vi.mock('@teskooano/systems-celestial', () => {
  // Create mock functions for the renderers
  const createStarMesh = vi.fn().mockImplementation(() => new THREE.Object3D());
  const createTerrestrialMesh = vi.fn().mockImplementation(() => new THREE.Object3D());
  const createMoonMesh = vi.fn().mockImplementation(() => new THREE.Object3D());

  // Create mocked renderer factories
  const createStarRenderer = vi.fn().mockReturnValue({
    createMesh: createStarMesh
  });

  const createTerrestrialRenderer = vi.fn().mockReturnValue({
    createMesh: createTerrestrialMesh
  });

  const createMoonRenderer = vi.fn().mockReturnValue({
    createMesh: createMoonMesh
  });

  return {
    createStarRenderer,
    createTerrestrialRenderer,
    createMoonRenderer,
    CelestialRenderer: vi.fn()
  };
});

// Import the mocked modules
import { 
  CelestialRenderer,
  createStarRenderer,
  createTerrestrialRenderer,
  createMoonRenderer
} from '@teskooano/systems-celestial';

describe('MeshFactory', () => {
  let celestialRenderers: Map<string, CelestialRenderer>;
  let starRenderers: Map<string, CelestialRenderer>;
  let planetRenderers: Map<string, CelestialRenderer>;
  let moonRenderers: Map<string, CelestialRenderer>;
  let createLODMeshFunction: Mock;
  let meshFactory: MeshFactory;
  
  beforeEach(() => {
    // Clear mocks
    vi.clearAllMocks();
    
    // Initialize maps
    celestialRenderers = new Map();
    starRenderers = new Map();
    planetRenderers = new Map();
    moonRenderers = new Map();
    
    // Create LOD function mock
    createLODMeshFunction = vi.fn().mockImplementation(() => new THREE.Object3D());
    
    // Add mock renderer for ASTEROID_FIELD
    celestialRenderers.set(CelestialType.ASTEROID_FIELD, {
      createMesh: vi.fn().mockReturnValue(new THREE.Object3D())
    } as unknown as CelestialRenderer);
    
    // Create mesh factory
    meshFactory = new MeshFactory(
      celestialRenderers,
      starRenderers,
      planetRenderers,
      moonRenderers,
      createLODMeshFunction
    );
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should create a star mesh', () => {
    // Use the mock factory
    const starObject = createMockStar();
    
    const mesh = meshFactory.createObjectMesh(starObject);
    
    // Get properties for assertion
    const starProps = starObject.properties as any; 
    expect(createStarRenderer).toHaveBeenCalledWith(starProps.spectralClass, starProps.stellarType);
    expect(mesh.name).toBe('test-star');
  });
  
  it('should create a terrestrial planet mesh', () => {
    // Use the mock factory
    const planetObject = createMockPlanet(); 
    
    const mesh = meshFactory.createObjectMesh(planetObject);
    
    expect(createTerrestrialRenderer).toHaveBeenCalledWith(planetObject);
    expect(mesh.name).toBe('test-planet');
  });
  
  it('should create a moon mesh', () => {
    // Use the mock factory
    const moonObject = createMockMoon();
    
    const mesh = meshFactory.createObjectMesh(moonObject);
    
    expect(createMoonRenderer).toHaveBeenCalledWith(moonObject);
    expect(mesh.name).toBe('test-moon');
  });
  
  it('should create an asteroid field mesh', () => {
    // Get the mock asteroid field renderer
    const asteroidRenderer = celestialRenderers.get(CelestialType.ASTEROID_FIELD);
    
    // Use the mock factory
    const asteroidObject = createMockAsteroidField();
    
    const mesh = meshFactory.createObjectMesh(asteroidObject);
    
    expect(asteroidRenderer?.createMesh).toHaveBeenCalled();
    expect(mesh.name).toBe('test-asteroid-field');
  });
  
  it('should fall back to default mesh when no renderer is available', () => {
    // Create a mock object with a type that has no specific renderer
    const otherObject: CelestialObject = {
      id: 'test-other',
      type: CelestialType.OTHER,
      name: 'Test Other',
      position: new THREE.Vector3(300, 0, 0),
      rotation: new THREE.Quaternion(0, 0, 0, 1),
      radius: 5,
      mass: 500,
      orbit: { semiMajorAxis: 300, eccentricity: 0, inclination: 0, longitudeOfAscendingNode: 0, argumentOfPeriapsis: 0, meanAnomaly: 0, period: 1000 },
      temperature: 100,
    };
    
    const mesh = meshFactory.createObjectMesh(otherObject);
    
    // Verify LOD function was called (indicates default mesh creation)
    expect(createLODMeshFunction).toHaveBeenCalled();
    expect(mesh.name).toBe('test-other');
  });
}); 