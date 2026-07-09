import { describe, it, expect, beforeEach } from "vitest";
import { FlatHierarchyService } from "../FlatHierarchyService";
import type { CelestialObject } from "@teskooano/data-types";
import { CelestialType, CelestialStatus } from "@teskooano/data-types";

describe("FlatHierarchyService", () => {
  let service: FlatHierarchyService;

  // Test data
  const createTestObject = (
    id: string,
    parentId?: string,
  ): CelestialObject => ({
    id,
    name: id,
    type: CelestialType.PLANET,
    status: CelestialStatus.ACTIVE,
    realRadius_m: 1000,
    realMass_kg: 1000,
    temperature: 300,
    orbit: {
      realSemiMajorAxis_m: 1000,
      eccentricity: 0,
      inclination: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: 1000,
      realAphelion_m: 1000,
      realPerihelion_m: 1000,
      averageOrbitalSpeed_mps: 1,
    },
    parentId,
  });

  beforeEach(() => {
    // Reset the singleton instance for each test
    (FlatHierarchyService as any).instance = undefined;
    service = FlatHierarchyService.getInstance();
  });

  describe("initialization", () => {
    it("should initialize with empty state", () => {
      const state = service.getHierarchyState();
      expect(state.entries).toEqual({});
      expect(state.roots).toEqual([]);
      expect(state.totalObjects).toBe(0);
      expect(state.maxDepth).toBe(0);
    });

    it("should initialize from objects correctly", () => {
      const objects = {
        sun: createTestObject("sun"),
        earth: createTestObject("earth", "sun"),
        moon: createTestObject("moon", "earth"),
        mars: createTestObject("mars", "sun"),
      };

      const result = service.initializeFromObjects(objects);

      expect(result.success).toBe(true);
      expect(result.affectedObjects).toEqual(["sun", "earth", "moon", "mars"]);

      const state = result.newState;
      expect(state.totalObjects).toBe(4);
      expect(state.roots).toEqual(["sun"]);
      expect(state.maxDepth).toBe(2);

      // Check sun entry
      expect(state.entries.sun).toEqual({
        id: "sun",
        parentId: undefined,
        children: ["earth", "mars"],
        depth: 0,
        path: ["sun"],
        isRoot: true,
        hasChildren: true,
        descendantCount: 3,
      });

      // Check earth entry
      expect(state.entries.earth).toEqual({
        id: "earth",
        parentId: "sun",
        children: ["moon"],
        depth: 1,
        path: ["sun", "earth"],
        isRoot: false,
        hasChildren: true,
        descendantCount: 1,
      });

      // Check moon entry
      expect(state.entries.moon).toEqual({
        id: "moon",
        parentId: "earth",
        children: [],
        depth: 2,
        path: ["sun", "earth", "moon"],
        isRoot: false,
        hasChildren: false,
        descendantCount: 0,
      });
    });

    it("should handle multiple root objects", () => {
      const objects = {
        star1: createTestObject("star1"),
        star2: createTestObject("star2"),
        planet1: createTestObject("planet1", "star1"),
        planet2: createTestObject("planet2", "star2"),
      };

      const result = service.initializeFromObjects(objects);

      expect(result.success).toBe(true);
      const state = result.newState;
      expect(state.roots).toEqual(["star1", "star2"]);
      expect(state.maxDepth).toBe(1);
    });
  });

  describe("adding objects", () => {
    beforeEach(() => {
      const objects = {
        sun: createTestObject("sun"),
        earth: createTestObject("earth", "sun"),
      };
      service.initializeFromObjects(objects);
    });

    it("should add a new object correctly", () => {
      const mars = createTestObject("mars", "sun");
      const result = service.addObject(mars);

      expect(result.success).toBe(true);
      expect(result.affectedObjects).toEqual(["mars"]);

      const state = result.newState;
      expect(state.totalObjects).toBe(3);
      expect(state.entries.mars).toEqual({
        id: "mars",
        parentId: "sun",
        children: [],
        depth: 1,
        path: ["sun", "mars"],
        isRoot: false,
        hasChildren: false,
        descendantCount: 0,
      });

      // Check that sun's children were updated
      expect(state.entries.sun.children).toContain("mars");
      expect(state.entries.sun.descendantCount).toBe(2);
    });

    it("should add a root object correctly", () => {
      const star = createTestObject("star");
      const result = service.addObject(star);

      expect(result.success).toBe(true);

      const state = result.newState;
      expect(state.roots).toContain("star");
      expect(state.entries.star.isRoot).toBe(true);
      expect(state.entries.star.depth).toBe(0);
    });

    it("should reject adding duplicate object", () => {
      const earth = createTestObject("earth", "sun");
      const result = service.addObject(earth);

      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");
    });
  });

  describe("updating parent relationships", () => {
    beforeEach(() => {
      const objects = {
        sun: createTestObject("sun"),
        earth: createTestObject("earth", "sun"),
        moon: createTestObject("moon", "earth"),
        mars: createTestObject("mars", "sun"),
      };
      service.initializeFromObjects(objects);
    });

    it("should update parent correctly", () => {
      const result = service.updateParent("moon", "mars");

      expect(result.success).toBe(true);

      const state = result.newState;
      expect(state.entries.moon.parentId).toBe("mars");
      expect(state.entries.moon.path).toEqual(["sun", "mars", "moon"]);
      expect(state.entries.moon.depth).toBe(2);

      // Check that earth no longer has moon as child
      expect(state.entries.earth.children).not.toContain("moon");
      expect(state.entries.earth.descendantCount).toBe(0);

      // Check that mars now has moon as child
      expect(state.entries.mars.children).toContain("moon");
      expect(state.entries.mars.descendantCount).toBe(1);
    });

    it("should make object root when parent is undefined", () => {
      const result = service.updateParent("earth", undefined);

      expect(result.success).toBe(true);

      const state = result.newState;
      expect(state.entries.earth.isRoot).toBe(true);
      expect(state.entries.earth.depth).toBe(0);
      expect(state.entries.earth.path).toEqual(["earth"]);
      expect(state.roots).toContain("earth");
    });

    it("should prevent cycles", () => {
      const result = service.updateParent("sun", "moon");

      expect(result.success).toBe(false);
      expect(result.error).toContain("cycle");
    });

    it("should reject updating non-existent object", () => {
      const result = service.updateParent("nonexistent", "sun");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("removing objects", () => {
    beforeEach(() => {
      const objects = {
        sun: createTestObject("sun"),
        earth: createTestObject("earth", "sun"),
        moon: createTestObject("moon", "earth"),
        mars: createTestObject("mars", "sun"),
      };
      service.initializeFromObjects(objects);
    });

    it("should remove object correctly", () => {
      const result = service.removeObject("earth");

      expect(result.success).toBe(true);

      const state = result.newState;
      expect(state.totalObjects).toBe(3);
      expect(state.entries.earth).toBeUndefined();

      // Check that sun no longer has earth as child
      expect(state.entries.sun.children).not.toContain("earth");
      expect(state.entries.sun.descendantCount).toBe(1); // Only mars

      // Check that moon is now orphaned (still exists but has no parent)
      expect(state.entries.moon.parentId).toBe("earth");
      // Note: In a real system, you might want to handle orphaned objects differently
    });

    it("should remove root object correctly", () => {
      const result = service.removeObject("sun");

      expect(result.success).toBe(true);

      const state = result.newState;
      expect(state.roots).not.toContain("sun");
      expect(state.entries.sun).toBeUndefined();
    });

    it("should reject removing non-existent object", () => {
      const result = service.removeObject("nonexistent");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("querying hierarchy", () => {
    beforeEach(() => {
      const objects = {
        sun: createTestObject("sun"),
        earth: createTestObject("earth", "sun"),
        moon: createTestObject("moon", "earth"),
        mars: createTestObject("mars", "sun"),
        phobos: createTestObject("phobos", "mars"),
      };
      service.initializeFromObjects(objects);
    });

    it("should get children correctly", () => {
      const result = service.getChildren("sun");

      expect(result.count).toBe(4); // earth, moon, mars, phobos
      expect(result.entries.map((e) => e.id)).toEqual([
        "earth",
        "moon",
        "mars",
        "phobos",
      ]);
    });

    it("should get children with depth limit", () => {
      const result = service.getChildren("sun", { maxDepth: 1 });

      expect(result.count).toBe(2); // earth, mars (not moon, phobos)
      expect(result.entries.map((e) => e.id)).toEqual(["earth", "mars"]);
      expect(result.depthLimited).toBe(true);
    });

    it("should get parent correctly", () => {
      const parent = service.getParent("moon");

      expect(parent?.id).toBe("earth");
    });

    it("should return undefined for root object parent", () => {
      const parent = service.getParent("sun");

      expect(parent).toBeUndefined();
    });

    it("should get path to root correctly", () => {
      const path = service.getPathToRoot("phobos");

      expect(path).toEqual(["sun", "mars", "phobos"]);
    });

    it("should get roots correctly", () => {
      const roots = service.getRoots();

      expect(roots).toHaveLength(1);
      expect(roots[0].id).toBe("sun");
    });

    it("should get objects at specific depth", () => {
      const depth1Objects = service.getObjectsAtDepth(1);

      expect(depth1Objects).toHaveLength(2);
      expect(depth1Objects.map((e) => e.id)).toEqual(["earth", "mars"]);
    });
  });

  describe("complex scenarios", () => {
    it("should handle deep hierarchy correctly", () => {
      const objects = {
        galaxy: createTestObject("galaxy"),
        star: createTestObject("star", "galaxy"),
        planet: createTestObject("planet", "star"),
        moon: createTestObject("moon", "planet"),
        satellite: createTestObject("satellite", "moon"),
      };

      const result = service.initializeFromObjects(objects);

      expect(result.success).toBe(true);
      const state = result.newState;
      expect(state.maxDepth).toBe(4);
      expect(state.entries.satellite.depth).toBe(4);
      expect(state.entries.satellite.path).toEqual([
        "galaxy",
        "star",
        "planet",
        "moon",
        "satellite",
      ]);
    });

    it("should handle multiple independent hierarchies", () => {
      const objects = {
        star1: createTestObject("star1"),
        planet1: createTestObject("planet1", "star1"),
        star2: createTestObject("star2"),
        planet2: createTestObject("planet2", "star2"),
      };

      const result = service.initializeFromObjects(objects);

      expect(result.success).toBe(true);
      const state = result.newState;
      expect(state.roots).toEqual(["star1", "star2"]);
      expect(state.entries.star1.descendantCount).toBe(1);
      expect(state.entries.star2.descendantCount).toBe(1);
    });

    it("should maintain consistency during complex updates", () => {
      // Start with a simple hierarchy
      const objects = {
        sun: createTestObject("sun"),
        earth: createTestObject("earth", "sun"),
        moon: createTestObject("moon", "earth"),
      };
      service.initializeFromObjects(objects);

      // Move moon to be a direct child of sun
      const result1 = service.updateParent("moon", "sun");
      expect(result1.success).toBe(true);

      // Move sun to be a child of moon (moon is a descendant of sun → cycle, must be prevented)
      const result2 = service.updateParent("sun", "moon");
      expect(result2.success).toBe(false); // Should fail due to cycle

      // Verify the state is still consistent
      const state = service.getHierarchyState();
      expect(state.entries.moon.parentId).toBe("sun");
      expect(state.entries.earth.parentId).toBe("sun"); // Should remain unchanged
    });
  });
});
