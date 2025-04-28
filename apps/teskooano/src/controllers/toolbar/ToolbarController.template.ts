import { PopoverAPI } from "@teskooano/web-apis";
import type { SystemControls } from "../../components/engine/main-toolbar/system-controls/SystemControls"; // Import type only if needed, otherwise just use HTMLElement

/**
 * Helper function to create a popover element.
 * @param id - The ID for the popover.
 * @param textContent - The text content for the popover.
 * @returns The created div element.
 */
const createPopover = (id: string, textContent: string): HTMLDivElement => {
  const popover = document.createElement("div");
  popover.id = id;
  popover.setAttribute("popover", PopoverAPI.PopoverStates.AUTO);
  popover.textContent = textContent;
  popover.classList.add("tooltip-popover");
  return popover;
};

/**
 * Helper function to create a standard toolbar button with an icon and popover.
 * @param id - Base ID for the button and popover.
 * @param popoverText - Text for the popover tooltip.
 * @param iconSvg - SVG string for the button's icon.
 * @param clickHandler - Function to call when the button is clicked.
 * @param parentElement - The element to append the popover to.
 * @returns The created button element.
 */
const createIconButton = (
  id: string,
  popoverText: string,
  iconSvg: string,
  clickHandler: (event: MouseEvent) => void,
  parentElement: HTMLElement, // Needed to append popover
): HTMLElement => {
  const button = document.createElement("teskooano-button");
  button.id = id;

  // Add Icon
  const icon = document.createElement("span");
  icon.slot = "icon";
  icon.innerHTML = iconSvg;
  button.appendChild(icon);

  // Add Popover
  const popoverId = `${id}-popover`;
  const popover = createPopover(popoverId, popoverText);
  parentElement.appendChild(popover); // Append popover to the toolbar/container

  // Link button to popover
  button.setAttribute("popovertarget", popoverId);
  button.setAttribute(
    "popovertargetaction",
    PopoverAPI.PopoverTargetActions.TOGGLE,
  );
  button.setAttribute("aria-describedby", popoverId);

  // Attach click handler
  button.addEventListener("click", clickHandler);

  return button;
};

/**
 * Creates the application icon element.
 * @returns The created img element within an anchor.
 */
const createAppIcon = (): HTMLAnchorElement => {
  const appIcon = document.createElement("img");
  appIcon.src = `${window.location.origin}/assets/icon.png`; // Use origin for robustness
  appIcon.alt = "Teskooano App Icon";
  appIcon.style.height = "100%";
  appIcon.style.width = "auto";
  appIcon.style.verticalAlign = "middle";
  appIcon.className = "app-logo";
  appIcon.id = "app-logo";

  const link = document.createElement("a");
  link.href = window.location.origin;
  link.appendChild(appIcon);
  return link;
};

/**
 * Creates a vertical separator element.
 * @returns The created div element.
 */
const createSeparator = () => {
  const separator = document.createElement("div");
  separator.className = "toolbar-separator";
  return separator;
};

/**
 * Interface defining the handlers needed by the template.
 */
export interface ToolbarTemplateHandlers {
  handleGitHubClick: (event: MouseEvent) => void;
  handleSettingsClick: (event: MouseEvent) => void;
  handleTourClick: (event: MouseEvent) => void;
  handleAddViewClick: (event: MouseEvent) => void;
}

/**
 * Interface defining the data needed by the template.
 */
export interface ToolbarTemplateData {
  isMobile: boolean;
}

/**
 * Renders the toolbar structure and returns the elements.
 *
 * @param toolbarElement - The container element to append popovers and potentially modify.
 * @param handlers - Object containing the click handlers for buttons.
 * @param data - Object containing state data like mobile status.
 * @returns An object containing references to the created toolbar elements.
 */
