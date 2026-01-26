import { describe, it, expect } from "vitest";
import { AlgorithmFactory } from "./algorithm-factory";
import { AlgorithmType } from "@teskooano/data-types";
import { SpatialPartitioning } from "../spatial/spatial-partitioning";

describe("AlgorithmFactory", () => {
  describe("createAlgorithm", () => {
    it("should always create Barnes-Hut algorithm", () => {
      const mockSpatialPartitioning = {
        isInitialized: () => true,
      } as unknown as SpatialPartitioning;

      const algorithm = AlgorithmFactory.createAlgorithm(
        AlgorithmType.BARNES_HUT,
        { spatialPartitioning: mockSpatialPartitioning },
      );

      expect(algorithm).toBeDefined();
      expect(algorithm.constructor.name).toBe("BarnesHutAlgorithm");
    });

    it("should create Barnes-Hut regardless of requested algorithm type", () => {
      const mockSpatialPartitioning = {
        isInitialized: () => true,
      } as unknown as SpatialPartitioning;

      // Even if a different algorithm type is requested, it should return Barnes-Hut
      const algorithm = AlgorithmFactory.createAlgorithm(
        AlgorithmType.FMM, // Requesting FMM
        { spatialPartitioning: mockSpatialPartitioning },
      );

      expect(algorithm).toBeDefined();
      expect(algorithm.constructor.name).toBe("BarnesHutAlgorithm");
    });
  });

  describe("getImplementedAlgorithms", () => {
    it("should return only barnes-hut", () => {
      const algorithms = AlgorithmFactory.getImplementedAlgorithms();

      expect(algorithms).toHaveLength(1);
      expect(algorithms).toContain(AlgorithmType.BARNES_HUT);
    });
  });

  describe("isAlgorithmImplemented", () => {
    it("should return true only for Barnes-Hut", () => {
      expect(
        AlgorithmFactory.isAlgorithmImplemented(AlgorithmType.BARNES_HUT),
      ).toBe(true);
      expect(AlgorithmFactory.isAlgorithmImplemented(AlgorithmType.FMM)).toBe(
        false,
      );
      expect(AlgorithmFactory.isAlgorithmImplemented(AlgorithmType.P3M)).toBe(
        false,
      );
      expect(
        AlgorithmFactory.isAlgorithmImplemented(AlgorithmType.TREE_PM),
      ).toBe(false);
    });
  });
});
