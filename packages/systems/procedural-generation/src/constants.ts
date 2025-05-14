import { AtmosphereType, RockyType } from "@teskooano/data-types";

export const AU_TO_METERS = 1.496e11;
export const EARTH_MASS_KG = 5.972e24;
export const EARTH_RADIUS_M = 6.371e6;
export const SOLAR_MASS_KG = 1.989e30;
export const SOLAR_RADIUS_M = 696340e3;
export const SOLAR_LUMINOSITY = 3.828e26;
export const STEFAN_BOLTZMANN = 5.670374e-8;

export const ROCKY_COMPOSITION = ["silicates", "iron", "nickel", "carbon"];
export const ICE_COMPOSITION = [
  "water ice",
  "ammonia ice",
  "methane ice",
  "rock",
];
export const GAS_COMPOSITION = ["H2", "He"];

export const RING_COMPOSITION: Record<RockyType, string[]> = {
  [RockyType.ICE]: ["water ice", "ammonia ice"],
  [RockyType.LIGHT_ROCK]: ["silicates", "carbon"],
  [RockyType.DARK_ROCK]: ["carbon", "silicates", "iron"],
  [RockyType.METALLIC]: ["iron", "nickel"],
  [RockyType.ICE_DUST]: ["water ice", "dust"],
  [RockyType.DUST]: ["silicate dust", "carbon dust"],
};

export const ATMOSPHERE_COMPOSITION: Record<AtmosphereType, string[][]> = {
  [AtmosphereType.NONE]: [],
  [AtmosphereType.THIN]: [
    ["N2", "Ar"],
    ["CO2", "Ar"],
    ["CH4", "N2"],
  ],
  [AtmosphereType.NORMAL]: [
    ["N2", "O2"],
    ["N2", "O2", "Ar"],
    ["CO2", "N2"],
  ],
  [AtmosphereType.DENSE]: [
    ["CO2", "N2"],
    ["SO2", "CO2"],
    ["N2", "CH4"],
  ],
  [AtmosphereType.VERY_DENSE]: [["CO2", "SO2"], ["N2"], ["H2S", "CO2"]],
};

export const ATMOSPHERE_DENSITY_RANGES: Record<
  AtmosphereType,
  { min: number; max: number }
> = {
  [AtmosphereType.NONE]: { min: 0, max: 0 },
  [AtmosphereType.THIN]: { min: 0.1, max: 0.4 },
  [AtmosphereType.NORMAL]: { min: 0.4, max: 0.8 },
  [AtmosphereType.DENSE]: { min: 0.8, max: 1.2 },
  [AtmosphereType.VERY_DENSE]: { min: 1.2, max: 1.6 },
};

export const ATMOSPHERE_COLORS: Record<AtmosphereType, string[]> = {
  [AtmosphereType.NONE]: [],
  [AtmosphereType.THIN]: ["#add8e6", "#b0e0e6", "#afeeee"],
  [AtmosphereType.NORMAL]: ["#87ceeb", "#add8e6", "#b0c4de"],
  [AtmosphereType.DENSE]: ["#f0e68c", "#ffe4b5", "#fff8dc"],
  [AtmosphereType.VERY_DENSE]: ["#d2b48c", "#bc8f8f", "#cd853f"],
};

export const RING_COLORS: Record<RockyType, string[]> = {
  [RockyType.ICE]: ["#e0f0ff", "#f0f8ff"],
  [RockyType.LIGHT_ROCK]: ["#b8b8b8", "#a8a8a8"],
  [RockyType.DARK_ROCK]: ["#787878", "#686868"],
  [RockyType.METALLIC]: ["#c0c0c0", "#d8d8d8"],
  [RockyType.ICE_DUST]: ["#d0e0f0", "#c8d8e8"],
  [RockyType.DUST]: ["#b0a090", "#a89888"],
};

export const CLOUD_COLORS: Record<string, string[]> = {
  TERRESTRIAL: ["#ffffff", "#f8f8f8", "#f5f5f5"],
  DESERT: ["#ffe0c0", "#f0d0b0", "#e8d0c0"],
  ICE: ["#f0f8ff", "#e0f0ff", "#d8e8f8"],
  LAVA: ["#808080", "#707070", "#606060"],
  ROCKY: ["#d0d0d0", "#c0c0c0", "#b0b0b0"],
  BARREN: ["#c8c8c8", "#b8b8b8", "#a8a8a8"],
  OCEAN: ["#ffffff", "#f0f0f0", "#e0e0e0"],

  CLASS_I: ["#f0f0f0", "#e8e8e8", "#e0e0e0"],
  CLASS_II: ["#f8f8f8", "#f0f0f0", "#e8e8e8"],
  CLASS_III: ["#d0e0f0", "#c0d0e0", "#b0c0d0"],
  CLASS_IV: ["#f0d0c0", "#e0c0b0", "#d0b0a0"],
  CLASS_V: ["#d0c0b0", "#c0b0a0", "#b0a090"],
};
