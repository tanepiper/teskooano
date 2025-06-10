/**
 * Helper function to create a 'teskooano-button' element with common configurations.
 * @param id The ID for the button.
 * @param options Configuration options (title, variant, size, iconSvg, tooltip, etc.).
 * @returns The configured button element.
 */
export function createToolbarButton(
  id: string,
  options: {
    title?: string;
    variant?: "icon" | "image" | "text";
    size?: "sm" | "md" | "lg";
    iconSvg?: string;
    imageUrl?: string;
    imageAlt?: string;
    tooltipText?: string;
    tooltipTitle?: string;
    tooltipIconSvg?: string;
    tooltipHorizontalAlign?: "start" | "center" | "end";
    mobileAware?: boolean;
  },
): HTMLElement {
  const buttonElement = document.createElement("teskooano-button");
  buttonElement.id = id;

  if (options.title) buttonElement.title = options.title;
  buttonElement.setAttribute("variant", options.variant ?? "icon");
  buttonElement.setAttribute("size", options.size ?? "sm");

  if (options.iconSvg) {
    buttonElement.innerHTML = `<span slot="icon">${options.iconSvg}</span>`;
  } else if (options.variant === "image" && options.imageUrl) {
    buttonElement.innerHTML = `<span slot="icon"><img src="${options.imageUrl}" alt="${
      options.imageAlt ?? ""
    }" style="width: 45px; height: 45px; object-fit: contain;"></span>`;
  }

  if (options.tooltipText)
    buttonElement.setAttribute("tooltip-text", options.tooltipText);
  if (options.tooltipTitle)
    buttonElement.setAttribute("tooltip-title", options.tooltipTitle);
  if (options.tooltipIconSvg)
    buttonElement.setAttribute("tooltip-icon-svg", options.tooltipIconSvg);
  if (options.tooltipHorizontalAlign)
    buttonElement.setAttribute(
      "tooltip-horizontal-align",
      options.tooltipHorizontalAlign,
    );

  if (!options.tooltipText && options.title) {
    buttonElement.title = options.title;
  }

  if (options.mobileAware) {
    buttonElement.dataset.mobileAware = "true";
  }

  return buttonElement;
}
