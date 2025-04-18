import { PlanetType, AtmosphereType, RockyType } from "@teskooano/data-types";

// --- Physical Constants ---
export const AU_TO_METERS = 1.496e11;
export const EARTH_MASS_KG = 5.972e24;
export const EARTH_RADIUS_M = 6.371e6;
export const SOLAR_MASS_KG = 1.989e30;
export const SOLAR_RADIUS_M = 696340e3;
export const SOLAR_LUMINOSITY = 3.828e26; // Watts
export const STEFAN_BOLTZMANN = 5.670374e-8; // W⋅m−2⋅K−4

// --- Composition Data ---
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

// --- Atmosphere Visual Properties ---
export const ATMOSPHERE_DENSITY_RANGES: Record<
  AtmosphereType,
  { min: number; max: number }
> = {
  [AtmosphereType.NONE]: { min: 0, max: 0 },
  [AtmosphereType.THIN]: { min: 0.1, max: 0.4 }, // Subtle glow (Adjusted)
  [AtmosphereType.NORMAL]: { min: 0.4, max: 0.8 }, // Earth-like glow (Adjusted)
  [AtmosphereType.DENSE]: { min: 0.8, max: 1.2 }, // Noticeable haze (Adjusted)
  [AtmosphereType.VERY_DENSE]: { min: 1.2, max: 1.6 }, // Thick, prominent haze (Adjusted)
};

// --- Color Palettes ---
export const ROCKY_SURFACE_COLORS: Record<PlanetType, string[]> = {
  [PlanetType.ROCKY]: ["#8a8a8a", "#9a8e8e", "#7a7a7a"],
  [PlanetType.TERRESTRIAL]: ["#5f7a5f", "#6b8e6b", "#8fbc8f"],
  [PlanetType.DESERT]: ["#c19a6b", "#d2b48c", "#f4a460"],
  [PlanetType.LAVA]: ["#5a1d0f", "#a0301a", "#ff4500"],
  [PlanetType.ICE]: ["#e0f0ff", "#d0e0f0", "#f0f8ff"],
  [PlanetType.BARREN]: ["#708090", "#778899", "#a9a9a9"],
  [PlanetType.OCEAN]: ["#4682b4", "#5f9ea0", "#add8e6"],
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

// --- Procedural Texture Colors ---

export const ROCKY_COLOR_BANDS = {
  dark: ["#444038", "#484040", "#384044"],
  midDark: ["#5C5850", "#605858", "#585860"],
  midLight: ["#7C7870", "#807878", "#787880"],
  light: ["#9C9890", "#A09898", "#9898A0"],
  highlight: ["#BCA0A0", "#C0B8B0", "#B8B8C0"],
};

export const DESERT_COLORS = {
  dunes: ["#c19a6b", "#d2b48c", "#e0c8a0"],
  rocks: ["#a0522d", "#8b4513", "#7a3e1a"],
};

export const LAVA_COLORS = {
  rock: ["#282828", "#302828", "#282830"],
  lava: ["#ff4500", "#ff6347", "#ff2000"],
  emission: ["#ff8c00", "#ffa500", "#ff7000"],
};

export const ICE_COLORS = {
  main: ["#e0f0ff", "#f0f8ff", "#d8e8f8"],
  crevasse: ["#87ceeb", "#a0d8ef", "#70c0e0"],
};

export const OCEAN_COLORS = {
  deep: ["#1e90ff", "#007acc", "#104e8b"],
  shallow: ["#4682b4", "#5f9ea0", "#87ceeb"],
  land: ["#90ee90", "#3cb371", "#8fbc8f"],
  ice: ["#ffffff", "#f0f8ff", "#e0f0ff"],
};

// Add cloud color constants for different planet and gas giant types

// Cloud colors for different types of planets
export const CLOUD_COLORS: Record<string, string[]> = {
  // Planet types
  TERRESTRIAL: ["#ffffff", "#f8f8f8", "#f5f5f5"], // White fluffy clouds for Earth-like
  DESERT: ["#ffe0c0", "#f0d0b0", "#e8d0c0"], // Dusty, tan-colored clouds
  ICE: ["#f0f8ff", "#e0f0ff", "#d8e8f8"], // Light blue-white ice clouds
  LAVA: ["#808080", "#707070", "#606060"], // Dark ash clouds for volcanic planets
  ROCKY: ["#d0d0d0", "#c0c0c0", "#b0b0b0"], // Grey rocky dust clouds
  BARREN: ["#c8c8c8", "#b8b8b8", "#a8a8a8"], // Thin grey dust clouds
  OCEAN: ["#ffffff", "#f0f0f0", "#e0e0e0"], // White water vapor clouds

  // Gas giant classes
  CLASS_I: ["#f0f0f0", "#e8e8e8", "#e0e0e0"], // White ammonia clouds (Jupiter-like)
  CLASS_II: ["#f8f8f8", "#f0f0f0", "#e8e8e8"], // Slightly off-white clouds (Saturn-like)
  CLASS_III: ["#d0e0f0", "#c0d0e0", "#b0c0d0"], // Blue-tinted clouds (Uranus/Neptune-like)
  CLASS_IV: ["#f0d0c0", "#e0c0b0", "#d0b0a0"], // Warm-colored clouds for hot gas giants
  CLASS_V: ["#d0c0b0", "#c0b0a0", "#b0a090"], // Silicate clouds for very hot gas giants
};
