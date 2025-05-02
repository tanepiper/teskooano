import { describe, it, expect, beforeEach, afterAll } from "vitest";
import * as THREE from "three";
import {
  CelestialObject,
  CelestialType,
  GasGiantProperties,
  PlanetProperties,
  StarProperties,
  GasGiantClass,
  PlanetType,
  RingProperties,
  OrbitalParameters,
  RockyType,
} from "@teskooano/data-types";
import {
  BaseGasGiantRenderer,
  ClassIGasGiantRenderer,
  ClassIIGasGiantRenderer,
  ClassIIIGasGiantRenderer,
  ClassIVGasGiantRenderer,
  ClassVGasGiantRenderer,
} from "./index";
import { TextureFactory } from "../../textures/TextureFactory";

const mockOrbit: OrbitalParameters = {
  semiMajorAxis: 1,
  eccentricity: 0,
  inclination: 0,
  longitudeOfAscendingNode: 0,
  argumentOfPeriapsis: 0,
  meanAnomaly: 0,
  period: 365.25,
};

function createMockPlanet(
  overrides: Partial<CelestialObject> & {
    properties?: Partial<PlanetProperties>;
  } = {},
): CelestialObject {
  const defaults: CelestialObject = {
    id: "mock-planet",
    name: "Mock Planet",
    type: CelestialType.PLANET,
    mass: 5.972e24,
    radius: 6371,
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Quaternion(0, 0, 0, 1),
    temperature: 288,
    orbit: { ...mockOrbit },
    properties: {
      class: CelestialType.PLANET,
      type: PlanetType.ROCKY,
      isMoon: false,
      composition: ["silicates", "iron"],
      seed: Math.random() * 10000,
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
  return merged;
}

function createMockStar(
  overrides: Partial<CelestialObject> & {
    properties?: Partial<StarProperties>;
  } = {},
): CelestialObject {
  const defaults: CelestialObject = {
    id: "mock-star",
    name: "Mock Star",
    type: CelestialType.STAR,
    mass: 1.989e30,
    radius: 696340,
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Quaternion(0, 0, 0, 1),
    temperature: 5778,
    orbit: { ...mockOrbit, semiMajorAxis: 0 },
    properties: {
      class: CelestialType.STAR,
      isMainStar: true,
      spectralClass: "G",
      luminosity: 1.0,
      color: "#FFFF00",
      seed: Math.random() * 10000,
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
  return merged;
}

function createGasGiantObject(
  id: string,
  gasGiantClass: GasGiantClass,
): CelestialObject {
  const position = new THREE.Vector3(0, 0, 0);
  const rotation = new THREE.Quaternion(0, 0, 0, 1);

  const properties: GasGiantProperties = {
    class: CelestialType.GAS_GIANT,
    type: gasGiantClass,
    atmosphereColor: "#CCAA77",
    cloudColor: "#DDBB88",
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

  const obj: CelestialObject = {
    id,
    name: `Test Gas Giant ${id}`,
    type: CelestialType.GAS_GIANT,
    position,
    rotation,
    radius: 71492,
    mass: 1.898e27,
    properties,
    orbit: { ...mockOrbit, semiMajorAxis: 5.2 },
    temperature: 165,
  };

  return obj;
}

describe("Gas Giant Renderers", () => {
  afterAll(() => {
    TextureFactory.dispose();
  });

  describe("ClassIGasGiantRenderer", () => {
    let renderer: ClassIGasGiantRenderer;
    let gasGiant: CelestialObject;

    beforeEach(() => {
      renderer = new ClassIGasGiantRenderer();
      gasGiant = createGasGiantObject("jupiter-test", GasGiantClass.CLASS_I);
    });

    it("should create a mesh with the correct properties", () => {
      const mesh = renderer.createMesh(gasGiant, {
        detailLevel: "very-low",
      }) as THREE.Group;

      expect(mesh).toBeInstanceOf(THREE.Group);
      expect(mesh.name).toBe(gasGiant.id);
      expect(mesh.position.x).toBe(gasGiant.position.x);
      expect(mesh.position.y).toBe(gasGiant.position.y);
      expect(mesh.position.z).toBe(gasGiant.position.z);

      expect(mesh.children.length).toBeGreaterThanOrEqual(2);

      const body = mesh.children.find(
        (child) => child.name === `${gasGiant.id}-body`,
      );
      expect(body).toBeInstanceOf(THREE.Mesh);
      expect((body as THREE.Mesh).geometry).toBeInstanceOf(
        THREE.SphereGeometry,
      );

      const rings = mesh.children.find(
        (child) => child.name === `${gasGiant.id}-rings`,
      );
      expect(rings).toBeInstanceOf(THREE.Group);

      renderer.dispose();
    });

    it("should have a planet body with shader material", () => {
      const mesh = renderer.createMesh(gasGiant, {
        detailLevel: "very-low",
      }) as THREE.Group;
      const body = mesh.children.find(
        (child) => child.name === `${gasGiant.id}-body`,
      ) as THREE.Mesh;

      expect(body.material).toBeInstanceOf(THREE.ShaderMaterial);
      const material = body.material as THREE.ShaderMaterial;

      expect(material.uniforms).toHaveProperty("time");
      expect(material.uniforms).toHaveProperty("atmosphereColor");
      expect(material.uniforms).toHaveProperty("cloudColor");
      expect(material.uniforms).toHaveProperty("baseColor");
      expect(material.uniforms).toHaveProperty("sunPosition");

      renderer.dispose();
    });

    it("should update time and sun position when updated", () => {
      const mesh = renderer.createMesh(gasGiant, {
        detailLevel: "very-low",
      }) as THREE.Group;
      const body = mesh.children.find(
        (child) => child.name === `${gasGiant.id}-body`,
      ) as THREE.Mesh;
      const material = body.material as THREE.ShaderMaterial;

      const initialTime = material.uniforms.time.value;

      const lightSources = new Map<string, THREE.Vector3>();
      lightSources.set("sun", new THREE.Vector3(1000, 0, 0));

      renderer.update(10.5, lightSources);

      expect(material.uniforms.time.value).not.toBe(initialTime);

      expect(material.uniforms.sunPosition.value.x).toBe(1000);
      expect(material.uniforms.sunPosition.value.y).toBe(0);
      expect(material.uniforms.sunPosition.value.z).toBe(0);

      renderer.dispose();
    });
  });

  const rendererClasses = [
    {
      name: "ClassI",
      renderer: ClassIGasGiantRenderer,
      class: GasGiantClass.CLASS_I,
    },
    {
      name: "ClassII",
      renderer: ClassIIGasGiantRenderer,
      class: GasGiantClass.CLASS_II,
    },
    {
      name: "ClassIII",
      renderer: ClassIIIGasGiantRenderer,
      class: GasGiantClass.CLASS_III,
    },
    {
      name: "ClassIV",
      renderer: ClassIVGasGiantRenderer,
      class: GasGiantClass.CLASS_IV,
    },
    {
      name: "ClassV",
      renderer: ClassVGasGiantRenderer,
      class: GasGiantClass.CLASS_V,
    },
  ];

  rendererClasses.forEach(
    ({ name, renderer: RendererClass, class: gasGiantClass }) => {
      describe(`${name}GasGiantRenderer`, () => {
        let renderer: BaseGasGiantRenderer;
        let gasGiant: CelestialObject;

        beforeEach(() => {
          renderer = new RendererClass();
          gasGiant = createGasGiantObject(
            `${name.toLowerCase()}-test`,
            gasGiantClass,
          );
        });

        it("should create and dispose a mesh without errors", () => {
          const mesh = renderer.createMesh(gasGiant, {
            detailLevel: "very-low",
          });

          expect(mesh).toBeInstanceOf(THREE.Group);

          expect(() => renderer.dispose()).not.toThrow();
        });

        it("should update without errors", () => {
          renderer.createMesh(gasGiant, { detailLevel: "very-low" });

          expect(() => renderer.update(1.0)).not.toThrow();

          const lightSources = new Map<string, THREE.Vector3>();
          lightSources.set("sun", new THREE.Vector3(1000, 0, 0));
          expect(() => renderer.update(2.0, lightSources)).not.toThrow();

          renderer.dispose();
        });
      });
    },
  );

  describe("Gas Giant Rings", () => {
    let renderer: ClassIGasGiantRenderer;
    let gasGiant: CelestialObject;

    beforeEach(() => {
      renderer = new ClassIGasGiantRenderer();

      gasGiant = createGasGiantObject("saturn-test", GasGiantClass.CLASS_II);

      const saturnProps = gasGiant.properties as GasGiantProperties;
      saturnProps.rings = [
        {
          innerRadius: 1.2,
          outerRadius: 1.5,
          color: "#FFDDAA",
          opacity: 0.6,
          density: 0.8,
          rotationRate: 0.015,
          texture: "banded",
          composition: ["ice"],
          type: RockyType.ICE,
        },
        {
          innerRadius: 1.6,
          outerRadius: 2.2,
          color: "#DDBBAA",
          opacity: 0.8,
          density: 1.2,
          rotationRate: 0.012,
          texture: "sparse",
          composition: ["rock", "dust"],
          type: RockyType.DARK_ROCK,
        },
      ];

      saturnProps.atmosphereColor = "#DDCC88";
      saturnProps.cloudColor = "#EEDD99";
    });

    it("should create rings with correct dimensions", () => {
      const mesh = renderer.createMesh(gasGiant, {
        detailLevel: "very-low",
      }) as THREE.Group;

      const ringsGroup = mesh.children.find(
        (child) => child.name === `${gasGiant.id}-rings`,
      ) as THREE.Group;
      expect(ringsGroup).toBeDefined();

      expect(ringsGroup.children.length).toBe(2);

      ringsGroup.children.forEach((ring) => {
        expect(ring).toBeInstanceOf(THREE.Mesh);

        const material = (ring as THREE.Mesh).material as THREE.ShaderMaterial;
        expect(material).toBeInstanceOf(THREE.ShaderMaterial);

        expect(material.transparent).toBe(true);

        expect(material.side).toBe(THREE.DoubleSide);
      });

      renderer.dispose();
    });

    it("should create correct mesh hierarchy", () => {
      const mesh = renderer.createMesh(gasGiant, {
        detailLevel: "very-low",
      }) as THREE.Group;

      expect(mesh.children.length).toBe(2);

      const body = mesh.children.find(
        (child) => child.name === `${gasGiant.id}-body`,
      );
      expect(body).toBeDefined();
      expect(body).toBeInstanceOf(THREE.Mesh);

      const ringsGroup = mesh.children.find(
        (child) => child.name === `${gasGiant.id}-rings`,
      );
      expect(ringsGroup).toBeDefined();
      expect(ringsGroup).toBeInstanceOf(THREE.Group);

      const allObjects = getAllObjects(mesh);
      const properties = gasGiant.properties as GasGiantProperties;
      const expectedCount = 1 + 1 + properties.rings!.length;
      expect(allObjects.length).toBe(expectedCount);

      renderer.dispose();
    });

    it("should apply correct ring properties", () => {
      const mesh = renderer.createMesh(gasGiant, {
        detailLevel: "very-low",
      }) as THREE.Group;
      const ringsGroup = mesh.children.find(
        (child) => child.name === `${gasGiant.id}-rings`,
      ) as THREE.Group;
      const properties = gasGiant.properties as GasGiantProperties;

      ringsGroup.children.forEach((ring, index) => {
        const ringMesh = ring as THREE.Mesh;
        const ringGeometry = ringMesh.geometry as THREE.RingGeometry;
        const ringMaterial = ringMesh.material as THREE.ShaderMaterial;
        const ringProps = properties.rings![index];

        expect(ringGeometry.parameters.innerRadius).toBe(
          gasGiant.radius * ringProps.innerRadius,
        );
        expect(ringGeometry.parameters.outerRadius).toBe(
          gasGiant.radius * ringProps.outerRadius,
        );

        expect(ringMaterial.uniforms.opacity.value).toBe(ringProps.opacity);
        expect(ringMaterial.uniforms.color.value).toBeInstanceOf(THREE.Color);

        const expectedColor = new THREE.Color(ringProps.color);
        expect(ringMaterial.uniforms.color.value.r).toBeCloseTo(
          expectedColor.r,
          2,
        );
        expect(ringMaterial.uniforms.color.value.g).toBeCloseTo(
          expectedColor.g,
          2,
        );
        expect(ringMaterial.uniforms.color.value.b).toBeCloseTo(
          expectedColor.b,
          2,
        );
      });

      renderer.dispose();
    });

    function getAllObjects(object: THREE.Object3D): THREE.Object3D[] {
      const objects: THREE.Object3D[] = [object];
      object.children.forEach((child) => {
        objects.push(...getAllObjects(child));
      });
      return objects;
    }
  });

  describe("Seeded Texture Generation", () => {
    let renderer: ClassIGasGiantRenderer;
    let gasGiant: CelestialObject;

    beforeEach(() => {
      renderer = new ClassIGasGiantRenderer();
      gasGiant = createGasGiantObject("jupiter-test", GasGiantClass.CLASS_I);

      const props = gasGiant.properties as GasGiantProperties;
      props.seed = 12345;
    });

    it("should generate consistent colors with same seed", () => {
      const mesh1 = renderer.createMesh(gasGiant, {
        detailLevel: "very-low",
      }) as THREE.Group;
      const mesh2 = renderer.createMesh(gasGiant, {
        detailLevel: "very-low",
      }) as THREE.Group;

      const body1 = mesh1.children.find(
        (child) => child.name === `${gasGiant.id}-body`,
      ) as THREE.Mesh;
      const body2 = mesh2.children.find(
        (child) => child.name === `${gasGiant.id}-body`,
      ) as THREE.Mesh;

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
      const mesh1 = renderer.createMesh(gasGiant, {
        detailLevel: "very-low",
      }) as THREE.Group;

      (gasGiant.properties as GasGiantProperties).seed = 54321;
      const mesh2 = renderer.createMesh(gasGiant, {
        detailLevel: "very-low",
      }) as THREE.Group;

      const body1 = mesh1.children.find(
        (child) => child.name === `${gasGiant.id}-body`,
      ) as THREE.Mesh;
      const body2 = mesh2.children.find(
        (child) => child.name === `${gasGiant.id}-body`,
      ) as THREE.Mesh;

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
    it("should have seed property in GasGiantProperties", () => {
      const gasGiant = createGasGiantObject(
        "test-gas-giant",
        GasGiantClass.CLASS_I,
      );
      const props = gasGiant.properties as GasGiantProperties;

      props.seed = 12345;

      expect(props.seed).toBe(12345);
    });

    it("should have seed property in PlanetProperties", () => {
      const planet = createMockPlanet({
        id: "test-planet",
        properties: {
          seed: 12345,
          class: CelestialType.PLANET,
          type: PlanetType.ROCKY,
          isMoon: false,
          composition: ["test-comp"],
        },
      });

      const props = planet.properties as PlanetProperties;

      expect(props.seed).toBe(12345);
    });

    it("should have seed property in StarProperties", () => {
      const star = createMockStar({
        id: "test-star",
        properties: {
          seed: 12345,
          class: CelestialType.STAR,
          isMainStar: true,
          spectralClass: "G",
          luminosity: 1.0,
          color: "#FFFF00",
        },
      });

      const props = star.properties as StarProperties;

      expect(props.seed).toBe(12345);
    });
  });
});
