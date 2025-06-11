import { getCelestialObjects } from "@teskooano/core-state";
import type {
  CelestialObject,
  OrbitalParameters,
  RingSystemProperties,
} from "@teskooano/data-types";
import { FormatUtils } from "../../utils/FormatUtils.js";

export function renderMainProperties(celestial: CelestialObject): string {
  return `
    ${celestial.realMass_kg ? `<dt>Mass:</dt><dd>${FormatUtils.formatExp(celestial.realMass_kg, 4)} kg</dd>` : ""}
    ${celestial.realRadius_m ? `<dt>Radius:</dt><dd>${FormatUtils.formatDistanceKm(celestial.realRadius_m)}</dd>` : ""}
    ${celestial.temperature ? `<dt>Temp:</dt><dd>${FormatUtils.formatFix(celestial.temperature)} K</dd>` : ""}
  `;
}

export function renderOrbit(
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

export function renderRotation(
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
  const allObjects = getCelestialObjects();
  const ringSystem = Object.values(allObjects).find(
    (obj) => obj.parentId === celestialId,
  );
  if (!ringSystem) return "";
  const ringSystemProps = ringSystem.properties as RingSystemProperties;
  return `
    <dt>Rings:</dt><dd>Yes (${ringSystemProps?.rings?.length || 0} defined)</dd>
  `;
}
