import { CelestialObject } from "@teskooano/data-types";

/**
 * Renders the main body (title and subtitle) of a celestial info component.
 * This is used by the BaseCelestialInfoComponent and is shared across all celestial types.
 */
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
