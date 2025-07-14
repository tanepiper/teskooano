import { describe, expect, it } from "vitest";
import {
  CelestialStatus,
  CelestialType,
  SpectralClass,
  StellarType,
  NeutronStarSubtype,
  BlackHoleSubtype,
  WhiteDwarfSubtype,
  ProtostarSubtype,
} from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";
import { generateIconConfig } from "./config-generator";

describe("Enhanced Star Icon Generation", () => {
  const createMockStar = (properties: any) => ({
    id: "test-star",
    name: "Test Star",
    type: CelestialType.STAR,
    status: CelestialStatus.ACTIVE,
    realRadius_m: 696340000,
    realMass_kg: 1.989e30,
    orbit: {
      realSemiMajorAxis_m: 0,
      eccentricity: 0,
      inclination: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: 0,
    },
    temperature: 5778,
    physicsStateReal: {
      id: "test-star",
      mass_kg: 1.989e30,
      position_m: new OSVector3(0, 0, 0),
      velocity_mps: new OSVector3(0, 0, 0),
    },
    properties,
  });

  describe("Main Sequence Stars", () => {
    it("should generate spectral class-based icons for main sequence stars", () => {
      const star = createMockStar({
        type: CelestialType.STAR,
        isMainStar: true,
        spectralClass: "G2V",
        mainSpectralClass: SpectralClass.G,
        stellarType: StellarType.MAIN_SEQUENCE,
        color: "#FFFFE0",
      });

      const config = generateIconConfig(star);

      expect(config.base.type).toBe("star");
      expect(config.base.gradient).toEqual(["#fff4ea", "#fff9f2"]);
      expect(config.atmosphere).toEqual({
        color: "#FFFFE0",
        size: 4,
      });
    });

    it("should handle O-class stars with blue gradient", () => {
      const star = createMockStar({
        type: CelestialType.STAR,
        isMainStar: true,
        spectralClass: "O5V",
        mainSpectralClass: SpectralClass.O,
        stellarType: StellarType.MAIN_SEQUENCE,
        color: "#9bb0ff",
      });

      const config = generateIconConfig(star);

      expect(config.base.gradient).toEqual(["#9bb0ff", "#587dff"]);
    });
  });

  describe("Exotic Stellar Types", () => {
    it("should generate pulsar icons for neutron stars", () => {
      const star = createMockStar({
        type: CelestialType.STAR,
        isMainStar: true,
        spectralClass: "P",
        stellarType: StellarType.NEUTRON_STAR,
        neutronStarSubtype: NeutronStarSubtype.PULSAR,
        color: "#FFFFFF",
      });

      const config = generateIconConfig(star);

      expect(config.base.type).toBe("star");
      expect(config.base.color).toBe("#FFFFFF");
      expect(config.base.radius).toBe(3);
      expect(config.atmosphere).toEqual({
        color: "#FFFFFF",
        size: 6,
      });
      expect(config.special).toBe("pulsar");
    });

    it("should generate magnetar icons", () => {
      const star = createMockStar({
        type: CelestialType.STAR,
        isMainStar: true,
        spectralClass: "M",
        stellarType: StellarType.NEUTRON_STAR,
        neutronStarSubtype: NeutronStarSubtype.MAGNETAR,
        color: "#FF6B6B",
      });

      const config = generateIconConfig(star);

      expect(config.base.color).toBe("#FF6B6B");
      expect(config.base.radius).toBe(3);
      expect(config.atmosphere).toEqual({
        color: "#FF6B6B",
        size: 6,
      });
      expect(config.special).toBe("pulsar");
    });

    it("should generate black hole icons", () => {
      const star = createMockStar({
        type: CelestialType.STAR,
        isMainStar: true,
        spectralClass: "X",
        stellarType: StellarType.BLACK_HOLE,
        blackHoleSubtype: BlackHoleSubtype.SCHWARZSCHILD,
        color: "#000000",
      });

      const config = generateIconConfig(star);

      expect(config.base.color).toBe("#000000");
      expect(config.base.radius).toBe(6);
      expect(config.atmosphere).toEqual({
        color: "#333333",
        size: 3,
      });
      expect(config.special).toBe("black-hole");
    });

    it("should generate white dwarf icons", () => {
      const star = createMockStar({
        type: CelestialType.STAR,
        isMainStar: true,
        spectralClass: "DA",
        stellarType: StellarType.WHITE_DWARF,
        whiteDwarfSubtype: WhiteDwarfSubtype.DA,
        color: "#FFFFFF",
      });

      const config = generateIconConfig(star);

      expect(config.base.color).toBe("#FFFFFF");
      expect(config.base.radius).toBe(4);
      expect(config.atmosphere).toEqual({
        color: "#FFFFFF",
        size: 2,
      });
      expect(config.special).toBe("white-dwarf");
    });

    it("should generate protostar icons", () => {
      const star = createMockStar({
        type: CelestialType.STAR,
        isMainStar: true,
        spectralClass: "P",
        stellarType: StellarType.PROTOSTAR,
        protostarSubtype: ProtostarSubtype.T_TAURI,
        color: "#FF8A4A",
      });

      const config = generateIconConfig(star);

      expect(config.base.color).toBe("#FF8A4A");
      expect(config.base.radius).toBe(5);
      expect(config.atmosphere).toEqual({
        color: "#FF8A4A",
        size: 5,
      });
      expect(config.special).toBe("protostar");
    });

    it("should generate Wolf-Rayet star icons", () => {
      const star = createMockStar({
        type: CelestialType.STAR,
        isMainStar: true,
        spectralClass: "W",
        stellarType: StellarType.WOLF_RAYET,
        color: "#FF6B6B",
      });

      const config = generateIconConfig(star);

      expect(config.base.color).toBe("#FF6B6B");
      expect(config.base.radius).toBe(10);
      expect(config.atmosphere).toEqual({
        color: "#FF6B6B",
        size: 8,
      });
    });

    it("should generate quasar icons", () => {
      const star = createMockStar({
        type: CelestialType.STAR,
        isMainStar: true,
        spectralClass: "Q",
        stellarType: StellarType.HYPERGIANT,
        color: "#FF6B6B",
      });

      const config = generateIconConfig(star);

      expect(config.base.color).toBe("#FF6B6B");
      expect(config.base.radius).toBe(8);
      expect(config.atmosphere).toEqual({
        color: "#FF6B6B",
        size: 12,
      });
    });
  });

  describe("Fallback Behavior", () => {
    it("should fallback to spectral class when no stellar type is specified", () => {
      const star = createMockStar({
        type: CelestialType.STAR,
        isMainStar: true,
        spectralClass: "K2V",
        mainSpectralClass: SpectralClass.K,
        color: "#FFD2A1",
      });

      const config = generateIconConfig(star);

      expect(config.base.type).toBe("star");
      expect(config.base.gradient).toEqual(["#ffd2a1", "#ffc58e"]);
      expect(config.atmosphere).toEqual({
        color: "#FFD2A1",
        size: 4,
      });
    });

    it("should fallback to color when no spectral class is available", () => {
      const star = createMockStar({
        type: CelestialType.STAR,
        isMainStar: true,
        color: "#FF0000",
      });

      const config = generateIconConfig(star);

      expect(config.base.type).toBe("star");
      expect(config.base.gradient).toEqual(["#FF0000", "#333333"]);
      expect(config.atmosphere).toEqual({
        color: "#FF0000",
        size: 4,
      });
    });
  });
});
