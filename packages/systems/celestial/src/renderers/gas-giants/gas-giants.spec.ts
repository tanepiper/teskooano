import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import * as THREE from 'three';
import { 
  CelestialObject, 
  CelestialType, 
  GasGiantProperties, 
  PlanetProperties, 
  StarProperties, 
  GasGiantClass, 
  PlanetType,
  RingProperties,
  OrbitalParameters,
  RockyType
} from '@teskooano/data-types';
import { 
  BaseGasGiantRenderer,
  ClassIGasGiantRenderer, 
  ClassIIGasGiantRenderer, 
  ClassIIIGasGiantRenderer, 
  ClassIVGasGiantRenderer, 
  ClassVGasGiantRenderer
} from './index';
import { TextureFactory } from '../../textures/TextureFactory';

// Mock Orbit
const mockOrbit: OrbitalParameters = {
  semiMajorAxis: 1,
  eccentricity: 0,
  inclination: 0,
  longitudeOfAscendingNode: 0,
  argumentOfPeriapsis: 0,
  meanAnomaly: 0,
  period: 365.25
};

// Mock Planet Factory
function createMockPlanet(overrides: Partial<CelestialObject> & { properties?: Partial<PlanetProperties> } = {}): CelestialObject {
  const defaults: CelestialObject = {
    id: 'mock-planet',
    name: 'Mock Planet',
    type: CelestialType.PLANET,
    mass: 5.972e24, // Earth mass
    radius: 6371, // Earth radius
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Quaternion(0, 0, 0, 1),
    temperature: 288, // Earth average K
    orbit: { ...mockOrbit },
    properties: {
      class: CelestialType.PLANET,
      type: PlanetType.ROCKY,
      isMoon: false,
      composition: ['silicates', 'iron'],
      seed: Math.random() * 10000,
      // Add other PlanetProperties defaults if needed
    }
  };

  const merged = {
    ...defaults,
    ...overrides,
    properties: {
      ...(defaults.properties as PlanetProperties),
      ...(overrides.properties || {})
    }
  };
  return merged;
}

// Mock Star Factory
function createMockStar(overrides: Partial<CelestialObject> & { properties?: Partial<StarProperties> } = {}): CelestialObject {
  const defaults: CelestialObject = {
    id: 'mock-star',
    name: 'Mock Star',
    type: CelestialType.STAR,
    mass: 1.989e30, // Sun mass
    radius: 696340, // Sun radius
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Quaternion(0, 0, 0, 1),
    temperature: 5778, // Sun temperature K
    orbit: { ...mockOrbit, semiMajorAxis: 0 }, // Stars usually don't orbit in the same way
    properties: {
      class: CelestialType.STAR,
      isMainStar: true,
      spectralClass: 'G',
      luminosity: 1.0, // Sun luminosity
      color: '#FFFF00', // Yellow
      seed: Math.random() * 10000,
    }
  };

  const merged = {
    ...defaults,
    ...overrides,
    properties: {
      ...(defaults.properties as StarProperties),
      ...(overrides.properties || {})
    }
  };
  return merged;
}

// Helper function to create a basic CelestialObject for testing
function createGasGiantObject(id: string, gasGiantClass: GasGiantClass): CelestialObject {
  // Create a celestial object compatible with the renderer
  const position = new THREE.Vector3(0, 0, 0);
  const rotation = new THREE.Quaternion(0, 0, 0, 1);
  
  // Create gas giant properties
  const properties: GasGiantProperties = {
    class: CelestialType.GAS_GIANT,
    type: gasGiantClass,
    atmosphereColor: '#CCAA77',
    cloudColor: '#DDBB88',
    cloudSpeed: 100,
    rings: [{
      innerRadius: 1.5,
      outerRadius: 2.5,
      color: '#CCBB99',
      opacity: 0.7,
      density: 1,
      rotationRate: 0.01,
      texture: 'uniform', 
      composition: ['ice', 'rock'],
      type: RockyType.ICE
    }]
  };
  
  const obj: CelestialObject = {
    id,
    name: `Test Gas Giant ${id}`,
    type: CelestialType.GAS_GIANT,
    position,
    rotation,
    radius: 71492, // Jupiter radius in km
    mass: 1.898e27, // Jupiter mass
    properties,
    orbit: { ...mockOrbit, semiMajorAxis: 5.2 }, // Example orbit
    temperature: 165 // Surface temperature (from properties)
  };
  
  return obj;
}

