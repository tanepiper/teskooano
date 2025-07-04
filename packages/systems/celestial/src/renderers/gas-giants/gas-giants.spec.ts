import {
  CelestialStatus,
  CelestialType,
  GasGiantClass,
  GasGiantProperties,
  OrbitalParameters,
  PlanetProperties,
  PlanetType,
  RenderableCelestialObject,
  RockyType,
  StarProperties,
  StellarType,
} from "@teskooano/data-types";
import * as THREE from "three";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { BaseGasGiantRenderer } from "./base";
import { ClassIGasGiantRenderer } from "./class-i";
import { ClassIIGasGiantRenderer } from "./class-ii";
import { ClassIIIGasGiantRenderer } from "./class-iii";
import { ClassIVGasGiantRenderer } from "./class-iv";
import { ClassVGasGiantRenderer } from "./class-v";

const mockOrbit: OrbitalParameters = {
  realSemiMajorAxis_m: 7.785e11,
  eccentricity: 0.0489,
  inclination: 1.303,
  longitudeOfAscendingNode: 100.464,
  argumentOfPeriapsis: 273.867,
  meanAnomaly: 20.02,
  period_s: 3.743e8,
};

function createMockPlanet(
  overrides: Partial<RenderableCelestialObject> & {
    properties?: Partial<PlanetProperties>;
  } = {},
): RenderableCelestialObject {
  const defaults: RenderableCelestialObject = {
    celestialObjectId: "mock-planet",
    name: "Mock Planet",
    type: CelestialType.PLANET,
    status: CelestialStatus.ACTIVE,
    seed: "mock-seed",
    mass: 5.972e24,
    radius: 6371000,
    realRadius_m: 6371000,
    position: new THREE.Vector3(),
    rotation: new THREE.Quaternion(),
    orbit: mockOrbit,
    temperature: 288,
    uniforms: {},
    properties: {
      type: CelestialType.PLANET,
      classType: PlanetType.ROCKY,
      isMoon: false,
      composition: ["silicates", "iron"],
    },
  };

  const merged = {
    ...defaults,
    ...overrides,
    properties: {
      ...(defaults.properties as PlanetProperties),
      ...(overrides.properties || {}),
    },
  };
  return merged as RenderableCelestialObject;
}

function createMockStar(
  overrides: Partial<RenderableCelestialObject> & {
    properties?: Partial<StarProperties>;
  } = {},
): RenderableCelestialObject {
  const defaults: RenderableCelestialObject = {
    celestialObjectId: "mock-star",
    name: "Mock Star",
    type: CelestialType.STAR,
    status: CelestialStatus.ACTIVE,
    seed: "mock-seed",
    mass: 1.989e30,
    radius: 696340000,
    realRadius_m: 696340000,
    position: new THREE.Vector3(),
    rotation: new THREE.Quaternion(),
    orbit: mockOrbit,
    temperature: 5778,
    uniforms: {},
    properties: {
      type: CelestialType.STAR,
      classType: StellarType.MAIN_SEQUENCE,
      isMainStar: true,
      spectralClass: "G",
      luminosity: 1,
      color: "#FFFF00",
    },
  };
  const merged = {
    ...defaults,
    ...overrides,
    properties: {
      ...(defaults.properties as StarProperties),
      ...(overrides.properties || {}),
    },
  };
  return merged as RenderableCelestialObject;
}

function createGasGiantObject(
  id: string,
  gasGiantClass: GasGiantClass,
): RenderableCelestialObject {
  const properties: GasGiantProperties = {
    type: CelestialType.GAS_GIANT,
    gasGiantClass: gasGiantClass,
    atmosphereColor: "#D2B48C",
    cloudColor: "#FFFFFF",
    emissiveColor: "#FF6600",
    emissiveIntensity: 0.1,
    cloudSpeed: 100,
    rings: [
      {
        innerRadius: 1.5,
        outerRadius: 2.5,
        color: "#CCBB99",
        opacity: 0.7,
        density: 1,
        rotationRate: 0.01,
        texture: "uniform",
        composition: ["ice", "rock"],
        type: RockyType.ICE,
      },
    ],
  };

  const obj: RenderableCelestialObject = {
    celestialObjectId: id,
    name: `Test Gas Giant ${id}`,
    type: CelestialType.GAS_GIANT,
    status: CelestialStatus.ACTIVE,
    seed: "test-seed",
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Quaternion(0, 0, 0, 1),
    radius: 69911000,
    realRadius_m: 69911000,
    mass: 1.898e27,
    properties,
    uniforms: {},
    orbit: { ...mockOrbit, realSemiMajorAxis_m: 7.785e11 },
    temperature: 165,
  };

  return obj;
}

