import { StateAccessor } from "@teskooano/core-state";
import {
  CelestialObject,
  OrbitalParameters,
  RingSystemProperties,
  PhysicsStateReal,
  GRAVITATIONAL_CONSTANT,
} from "@teskooano/data-types";
import { FormatUtils } from "../../utils/formatters";

export function renderMainBody(
  title: string,
  subtitle: string,
  celestial: CelestialObject,
): string {
  return `
    <div class="title-container">
        <celestial-icon object-id="${celestial.id}"></celestial-icon>
        <div class="title-text">
            <h3>${title}</h3>
            <p>${subtitle}</p>
        </div>
    </div>`;
}

export function renderCard(
  title: string,
  content: string,
  extraClasses: string = "",
): string {
  if (!content.trim()) return "";
  return `
    <div class="info-card ${extraClasses}">
      <h4>${title}</h4>
      <dl class="info-grid">
        ${content}
      </dl>
    </div>
  `;
}

export function renderPhysicalCharacteristics(
  celestial: CelestialObject,
): string {
  return `
    ${celestial.realMass_kg ? `<dt>Mass:</dt><dd>${FormatUtils.formatExp(celestial.realMass_kg, 4)} kg</dd>` : ""}
    ${celestial.realRadius_m ? `<dt>Radius:</dt><dd>${FormatUtils.formatDistanceKm(celestial.realRadius_m)}</dd>` : ""}
    ${celestial.temperature ? `<dt>Temp:</dt><dd>${FormatUtils.formatFix(celestial.temperature)} K</dd>` : ""}
  `;
}

export function renderOrbitalParameters(
  orbit: OrbitalParameters | undefined | null,
): string {
  if (!orbit) return "";
  return `
    <dt>Semi-Major:</dt><dd>${FormatUtils.formatDistanceAU(orbit.realSemiMajorAxis_m)}</dd>
    <dt>Eccentricity:</dt><dd>${FormatUtils.formatFix(orbit.eccentricity, 4)}</dd>
    <dt>Inclination:</dt><dd>${FormatUtils.formatDegrees(orbit.inclination)}</dd>
    <dt>Period:</dt><dd>${FormatUtils.formatPeriod(orbit.period_s)}</dd>
  `;
}

export function renderRotationalParameters(
  siderealRotationPeriod_s: number | undefined | null,
): string {
  if (!siderealRotationPeriod_s) return "";
  return `
    <dt>Rotation Period:</dt><dd>${FormatUtils.formatPeriod(siderealRotationPeriod_s)}</dd>
  `;
}

export function renderAlbedo(albedo: number | undefined | null): string {
  if (!albedo) return "";
  return `
    <dt>Albedo:</dt><dd>${FormatUtils.formatFix(albedo, 2)}</dd>
  `;
}

export function renderRingSystem(celestialId: string): string {
  const allObjects = StateAccessor.getCurrentCelestialObjects();
  const ringSystem = Object.values(allObjects).find(
    (obj) => obj.parentId === celestialId && obj.type === "RING_SYSTEM",
  );
  if (!ringSystem) return "";
  const ringSystemProps = ringSystem.properties as RingSystemProperties;
  return `
    <dt>Rings:</dt><dd>Yes (${ringSystemProps?.rings?.length || 0} defined)</dd>
  `;
}

export function renderHierarchy(celestial: CelestialObject): string {
  const allObjects = StateAccessor.getCurrentCelestialObjects();
  const parent = allObjects[celestial.parentId || ""];
  const children = Object.values(allObjects).filter(
    (obj) => obj.parentId === celestial.id,
  );

  let html = "";
  if (parent) {
    html += `<dt>Parent:</dt><dd>${parent.name}</dd>`;
  }
  if (children.length > 0) {
    html += `<dt>Children:</dt><dd>${children
      .map((c) => c.name)
      .join(", ")}</dd>`;
  }
  return html;
}

export function renderGravitationalInfluences(
  celestial: CelestialObject,
): string {
  if (!celestial.physicsStateReal) return "";

  const allObjects = StateAccessor.getCurrentCelestialObjects();
  const influences: { name: string; force: number }[] = [];

  for (const other of Object.values(allObjects)) {
    if (other.id === celestial.id || !other.physicsStateReal) continue;

    const distance = celestial.physicsStateReal.position_m.distanceTo(
      other.physicsStateReal.position_m,
    );
    if (distance === 0) continue;

    const force =
      (GRAVITATIONAL_CONSTANT * (celestial.realMass_kg * other.realMass_kg)) /
      (distance * distance);
    influences.push({ name: other.name, force });
  }

  // Sort by force descending and take the top 5
  const topInfluences = influences
    .sort((a, b) => b.force - a.force)
    .slice(0, 5);

  return topInfluences
    .map(
      (inf) =>
        `<dt>${inf.name}:</dt><dd>${FormatUtils.formatExp(inf.force, 3)} N</dd>`,
    )
    .join("");
}

export function renderLightSources(
  celestial: CelestialObject,
  lightingManager: any,
): string {
  if (!celestial.physicsStateReal || !lightingManager) return "";

  const lightSources = lightingManager.getLightSources();
  if (!lightSources || lightSources.size === 0) return "";

  const sourceInfluences: {
    name: string;
    distance: number;
    intensity: number;
  }[] = [];

  for (const source of lightSources.values()) {
    const distance = celestial.physicsStateReal.position_m.distanceTo(
      source.position,
    );
    sourceInfluences.push({
      name: source.name,
      distance,
      intensity: source.intensity,
    });
  }

  // Sort by distance ascending and take the top 3
  const topSources = sourceInfluences
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

  return topSources
    .map(
      (src) =>
        `<dt>${src.name}:</dt><dd>${FormatUtils.formatDistanceAU(src.distance, 2)} away, ${FormatUtils.formatFix(src.intensity, 2)} intensity</dd>`,
    )
    .join("");
}

export function renderPhysics(
  celestialId: string,
  physics: PhysicsStateReal | undefined | null,
): string {
  if (!physics) return "";

  const speed = Math.sqrt(
    physics.velocity_mps.x ** 2 +
      physics.velocity_mps.y ** 2 +
      physics.velocity_mps.z ** 2,
  );

  return `
    <div id="physics-data-${celestialId}">
        <dt>Position X:</dt><dd>${FormatUtils.formatDistanceAU(physics.position_m.x)}</dd>
        <dt>Position Y:</dt><dd>${FormatUtils.formatDistanceAU(physics.position_m.y)}</dd>
        <dt>Position Z:</dt><dd>${FormatUtils.formatDistanceAU(physics.position_m.z)}</dd>
        <dt>Speed:</dt><dd>${FormatUtils.formatSpeed(speed)}</dd>
    </div>
    `;
}
