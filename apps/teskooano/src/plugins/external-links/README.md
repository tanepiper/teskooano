# External Links Plugin (`@teskooano/external-links`)

Provides a custom element (`teskooano-external-links-component`) containing icon buttons that link to predefined external project resources.

## Purpose

To offer easy access to relevant external project links (like code repositories or social media) directly from a designated UI area, typically the main application toolbar.

## Features

- **Custom Element:** Defines `teskooano-external-links-component` which renders a set of link buttons.
- **Toolbar Widget Integration:** Registers the component as a widget (`main-toolbar-external-links`) intended for placement in the `main-toolbar` widget area via the UI Plugin system.
- **Predefined Links:** Currently includes links to:
  - Teskooano GitHub Repository
  - Teskooano Mastodon Profile
- **Tooltip Integration:** Each button includes attributes (`tooltip-text`, `tooltip-title`, `tooltip-icon-svg`) to allow a tooltip system (like a `TooltipManager`) to display relevant information on hover.

## Usage

1.  **Plugin Registration:** Ensure this plugin (`teskooano-external-links`) is included in the application's `pluginConfig` and loaded via the plugin manager (e.g., `loadAndRegisterPlugins`).
2.  **Toolbar Display:** Once registered, the `main-toolbar-external-links` widget configuration directs the UI Plugin system to instantiate the `teskooano-external-links-component` within the element designated as the `main-toolbar`.

## Component Details (`teskooano-external-links-component`)

- Renders a `div` (CSS part: `container`) containing multiple `teskooano-button` elements.
- Each button is configured with:
  - `variant="icon-toolbar"`
  - An `aria-label` for accessibility.
  - An `onclick` handler to open the link in a new tab (`_blank`).
  - Tooltip attributes (see Features).
  - An SVG icon placed in the button's `icon` slot.
- The component structure is defined in `external-links.template.ts` and styled by `external-links.css`.

## Data Structure (`ExternalLink`)

The links are defined internally using the `ExternalLink` interface (`types.ts`):

```typescript
interface ExternalLink {
  url: string; // Target URL
  label: string; // Aria-label for the button
  iconSvg: string; // SVG string for the button icon
  tooltipText?: string; // Optional: Tooltip main text
  tooltipTitle?: string; // Optional: Tooltip title text
  tooltipIconSvg?: string; // Optional: SVG string for tooltip icon
}
```

## Dependencies

- **`@teskooano/ui-plugin`:** Required for the plugin registration mechanism and types (`TeskooanoPlugin`, `ComponentConfig`, `ToolbarWidgetConfig`).
- **`teskooano-button` (Core Component):** Uses the core button component (`apps/teskooano/src/core/components/button`) to render the links.
- **Tooltip System (Implicit):** Relies on an external mechanism (e.g., a `TooltipManager`) to interpret the `tooltip-*` attributes and display tooltips.
