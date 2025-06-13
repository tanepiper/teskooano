import { CustomEvents } from "@teskooano/data-types";

export function dispatchTextureGenerationComplete(): void {
  document.dispatchEvent(
    new CustomEvent(CustomEvents.TEXTURE_GENERATION_COMPLETE, {
      bubbles: true,
      composed: true,
    }),
  );
}
