import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { GravitationalLensingHandler } from '../../object-manager/gravitational-lensing';
import { CelestialObject, CelestialType, StellarType } from '@teskooano/data-types';
import { 
  CelestialRenderer, 
  SchwarzschildBlackHoleRenderer,
  KerrBlackHoleRenderer,
  NeutronStarRenderer
} from '@teskooano/systems-celestial';
// Import mock factories
import { createMockBlackHole, createMockStar, createMockPlanet } from '../test-utils';

// Create module-level mock object to hold our spies
const mockCelestialRenderers = {
  addGravitationalLensing: vi.fn(),
  update: vi.fn()
};

// Mock celestial renderers
vi.mock('@teskooano/systems-celestial', () => {
  class MockCelestialRenderer {
    update(time: number, lightSources?: Map<string, THREE.Vector3>): void {
      mockCelestialRenderers.update(time, lightSources);
    }
  }

  class MockSchwarzschildBlackHoleRenderer extends MockCelestialRenderer {
    addGravitationalLensing(
      object: CelestialObject,
      renderer: THREE.WebGLRenderer,
      scene: THREE.Scene,
      camera: THREE.PerspectiveCamera,
      mesh: THREE.Object3D
    ): void {
      mockCelestialRenderers.addGravitationalLensing(object, renderer, scene, camera, mesh);
    }
  }

  class MockKerrBlackHoleRenderer extends MockCelestialRenderer {
    addGravitationalLensing(
      object: CelestialObject,
      renderer: THREE.WebGLRenderer,
      scene: THREE.Scene,
      camera: THREE.PerspectiveCamera,
      mesh: THREE.Object3D
    ): void {
      mockCelestialRenderers.addGravitationalLensing(object, renderer, scene, camera, mesh);
    }
  }

  class MockNeutronStarRenderer extends MockCelestialRenderer {
    addGravitationalLensing(
      object: CelestialObject,
      renderer: THREE.WebGLRenderer,
      scene: THREE.Scene,
      camera: THREE.PerspectiveCamera,
      mesh: THREE.Object3D
    ): void {
      mockCelestialRenderers.addGravitationalLensing(object, renderer, scene, camera, mesh);
    }
  }

  return {
    CelestialRenderer: MockCelestialRenderer,
    SchwarzschildBlackHoleRenderer: MockSchwarzschildBlackHoleRenderer,
    KerrBlackHoleRenderer: MockKerrBlackHoleRenderer,
    NeutronStarRenderer: MockNeutronStarRenderer
  };
});

describe('GravitationalLensingHandler', () => {
  let starRenderers: Map<string, CelestialRenderer>;
  let lensingHandler: GravitationalLensingHandler;
  let blackHoleRenderer: SchwarzschildBlackHoleRenderer;
  
  beforeEach(() => {
    // Clear mocks
    vi.clearAllMocks();
    mockCelestialRenderers.addGravitationalLensing.mockClear();
    mockCelestialRenderers.update.mockClear();
    
    // Create star renderers map
    starRenderers = new Map();
    
    // Create the mock renderer directly
    blackHoleRenderer = new SchwarzschildBlackHoleRenderer();
    
    // Create lensing handler
    lensingHandler = new GravitationalLensingHandler(starRenderers);
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should identify objects needing gravitational lensing', () => {
    // Create a black hole object
    const blackHoleObject = createMockBlackHole(); // Use factory
    
    // Create a regular star object
    const regularStarObject = createMockStar(); // Use factory
    
    // Create a planet (non-star object)
    const planetObject = createMockPlanet(); // Use factory
    
    // Check which objects need gravitational lensing
    expect(lensingHandler.needsGravitationalLensing(blackHoleObject)).toBe(true);
    expect(lensingHandler.needsGravitationalLensing(regularStarObject)).toBe(false);
    expect(lensingHandler.needsGravitationalLensing(planetObject)).toBe(false);
  });
  
  it('should apply gravitational lensing to objects that need it', () => {
    // Create a black hole renderer and add it to the map
    starRenderers.set('black-hole', blackHoleRenderer as unknown as CelestialRenderer);
    
    // Create a mesh for the black hole
    const blackHoleMesh = new THREE.Object3D();
    
    // Create objects map
    const objects = new Map();
    objects.set('black-hole', blackHoleMesh);
    
    // Add the black hole to the lensing objects
    lensingHandler.addLensingObject('black-hole');
    
    // Create renderer, scene, and camera
    const renderer = new THREE.WebGLRenderer();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    
    // Apply gravitational lensing
    lensingHandler.applyGravitationalLensing(renderer, scene, camera, objects);
    
    // Verify lensing was applied
    expect(mockCelestialRenderers.addGravitationalLensing).toHaveBeenCalled();
  });
  
  it('should not apply lensing if renderer or mesh is missing', () => {
    // Create a renderer, scene, and camera
    const renderer = new THREE.WebGLRenderer();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    
    // Create objects map with no black hole
    const objects = new Map();
    
    // Add a non-existent object to the lensing objects
    lensingHandler.addLensingObject('non-existent');
    
    // Apply gravitational lensing - should not throw any errors
    lensingHandler.applyGravitationalLensing(renderer, scene, camera, objects);
    
    // Now add a renderer but still no mesh
    starRenderers.set('black-hole', blackHoleRenderer as unknown as CelestialRenderer);
    lensingHandler.addLensingObject('black-hole');
    
    // Apply gravitational lensing - should still not throw any errors
    lensingHandler.applyGravitationalLensing(renderer, scene, camera, objects);
    
    // Verify lensing was not applied
    expect(mockCelestialRenderers.addGravitationalLensing).not.toHaveBeenCalled();
  });
  
  it('should clear lensing objects', () => {
    // Add some lensing objects
    lensingHandler.addLensingObject('black-hole-1');
    lensingHandler.addLensingObject('black-hole-2');
    
    // Clear lensing objects
    lensingHandler.clear();
    
    // Create objects and renderers
    const objects = new Map();
    objects.set('black-hole-1', new THREE.Object3D());
    starRenderers.set('black-hole-1', blackHoleRenderer as unknown as CelestialRenderer);
    
    // Apply gravitational lensing
    const renderer = new THREE.WebGLRenderer();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    
    lensingHandler.applyGravitationalLensing(renderer, scene, camera, objects);
    
    // Verify lensing was not applied (objects were cleared)
    expect(mockCelestialRenderers.addGravitationalLensing).not.toHaveBeenCalled();
  });
}); 