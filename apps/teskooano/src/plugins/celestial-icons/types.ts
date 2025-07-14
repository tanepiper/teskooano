import type { ProceduralSurfaceProperties } from "@teskooano/data-types";

export interface CelestialIconConfig {
  base: {
    type: "star" | "planet" | "satellite";
    color: string;
    gradient?: [string, string];
    radius?: number;
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
  tail?: {
    color: string;
    angle: number; // in degrees
    length: number;
  };
  special?: "pulsar" | "black-hole" | "white-dwarf" | "protostar";
}
