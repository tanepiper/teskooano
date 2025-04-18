import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ModularSpaceRenderer } from '../index';
import { CelestialType } from '@teskooano/data-types';
import * as THREE from 'three';

describe('ThreeJS Renderer Browser Tests', () => {
  let container: HTMLElement;
  let renderer: ModularSpaceRenderer;

  beforeEach(() => {
    // Create a container
    container = document.createElement('div');
    container.id = 'renderer-container';
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (renderer) {
      renderer.dispose();
    }
    document.body.removeChild(container);
  });

  it('should create and append a canvas element', async () => {
    // Initialize the renderer
    renderer = new ModularSpaceRenderer(container);
    
    // Verify the canvas was added to the DOM
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
    expect(canvas instanceof HTMLCanvasElement).toBe(true);
  });

  it('should handle window resize', async () => {
    // Initialize the renderer
    renderer = new ModularSpaceRenderer(container);
    
    // Get initial canvas size
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    const initialWidth = canvas.width;
    const initialHeight = canvas.height;
    
    // Trigger resize by changing container dimensions
    container.style.width = '1024px';
    container.style.height = '768px';
    
    // Manually trigger resize event
    renderer.onResize(1024, 768);
    
    // Check if canvas was resized
    expect(canvas.width).not.toBe(initialWidth);
    expect(canvas.height).not.toBe(initialHeight);
  });

  it('should be able to start and stop the render loop', async () => {
    // Initialize the renderer
    renderer = new ModularSpaceRenderer(container);
    
    // Start render loop
    expect(() => renderer.startRenderLoop()).not.toThrow();
    
    // Stop render loop
    expect(() => renderer.stopRenderLoop()).not.toThrow();
  });

  it('should add and render celestial objects', async () => {
    // Initialize the renderer
    renderer = new ModularSpaceRenderer(container);
    
    // Create test objects
    const testStar = {
      id: 'test-star',
      name: 'Test Star',
      type: CelestialType.STAR,
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Quaternion(0, 0, 0, 1),
      scale: { x: 10, y: 10, z: 10 },
      mass: 10000,
      radius: 1000,
      properties: {
        spectralClass: 'G',
        luminosity: 1,
        temperature: 5778,
        color: '#FFFF00'
      }
    };
    
    const testPlanet = {
      id: 'test-planet',
      name: 'Test Planet',
      type: CelestialType.PLANET,
      position: new THREE.Vector3(2000, 0, 0),
      rotation: new THREE.Quaternion(0, 0, 0, 1),
      scale: { x: 1, y: 1, z: 1 },
      mass: 1000,
      radius: 100,
      properties: {
        type: 'rocky' as 'rocky'
      }
    };
    
    // Add objects to renderer
    renderer.addObject(testStar);
    renderer.addObject(testPlanet);
    
    // Render the scene - use public method to call private render
    expect(() => renderer.startRenderLoop()).not.toThrow();
    expect(() => renderer.stopRenderLoop()).not.toThrow();
    
    // Update object position
    const updatedPlanet = {
      ...testPlanet,
      position: new THREE.Vector3(3000, 500, 0)
    };
    
    // Update the object
    renderer.updateObject(updatedPlanet);
    
    // Render again
    expect(() => renderer.startRenderLoop()).not.toThrow();
    expect(() => renderer.stopRenderLoop()).not.toThrow();
    
    // Remove the objects
    renderer.removeObject(testStar.id);
    renderer.removeObject(testPlanet.id);
    
    // Render again
    expect(() => renderer.startRenderLoop()).not.toThrow();
    expect(() => renderer.stopRenderLoop()).not.toThrow();
  });

  it('should update camera position and target', async () => {
    // Initialize the renderer
    renderer = new ModularSpaceRenderer(container);
    
    // Update camera position and target
    const position = new THREE.Vector3(1000, 2000, 3000);
    const target = new THREE.Vector3(0, 0, 0);
    
    renderer.updateCamera(position, target);
    
    // Render the scene
    expect(() => renderer.startRenderLoop()).not.toThrow();
    expect(() => renderer.stopRenderLoop()).not.toThrow();
  });

  it('should handle browser events for interactive controls', async () => {
    // Initialize the renderer with the container
    renderer = new ModularSpaceRenderer(container);
    
    // Add a test planet
    const testPlanet = {
      id: 'interactive-planet',
      name: 'Interactive Planet',
      type: CelestialType.PLANET,
      position: new THREE.Vector3(0, 0, -1000),
      rotation: new THREE.Quaternion(0, 0, 0, 1),
      scale: { x: 1, y: 1, z: 1 },
      mass: 1000,
      radius: 100,
      properties: {
        type: 'rocky' as 'rocky'
      }
    };
    
    renderer.addObject(testPlanet);
    
    // Start the render loop
    renderer.startRenderLoop();
    
    // Create a mouse event to simulate interaction
    const mouseDownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: 400,
      clientY: 300
    });
    
    const mouseMoveEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      clientX: 450, // Move 50px to the right
      clientY: 300
    });
    
    const mouseUpEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      clientX: 450,
      clientY: 300
    });
    
    // Get the canvas element
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    
    // Dispatch events to simulate dragging
    canvas.dispatchEvent(mouseDownEvent);
    canvas.dispatchEvent(mouseMoveEvent);
    canvas.dispatchEvent(mouseUpEvent);
    
    // We're mainly testing that these events don't cause errors
    // In a real app, we'd have orbit controls or similar that would respond to these events
    expect(() => renderer.startRenderLoop()).not.toThrow();
    expect(() => renderer.stopRenderLoop()).not.toThrow();
    
    // Clean up
    renderer.stopRenderLoop();
  });
}); 