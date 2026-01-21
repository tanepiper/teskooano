import { AtmosphereType, RockyType } from "@teskooano/data-types";

// System boundary - maximum distance for any celestial object
export const SYSTEM_MAX_DISTANCE_AU = 1000;

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
  [RockyType.ICE]: ["#f0f8ff", "#ffffff", "#e8f4ff"],
  [RockyType.LIGHT_ROCK]: ["#d8d0c8", "#c8c0b8", "#e0d8d0"],
  [RockyType.DARK_ROCK]: ["#a09890", "#908880", "#b0a8a0"],
  [RockyType.METALLIC]: ["#e8e8e8", "#f0f0f0", "#d8d8d8"],
  [RockyType.ICE_DUST]: ["#e8f0f8", "#f0f8ff", "#d8e8f0"],
  [RockyType.DUST]: ["#d8c8b8", "#c8b8a8", "#e0d0c0"],
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
