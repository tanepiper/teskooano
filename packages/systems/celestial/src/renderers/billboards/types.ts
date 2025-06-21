import type { RenderableCelestialObject } from "@teskooano/data-types";
import { Color, PointLight, Sprite } from "three";

export interface BillboardInfo {
  sprite: Sprite;
  activationDistance: number;
  maxFadeDistance: number; // Distance at which opacity reaches its minimum
  object: RenderableCelestialObject;
}

export interface BillboardLODConfig {
  distance: number;
  size: number;
  color: Color;
  albedo?: number;
  light?: PointLight;
}
