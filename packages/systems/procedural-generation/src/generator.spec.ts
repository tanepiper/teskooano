import { describe, it, expect } from "vitest";
import { generateSystem } from "./generator";
import type { CelestialObjectInputData } from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";

describe("generateSystem", () => {
  it("should generate a deterministic system based on a seed", async () => {
    const seed = "test-deterministic-seed";

    const system1 = await generateSystem(seed);
    const system2 = await generateSystem(seed);

    expect(system1).toBeInstanceOf(Array);
    expect(system1.length).toBeGreaterThan(0);
    expect(system1[0].type).toBe(CelestialType.STAR);

    expect(system1).toEqual(system2);
  });

  it("should generate different systems for different seeds", async () => {
    const seedA = "test-seed-alpha";
    const seedB = "test-seed-beta";

    const systemA = await generateSystem(seedA);
    const systemB = await generateSystem(seedB);
    console.log(systemA);
    console.log(systemB);

    expect(systemA.length).toBeGreaterThan(0);
    expect(systemB.length).toBeGreaterThan(0);

    expect(systemA).not.toEqual(systemB);

    expect(systemA[0].name).not.toEqual(systemB[0].name);
  });
});
