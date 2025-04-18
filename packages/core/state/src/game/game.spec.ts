import { describe, it, expect, vi, beforeEach } from 'vitest';
import { atom } from 'nanostores';
import { 
  CelestialObject, 
  PhysicsStateReal, 
  OrbitalParameters, 
  CelestialType 
} from '@teskooano/data-types';
import { OSVector3 } from '@teskooano/core-physics';
import {
  celestialObjectsStore,
  addCelestialObject,
  updateCelestialObject,
  removeCelestialObject,
  selectObject,
  focusObject,
} from './stores';
import { simulationState } from './simulation';
import * as THREE from 'three';

// Helper to create minimal REAL state
const createMinimalRealState = (
  id: string,
  mass: number = 1e6
): PhysicsStateReal => ({
  id,
  mass_kg: mass,
  position_m: new OSVector3(0, 0, 0),
  velocity_mps: new OSVector3(0, 0, 0),
});

// Helper to create a mock CelestialObject using REAL state
const createMockObject = (
  id: string,
  name: string = `Obj ${id}`,
  type: CelestialType = CelestialType.PLANET,
  parentId?: string,
): CelestialObject => ({
  id,
  name,
  type,
  radius: 1000, // Scaled visual radius
  mass: 1, // Scaled visual mass
  realRadius_m: 1e6,
  realMass_kg: 1e22,
  orbit: {} as OrbitalParameters, // Simplified
  temperature: 273,
  physicsStateReal: createMinimalRealState(id, 1e22),
  parentId,
});

describe('Celestial Objects Store', () => {
  beforeEach(() => {
    // Reset store before each test
    celestialObjectsStore.set({});
  });

  it('should add a celestial object', () => {
    const obj = createMockObject('planet1');
    addCelestialObject(obj);
    const state = celestialObjectsStore.get();
    expect(state['planet1']).toEqual(obj);
    expect(Object.keys(state).length).toBe(1);
  });

  it('should update an existing celestial object', () => {
    const obj1 = createMockObject('star1', 'Sol', CelestialType.STAR);
    addCelestialObject(obj1);
    const updatedObj = { ...obj1, name: 'Updated Sol' };
    updateCelestialObject(updatedObj);
    const state = celestialObjectsStore.get();
    expect(state['star1']).toEqual(updatedObj);
    expect(state['star1'].name).toBe('Updated Sol');
  });

  it('should remove a celestial object', () => {
    const obj1 = createMockObject('moon1', 'Luna', CelestialType.MOON, 'planet1');
    const obj2 = createMockObject('planet1');
    addCelestialObject(obj1);
    addCelestialObject(obj2);
    removeCelestialObject('moon1');
    const state = celestialObjectsStore.get();
    expect(state['moon1']).toBeUndefined();
    expect(state['planet1']).toEqual(obj2);
    expect(Object.keys(state).length).toBe(1);
  });
});

describe('Simulation State Actions', () => {
  beforeEach(() => {
    // Reset simulation state as well
    simulationState.set({
      time: 0,
      timeScale: 1,
      paused: false,
      selectedObject: null,
      focusedObjectId: null,
      camera: { /* default camera */ } as any, // simplified
    });
    // Add some objects for testing selection/focus
    celestialObjectsStore.set({
      'obj1': createMockObject('obj1'),
      'obj2': createMockObject('obj2')
    });
  });

  it('should select an object', () => {
    selectObject('obj1');
    const state = simulationState.get();
    expect(state.selectedObject).toBe('obj1');
  });

  it('should deselect object if null is passed', () => {
    selectObject('obj1');
    selectObject(null);
    const state = simulationState.get();
    expect(state.selectedObject).toBeNull();
  });

  it('should not select a non-existent object', () => {
    selectObject('nonexistent');
    const state = simulationState.get();
    expect(state.selectedObject).toBeNull();
  });

  it('should focus an object', () => {
    focusObject('obj2');
    const state = simulationState.get();
    expect(state.focusedObjectId).toBe('obj2');
    // Add check for camera target update if implemented
  });

  it('should unfocus object if null is passed', () => {
    focusObject('obj2');
    focusObject(null);
    const state = simulationState.get();
    expect(state.focusedObjectId).toBeNull();
  });

  it('should not focus a non-existent object', () => {
    focusObject('nonexistent');
    const state = simulationState.get();
    expect(state.focusedObjectId).toBeNull(); // Should remain null or previous value
  });
});