describe("Gas Giant Renderers", () => {
  afterAll(() => {
    // cleanup mocks if any
  });

  describe("ClassIGasGiantRenderer", () => {
    let renderer: ClassIGasGiantRenderer;
    let gasGiant: RenderableCelestialObject;

    beforeEach(() => {
      renderer = new ClassIGasGiantRenderer();
      gasGiant = createGasGiantObject("jupiter-test", GasGiantClass.CLASS_I);
      renderer.initialize(gasGiant);
    });

    it("should create a mesh with the correct properties", () => {
      const lod = renderer.getLODLevels(gasGiant, {
        detailLevel: "very-low",
      });
      const mesh = lod[0].object as THREE.Group;

      expect(mesh).toBeInstanceOf(THREE.Group);
      expect(mesh.name).toBe(`${gasGiant.celestialObjectId}-lod-0-combined`);

      const body = mesh.children[0].children[0] as THREE.Mesh;
      expect(body).toBeInstanceOf(THREE.Mesh);
      expect(body.geometry).toBeInstanceOf(THREE.SphereGeometry);

      const rings = mesh.children[1] as THREE.Group;
      expect(rings).toBeInstanceOf(THREE.Group);
      expect(rings.name).toContain("-rings-lod-0");

      renderer.dispose();
    });

    it("should have a planet body with shader material", () => {
      const lod = renderer.getLODLevels(gasGiant, {
        detailLevel: "very-low",
      });
      const body = lod[0].object.children[0].children[0] as THREE.Mesh;

      expect(body.material).toBeInstanceOf(THREE.ShaderMaterial);
      const material = body.material as THREE.ShaderMaterial;

      expect(material.uniforms).toHaveProperty("time");
      expect(material.uniforms).toHaveProperty("mainColor1");
      expect(material.uniforms).toHaveProperty("mainColor2");
      expect(material.uniforms).toHaveProperty("darkColor");
      expect(material.uniforms).toHaveProperty("sunPosition");

      renderer.dispose();
    });

    it("should update time and sun position when updated", () => {
      const lod = renderer.getLODLevels(gasGiant, {
        detailLevel: "very-low",
      });
      const body = lod[0].object.children[0].children[0] as THREE.Mesh;
      const material = body.material as THREE.ShaderMaterial;

      const initialTime = material.uniforms.time.value;

      const lightSources = new Map<string, any>();
      lightSources.set("sun", { position: new THREE.Vector3(1000, 0, 0) });

      renderer.update(gasGiant, 10.5, 1, lightSources);

      expect(material.uniforms.time.value).not.toBe(initialTime);

      expect(material.uniforms.sunPosition.value.x).toBe(1000);
      expect(material.uniforms.sunPosition.value.y).toBe(0);
      expect(material.uniforms.sunPosition.value.z).toBe(0);

      renderer.dispose();
    });
  });

  const rendererClasses = [
    {
      RendererClass: ClassIGasGiantRenderer,
      name: "Class I",
      gasGiantClass: GasGiantClass.CLASS_I,
    },
    {
      RendererClass: ClassIIGasGiantRenderer,
      name: "Class II",
      gasGiantClass: GasGiantClass.CLASS_II,
    },
    {
      RendererClass: ClassIIIGasGiantRenderer,
      name: "Class III",
      gasGiantClass: GasGiantClass.CLASS_III,
    },
    {
      RendererClass: ClassIVGasGiantRenderer,
      name: "Class IV",
      gasGiantClass: GasGiantClass.CLASS_IV,
    },
    {
      RendererClass: ClassVGasGiantRenderer,
      name: "Class V",
      gasGiantClass: GasGiantClass.CLASS_V,
    },
  ];

  rendererClasses.forEach(({ RendererClass, name, gasGiantClass }) => {
    describe(`${name}GasGiantRenderer`, () => {
      let renderer: BaseGasGiantRenderer;
      let gasGiant: RenderableCelestialObject;

      beforeEach(() => {
        renderer = new RendererClass();
        gasGiant = createGasGiantObject(
          `${name.toLowerCase()}-test`,
          gasGiantClass,
        );
        renderer.initialize(gasGiant);
      });

      it("should create and dispose a mesh without errors", () => {
        const lod = renderer.getLODLevels(gasGiant, {
          detailLevel: "very-low",
        });

        expect(lod[0].object).toBeInstanceOf(THREE.Group);

        expect(() => renderer.dispose()).not.toThrow();
      });

      it("should update without errors", () => {
        renderer.getLODLevels(gasGiant, { detailLevel: "very-low" });

        expect(() => renderer.update(gasGiant, 1.0, 1.0)).not.toThrow();

        const lightSources = new Map<string, any>();
        lightSources.set("sun", { position: new THREE.Vector3(1000, 0, 0) });
        expect(() =>
          renderer.update(gasGiant, 2.0, 1.0, lightSources),
        ).not.toThrow();

        renderer.dispose();
      });
    });
  });

  describe("Gas Giant Rings", () => {
    let renderer: ClassIIGasGiantRenderer;
    let gasGiant: RenderableCelestialObject;

    beforeEach(() => {
      renderer = new ClassIIGasGiantRenderer();

      gasGiant = createGasGiantObject("saturn-test", GasGiantClass.CLASS_II);
      renderer.initialize(gasGiant);

      const saturnProps = gasGiant.properties as GasGiantProperties;
      saturnProps.rings = [
        {
          innerRadius: 1.5,
          outerRadius: 2.5,
          color: "#CCBB99",
          opacity: 0.7,
          density: 1,
          rotationRate: 0.01,
          texture: "uniform",
          composition: ["ice", "rock"],
          type: RockyType.ICE,
        },
        {
          innerRadius: 2.7,
          outerRadius: 3.5,
          color: "#A09080",
          opacity: 0.5,
          density: 1,
          rotationRate: 0.008,
          texture: "uniform",
          composition: ["ice", "dust"],
          type: RockyType.ICE,
        },
      ];
    });

    it("should create rings with correct dimensions", () => {
      const lod = renderer.getLODLevels(gasGiant, {
        detailLevel: "very-low",
      });
      const ringsGroup = lod[0].object.children[1] as THREE.Group;
      expect(ringsGroup).toBeDefined();

      expect(ringsGroup.children.length).toBe(2);

      ringsGroup.children.forEach((ring) => {
        expect(ring).toBeInstanceOf(THREE.Mesh);
        expect((ring as THREE.Mesh).geometry).toBeInstanceOf(
          THREE.RingGeometry,
        );
      });

      renderer.dispose();
    });

    it("should create correct mesh hierarchy", () => {
      const lod = renderer.getLODLevels(gasGiant, {
        detailLevel: "very-low",
      });
      const mesh = lod[0].object as THREE.Group;

      expect(mesh.children.length).toBe(2);

      const bodyGroup = mesh.children.find((child) =>
        child.children[0]?.name?.includes("-high-lod"),
      );
      expect(bodyGroup).toBeDefined();

      const ringsGroup = mesh.children.find((child) =>
        child.name?.includes("-rings-lod"),
      );
      expect(ringsGroup).toBeDefined();
      expect(ringsGroup).toBeInstanceOf(THREE.Group);

      const allObjects = getAllObjects(mesh);
      const properties = gasGiant.properties as GasGiantProperties;
      // 1 group, 1 body group, 1 body mesh, 1 ring group, 2 ring meshes = 6
      const expectedCount = 1 + 1 + 1 + 1 + properties.rings!.length;
      expect(allObjects.length).toBe(expectedCount);

      renderer.dispose();
    });

    it("should apply correct ring properties", () => {
      const lod = renderer.getLODLevels(gasGiant, {
        detailLevel: "very-low",
      });
      const ringsGroup = lod[0].object.children[1] as THREE.Group;
      const properties = gasGiant.properties as GasGiantProperties;

      ringsGroup.children.forEach((ring, index) => {
        const ringMesh = ring as THREE.Mesh;
        const ringGeometry = ringMesh.geometry as THREE.RingGeometry;
        const ringMaterial = ringMesh.material as THREE.ShaderMaterial;
        const ringProps = properties.rings![index];
        const planetRadius = gasGiant.radius || 1;

        expect(ringGeometry.parameters.innerRadius).toBe(
          planetRadius * ringProps.innerRadius,
        );
        expect(ringGeometry.parameters.outerRadius).toBe(
          planetRadius * ringProps.outerRadius,
        );

        expect(ringMaterial.uniforms.uOpacity.value).toBe(ringProps.opacity);
        expect(ringMaterial.uniforms.uColor.value).toBeInstanceOf(THREE.Color);

        const expectedColor = new THREE.Color(ringProps.color);
        expect(ringMaterial.uniforms.uColor.value.r).toBeCloseTo(
          expectedColor.r,
          2,
        );
        expect(ringMaterial.uniforms.uColor.value.g).toBeCloseTo(
          expectedColor.g,
          2,
        );
        expect(ringMaterial.uniforms.uColor.value.b).toBeCloseTo(
          expectedColor.b,
          2,
        );
      });

      renderer.dispose();
    });

    function getAllObjects(object: THREE.Object3D): THREE.Object3D[] {
      const all: THREE.Object3D[] = [];
      object.traverse((obj) => all.push(obj));
      return all;
    }
  });

  describe("Seeded Texture Generation", () => {
    let renderer: ClassIGasGiantRenderer;
    let gasGiant: RenderableCelestialObject;

    beforeEach(() => {
      renderer = new ClassIGasGiantRenderer();
      gasGiant = createGasGiantObject("jupiter-test", GasGiantClass.CLASS_I);
      gasGiant.seed = "12345";
      renderer.initialize(gasGiant);
    });

    it("should generate consistent colors with same seed", () => {
      const lod1 = renderer.getLODLevels(gasGiant, {
        detailLevel: "very-low",
      });
      const lod2 = renderer.getLODLevels(gasGiant, {
        detailLevel: "very-low",
      });

      const body1 = lod1[0].object.children[0].children[0] as THREE.Mesh;
      const body2 = lod2[0].object.children[0].children[0] as THREE.Mesh;

      const material1 = body1.material as THREE.ShaderMaterial;
      const material2 = body2.material as THREE.ShaderMaterial;

      expect(material1.uniforms.mainColor1.value).toEqual(
        material2.uniforms.mainColor1.value,
      );
      expect(material1.uniforms.mainColor2.value).toEqual(
        material2.uniforms.mainColor2.value,
      );
      expect(material1.uniforms.darkColor.value).toEqual(
        material2.uniforms.darkColor.value,
      );

      renderer.dispose();
    });

    it("should generate different colors with different seeds", () => {
      const lod1 = renderer.getLODLevels(gasGiant, {
        detailLevel: "very-low",
      });

      gasGiant.seed = "54321";
      const lod2 = renderer.getLODLevels(gasGiant, {
        detailLevel: "very-low",
      });

      const body1 = lod1[0].object.children[0].children[0] as THREE.Mesh;
      const body2 = lod2[0].object.children[0].children[0] as THREE.Mesh;

      const material1 = body1.material as THREE.ShaderMaterial;
      const material2 = body2.material as THREE.ShaderMaterial;

      expect(material1.uniforms.mainColor1.value).not.toEqual(
        material2.uniforms.mainColor1.value,
      );
      expect(material1.uniforms.mainColor2.value).not.toEqual(
        material2.uniforms.mainColor2.value,
      );
      expect(material1.uniforms.darkColor.value).not.toEqual(
        material2.uniforms.darkColor.value,
      );

      renderer.dispose();
    });
  });

  describe("Seed Property Availability", () => {
    it("should have seed property in RenderableCelestialObject", () => {
      const gasGiant = createGasGiantObject(
        "test-gas-giant",
        GasGiantClass.CLASS_I,
      );
      gasGiant.seed = "12345";

      expect(gasGiant.seed).toBe("12345");
    });

    it("should not have seed property in PlanetProperties", () => {
      const planet = createMockPlanet({
        celestialObjectId: "test-planet",
      });

      const props = planet.properties as PlanetProperties;

      expect(props).not.toHaveProperty("seed");
    });

    it("should not have seed property in StarProperties", () => {
      const star = createMockStar({
        celestialObjectId: "test-star",
      });

      const props = star.properties as StarProperties;

      expect(props).not.toHaveProperty("seed");
    });
  });
});
