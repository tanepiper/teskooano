import { describe, expect, it } from "vitest";
import { CelestialType } from "@teskooano/data-types";
import { generateSystem } from "./generator";
import { OrbitalConfiguration } from "./zones";

describe("Enhanced Procedural Generation System", () => {
  it("generates a deterministic system with the same seed", async () => {
    const seed = "test-seed-deterministic";

    const result1 = await generateSystem(seed);
    const result2 = await generateSystem(seed);

    expect(result1.systemName).toBe(result2.systemName);

    const objects1: any[] = [];
    const objects2: any[] = [];

    await new Promise<void>((resolve) => {
      let completed = 0;

      result1.objects$.subscribe({
        next: (obj) => objects1.push(obj),
        complete: () => {
          completed++;
          if (completed === 2) resolve();
        },
      });

      result2.objects$.subscribe({
        next: (obj) => objects2.push(obj),
        complete: () => {
          completed++;
          if (completed === 2) resolve();
        },
      });
    });

    expect(objects1.length).toBe(objects2.length);
    expect(objects1.length).toBeGreaterThan(0);

    // Check that objects are identical
    for (let i = 0; i < objects1.length; i++) {
      expect(objects1[i].id).toBe(objects2[i].id);
      expect(objects1[i].name).toBe(objects2[i].name);
      expect(objects1[i].type).toBe(objects2[i].type);
    }
  });

  it("generates different systems with different seeds", async () => {
    const result1 = await generateSystem("seed-alpha");
    const result2 = await generateSystem("seed-beta");

    expect(result1.systemName).not.toBe(result2.systemName);
  });

  it("generates systems with realistic orbital distances", async () => {
    const seed = "test-realistic-distances";
    const { objects$ } = await generateSystem(seed);

    const objects: any[] = [];
    await new Promise<void>((resolve) => {
      objects$.subscribe({
        next: (obj) => objects.push(obj),
        complete: () => resolve(),
      });
    });

    // Check that we have at least one star
    const stars = objects.filter((obj) => obj.type === CelestialType.STAR);
    expect(stars.length).toBeGreaterThanOrEqual(1);

    // Check that planets have realistic orbital distances
    const planets = objects.filter(
      (obj) =>
        obj.type === CelestialType.PLANET ||
        obj.type === CelestialType.GAS_GIANT,
    );

    planets.forEach((planet) => {
      const orbitRadius = planet.orbit?.realSemiMajorAxis_m;
      if (orbitRadius) {
        const distanceAU = orbitRadius / 1.496e11;
        expect(distanceAU).toBeGreaterThan(0.01); // Minimum distance
        expect(distanceAU).toBeLessThan(10000); // Maximum distance in our system
      }
    });
  });

  it("generates enhanced multi-star systems", async () => {
    // Test multiple seeds to find a multi-star system
    const seeds = [
      "binary-test-1",
      "binary-test-2",
      "binary-test-3",
      "alpha-centauri",
    ];

    let foundMultiStar = false;

    for (const seed of seeds) {
      const { objects$ } = await generateSystem(seed);

      const objects: any[] = [];
      await new Promise<void>((resolve) => {
        objects$.subscribe({
          next: (obj) => objects.push(obj),
          complete: () => resolve(),
        });
      });

      const stars = objects.filter((obj) => obj.type === CelestialType.STAR);
      if (stars.length > 1) {
        foundMultiStar = true;

        // Verify hierarchical structure
        expect(stars.length).toBeGreaterThanOrEqual(2);
        expect(stars.length).toBeLessThanOrEqual(4); // Maximum 4 stars

        // Check that companion stars have orbital parameters
        const companionStars = stars.slice(1);
        companionStars.forEach((star) => {
          expect(star.orbit).toBeDefined();
          expect(star.orbit.realSemiMajorAxis_m).toBeGreaterThan(0);
        });

        break;
      }
    }

    // We should find at least one multi-star system in our test seeds
    expect(foundMultiStar).toBe(true);
  });

  it("generates systems with variety in celestial types", async () => {
    const seed = "variety-test";
    const { objects$ } = await generateSystem(seed);

    const objects: any[] = [];
    await new Promise<void>((resolve) => {
      objects$.subscribe({
        next: (obj) => objects.push(obj),
        complete: () => resolve(),
      });
    });

    const typeSet = new Set(objects.map((obj) => obj.type));

    // Should have at least stars
    expect(typeSet.has(CelestialType.STAR)).toBe(true);

    // Should likely have planets or gas giants
    const hasPlanets =
      typeSet.has(CelestialType.PLANET) || typeSet.has(CelestialType.GAS_GIANT);
    expect(hasPlanets).toBe(true);

    // System should have reasonable number of objects
    expect(objects.length).toBeGreaterThan(1);
    expect(objects.length).toBeLessThan(100); // Reasonable upper bound
  });

  it("generates systems with enhanced metadata", async () => {
    const seed = "metadata-test";
    const { systemName, objects$ } = await generateSystem(seed);

    expect(systemName).toBeDefined();
    expect(typeof systemName).toBe("string");
    expect(systemName.length).toBeGreaterThan(0);

    const objects: any[] = [];
    await new Promise<void>((resolve) => {
      objects$.subscribe({
        next: (obj) => objects.push(obj),
        complete: () => resolve(),
      });
    });

    // Check for generation metadata on objects
    const planetsWithMetadata = objects.filter(
      (obj) => obj.properties?.generationInfo,
    );

    if (planetsWithMetadata.length > 0) {
      const metadata = planetsWithMetadata[0].properties.generationInfo;
      expect(metadata.systemSeed).toBe(seed);
      expect(metadata.systemType).toBeDefined();
      expect(metadata.starCount).toBeGreaterThanOrEqual(1);
    }
  });

  it("generates systems with proper zone distribution", async () => {
    const seed = "zone-test";
    const { objects$ } = await generateSystem(seed);

    const objects: any[] = [];
    await new Promise<void>((resolve) => {
      objects$.subscribe({
        next: (obj) => objects.push(obj),
        complete: () => resolve(),
      });
    });

    const planets = objects.filter(
      (obj) =>
        obj.type === CelestialType.PLANET ||
        obj.type === CelestialType.GAS_GIANT,
    );

    // Check distance distribution
    const distances = planets
      .map((p) => p.orbit?.realSemiMajorAxis_m)
      .filter((d) => d)
      .map((d) => d / 1.496e11) // Convert to AU
      .sort((a, b) => a - b);

    if (distances.length > 1) {
      // Inner planets should be closer than outer planets
      expect(distances[0]).toBeLessThan(distances[distances.length - 1]);

      // Should have reasonable spacing
      const totalRange = distances[distances.length - 1] - distances[0];
      expect(totalRange).toBeGreaterThan(0.1); // At least 0.1 AU range
    }
  });

  it("handles edge cases gracefully", async () => {
    const edgeCaseSeeds = [
      "",
      "x",
      "extremely-long-seed-name-that-might-cause-issues-with-generation",
    ];

    for (const seed of edgeCaseSeeds) {
      const result = await generateSystem(seed);

      expect(result.systemName).toBeDefined();
      expect(result.objects$).toBeDefined();

      // Should complete without errors
      const objects: any[] = [];
      await new Promise<void>((resolve) => {
        result.objects$.subscribe({
          next: (obj) => objects.push(obj),
          complete: () => resolve(),
          error: (err) => {
            throw err; // Should not error
          },
        });
      });

      expect(objects.length).toBeGreaterThan(0);
    }
  });

  it("generates systems with realistic physics constraints", async () => {
    const seed = "physics-test";
    const { objects$ } = await generateSystem(seed);

    const objects: any[] = [];
    await new Promise<void>((resolve) => {
      objects$.subscribe({
        next: (obj) => objects.push(obj),
        complete: () => resolve(),
      });
    });

    // Check stars
    const stars = objects.filter((obj) => obj.type === CelestialType.STAR);
    stars.forEach((star) => {
      expect(star.realMass_kg).toBeGreaterThan(0);
      expect(star.realRadius_m).toBeGreaterThan(0);
      expect(star.temperature).toBeGreaterThan(1000); // Reasonable stellar temperature
      expect(star.temperature).toBeLessThan(100000);
    });

    // Check planets
    const planets = objects.filter(
      (obj) =>
        obj.type === CelestialType.PLANET ||
        obj.type === CelestialType.GAS_GIANT,
    );

    planets.forEach((planet) => {
      expect(planet.realMass_kg).toBeGreaterThan(0);
      expect(planet.realRadius_m).toBeGreaterThan(0);

      if (planet.orbit) {
        expect(planet.orbit.period_s).toBeGreaterThan(0);
        expect(planet.orbit.eccentricity).toBeGreaterThanOrEqual(0);
        expect(planet.orbit.eccentricity).toBeLessThan(1); // Should be elliptical, not hyperbolic
      }
    });
  });

  it("maintains backward compatibility for basic generation", async () => {
    const seed = "compatibility-test";
    const { systemName, objects$ } = await generateSystem(seed);

    // Basic structure should remain the same
    expect(systemName).toBeDefined();
    expect(objects$).toBeDefined();

    const objects: any[] = [];
    await new Promise<void>((resolve) => {
      objects$.subscribe({
        next: (obj) => {
          // Each object should have the basic required properties
          expect(obj.id).toBeDefined();
          expect(obj.name).toBeDefined();
          expect(obj.type).toBeDefined();
          expect(obj.realMass_kg).toBeDefined();
          expect(obj.realRadius_m).toBeDefined();

          objects.push(obj);
        },
        complete: () => resolve(),
      });
    });

    expect(objects.length).toBeGreaterThan(0);

    // Should have at least one star
    const hasStars = objects.some((obj) => obj.type === CelestialType.STAR);
    expect(hasStars).toBe(true);
  });

  it("validates orbital boundary checking utility function", async () => {
    // Test the isOrbitWithinSystemBoundary utility function
    const { isOrbitWithinSystemBoundary } = await import("./utils");

    // Test circular orbit at boundary
    expect(isOrbitWithinSystemBoundary(10000, 0, 10000)).toBe(true);

    // Test elliptical orbit that would exceed boundary
    expect(isOrbitWithinSystemBoundary(6000, 0.8, 10000)).toBe(false); // Aphelion: 6000 * 1.8 = 10800 AU

    // Test elliptical orbit that stays within boundary
    expect(isOrbitWithinSystemBoundary(5000, 0.8, 10000)).toBe(true); // Aphelion: 5000 * 1.8 = 9000 AU

    // Test highly elliptical comet-like orbit
    expect(isOrbitWithinSystemBoundary(3000, 0.99, 10000)).toBe(true); // Aphelion: 3000 * 1.99 = 5970 AU (within boundary)
    expect(isOrbitWithinSystemBoundary(5100, 0.99, 10000)).toBe(false); // Aphelion: 5100 * 1.99 = 10149 AU (exceeds boundary)

    // Test invalid inputs
    expect(isOrbitWithinSystemBoundary(-1000, 0.5, 10000)).toBe(false);
    expect(isOrbitWithinSystemBoundary(1000, -0.1, 10000)).toBe(false);
    expect(isOrbitWithinSystemBoundary(1000, 1.0, 10000)).toBe(false);
  });

  it("enforces system distance boundary of 10,000 AU including aphelion", async () => {
    const seed = "distance-boundary-test";
    const { objects$ } = await generateSystem(seed);

    const objects: any[] = [];
    await new Promise<void>((resolve) => {
      objects$.subscribe({
        next: (obj) => objects.push(obj),
        complete: () => resolve(),
      });
    });

    // Check all objects are within the 10,000 AU boundary
    for (const obj of objects) {
      if (
        obj.orbit?.realSemiMajorAxis_m &&
        obj.orbit?.eccentricity !== undefined
      ) {
        const semiMajorAxisAU = obj.orbit.realSemiMajorAxis_m / 1.496e11;
        const eccentricity = obj.orbit.eccentricity;

        // Check semi-major axis is within boundary
        expect(semiMajorAxisAU).toBeLessThanOrEqual(10000);

        // More importantly, check that aphelion (farthest orbital point) is within boundary
        // Aphelion = semiMajorAxis × (1 + eccentricity)
        const aphelionAU = semiMajorAxisAU * (1 + eccentricity);
        expect(aphelionAU).toBeLessThanOrEqual(10000);

        // Verify eccentricity is valid
        expect(eccentricity).toBeGreaterThanOrEqual(0);
        expect(eccentricity).toBeLessThan(1);
      }
    }

    // Also check for any rogue objects that might store distance differently
    const rogueObjects = objects.filter((obj) => obj.name.includes("Rogue"));
    for (const rogue of rogueObjects) {
      if (rogue.orbit?.meanAnomaly) {
        // Rogue planets store distance in meanAnomaly
        expect(rogue.orbit.meanAnomaly).toBeLessThanOrEqual(10000);
      }
    }
  });
});