describe('Gas Giant Renderers', () => {
  // Clean up all resources after tests
  afterAll(() => {
    // Clean up any resources
    TextureFactory.dispose();
  });
  
  describe('ClassIGasGiantRenderer', () => {
    let renderer: ClassIGasGiantRenderer;
    let gasGiant: CelestialObject;
    
    beforeEach(() => {
      // Create a fresh renderer for each test
      renderer = new ClassIGasGiantRenderer();
      gasGiant = createGasGiantObject('jupiter-test', GasGiantClass.CLASS_I);
    });
    
    it('should create a mesh with the correct properties', () => {
      // Create mesh with low detail to speed up tests
      const mesh = renderer.createMesh(gasGiant, { detailLevel: 'very-low' }) as THREE.Group;
      
      // Verify group properties
      expect(mesh).toBeInstanceOf(THREE.Group);
      expect(mesh.name).toBe(gasGiant.id);
      expect(mesh.position.x).toBe(gasGiant.position.x);
      expect(mesh.position.y).toBe(gasGiant.position.y);
      expect(mesh.position.z).toBe(gasGiant.position.z);
      
      // Should have at least two children - body and rings
      expect(mesh.children.length).toBeGreaterThanOrEqual(2);
      
      // Check for planet body
      const body = mesh.children.find(child => child.name === `${gasGiant.id}-body`);
      expect(body).toBeInstanceOf(THREE.Mesh);
      expect((body as THREE.Mesh).geometry).toBeInstanceOf(THREE.SphereGeometry);
      
      // Check for rings group
      const rings = mesh.children.find(child => child.name === `${gasGiant.id}-rings`);
      expect(rings).toBeInstanceOf(THREE.Group);
      
      // Clean up
      renderer.dispose();
    });
    
    it('should have a planet body with shader material', () => {
      const mesh = renderer.createMesh(gasGiant, { detailLevel: 'very-low' }) as THREE.Group;
      const body = mesh.children.find(child => child.name === `${gasGiant.id}-body`) as THREE.Mesh;
      
      // Check material
      expect(body.material).toBeInstanceOf(THREE.ShaderMaterial);
      const material = body.material as THREE.ShaderMaterial;
      
      // Shader material should have required uniforms
      expect(material.uniforms).toHaveProperty('time');
      expect(material.uniforms).toHaveProperty('atmosphereColor');
      expect(material.uniforms).toHaveProperty('cloudColor');
      expect(material.uniforms).toHaveProperty('baseColor');
      expect(material.uniforms).toHaveProperty('sunPosition');
      
      // Clean up
      renderer.dispose();
    });
    
    it('should update time and sun position when updated', () => {
      // Create mesh and get initial time value
      const mesh = renderer.createMesh(gasGiant, { detailLevel: 'very-low' }) as THREE.Group;
      const body = mesh.children.find(child => child.name === `${gasGiant.id}-body`) as THREE.Mesh;
      const material = body.material as THREE.ShaderMaterial;
      
      // Store initial time
      const initialTime = material.uniforms.time.value;
      
      // Create a light source
      const lightSources = new Map<string, THREE.Vector3>();
      lightSources.set('sun', new THREE.Vector3(1000, 0, 0));
      
      // Update renderer
      renderer.update(10.5, lightSources);
      
      // Time should have changed - exact value may vary, but it should no longer be the initial value
      expect(material.uniforms.time.value).not.toBe(initialTime);
      
      // Sun position should match the light source
      expect(material.uniforms.sunPosition.value.x).toBe(1000);
      expect(material.uniforms.sunPosition.value.y).toBe(0);
      expect(material.uniforms.sunPosition.value.z).toBe(0);
      
      // Clean up
      renderer.dispose();
    });
  });
  
  // Test all gas giant classes with shared tests
  const rendererClasses = [
    { name: 'ClassI', renderer: ClassIGasGiantRenderer, class: GasGiantClass.CLASS_I },
    { name: 'ClassII', renderer: ClassIIGasGiantRenderer, class: GasGiantClass.CLASS_II },
    { name: 'ClassIII', renderer: ClassIIIGasGiantRenderer, class: GasGiantClass.CLASS_III },
    { name: 'ClassIV', renderer: ClassIVGasGiantRenderer, class: GasGiantClass.CLASS_IV },
    { name: 'ClassV', renderer: ClassVGasGiantRenderer, class: GasGiantClass.CLASS_V }
  ];
  
  rendererClasses.forEach(({ name, renderer: RendererClass, class: gasGiantClass }) => {
    describe(`${name}GasGiantRenderer`, () => {
      let renderer: BaseGasGiantRenderer;
      let gasGiant: CelestialObject;
      
      beforeEach(() => {
        renderer = new RendererClass();
        gasGiant = createGasGiantObject(`${name.toLowerCase()}-test`, gasGiantClass);
      });
      
      it('should create and dispose a mesh without errors', () => {
        // Create mesh with minimal detail for fast tests
        const mesh = renderer.createMesh(gasGiant, { detailLevel: 'very-low' });
        
        // Basic assertions
        expect(mesh).toBeInstanceOf(THREE.Group);
        
        // Dispose without errors
        expect(() => renderer.dispose()).not.toThrow();
      });
      
      it('should update without errors', () => {
        // Create mesh with minimal detail
        renderer.createMesh(gasGiant, { detailLevel: 'very-low' });
        
        // Update without errors
        expect(() => renderer.update(1.0)).not.toThrow();
        
        // Update with light sources
        const lightSources = new Map<string, THREE.Vector3>();
        lightSources.set('sun', new THREE.Vector3(1000, 0, 0));
        expect(() => renderer.update(2.0, lightSources)).not.toThrow();
        
        // Clean up
        renderer.dispose();
      });
    });
  });
  
  // Test the ring material specifically
  describe('Gas Giant Rings', () => {
    let renderer: ClassIGasGiantRenderer;
    let gasGiant: CelestialObject;
    
    beforeEach(() => {
      renderer = new ClassIGasGiantRenderer();
      
      // Create a gas giant with multiple rings
      gasGiant = createGasGiantObject('saturn-test', GasGiantClass.CLASS_II);
      
      // Override with Saturn-like properties
      const saturnProps = gasGiant.properties as GasGiantProperties;
      saturnProps.rings = [
        {
          innerRadius: 1.2,
          outerRadius: 1.5,
          color: '#FFDDAA',
          opacity: 0.6,
          density: 0.8,
          rotationRate: 0.015,
          texture: 'banded', 
          composition: ['ice'],
          type: RockyType.ICE
        },
        {
          innerRadius: 1.6,
          outerRadius: 2.2,
          color: '#DDBBAA',
          opacity: 0.8,
          density: 1.2,
          rotationRate: 0.012,
          texture: 'sparse', 
          composition: ['rock', 'dust'],
          type: RockyType.DARK_ROCK
        }
      ];
      
      // Change colors for Saturn-like appearance
      saturnProps.atmosphereColor = '#DDCC88';
      saturnProps.cloudColor = '#EEDD99';
    });
    
    it('should create rings with correct dimensions', () => {
      const mesh = renderer.createMesh(gasGiant, { detailLevel: 'very-low' }) as THREE.Group;
      
      // Get rings group
      const ringsGroup = mesh.children.find(child => child.name === `${gasGiant.id}-rings`) as THREE.Group;
      expect(ringsGroup).toBeDefined();
      
      // Should have two ring meshes
      expect(ringsGroup.children.length).toBe(2);
      
      // Each ring should be a mesh
      ringsGroup.children.forEach(ring => {
        expect(ring).toBeInstanceOf(THREE.Mesh);
        
        // Ring material should be a ShaderMaterial
        const material = (ring as THREE.Mesh).material as THREE.ShaderMaterial;
        expect(material).toBeInstanceOf(THREE.ShaderMaterial);
        
        // Should have transparency enabled
        expect(material.transparent).toBe(true);
        
        // Should have double-sided rendering
        expect(material.side).toBe(THREE.DoubleSide);
      });
      
      // Clean up
      renderer.dispose();
    });

    it('should create correct mesh hierarchy', () => {
      const mesh = renderer.createMesh(gasGiant, { detailLevel: 'very-low' }) as THREE.Group;
      
      // Should have exactly two children - body and rings
      expect(mesh.children.length).toBe(2);
      
      // First child should be the body
      const body = mesh.children.find(child => child.name === `${gasGiant.id}-body`);
      expect(body).toBeDefined();
      expect(body).toBeInstanceOf(THREE.Mesh);
      
      // Second child should be the rings group
      const ringsGroup = mesh.children.find(child => child.name === `${gasGiant.id}-rings`);
      expect(ringsGroup).toBeDefined();
      expect(ringsGroup).toBeInstanceOf(THREE.Group);
      
      // No other groups or meshes should exist in the hierarchy
      const allObjects = getAllObjects(mesh);
      const properties = gasGiant.properties as GasGiantProperties;
      const expectedCount = 1 + 1 + properties.rings!.length; // 1 body + 1 rings group + number of ring meshes
      expect(allObjects.length).toBe(expectedCount);
      
      // Clean up
      renderer.dispose();
    });

    it('should apply correct ring properties', () => {
      const mesh = renderer.createMesh(gasGiant, { detailLevel: 'very-low' }) as THREE.Group;
      const ringsGroup = mesh.children.find(child => child.name === `${gasGiant.id}-rings`) as THREE.Group;
      const properties = gasGiant.properties as GasGiantProperties;
      
      // Check each ring mesh matches the properties
      ringsGroup.children.forEach((ring, index) => {
        const ringMesh = ring as THREE.Mesh;
        const ringGeometry = ringMesh.geometry as THREE.RingGeometry;
        const ringMaterial = ringMesh.material as THREE.ShaderMaterial;
        const ringProps = properties.rings![index];
        
        // Check geometry dimensions
        expect(ringGeometry.parameters.innerRadius).toBe(gasGiant.radius * ringProps.innerRadius);
        expect(ringGeometry.parameters.outerRadius).toBe(gasGiant.radius * ringProps.outerRadius);
        
        // Check material properties
        expect(ringMaterial.uniforms.opacity.value).toBe(ringProps.opacity);
        expect(ringMaterial.uniforms.color.value).toBeInstanceOf(THREE.Color);
        // Convert hex color to THREE.Color for comparison
        const expectedColor = new THREE.Color(ringProps.color);
        expect(ringMaterial.uniforms.color.value.r).toBeCloseTo(expectedColor.r, 2);
        expect(ringMaterial.uniforms.color.value.g).toBeCloseTo(expectedColor.g, 2);
        expect(ringMaterial.uniforms.color.value.b).toBeCloseTo(expectedColor.b, 2);
      });
      
      // Clean up
      renderer.dispose();
    });

    // Helper function to get all objects in the hierarchy
    function getAllObjects(object: THREE.Object3D): THREE.Object3D[] {
      const objects: THREE.Object3D[] = [object];
      object.children.forEach(child => {
        objects.push(...getAllObjects(child));
      });
      return objects;
    }
  });

  // Test seeded texture generation
  describe('Seeded Texture Generation', () => {
    let renderer: ClassIGasGiantRenderer;
    let gasGiant: CelestialObject;
    
    beforeEach(() => {
      renderer = new ClassIGasGiantRenderer();
      gasGiant = createGasGiantObject('jupiter-test', GasGiantClass.CLASS_I);
      
      // Add seed to properties
      const props = gasGiant.properties as GasGiantProperties;
      props.seed = 12345; // Fixed seed for testing
    });
    
    it('should generate consistent colors with same seed', () => {
      // Create two meshes with same seed
      const mesh1 = renderer.createMesh(gasGiant, { detailLevel: 'very-low' }) as THREE.Group;
      const mesh2 = renderer.createMesh(gasGiant, { detailLevel: 'very-low' }) as THREE.Group;
      
      // Get materials from both meshes
      const body1 = mesh1.children.find(child => child.name === `${gasGiant.id}-body`) as THREE.Mesh;
      const body2 = mesh2.children.find(child => child.name === `${gasGiant.id}-body`) as THREE.Mesh;
      
      const material1 = body1.material as THREE.ShaderMaterial;
      const material2 = body2.material as THREE.ShaderMaterial;
      
      // Colors should be identical with same seed
      expect(material1.uniforms.mainColor1.value).toEqual(material2.uniforms.mainColor1.value);
      expect(material1.uniforms.mainColor2.value).toEqual(material2.uniforms.mainColor2.value);
      expect(material1.uniforms.darkColor.value).toEqual(material2.uniforms.darkColor.value);
      
      // Clean up
      renderer.dispose();
    });
    
    it('should generate different colors with different seeds', () => {
      // Create first mesh with original seed
      const mesh1 = renderer.createMesh(gasGiant, { detailLevel: 'very-low' }) as THREE.Group;
      
      // Change seed and create second mesh
      (gasGiant.properties as GasGiantProperties).seed = 54321;
      const mesh2 = renderer.createMesh(gasGiant, { detailLevel: 'very-low' }) as THREE.Group;
      
      // Get materials from both meshes
      const body1 = mesh1.children.find(child => child.name === `${gasGiant.id}-body`) as THREE.Mesh;
      const body2 = mesh2.children.find(child => child.name === `${gasGiant.id}-body`) as THREE.Mesh;
      
      const material1 = body1.material as THREE.ShaderMaterial;
      const material2 = body2.material as THREE.ShaderMaterial;
      
      // Colors should be different with different seeds
      expect(material1.uniforms.mainColor1.value).not.toEqual(material2.uniforms.mainColor1.value);
      expect(material1.uniforms.mainColor2.value).not.toEqual(material2.uniforms.mainColor2.value);
      expect(material1.uniforms.darkColor.value).not.toEqual(material2.uniforms.darkColor.value);
      
      // Clean up
      renderer.dispose();
    });
  });
  
  // Test that seed property is available for all celestial object types
  describe('Seed Property Availability', () => {
    it('should have seed property in GasGiantProperties', () => {
      const gasGiant = createGasGiantObject('test-gas-giant', GasGiantClass.CLASS_I);
      const props = gasGiant.properties as GasGiantProperties;
      
      // Set a seed
      props.seed = 12345;
      
      // Verify seed is accessible
      expect(props.seed).toBe(12345);
    });
    
    it('should have seed property in PlanetProperties', () => {
      // Create a planet object using mock factory
      // Explicitly provide all required props in override for type safety here
      const planet = createMockPlanet({
        id: 'test-planet',
        properties: {
          seed: 12345,
          class: CelestialType.PLANET,
          type: PlanetType.ROCKY,
          isMoon: false,
          composition: ['test-comp'] // Provide required field
        }
      });
      
      const props = planet.properties as PlanetProperties;
      
      // Verify seed is accessible
      expect(props.seed).toBe(12345);
    });
    
    it('should have seed property in StarProperties', () => {
      // Create a star object using mock factory
      // Explicitly provide all required props in override for type safety here
      const star = createMockStar({
        id: 'test-star',
        properties: {
          seed: 12345,
          class: CelestialType.STAR,
          isMainStar: true,
          spectralClass: 'G',
          luminosity: 1.0,
          color: '#FFFF00'
        }
      });
      
      const props = star.properties as StarProperties;
      
      // Verify seed is accessible
      expect(props.seed).toBe(12345);
    });
  });
}); 