export const renderToolbarTemplate = (
  toolbarElement: HTMLElement,
  handlers: ToolbarTemplateHandlers,
  data: ToolbarTemplateData,
) => {
  // Clear existing content and setup container
  toolbarElement.innerHTML = "";
  toolbarElement.classList.add("toolbar-cosmic-background");
  toolbarElement.style.padding = "var(--space-sm, 8px)";
  toolbarElement.style.display = "flex";
  toolbarElement.style.alignItems = "center";
  toolbarElement.style.gap = data.isMobile
    ? "var(--space-xs, 4px)"
    : "var(--space-md, 12px)";

  // --- Create Elements ---

  const appIcon = createAppIcon();

  // Button Group 1 (GitHub, Settings, Tour, Add)
  const otherButtonsWrapper = document.createElement("div");
  otherButtonsWrapper.style.display = "flex";
  otherButtonsWrapper.style.alignItems = "center";
  otherButtonsWrapper.style.justifyContent = "space-between"; // Let flex handle spacing if needed
  otherButtonsWrapper.style.gap = "var(--space-xs, 4px)";

  const githubButton = createIconButton(
    "github-button",
    "View Source on GitHub",
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
    </svg>`,
    handlers.handleGitHubClick,
    toolbarElement, // Pass parent for popover
  );

  const settingsButton = createIconButton(
    "settings-button",
    "Application Settings",
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/>
        <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zM8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1"/>
    </svg>`,
    handlers.handleSettingsClick,
    toolbarElement, // Pass parent for popover
  );

  let tourButton: HTMLElement | null = null;
  tourButton = document.createElement("teskooano-button");
  tourButton.id = "tour-button";
  const helpIcon = document.createElement("span");
  helpIcon.slot = "icon";
  helpIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
      <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94"/>
  </svg>`;
  tourButton.appendChild(helpIcon);
  const textSpanTour = document.createElement("span");
  textSpanTour.textContent = "Take Tour";
  tourButton.appendChild(textSpanTour);
  const tourPopoverId = "tour-popover";
  const tourPopover = createPopover(
    tourPopoverId,
    "Take a tour of the application",
  );
  toolbarElement.appendChild(tourPopover);
  tourButton.setAttribute("popovertarget", tourPopoverId);
  tourButton.setAttribute(
    "popovertargetaction",
    PopoverAPI.PopoverTargetActions.TOGGLE,
  );
  tourButton.setAttribute("aria-describedby", tourPopoverId);
  if (data.isMobile) {
    tourButton.toggleAttribute("mobile", true);
  }
  tourButton.addEventListener("click", handlers.handleTourClick);

  const addButton = document.createElement("teskooano-button");
  addButton.id = "add-view-button";
  addButton.textContent = "+ Add View";
  addButton.setAttribute("title", "Add a new engine view");
  addButton.setAttribute("aria-label", "Add new engine view");
  addButton.addEventListener("click", handlers.handleAddViewClick);
  if (data.isMobile) {
    addButton.toggleAttribute("mobile", true);
  }

  // Simulation Controls
  const simControls = document.createElement("toolbar-simulation-controls");
  simControls.id = "simulation-controls";
  if (data.isMobile) {
    simControls.toggleAttribute("mobile", true);
  }

  // --- ADDED BACK: System Controls ---
  const systemControls = document.createElement(
    "system-controls",
  ) as SystemControls;
  systemControls.id = "system-controls";
  if (data.isMobile) {
    systemControls.toggleAttribute("mobile", true);
  }
  // --- END ADDED BACK ---

  // --- Assemble Toolbar ---
  toolbarElement.appendChild(appIcon);

  otherButtonsWrapper.appendChild(githubButton);
  otherButtonsWrapper.appendChild(settingsButton);
  if (tourButton) {
    otherButtonsWrapper.appendChild(tourButton);
  }
  otherButtonsWrapper.appendChild(addButton);
  toolbarElement.appendChild(otherButtonsWrapper);

  toolbarElement.appendChild(createSeparator());
  toolbarElement.appendChild(simControls);
  toolbarElement.appendChild(createSeparator()); // ADDED BACK Separator

  // --- ADDED BACK: Appending System Controls Wrapper ---
  const systemControlsWrapper = document.createElement("div");
  systemControlsWrapper.style.display = "flex";
  systemControlsWrapper.style.alignItems = "center";
  systemControlsWrapper.appendChild(systemControls);
  toolbarElement.appendChild(systemControlsWrapper);
  // --- END ADDED BACK ---

  // Return references including systemControls
  return {
    githubButton,
    settingsButton,
    tourButton, // Can be null
    addButton,
    simControls,
    systemControls, // ADDED BACK
  };
};
