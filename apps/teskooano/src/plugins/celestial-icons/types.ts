import type { ProceduralSurfaceProperties } from "@teskooano/data-types";

export interface CelestialIconConfig {
  base: {
    type: "star" | "planet";
    color: string;
    gradient?: [string, string];
  };
  rings?: {
    color: string;
    angle: number; // in degrees
  };
  atmosphere?: {
    color: string;
    size: number; // as a percentage of the icon size
  };
  procedural?: ProceduralSurfaceProperties;
}
