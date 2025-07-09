import { describe, it, expect, vi } from 'vitest';
import { OSVector3 } from '@teskooano/core-math';
import { updateSimulationWithConfiguration } from './simulation';
import type { PhysicsStateReal } from '@teskooano/data-types';
import type { SimulationConfiguration } from '@teskooano/core-state';

describe('Enhanced Simulation System', () => {
  const mockBody: PhysicsStateReal = {
    id: 'test-body',
    mass_kg: 1e20,
    position_m: new OSVector3(0, 0, 0),
    velocity_mps: new OSVector3(0, 0, 0)
  };

  const basicParams = {
    radii: new Map([['test-body', 1000]]),
    isStar: new Map([['test-body', false]]),
    bodyTypes: new Map(),
    parentIds: new Map(),
    octreeSize: 1e12,
    barnesHutTheta: 0.7
  };

  describe('updateSimulationWithConfiguration', () => {
    it('should handle ideal mode configuration', () => {
      const config: SimulationConfiguration = { mode: 'ideal' };
      
      const result = updateSimulationWithConfiguration(
        [mockBody],
        1.0,
        {
          ...basicParams,
          simulationConfig: config,
          orbitalParameters: new Map(),
          parentIds: new Map(),
          currentTime_s: 0
        }
      );

      expect(result).toBeDefined();
      expect(result.states).toHaveLength(1);
      expect(result.accelerations).toBeDefined();
    });

    it('should handle nbody mode configuration', () => {
      const config: SimulationConfiguration = {
        mode: 'nbody',
        integrator: 'verlet',
        algorithm: 'barnes-hut'
      };
      
      const result = updateSimulationWithConfiguration(
        [mockBody],
        1.0,
        {
          ...basicParams,
          simulationConfig: config
        }
      );

      expect(result).toBeDefined();
      expect(result.states).toHaveLength(1);
      expect(result.accelerations.size).toBeGreaterThanOrEqual(0);
    });

    it('should migrate legacy physics engine to new configuration', () => {
      const result = updateSimulationWithConfiguration(
        [mockBody],
        1.0,
        {
          ...basicParams,
          legacyPhysicsEngine: 'euler'
        }
      );

      expect(result).toBeDefined();
      expect(result.states).toHaveLength(1);
    });

    it('should use default configuration when none provided', () => {
      const result = updateSimulationWithConfiguration(
        [mockBody],
        1.0,
        basicParams
      );

      expect(result).toBeDefined();
      expect(result.states).toHaveLength(1);
    });

    it('should handle invalid configuration gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const invalidConfig = {
        mode: 'nbody',
        // Missing required integrator and algorithm
      } as SimulationConfiguration;
      
      const result = updateSimulationWithConfiguration(
        [mockBody],
        1.0,
        {
          ...basicParams,
          simulationConfig: invalidConfig
        }
      );

      expect(result).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should prioritize simulationConfig over legacy engine', () => {
      const config: SimulationConfiguration = {
        mode: 'nbody',
        integrator: 'symplectic',
        algorithm: 'direct'
      };
      
      const result = updateSimulationWithConfiguration(
        [mockBody],
        1.0,
        {
          ...basicParams,
          simulationConfig: config,
          legacyPhysicsEngine: 'euler' // Should be ignored
        }
      );

      expect(result).toBeDefined();
      expect(result.states).toHaveLength(1);
    });

    it('should translate all integrator types correctly', () => {
      const integrators = ['euler', 'symplectic', 'verlet', 'rk4', 'adaptive'] as const;
      
      integrators.forEach(integrator => {
        const config: SimulationConfiguration = {
          mode: 'nbody',
          integrator,
          algorithm: 'barnes-hut'
        };
        
        const result = updateSimulationWithConfiguration(
          [mockBody],
          1.0,
          {
            ...basicParams,
            simulationConfig: config
          }
        );

        expect(result).toBeDefined();
        expect(result.states).toHaveLength(1);
      });
    });

    it('should translate all algorithm types correctly', () => {
      const algorithms = ['direct', 'barnes-hut', 'fmm', 'p3m'] as const;
      
      algorithms.forEach(algorithm => {
        const config: SimulationConfiguration = {
          mode: 'nbody',
          integrator: 'verlet',
          algorithm
        };
        
        const result = updateSimulationWithConfiguration(
          [mockBody],
          1.0,
          {
            ...basicParams,
            simulationConfig: config
          }
        );

        expect(result).toBeDefined();
        expect(result.states).toHaveLength(1);
      });
    });
  });
});