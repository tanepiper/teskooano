import { atom } from "nanostores";
import type { CelestialObject } from "@teskooano/data-types";

export * from "./game";
export * from "./game/physics";
export * from "./game/panelState";
export * from "./game/simulation";
export * from "./game/stores";
export * from "./game/factory";
export * from "./game/celestialActions";
export * from "./game/panelRegistry";
export * from "./game/renderableStore";
export type { PhysicsEngineType } from "./game/simulation";
export {
  type PerformanceProfileType,
  simulationActions,
} from "./game/simulation";

export const celestialObjectsStore = atom<Record<string, CelestialObject>>({});
export const currentSeed = atom<string>("");
export const systemNameStore = atom<string | null>(null);
