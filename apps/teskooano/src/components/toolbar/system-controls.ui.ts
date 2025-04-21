import type { CelestialObject } from "@teskooano/data-types";

// Define the shape of the component the UI functions expect to interact with.
// This avoids a direct import cycle and clarifies dependencies.
export interface SystemControlsUIContract {
  shadowRoot: ShadowRoot | null;
  isMobile: () => boolean;
  isGenerating: () => boolean;
}

/**
 * Updates the size and appearance of buttons based on the mobile state.
 * @param component The SystemControls instance.
 */
export function updateButtonSizesUI(component: SystemControlsUIContract): void {
  if (!component.shadowRoot) return;

  const buttons = component.shadowRoot.querySelectorAll<HTMLElement>(
    'teskooano-button[data-action], teskooano-button[type="submit"]',
  );
  const seedForm =
    component.shadowRoot.querySelector<HTMLFormElement>(".seed-form");

  if (!buttons) return;

  const mobile = component.isMobile();
  const size = mobile ? "sm" : "";
  buttons.forEach((button) => {
    if (mobile) {
      button.setAttribute("size", "sm");
    } else {
      if (button.getAttribute("size") === "sm") {
        button.removeAttribute("size");
      }
    }

    // Special handling for seed form submit button text based on mobile
    const submitButton = seedForm?.querySelector<HTMLElement>(
      'teskooano-button[type="submit"]',
    );
    if (!submitButton) return;

    const submitText = submitButton.querySelector('span:not([slot="icon"])');
    if (submitText) {
      (submitText as HTMLElement).style.display = mobile ? "none" : "";
    }
    const submitIcon = submitButton.querySelector('span[slot="icon"]');
    if (submitIcon) {
      (submitIcon as HTMLElement).style.marginRight = mobile ? "0" : "";
    }
  });
}

/**
 * Updates the component's display based on the current system state.
 * Toggles between empty and loaded states, updates displayed info, and loading overlay.
 * Also ensures button sizes are updated.
 * @param component The SystemControls instance.
 * @param objects The current map of celestial objects.
 * @param seed The current system seed.
 */
export function updateDisplayUI(
  component: SystemControlsUIContract,
  objects: Record<string, CelestialObject>,
  seed: string,
): void {
  const objectCount = Object.keys(objects).length;
  const systemLoaded = objectCount > 0;

  if (!component.shadowRoot) return;
  const emptyState =
    component.shadowRoot.querySelector<HTMLElement>(".state--empty");
  const loadedState =
    component.shadowRoot.querySelector<HTMLElement>(".state--loaded");
  const systemSeedEl =
    component.shadowRoot.querySelector<HTMLElement>(".system-seed");
  const celestialCountEl =
    component.shadowRoot.querySelector<HTMLElement>(".celestial-count");
  const loadingOverlay =
    component.shadowRoot.querySelector<HTMLElement>(".loading-overlay");
  const buttons = component.shadowRoot.querySelectorAll<HTMLElement>(
    'teskooano-button[data-action], teskooano-button[type="submit"]',
  );

  // Update visibility based on system state
  if (emptyState && loadedState) {
    emptyState.style.display = systemLoaded ? "none" : "";
    loadedState.style.display = systemLoaded ? "" : "none";
  }

  // Update system info when loaded
  if (systemLoaded) {
    const count = objectCount;
    const currentSystemSeed = seed || "---------";
    if (systemSeedEl) {
      systemSeedEl.textContent = currentSystemSeed;
      systemSeedEl.title = `Seed: ${currentSystemSeed}`;
    }
    if (celestialCountEl) {
      celestialCountEl.textContent = `${count} Celestial${count !== 1 ? "s" : ""}`;
    }
  }

  // Toggle loading overlay
  if (loadingOverlay) {
    loadingOverlay.style.display = component.isGenerating() ? "flex" : "none";
  }

  // Ensure buttons are enabled/disabled correctly based on generating state
  buttons?.forEach((button) => {
    (button as HTMLButtonElement).disabled = component.isGenerating();
  });

  // Ensure button sizes/styles are correct for the current state
  updateButtonSizesUI(component);
}
