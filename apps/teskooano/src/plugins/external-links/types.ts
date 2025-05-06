/**
 * Defines the structure for data representing an external link
 * used by the ExternalLinksComponent.
 */
export interface ExternalLink {
  /** The target URL for the link. */
  url: string;
  /** The accessible label for the link button (used for aria-label). */
  label: string;
  /** An SVG string representing the icon for the button. */
  iconSvg: string;
  /** The main text content for the tooltip associated with the button. Falls back to `label` if not provided. */
  tooltipText?: string;
  /** The title content for the tooltip. Falls back to `label` if not provided. */
  tooltipTitle?: string;
  /** An SVG string for the icon within the tooltip. Falls back to `iconSvg` if not provided. */
  tooltipIconSvg?: string;
}
