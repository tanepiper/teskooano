import { Sprite } from "three";

export interface BillboardInfo {
  sprite: Sprite;
  activationDistance: number;
  maxFadeDistance: number; // Distance at which opacity reaches its minimum
}
