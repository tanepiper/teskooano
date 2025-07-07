import { CelestialObject } from "@teskooano/data-types";
import { generateIconConfig } from "../../../celestial-icons/service/config-generator.js";

/**
 * Renders the main body (title and subtitle) of a celestial info component.
 * This is used by the BaseCelestialInfoComponent and is shared across all celestial types.
 */
export function renderMainBody(
  title: string,
  subtitle: string,
  celestial: CelestialObject,
): string {
  // Generate icon configuration for this celestial object
  const iconConfig = generateIconConfig(celestial);
  const iconConfigJson = JSON.stringify(iconConfig);

  return `
    <div class="celestial-header">
        <div class="icon-container">
            <celestial-icon config='${iconConfigJson}'></celestial-icon>
        </div>
        <div class="header-content">
            <h2 class="celestial-title">${title}</h2>
            <p class="celestial-subtitle">${subtitle}</p>
            <div class="celestial-id">ID: ${celestial.id}</div>
        </div>
        <div class="header-accent"></div>
    </div>`;
}

/**
 * Utility function to render a generic card (deprecated - cards now handle their own rendering).
 * @deprecated Use individual card components instead
 */
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
