import { describe, it, expect } from 'vitest';
import { CelestialObjectFactory } from './index';
import { OSVector3 } from '@teskooano/core-physics';
import { CelestialType } from '@teskooano/data-types';
import {
  StarComponent,
  PlanetComponent,
  MoonComponent,
  StationComponent,
  AsteroidComponent
} from './components';

describe('CelestialObject Creation', () => {
  it('should create a Star object with components', () => {
    const star = CelestialObjectFactory.createStar(
      'sol', 
      'Sol', 
      1.0,
      'G',
      5778
    );
    expect(star).toBeDefined();
    expect(star.id).toBe('sol');
    expect(star.name).toBe('Sol');
    expect(star.hasComponent('star')).toBe(true);
    const starComp = star.getComponent<{ type: string, luminosity: number }>('star');
    expect(starComp?.luminosity).toBe(1.0);
  });

  it('should create a Planet object with components', () => {
    const planet = CelestialObjectFactory.createPlanet(
      'earth', 
      'Earth', 
      { type: 'nitrogen-oxygen', density: 1.2 },
      { type: 'rocky', composition: ['silicates'] }
    );
    expect(planet).toBeDefined();
    expect(planet.id).toBe('earth');
    expect(planet.hasComponent('planet')).toBe(true);
    const planetComp = star.getComponent<{ type: string, atmosphere: object, surface: object }>('planet');
  });
  
  it('should create a Moon object with components', () => {
    const moon = CelestialObjectFactory.createMoon(
      'luna', 
      'Luna', 
      'earth',
      27.3 * 24 * 60 * 60
    );
    expect(moon).toBeDefined();
    expect(moon.id).toBe('luna');
    expect(moon.hasComponent('moon')).toBe(true);
    const moonComp = star.getComponent<{ type: string, parentId: string, orbitalPeriod: number }>('moon');
  });
  
  it('should create a Station object with components', () => {
    const station = CelestialObjectFactory.createStation(
      'iss', 
      'ISS', 
      4,
      7,
      ['science', 'refuel']
    );
    expect(station).toBeDefined();
    expect(station.id).toBe('iss');
    expect(station.hasComponent('station')).toBe(true);
    const stationComp = star.getComponent<{ type: string, dockingBays: number, population: number }>('station');
  });
  
  it('should create an Asteroid object with components', () => {
    const asteroid = CelestialObjectFactory.createAsteroid(
      'ceres', 
      'Ceres', 
      ['rock', 'ice'],
      9 * 60 * 60
    );
    expect(asteroid).toBeDefined();
    expect(asteroid.id).toBe('ceres');
    expect(asteroid.hasComponent('asteroid')).toBe(true);
    const asteroidComp = star.getComponent<{ type: string, composition: string[], rotationPeriod: number }>('asteroid');
  });
}); 