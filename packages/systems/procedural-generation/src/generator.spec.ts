import { describe, it, expect } from 'vitest';
import { generateSystem } from './generator';
import type { CelestialObjectInputData } from '@teskooano/data-types';
import { CelestialType } from '@teskooano/data-types';

describe('generateSystem', () => {
  it('should generate a deterministic system based on a seed', async () => {
    const seed = 'test-deterministic-seed';

    // Generate the system twice with the same seed
    const system1 = await generateSystem(seed);
    const system2 = await generateSystem(seed);

    // Basic checks: Ensure at least one object (the star) is generated
    expect(system1).toBeInstanceOf(Array);
    expect(system1.length).toBeGreaterThan(0);
    expect(system1[0].type).toBe(CelestialType.STAR);

    // Determinism check: The results should be identical
    expect(system1).toEqual(system2);

    // Optional: Check specific properties if needed, though exact values
    // depend heavily on the PRNG implementation and generation logic.
    // For now, deep equality is the primary test for determinism.
    // console.log("Generated Star Name (Test Seed):");
    // console.log(system1[0].name);
  });

  it('should generate different systems for different seeds', async () => {
    const seedA = 'test-seed-alpha';
    const seedB = 'test-seed-beta';

    const systemA = await generateSystem(seedA);
    const systemB = await generateSystem(seedB);
    console.log(systemA);
    console.log(systemB);

    // Ensure both generated something
    expect(systemA.length).toBeGreaterThan(0);
    expect(systemB.length).toBeGreaterThan(0);

    // Check that the results are different
    expect(systemA).not.toEqual(systemB);

    // Specifically, check if star names are different (high probability)
    expect(systemA[0].name).not.toEqual(systemB[0].name);
  });
}); 