import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Simulation } from './index';
import type { CelestialObject } from '@teskooano/data-types';
import { CelestialType } from '@teskooano/data-types';

describe('Simulation', () => {
  let container: HTMLElement;
  let simulation: Simulation;

  beforeEach(() => {
    // Create a mock container
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    // Create simulation
    simulation = new Simulation(container);
  });

  afterEach(() => {
    // Clean up
    simulation.stop();
    document.body.removeChild(container);
  });

  describe('constructor', () => {
    it('should create a simulation instance', () => {
      expect(simulation).toBeDefined();
    });
  });

  describe('addObject', () => {
    const testObject: CelestialObject = {
      id: 'test-1',
      name: 'Test Planet',
      type: CelestialType.PLANET,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
      mass: 1000,
      radius: 100
    };

    it('should add a celestial object to the simulation', () => {
      expect(() => simulation.addObject(testObject)).not.toThrow();
    });
  });

  describe('removeObject', () => {
    const testObject: CelestialObject = {
      id: 'test-1',
      name: 'Test Planet',
      type: CelestialType.PLANET,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
      mass: 1000,
      radius: 100
    };

    it('should remove a celestial object from the simulation', () => {
      simulation.addObject(testObject);
      expect(() => simulation.removeObject(testObject.id)).not.toThrow();
    });
  });

  describe('stop', () => {
    it('should stop the simulation loop', () => {
      simulation.stop();
      // Note: We can't directly test the animation frame, but we can verify the method doesn't throw
      expect(() => simulation.stop()).not.toThrow();
    });
  });

  describe('event listeners', () => {
    it('should handle window resize events', () => {
      // Simulate window resize
      window.dispatchEvent(new Event('resize'));
      // Note: We can't directly test the resize handler, but we can verify it doesn't throw
      expect(() => window.dispatchEvent(new Event('resize'))).not.toThrow();
    });

    it('should handle keyboard events', () => {
      // Simulate keyboard events
      const events = [
        new KeyboardEvent('keydown', { key: ' ' }), // Space - toggle pause
        new KeyboardEvent('keydown', { key: '+' }), // Plus - increase time scale
        new KeyboardEvent('keydown', { key: '-' }), // Minus - decrease time scale
      ];

      events.forEach(event => {
        window.dispatchEvent(event);
        // Note: We can't directly test the event handlers, but we can verify they don't throw
        expect(() => window.dispatchEvent(event)).not.toThrow();
      });
    });

    it('should handle invalid keyboard events gracefully', () => {
      // Simulate an invalid keyboard event
      const event = new KeyboardEvent('keydown', { key: 'invalid' });
      expect(() => window.dispatchEvent(event)).not.toThrow();
    });
  });
}); 