describe('Core State', () => {
  beforeEach(() => {
    // Reset state before each test
    simulationState.set({
      time: 0,
      timeScale: 1,
      paused: false,
      selectedObject: null,
      focusedObjectId: null,
      camera: {
        position: new THREE.Vector3(0, 0, 1000),
        target: new THREE.Vector3(0, 0, 0),
        fov: 60
      }
    });
    celestialObjectsStore.set({});
  });

  describe('simulationState', () => {
    it('should initialize with default values', () => {
      const state = simulationState.get();
      expect(state.time).toBe(0);
      expect(state.timeScale).toBe(1);
      expect(state.paused).toBe(false);
      expect(state.selectedObject).toBeNull();
      expect(state.camera.position.x).toBe(0);
      expect(state.camera.position.y).toBe(0);
      expect(state.camera.position.z).toBe(1000);
      expect(state.camera.target.x).toBe(0);
      expect(state.camera.target.y).toBe(0);
      expect(state.camera.target.z).toBe(0);
      expect(state.camera.fov).toBe(60);
    });

    it('should update timeScale', () => {
      actions.setTimeScale(2);
      expect(simulationState.get().timeScale).toBe(2);
    });

    it('should toggle pause state', () => {
      actions.togglePause();
      expect(simulationState.get().paused).toBe(true);
      actions.togglePause();
      expect(simulationState.get().paused).toBe(false);
    });

    it('should update selected object', () => {
      actions.selectObject('test-1');
      expect(simulationState.get().selectedObject).toBe('test-1');
      actions.selectObject(null);
      expect(simulationState.get().selectedObject).toBeNull();
    });

    it('should update camera position and target', () => {
      const newPosition = new THREE.Vector3(100, 200, 300);
      const newTarget = new THREE.Vector3(0, 0, 0);
      actions.updateCamera(newPosition, newTarget);
      expect(simulationState.get().camera.position.x).toBe(100);
      expect(simulationState.get().camera.position.y).toBe(200);
      expect(simulationState.get().camera.position.z).toBe(300);
      expect(simulationState.get().camera.target.x).toBe(0);
      expect(simulationState.get().camera.target.y).toBe(0);
      expect(simulationState.get().camera.target.z).toBe(0);
    });
  });

  describe('solar system hierarchy', () => {
    it('should create a solar system with a star', () => {
      const starId = actions.createSolarSystem({
        id: 'sun-1',
        name: 'Sun',
        mass: 1.989e30,
        radius: 696340000
      });

      const objects = celestialObjectsStore.get();
      expect(objects).toHaveProperty(starId);
      
      if (starId in objects) {
        expect(objects[starId].type).toEqual(CelestialType.STAR);
      }
      
      const hierarchy = celestialHierarchyStore.get();
      expect(hierarchy[starId]).toEqual([]);
    });

    it('should add a planet to a star', () => {
      const starId = actions.createSolarSystem({
        id: 'sun-1',
        name: 'Sun',
        mass: 1.989e30,
        radius: 696340000
      });

      const planetId = actions.addCelestial({
        id: 'earth-1',
        name: 'Earth',
        mass: 5.972e24,
        radius: 6371000,
        orbitalParameters: {
          semiMajorAxis: 1.0,
          eccentricity: 0.0167,
          inclination: 0.0,
          longitudeOfAscendingNode: 0.0,
          argumentOfPeriapsis: 0.0,
          meanAnomaly: 0.0,
          period: 365.25
        },
        parentId: starId
      });

      const objects = celestialObjectsStore.get();
      const planetObj = objects[planetId!];
      expect(planetObj).toBeDefined();
      if (planetObj) { // Type guard for TS
        expect(planetObj.type).toEqual(CelestialType.PLANET);
        expect(planetObj.parentId).toEqual(starId);
      }
      
      const hierarchy = celestialHierarchyStore.get();
      expect(hierarchy[starId]).toContain(planetId);

      const children = getChildrenOfObject(starId);
      expect(children.length).toBe(1);
      expect(children[0].id).toEqual(planetId);
    });

    it('should get physics bodies for simulation', () => {
      const starId = actions.createSolarSystem({
        id: 'sun-1',
        name: 'Sun',
        mass: 1.989e30,
        radius: 696340000
      });

      const planetId = actions.addCelestial({
        id: 'earth-1',
        name: 'Earth',
        mass: 5.972e24,
        radius: 6371000,
        orbitalParameters: {
          semiMajorAxis: 1.0,
          eccentricity: 0.0167,
          inclination: 0.0,
          longitudeOfAscendingNode: 0.0,
          argumentOfPeriapsis: 0.0,
          meanAnomaly: 0.0,
          period: 365.25
        },
        parentId: starId
      });

      const bodies = getPhysicsBodies();
      expect(bodies.length).toBe(2);
      
      const ids = bodies.map(b => b.id);
      expect(ids).toContain(starId);
      expect(ids).toContain(planetId);
    });

    it('should update physics state from simulation results', () => {
      const starId = 'sun-1';
      actions.createSolarSystem({
        id: starId,
        name: 'Sun',
        mass: 1.989e30,
        radius: 696340000
      });

      const bodies = getPhysicsBodies();
      
      // Simulate movement
      const updatedBodies = [{
        ...bodies[0],
        position: new THREE.Vector3(0.001, 0, 0)
      }];

      updatePhysicsState(updatedBodies);
      
      const objects = celestialObjectsStore.get();
      const starObj = objects[starId];
      
      if (starObj) { // Type guard for TS
        expect(starObj.position.x).toEqual(0.001);
        expect(starObj.physicsState.position.x).toEqual(0.001);
      }
    });
  });
}); 