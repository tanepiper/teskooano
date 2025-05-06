import { TextureProgressEventDetail } from "./types";
import { CustomEvents } from "@teskooano/data-types";

export function dispatchTextureProgress(current: number, total: number): void {
  const detail = { current, total, progress: current / total };
  document.dispatchEvent(
    new CustomEvent(CustomEvents.TEXTURE_PROGRESS, { detail }),
  );
}

export function dispatchTextureGenerationComplete(): void {
  document.dispatchEvent(
    new CustomEvent(CustomEvents.TEXTURE_GENERATION_COMPLETE, {
      bubbles: true,
      composed: true,
    }),
  );
}
