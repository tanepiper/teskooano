import * as THREE from "three";
import { vi } from "vitest";
import {
  CelestialObject,
  CelestialType,
  StellarType,
  CelestialStatus,
  PlanetType,
} from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

export function createMockStar(overrides = {}): CelestialObject {
  return {
    id: "test-star",
    type: CelestialType.STAR,
    name: "Test Star",
    status: CelestialStatus.ACTIVE,
    realRadius_m: 100,
    realMass_kg: 1000000,
    orbit: {
      realSemiMajorAxis_m: 0,
      eccentricity: 0,
      inclination: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: 0,
    },
    temperature: 5778,
    physicsStateReal: {
      id: "test-star",
      mass_kg: 1000000,
      position_m: new OSVector3(0, 0, 0),
      velocity_mps: new OSVector3(0, 0, 0),
    },
    properties: {
      type: CelestialType.STAR,
      isMainStar: true,
      spectralClass: "G",
      luminosity: 1,
      color: "#ffff00",
      stellarType: StellarType.MAIN_SEQUENCE,
    },
    ...overrides,
  };
}

export function createMockPlanet(overrides = {}): CelestialObject {
  return {
    id: "test-planet",
    type: CelestialType.PLANET,
    name: "Test Planet",
    status: CelestialStatus.ACTIVE,
    realRadius_m: 10,
    realMass_kg: 1000,
    orbit: {
      realSemiMajorAxis_m: 100,
      eccentricity: 0,
      inclination: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: 365 * 24 * 3600,
    },
    temperature: 293,
    physicsStateReal: {
      id: "test-planet",
      mass_kg: 1000,
      position_m: new OSVector3(100, 0, 0),
      velocity_mps: new OSVector3(0, 0, 0),
    },
    properties: {
      type: CelestialType.PLANET,
      classType: PlanetType.ROCKY,
      isMoon: false,
      composition: ["rock", "iron"],
    },
    ...overrides,
  };
}

export function createMockMoon(overrides = {}): CelestialObject {
  return {
    id: "test-moon",
    type: CelestialType.MOON,
    name: "Test Moon",
    status: CelestialStatus.ACTIVE,
    realRadius_m: 2,
    realMass_kg: 100,
    orbit: {
      realSemiMajorAxis_m: 101,
      eccentricity: 0,
      inclination: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: 27 * 24 * 3600,
    },
    temperature: 200,
    physicsStateReal: {
      id: "test-moon",
      mass_kg: 100,
      position_m: new OSVector3(101, 0, 0),
      velocity_mps: new OSVector3(0, 0, 0),
    },
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.ROCKY,
      isMoon: true,
      composition: ["rock"],
    },
    ...overrides,
  };
}

export function createMockAsteroid(overrides = {}): CelestialObject {
  return {
    id: "test-asteroid",
    type: CelestialType.PLANET,
    name: "Test Asteroid",
    status: CelestialStatus.ACTIVE,
    realRadius_m: 1,
    realMass_kg: 10,
    orbit: {
      realSemiMajorAxis_m: 200,
      eccentricity: 0.1,
      inclination: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: 1000 * 24 * 3600,
    },
    temperature: 150,
    physicsStateReal: {
      id: "test-asteroid",
      mass_kg: 10,
      position_m: new OSVector3(200, 0, 0),
      velocity_mps: new OSVector3(0, 0, 0),
    },
    properties: {
      type: CelestialType.PLANET,
      classType: PlanetType.ROCKY,
      isMoon: false,
      composition: ["iron", "rock"],
    },
    ...overrides,
  };
}

export function createMockStation(overrides = {}): CelestialObject {
  return {
    id: "test-station",
    type: CelestialType.SATELLITE,
    name: "Test Station",
    status: CelestialStatus.ACTIVE,
    realRadius_m: 5,
    realMass_kg: 500,
    orbit: {
      realSemiMajorAxis_m: 300,
      eccentricity: 0,
      inclination: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: 90 * 24 * 3600,
    },
    temperature: 300,
    physicsStateReal: {
      id: "test-station",
      mass_kg: 500,
      position_m: new OSVector3(300, 0, 0),
      velocity_mps: new OSVector3(0, 0, 0),
    },
    properties: {
      type: CelestialType.SATELLITE,
      modelPath: "models/satellite.fbx",
      components: ["solar panels", "communication array"],
      missionType: "communications",
      operationalStatus: "active",
    },
    ...overrides,
  };
}

export function createMockBlackHole(overrides = {}): CelestialObject {
  return {
    id: "black-hole",
    type: CelestialType.STAR,
    name: "Test Black Hole",
    status: CelestialStatus.ACTIVE,
    realRadius_m: 100,
    realMass_kg: 100000000,
    orbit: {
      realSemiMajorAxis_m: 0,
      eccentricity: 0,
      inclination: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: 0,
    },
    temperature: 0,
    physicsStateReal: {
      id: "black-hole",
      mass_kg: 100000000,
      position_m: new OSVector3(0, 0, 0),
      velocity_mps: new OSVector3(0, 0, 0),
    },
    properties: {
      type: CelestialType.STAR,
      isMainStar: true,
      spectralClass: "X",
      luminosity: 0,
      color: "#000000",
      stellarType: StellarType.BLACK_HOLE,
    },
    ...overrides,
  };
}
