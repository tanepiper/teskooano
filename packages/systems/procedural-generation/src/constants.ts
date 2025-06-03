import { AtmosphereType, RockyType } from "@teskooano/data-types";

export const RING_COMPOSITION: Record<RockyType, string[]> = {
  [RockyType.ICE]: ["water ice", "ammonia ice"],
  [RockyType.LIGHT_ROCK]: ["silicates", "carbon"],
  [RockyType.DARK_ROCK]: ["carbon", "silicates", "iron"],
  [RockyType.METALLIC]: ["iron", "nickel"],
  [RockyType.ICE_DUST]: ["water ice", "dust"],
  [RockyType.DUST]: ["silicate dust", "carbon dust"],
};

export const ATMOSPHERE_DENSITY_RANGES: Record<
  AtmosphereType,
  { min: number; max: number }
> = {
  [AtmosphereType.NONE]: { min: 0, max: 0 },
  [AtmosphereType.THIN]: { min: 0.1, max: 0.4 },
  [AtmosphereType.NORMAL]: { min: 0.4, max: 0.8 },
  [AtmosphereType.DENSE]: { min: 0.8, max: 1.2 },
  [AtmosphereType.SUPER_DENSE]: { min: 1.2, max: 1.6 },
  [AtmosphereType.TRACE]: { min: 0, max: 0.1 },
  [AtmosphereType.CRUSHING]: { min: 1.6, max: 2.0 },
};

export const ATMOSPHERE_COLORS: Record<AtmosphereType, string[]> = {
  [AtmosphereType.NONE]: [],
  [AtmosphereType.THIN]: ["#add8e6", "#b0e0e6", "#afeeee"],
  [AtmosphereType.NORMAL]: ["#87ceeb", "#add8e6", "#b0c4de"],
  [AtmosphereType.DENSE]: ["#f0e68c", "#ffe4b5", "#fff8dc"],
  [AtmosphereType.SUPER_DENSE]: ["#d2b48c", "#bc8f8f", "#cd853f"],
  [AtmosphereType.TRACE]: ["#e0f0ff", "#f0f8ff"],
  [AtmosphereType.CRUSHING]: ["#d2b48c", "#bc8f8f", "#cd853f"],
};

export const RING_COLORS: Record<RockyType, string[]> = {
  [RockyType.ICE]: ["#e0f0ff", "#f0f8ff"],
  [RockyType.LIGHT_ROCK]: ["#b8b8b8", "#a8a8a8"],
  [RockyType.DARK_ROCK]: ["#787878", "#686868"],
  [RockyType.METALLIC]: ["#c0c0c0", "#d8d8d8"],
  [RockyType.ICE_DUST]: ["#d0e0f0", "#c8d8e8"],
  [RockyType.DUST]: ["#b0a090", "#a89888"],
};
