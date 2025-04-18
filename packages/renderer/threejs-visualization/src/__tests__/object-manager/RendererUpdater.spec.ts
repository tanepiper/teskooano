import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { RendererUpdater } from '../../object-manager/renderer-updater';
import { 
  CelestialRenderer,
  SchwarzschildBlackHoleRenderer,
  KerrBlackHoleRenderer,
  NeutronStarRenderer,
  createStarRenderer
} from '@teskooano/systems-celestial';
import { createMockStar } from '../test-utils';
import { CelestialType } from '@teskooano/data-types';

describe('RendererUpdater', () => {
  let celestialRenderers: Map<string, CelestialRenderer>;
  let starRenderers: Map<string, CelestialRenderer>;
  let planetRenderers: Map<string, CelestialRenderer>;
  let moonRenderers: Map<string, CelestialRenderer>;
  let rendererUpdater: RendererUpdater;
  
  // Create spy functions for the update methods
  const standardUpdateSpy = vi.fn();
  const specializedUpdateSpy = vi.fn();
  const disposeSpy = vi.fn();
  
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Initialize maps
    celestialRenderers = new Map();
    starRenderers = new Map();
    planetRenderers = new Map();
    moonRenderers = new Map();
    
    // Create mock star object using factory
    const mockStar = createMockStar();

    // Create real renderers based on mock star data
    const standardRenderer = createStarRenderer(
      (mockStar.properties as any).spectralClass, 
      (mockStar.properties as any).stellarType
    );
    
    // Create specialized renderers with type assertions
    const blackHoleRenderer = new SchwarzschildBlackHoleRenderer() as unknown as CelestialRenderer;
    const kerrBlackHoleRenderer = new KerrBlackHoleRenderer() as unknown as CelestialRenderer;
    const neutronStarRenderer = new NeutronStarRenderer() as unknown as CelestialRenderer;
    
    // Replace update methods with spies
    standardRenderer.update = standardUpdateSpy;
    blackHoleRenderer.update = specializedUpdateSpy;
    kerrBlackHoleRenderer.update = specializedUpdateSpy;
    neutronStarRenderer.update = specializedUpdateSpy;
    
    // Add renderers to maps
    starRenderers.set('standard-star', standardRenderer);
    starRenderers.set('black-hole', blackHoleRenderer);
    starRenderers.set('kerr-black-hole', kerrBlackHoleRenderer);
    starRenderers.set('neutron-star', neutronStarRenderer);
    
    // Create mock renderers for planet/moon/asteroid using the standard star renderer mock
    const planetRenderer = createStarRenderer('G'); // Type doesn't matter for mock update
    const moonRenderer = createStarRenderer('G');
    const asteroidRenderer = createStarRenderer('G');
    
    planetRenderer.update = standardUpdateSpy;
    moonRenderer.update = standardUpdateSpy;
    asteroidRenderer.update = standardUpdateSpy;
    
    // Add to maps using correct keys
    planetRenderers.set('earth', planetRenderer);
    moonRenderers.set('moon', moonRenderer);
    celestialRenderers.set(CelestialType.ASTEROID_FIELD, asteroidRenderer); // Use correct key
    
    // Create renderer updater
    rendererUpdater = new RendererUpdater(
      celestialRenderers,
      starRenderers,
      planetRenderers,
      moonRenderers
    );
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should update standard renderers', () => {
    // Create light sources
    const lightSources = new Map<string, THREE.Vector3>();
    lightSources.set('sun', new THREE.Vector3(0, 0, 0));
    
    // Update renderers
    rendererUpdater.updateRenderers(123, lightSources);
    
    // Verify standard renderers were updated
    expect(standardUpdateSpy).toHaveBeenCalledWith(123, lightSources);
  });
  
  it('should update specialized renderers with extra parameters', () => {
    // Create light sources
    const lightSources = new Map<string, THREE.Vector3>();
    lightSources.set('sun', new THREE.Vector3(0, 0, 0));
    
    // Create renderer, scene, and camera
    const renderer = new THREE.WebGLRenderer();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    
    // Update renderers
    rendererUpdater.updateRenderers(123, lightSources, renderer, scene, camera);
    
    // Verify specialized renderers were updated with extra parameters
    expect(specializedUpdateSpy).toHaveBeenCalledWith(123, renderer, scene, camera);
  });
  
  it('should not update specialized renderers if extra parameters are missing', () => {
    // Create light sources
    const lightSources = new Map<string, THREE.Vector3>();
    lightSources.set('sun', new THREE.Vector3(0, 0, 0));
    
    // Update renderers without renderer, scene, and camera
    rendererUpdater.updateRenderers(123, lightSources);
    
    // Verify specialized renderers were NOT updated
    // According to the implementation, specialized renderers are only updated
    // when all three extra parameters (renderer, scene, camera) are provided
    expect(specializedUpdateSpy).not.toHaveBeenCalled();
  });
  
  it('should dispose all renderers', () => {
    // Replace dispose methods with spies
    starRenderers.forEach(renderer => {
      renderer.dispose = disposeSpy;
    });
    
    planetRenderers.forEach(renderer => {
      renderer.dispose = disposeSpy;
    });
    
    moonRenderers.forEach(renderer => {
      renderer.dispose = disposeSpy;
    });
    
    celestialRenderers.forEach(renderer => {
      renderer.dispose = disposeSpy;
    });
    
    // Dispose renderers
    rendererUpdater.dispose();
    
    // Verify dispose was called on all renderers
    expect(disposeSpy).toHaveBeenCalledTimes(7); // 3 specialized + 4 standard renderers
  });
}); 