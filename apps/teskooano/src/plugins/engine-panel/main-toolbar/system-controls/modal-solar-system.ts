import {
  getCelestialObjects,
  simulationStateService,
} from "@teskooano/core-state";

/**
 * Creates a modal content with Solar System information
 */
export function createSolarSystemModalContent(): HTMLElement {
  const objects = getCelestialObjects();
  const planets = Object.values(objects).filter((obj) => obj.type === "PLANET");
  const moons = Object.values(objects).filter((obj) => obj.type === "MOON");
  const gasGiants = Object.values(objects).filter(
    (obj) => obj.type === "GAS_GIANT",
  );
  const dwarfPlanets = Object.values(objects).filter(
    (obj) => obj.type === "DWARF_PLANET",
  );
  const asteroidFields = Object.values(objects).filter(
    (obj) => obj.type === "ASTEROID_FIELD",
  );
  const totalObjects = Object.values(objects).length;

  const content = document.createElement("div");
  content.style.cssText = `
    font-family: var(--font-family-base, system-ui);
    line-height: 1.5;
    color: var(--color-text-secondary, #ccccdd);
  `;

  content.innerHTML = `
    <div style="margin-bottom: 16px;">
      <h4 style="margin: 0 0 8px 0; color: var(--color-text-primary, #eeeef5); font-size: 18px;">
        🏡 Welcome to our Solar System
      </h4>
      <p style="margin: 0; font-size: 14px; opacity: 0.9;">
        Our home system has been loaded with reasonably accurate astronomical data from NASA and JPL.
      </p>
    </div>

    <div style="background: rgba(255, 0, 0, 0.1); padding: 12px; border-radius: 6px; margin-bottom: 16px;">
      <h5 style="margin: 0 0 8px 0; color: var(--color-text-primary, #eeeef5); font-size: 14px;">
        ⚠️ Development Accuracy Warning
      </h5>
      <p style="margin: 0; font-size: 14px; opacity: 0.9;">
        This is a hand-crafted system, currently used for testing and eventually to have as accurate as possible.
        <br />
        During development you might find moons flying off (don't worry! it's not real), planets not looking correct, and not all features are implemented.
        <br />
        For the best experience, use the "Ideal Physics" mode.
      </p>
    </div>

    <div style="background: var(--color-surface-1, #1e1e2a); padding: 12px; border-radius: 6px; margin-bottom: 16px;">
      <h5 style="margin: 0 0 8px 0; color: var(--color-text-primary, #eeeef5); font-size: 14px;">
        📊 System Summary
      </h5>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
        <div><strong>Total Objects:</strong> ${totalObjects}</div>
        <div><strong>Seed:</strong> SOLARSYSTEM</div>
        <div><strong>Terrestrial Planets:</strong> ${planets.length}</div>
        <div><strong>Gas Giants:</strong> ${gasGiants.length}</div>
        <div><strong>Natural Satellites:</strong> ${moons.length}</div>
        <div><strong>Dwarf Planets:</strong> ${dwarfPlanets.length}</div>
        <div><strong>Asteroid Fields:</strong> ${asteroidFields.length}</div>
        <div><strong>System Type:</strong> G-type Main Sequence</div>
      </div>
    </div>

    <div style="background: var(--color-surface-1, #1e1e2a); padding: 12px; border-radius: 6px; margin-bottom: 16px;">
      <h5 style="margin: 0 0 8px 0; color: var(--color-text-primary, #eeeef5); font-size: 14px;">
        🌟 Central Star: Sun
      </h5>
      <div style="font-size: 13px; line-height: 1.4;">
        <p style="margin: 0 0 6px 0;">
          <strong>Type:</strong> G2V Main Sequence Star<br>
          <strong>Mass:</strong> 1.989 x 10³⁰ kg<br>
          <strong>Temperature:</strong> 5,778 K<br>
          <strong>Age:</strong> ~4.6 billion years
        </p>
      </div>
    </div>

    <div style="background: var(--color-surface-1, #1e1e2a); padding: 12px; border-radius: 6px;">
      <h5 style="margin: 0 0 8px 0; color: var(--color-text-primary, #eeeef5); font-size: 14px;">
        🪐 Notable Features
      </h5>
      <div style="font-size: 13px; line-height: 1.4;">
        <ul style="margin: 0; padding-left: 16px;">
          <li>Earth - The only known planet with life</li>
          <li>Jupiter - Largest planet with 4 major moons</li>
          <li>Saturn - Famous for its prominent ring system</li>
          <li>Main Asteroid Belt - Between Mars and Jupiter</li>
          <li>Accurate orbital mechanics and real astronomical data</li>
        </ul>
      </div>
    </div>

    <div style="margin-top: 16px; font-size: 12px; opacity: 0.7; text-align: center;">
      Data sourced from NASA Planetary Fact Sheet & JPL Horizons
    </div>
  `;

  return content;
}

/**
 * Shows a modal with Solar System information using the modal manager
 */
export async function showSolarSystemModal(): Promise<void> {
  try {
    // Dynamic import to avoid circular dependencies
    const { pluginManager } = await import("@teskooano/ui-plugin");

    // Get the modal manager instance
    const modalManager = pluginManager.getManagerInstance("modal-manager");

    if (!modalManager) {
      console.warn("Modal manager not available, skipping system info modal");
      return;
    }

    // Pause simulation while the user chooses physics mode
    const wasPaused = simulationStateService.getCurrentState().paused;
    if (!wasPaused) {
      simulationStateService.togglePause();
    }

    const result = await modalManager.show({
      title: "Solar System Loaded",
      content: createSolarSystemModalContent(),
      width: 500,
      height: 620,
      confirmText: "Ideal Physics",
      secondaryText: "Accurate Physics",
      closeText: "Close",
      hideSecondaryButton: false,
    });

    // Handle selection – default to Kepler/Ideal
    if (result === "secondary") {
      simulationStateService.setPhysicsEngine("verlet");
    } else {
      // "confirm", "close", or anything else defaults to ideal rails
      simulationStateService.setPhysicsEngine("kepler");
    }

    // Resume simulation if it was running before modal
    if (!wasPaused) {
      simulationStateService.togglePause();
    }

    console.log("Solar System modal result:", result);
  } catch (error) {
    console.warn("Could not show Solar System modal:", error);
    // Don't throw - modal is optional, system loading should still work
  }
}
