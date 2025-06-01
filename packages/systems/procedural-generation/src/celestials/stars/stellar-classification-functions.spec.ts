import { describe, it, expect } from "vitest";
import {
  StellarType,
  MainSequenceSpectralClass,
  BrownDwarfSpectralClass,
} from "@teskooano/data-types/src/celestials/common/stellar-classification";

import type {
  StellarPhysicsData,
  StellarRenderingData,
} from "@teskooano/data-types/src/celestials/common/stellar-classification";

import {
  determineLuminosityClass,
  determineMainSequenceSpectralClass,
  determineBrownDwarfSpectralClass,
  determineBlackHoleCharacteristics,
  determineWhiteDwarfType,
  createMainSequenceStar,
  createStellarRemnant,
} from "./stellar-classification-functions";

describe("Stellar Classification - Data Driven Approach", () => {
  // Sample physics data for different star types
  const sunLikePhysics: StellarPhysicsData = {
    mass: 1.0,
    radius: 1.0,
    temperature: 5778,
    luminosity: 1.0,
    metallicity: 0.0,
    age: 4.6e9,
    rotationPeriod: 609.12, // 25.4 days in hours
  };

  const hotBlueStarPhysics: StellarPhysicsData = {
    mass: 20.0,
    radius: 8.0,
    temperature: 35000,
    luminosity: 50000,
    metallicity: -0.2,
    age: 5e6,
    rotationPeriod: 24,
  };

  const whiteDwarfPhysics: StellarPhysicsData = {
    mass: 0.6,
    radius: 0.01,
    temperature: 15000,
    luminosity: 0.001,
    metallicity: 0.0,
    age: 1e9,
    rotationPeriod: 12,
  };

  const blackHolePhysics: StellarPhysicsData = {
    mass: 10.0,
    radius: 0.0001, // Event horizon
    temperature: 6e-8, // Hawking radiation temperature
    luminosity: 0,
    metallicity: 0,
    age: 1e8,
    rotationPeriod: 0.1,
    schwarzschildRadius: 29.5, // km
  };

  const sampleRenderingData: StellarRenderingData = {
    color: { r: 1.0, g: 1.0, b: 0.8 },
    lightIntensity: 1.0,
    lightColor: { r: 1.0, g: 1.0, b: 0.9 },
  };

  describe("Spectral Classification Functions", () => {
    it("should determine correct main sequence spectral class from temperature", () => {
      expect(determineMainSequenceSpectralClass(5778)).toBe(
        MainSequenceSpectralClass.G,
      );
      expect(determineMainSequenceSpectralClass(35000)).toBe(
        MainSequenceSpectralClass.O,
      );
      expect(determineMainSequenceSpectralClass(3000)).toBe(
        MainSequenceSpectralClass.M,
      );
      expect(determineMainSequenceSpectralClass(1000)).toBeNull(); // Too cool for main sequence
    });

    it("should determine brown dwarf spectral class correctly", () => {
      expect(determineBrownDwarfSpectralClass(2000)).toBe(
        BrownDwarfSpectralClass.L,
      );
      expect(determineBrownDwarfSpectralClass(800)).toBe(
        BrownDwarfSpectralClass.T,
      );
      expect(determineBrownDwarfSpectralClass(300)).toBe(
        BrownDwarfSpectralClass.Y,
      );
      expect(determineBrownDwarfSpectralClass(3000)).toBeNull(); // Too hot for brown dwarf
    });
  });

  describe("Luminosity Class Determination", () => {
    it("should determine correct luminosity class for main sequence stars", () => {
      const luminosityClass = determineLuminosityClass(
        sunLikePhysics,
        StellarType.MAIN_SEQUENCE,
      );
      expect(luminosityClass).toBe("V"); // Main sequence dwarf
    });

    it("should determine correct luminosity class for giants", () => {
      const giantPhysics = { ...sunLikePhysics, radius: 50, luminosity: 1000 };
      const luminosityClass = determineLuminosityClass(
        giantPhysics,
        StellarType.RED_GIANT,
      );
      expect(luminosityClass).toBe("III"); // Giant
    });

    it("should determine correct luminosity class for white dwarfs", () => {
      const luminosityClass = determineLuminosityClass(
        whiteDwarfPhysics,
        StellarType.WHITE_DWARF,
      );
      expect(luminosityClass).toBe("VII"); // White dwarf
    });
  });

  describe("Stellar Remnant Classification", () => {
    it("should classify black holes by mass and rotation", () => {
      const stellarBH = determineBlackHoleCharacteristics(blackHolePhysics);
      expect(stellarBH.massCategory).toBe("stellar");
      expect(stellarBH.rotationType).toBe("kerr"); // Has rotation

      const superMassiveBH = {
        ...blackHolePhysics,
        mass: 1e6,
        rotationPeriod: 0,
      };
      const supermassive = determineBlackHoleCharacteristics(superMassiveBH);
      expect(supermassive.massCategory).toBe("supermassive");
      expect(supermassive.rotationType).toBe("schwarzschild"); // No rotation
    });

    it("should classify white dwarf atmospheric types", () => {
      const hydrogenComposition = {
        hydrogen: 0.8,
        helium: 0.2,
        carbon: 0,
        metals: 0,
      };
      const type = determineWhiteDwarfType(
        whiteDwarfPhysics,
        hydrogenComposition,
      );
      expect(type).toBe("DA"); // Hydrogen atmosphere

      const heliumComposition = {
        hydrogen: 0.1,
        helium: 0.9,
        carbon: 0,
        metals: 0,
      };
      const heliumType = determineWhiteDwarfType(
        whiteDwarfPhysics,
        heliumComposition,
      );
      expect(heliumType).toBe("DB"); // Helium atmosphere

      const unknownType = determineWhiteDwarfType(whiteDwarfPhysics);
      expect(unknownType).toBe("DX"); // Unclassified when no composition data
    });
  });

  describe("Factory Functions", () => {
    it("should create a main sequence star with correct classification", () => {
      const star = createMainSequenceStar(sunLikePhysics, sampleRenderingData);

      expect(star.stellarType).toBe(StellarType.MAIN_SEQUENCE);
      expect(star.spectralClass).toBe(MainSequenceSpectralClass.G);
      expect(star.luminosityClass).toBe("V");
      expect(star.physicsData).toEqual(sunLikePhysics);
      expect(star.renderingData).toEqual(sampleRenderingData);
    });

    it("should create a white dwarf with correct classification", () => {
      const composition = { hydrogen: 0.7, helium: 0.3, carbon: 0, metals: 0 };
      const whiteDwarf = createStellarRemnant(
        StellarType.WHITE_DWARF,
        whiteDwarfPhysics,
        sampleRenderingData,
        { composition },
      );

      expect(whiteDwarf.stellarType).toBe(StellarType.WHITE_DWARF);
      expect(whiteDwarf.characteristics.atmosphericType).toBe("DA");
      expect(whiteDwarf.characteristics.luminosityClass).toBe("VII");
    });

    it("should create a neutron star with correct characteristics", () => {
      const neutronStarPhysics = {
        ...blackHolePhysics,
        mass: 1.4,
        radius: 12e-6, // 12 km in solar radii
        magneticFieldStrength: 1e12,
      };

      const neutronStar = createStellarRemnant(
        StellarType.NEUTRON_STAR,
        neutronStarPhysics,
        sampleRenderingData,
        { rotationPeriod: 0.1 },
      );

      expect(neutronStar.stellarType).toBe(StellarType.NEUTRON_STAR);
      expect(neutronStar.characteristics.isPulsar).toBe(true); // Fast rotation
      expect(neutronStar.characteristics.isMagnetar).toBe(true); // Strong magnetic field
    });

    it("should create a black hole with correct classification", () => {
      const blackHole = createStellarRemnant(
        StellarType.BLACK_HOLE,
        blackHolePhysics,
        sampleRenderingData,
      );

      expect(blackHole.stellarType).toBe(StellarType.BLACK_HOLE);
      expect(blackHole.characteristics.massCategory).toBe("stellar");
      expect(blackHole.characteristics.rotationType).toBe("kerr");
    });
  });

  describe("Data-Driven Philosophy", () => {
    it("should demonstrate separation of physics vs rendering data", () => {
      const star = createMainSequenceStar(sunLikePhysics, sampleRenderingData);

      // Physics data should be separate and focused on simulation needs
      expect(star.physicsData).toHaveProperty("mass");
      expect(star.physicsData).toHaveProperty("temperature");
      expect(star.physicsData).toHaveProperty("luminosity");

      // Rendering data should be separate and focused on visual needs
      expect(star.renderingData).toHaveProperty("color");
      expect(star.renderingData).toHaveProperty("lightIntensity");
      expect(star.renderingData).toHaveProperty("lightColor");

      // Classification should be determined from data, not hardcoded
      expect(typeof star.spectralClass).toBe("string");
      expect(typeof star.luminosityClass).toBe("string");
    });

    it("should allow the same physics data to generate different visual representations", () => {
      const alternateRenderingData: StellarRenderingData = {
        color: { r: 0.8, g: 0.9, b: 1.0 },
        lightIntensity: 1.2,
        lightColor: { r: 0.9, g: 0.95, b: 1.0 },
        coronaSize: 2.0,
        surfaceActivity: 0.8,
      };

      const star1 = createMainSequenceStar(sunLikePhysics, sampleRenderingData);
      const star2 = createMainSequenceStar(
        sunLikePhysics,
        alternateRenderingData,
      );

      // Same physics, same classification
      expect(star1.physicsData).toEqual(star2.physicsData);
      expect(star1.spectralClass).toBe(star2.spectralClass);
      expect(star1.luminosityClass).toBe(star2.luminosityClass);

      // But different visual representation
      expect(star1.renderingData).not.toEqual(star2.renderingData);
    });
  });
});
