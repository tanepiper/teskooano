import * as THREE from "three";
import { vi } from "vitest";
import {
  CelestialObject,
  CelestialType,
  StellarType,
} from "@teskooano/data-types";

export function createMockVector3(x = 0, y = 0, z = 0): THREE.Vector3 {
  return {
    x,
    y,
    z,
    set: vi.fn(),
    copy: vi.fn(),
    add: vi.fn(),
    subtract: vi.fn(),
    lengthSquared: vi.fn(),
    distanceSquaredTo: vi.fn(),
    toSpherical: vi.fn(),
    fromSpherical: vi.fn(),
    distanceTo: vi.fn().mockReturnValue(100),
    // Add any other required Vector3 properties
  } as unknown as THREE.Vector3;
}

export function createMockStar(overrides = {}): CelestialObject {
  return {
    id: "test-star",
    type: CelestialType.STAR,
    name: "Test Star",
    position: createMockVector3(0, 0, 0),
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    radius: 100,
    mass: 1000000,
    properties: {
      spectralClass: "G",
      stellarType: StellarType.MAIN_SEQUENCE,
      luminosity: 1,
      temperature: 5778,
      color: 0xffff00,
    },
    ...overrides,
  };
}

export function createMockPlanet(overrides = {}): CelestialObject {
  return {
    id: "test-planet",
    type: CelestialType.PLANET,
    name: "Test Planet",
    position: createMockVector3(100, 0, 0),
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    radius: 10,
    mass: 1000,
    properties: {
      type: "rocky",
      atmosphere: {
        density: 1,
        composition: [],
      },
      surfaceTemp: 293,
    },
    ...overrides,
  };
}

export function createMockMoon(overrides = {}): CelestialObject {
  return {
    id: "test-moon",
    type: CelestialType.MOON,
    name: "Test Moon",
    position: createMockVector3(101, 0, 0),
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    radius: 2,
    mass: 100,
    properties: {
      type: "rocky",
      surfaceTemp: 200,
    },
    ...overrides,
  };
}

export function createMockAsteroid(overrides = {}): CelestialObject {
  return {
    id: "test-asteroid",
    type: CelestialType.ASTEROID,
    name: "Test Asteroid",
    position: createMockVector3(200, 0, 0),
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    radius: 1,
    mass: 10,
    properties: {
      density: 1,
      composition: ["iron", "rock"],
    },
    ...overrides,
  };
}

export function createMockStation(overrides = {}): CelestialObject {
  return {
    id: "test-station",
    type: CelestialType.STATION,
    name: "Test Station",
    position: createMockVector3(300, 0, 0),
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    radius: 5,
    mass: 500,
    properties: {
      population: 1000,
      class: "orbital",
      dockingPorts: 4,
      owner: "test-faction",
    },
    ...overrides,
  };
}

export function createMockBlackHole(overrides = {}): CelestialObject {
  return {
    id: "black-hole",
    type: CelestialType.STAR,
    name: "Test Black Hole",
    position: createMockVector3(0, 0, 0),
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    radius: 100,
    mass: 100000000,
    properties: {
      spectralClass: "X",
      stellarType: StellarType.BLACK_HOLE,
      luminosity: 0,
      temperature: 0,
      color: 0x000000,
    },
    ...overrides,
  };
}
