import * as THREE from "three";
import { vi } from "vitest";
import {
  CelestialObject,
  CelestialType,
  StellarType,
  PlanetType,
  SurfaceType,
  RockyType,
  OrbitalParameters,
  PhysicsStateReal,
} from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-physics";

export function createMockVector3(x = 0, y = 0, z = 0): THREE.Vector3 {
  return new THREE.Vector3(x, y, z);
}

function createMockOrbit(): OrbitalParameters {
  return {
    semiMajorAxis: 1000,
    realSemiMajorAxis_m: 1000,
    eccentricity: 0.01,
    inclination: 0,
    longitudeOfAscendingNode: 0,
    argumentOfPeriapsis: 0,
    meanAnomaly: 0,
    period_s: 10000,
  };
}

export function createMockPhysicsStateReal(
  id: string,
  mass_kg = 1e6,
  pos_m = new OSVector3(0, 0, 0),
  vel_mps = new OSVector3(0, 0, 0),
): PhysicsStateReal {
  return {
    id,
    mass_kg,
    position_m: pos_m,
    velocity_mps: vel_mps,
    ticksSinceLastPhysicsUpdate: 0,
  };
}

export function createMockStar(overrides = {}): CelestialObject {
  const defaultId = "test-star";
  const defaultProps = {
    class: CelestialType.STAR,
    isMainStar: true,
    spectralClass: "G",
    stellarType: StellarType.MAIN_SEQUENCE,
    luminosity: 1,
    color: "#FFFF00",
  };
  const defaultRealMassKg = 1.989e30;
  const defaultRealRadiusM = 696340000;
  const defaultPosition = createMockVector3(0, 0, 0);

  const base = {
    id: defaultId,
    type: CelestialType.STAR,
    name: "Test Star",
    position: defaultPosition,
    rotation: { x: 0, y: 0, z: 0, w: 1 } as THREE.Quaternion,
    radius: 100,
    mass: 1000000,
    realRadius_m: defaultRealRadiusM,
    realMass_kg: defaultRealMassKg,
    orbit: createMockOrbit(),
    temperature: 5778,
    properties: defaultProps,
    physicsStateReal: createMockPhysicsStateReal(
      defaultId,
      defaultRealMassKg,
      defaultPosition,
    ),
  };
  const mergedProps = { ...defaultProps, ...(overrides as any).properties };
  return { ...base, ...overrides, properties: mergedProps };
}

export function createMockPlanet(overrides = {}): CelestialObject {
  const defaultId = "test-planet";
  const defaultProps = {
    class: CelestialType.PLANET,
    isMoon: false,
    composition: ["rock"],
    type: PlanetType.ROCKY,
    atmosphere: {
      composition: [],
      pressure: 1,
      color: "#FFFFFF",
    },
    surface: {
      type: SurfaceType.CRATERED,
      color: "#888888",
      roughness: 0.7,
    },
  };
  const defaultRealMassKg = 5.972e24;
  const defaultRealRadiusM = 6371000;
  const defaultPosition = createMockVector3(100, 0, 0);
  const defaultParentId = "test-star";

  const base = {
    id: defaultId,
    type: CelestialType.PLANET,
    name: "Test Planet",
    position: defaultPosition,
    rotation: { x: 0, y: 0, z: 0, w: 1 } as THREE.Quaternion,
    radius: 10,
    mass: 1000,
    realRadius_m: defaultRealRadiusM,
    realMass_kg: defaultRealMassKg,
    parentId: defaultParentId,
    orbit: createMockOrbit(),
    temperature: 293,
    properties: defaultProps,
    physicsStateReal: createMockPhysicsStateReal(
      defaultId,
      defaultRealMassKg,
      defaultPosition,
    ),
  };
  const mergedProps = { ...defaultProps, ...(overrides as any).properties };
  return { ...base, ...overrides, properties: mergedProps };
}

export function createMockMoon(overrides = {}): CelestialObject {
  const defaultId = "test-moon";
  const defaultProps = {
    class: CelestialType.MOON,
    isMoon: true,
    parentPlanet: "test-planet",
    composition: ["rock"],
    type: PlanetType.ROCKY,
    surface: {
      type: SurfaceType.CRATERED,
      color: "#CCCCCC",
      roughness: 0.8,
    },
  };
  const defaultRealMassKg = 7.342e22;
  const defaultRealRadiusM = 1737400;
  const defaultPosition = createMockVector3(101, 0, 0);
  const defaultParentId = "test-planet";

  const base = {
    id: defaultId,
    type: CelestialType.MOON,
    name: "Test Moon",
    position: defaultPosition,
    rotation: { x: 0, y: 0, z: 0, w: 1 } as THREE.Quaternion,
    radius: 2,
    mass: 100,
    realRadius_m: defaultRealRadiusM,
    realMass_kg: defaultRealMassKg,
    parentId: defaultParentId,
    orbit: createMockOrbit(),
    temperature: 200,
    properties: defaultProps,
    physicsStateReal: createMockPhysicsStateReal(
      defaultId,
      defaultRealMassKg,
      defaultPosition,
    ),
  };
  const mergedProps = { ...defaultProps, ...(overrides as any).properties };
  return { ...base, ...overrides, properties: mergedProps };
}

export function createMockAsteroidField(overrides = {}): CelestialObject {
  const defaultId = "test-asteroid-field";
  const defaultProps = {
    class: CelestialType.ASTEROID_FIELD,
    innerRadius: 100,
    outerRadius: 200,
    height: 10,
    count: 100,
    color: "#8B7355",
    composition: ["iron", "rock"],
    type: RockyType.DARK_ROCK,
  };
  const defaultRealMassKg = 1e21;
  const defaultRealRadiusM = 1000; // Arbitrary for field
  const defaultPosition = createMockVector3(200, 0, 0);
  const defaultParentId = "test-star";

  const base = {
    id: defaultId,
    type: CelestialType.ASTEROID_FIELD,
    name: "Test Asteroid Field",
    position: defaultPosition,
    rotation: { x: 0, y: 0, z: 0, w: 1 } as THREE.Quaternion,
    radius: 1, // Represents individual asteroid size maybe?
    mass: 1, // Represents individual asteroid mass?
    realRadius_m: defaultRealRadiusM, // Represents field dimension?
    realMass_kg: defaultRealMassKg, // Represents total field mass?
    parentId: defaultParentId,
    orbit: createMockOrbit(),
    temperature: 150,
    properties: defaultProps,
    physicsStateReal: createMockPhysicsStateReal(
      defaultId,
      defaultRealMassKg,
      defaultPosition,
    ),
  };
  const mergedProps = { ...defaultProps, ...(overrides as any).properties };
  return { ...base, ...overrides, properties: mergedProps };
}

export function createMockBlackHole(overrides = {}): CelestialObject {
  const defaultId = "black-hole";
  const defaultProps = {
    class: CelestialType.STAR,
    isMainStar: false,
    spectralClass: "X",
    stellarType: StellarType.BLACK_HOLE,
    luminosity: 0,
    color: "#000000",
  };
  const defaultRealMassKg = 1e36;
  const defaultRealRadiusM = 30000; // Schwarzschild radius for ~10 solar mass BH
  const defaultPosition = createMockVector3(0, 0, 0);

  const base = {
    id: defaultId,
    type: CelestialType.STAR,
    name: "Test Black Hole",
    position: defaultPosition,
    rotation: { x: 0, y: 0, z: 0, w: 1 } as THREE.Quaternion,
    radius: 1, // Visual radius, not physical
    mass: 100000000,
    realRadius_m: defaultRealRadiusM,
    realMass_kg: defaultRealMassKg,
    orbit: createMockOrbit(),
    temperature: 0,
    properties: defaultProps,
    physicsStateReal: createMockPhysicsStateReal(
      defaultId,
      defaultRealMassKg,
      defaultPosition,
    ),
  };
  const mergedProps = { ...defaultProps, ...(overrides as any).properties };
  return { ...base, ...overrides, properties: mergedProps };
}

export function createMockCelestialObject(
  id: string,
  name: string = `Mock ${id}`,
  type: CelestialType = CelestialType.PLANET,
  realMass_kg = 1e22,
  realRadius_m = 1e6,
  position_m = new OSVector3(0, 0, 0),
  velocity_mps = new OSVector3(0, 0, 0),
  parentId?: string,
): CelestialObject {
  const realState = createMockPhysicsStateReal(
    id,
    realMass_kg,
    position_m,
    velocity_mps,
  );
  // Scaled properties might still be needed by renderer/UI tests?
  const scaledRadius = 1000; // Example scaled value
  const scaledMass = 1; // Example scaled value

  return {
    id,
    name,
    type,
    radius: scaledRadius,
    mass: scaledMass,
    realRadius_m,
    realMass_kg,
    orbit: {} as OrbitalParameters, // Mock orbit as needed
    temperature: 273,
    properties: {}, // Add mock properties as needed
    physicsStateReal: realState,
    parentId,
  };
}
