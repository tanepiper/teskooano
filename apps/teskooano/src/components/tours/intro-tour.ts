import { TourStep } from "./types";

// Base tour steps definition - will be cloned and customized when driving
export const BASE_TOUR_STEPS: TourStep[] = [
    {
      id: "app-intro",
      element: "#app-logo",
      overlayColor: "rgba(0, 0, 0, 0.75)", // Standard overlay
      popover: {
        title: "Welcome to Teskooano",
        description:
          "Teskooano is an 3D N-Body simulation engine that attempts to simulate real physics, and provide a multi-view experience of the simulation in real time. It also features collision detection and a physics engine to simulate realistic interactions between celestial bodies combined with procedural generation to create unique systems and views.",
        side: "bottom",
        align: "center",
      },
    },
    {
      id: "app-intro-2",
      element: "#app-logo",
      overlayColor: "rgba(0, 0, 0, 0.75)", // Standard overlay
      popover: {
        title: "Welcome to Teskooano",
        description:
          "This tour will guide you through the main features of using the application and hopefully help you get the most out of it!",
        side: "bottom",
        align: "center",
      },
    },
    {
      id: "engine-view",
      element: ".engine-view",
      overlayColor: "rgba(0, 0, 0, 0.1)", // More transparent for the engine view
      popover: {
        title: "Engine View",
        description:
          `This is the main engine view, it is currently empty as you need to load a system (don't worry, we're coming to that!), but here you will see the 3D simulation of the system. In this view you can orbit and zoom around the system, and use the focus controls to focus on specific objects.`,
        side: "bottom",
        align: "center",
      },
    },
    {
      id: "add-view",
      element: "#add-view-button",
      popover: {
        title: "Add View",
        description:
          "Teskooano supports multiple engine views, each with its own UI settings and focus controls providing multiple views of the same simulation in real time. Lets skip this for now and focus on the main features.",
        side: "bottom",
        align: "center",
      },
      disableActiveInteraction: true,
    },
    {
      id: "controls-intro",
      element: "toolbar-simulation-controls",
      popover: {
        title: "Control Panel",
        description:
          "This toolbar contains the main controls for the simulation. You can add new bodies, adjust the simulation speed, and access settings.  x16 is equivilent to real time, you can go up to x10M but this depends on your CPU and GPU performance.",
        side: "bottom",
        align: "start",
      },
      disableActiveInteraction: true,
    },
    {
      id: "seed-form",
      element: "toolbar-seed-form",
      popover: {
        title: "Seed Generator",
        description:
          "Generate new star systems with different seeds. Each seed creates a unique procedurally generated system. Go ahead and try it out, feel free to change the default seed to see different systems!",
        side: "right",
        align: "center",
      },
    },
    {
      id: "ui-settings",
      element: ".ui-panel",
      popover: {
        title: "Engine UI Settings",
        description:
          "This panel controls the engine view panels - each engine is independently rendered from the same simulation data, allowing you to have multiple views of the same system in real time. I'll explain each panel in more detail...",
        side: "right",
        align: "center",
      },
    },
    {
      id: "focus-control",
      element: ".focus-section",
      overlayColor: "rgba(0, 0, 0, 0.3)", // More transparent for interactive controls
      disableActiveInteraction: false, // Allow interaction with the focus control
      popover: {
        title: "Focus Control",
        description:
          "This is the focus control, it allows you to focus on specific objects in the simulation. You can use the focus controls to focus on specific objects, or use the orbit controls to orbit around the system.  Why not try it out by clicking on a body in the list?",
        side: "right",
        align: "center",
      },
    },
    {
      id: "celestial-info",
      element: ".celestial-info-section",
      popover: {
        title: "Celestial Info",
        description:
          "This is the celestial info section, it displays information about the currently focused object.",
        side: "right",
        align: "center",
      },
    },
    {
      id: "renderer-info",
      element: ".renderer-info-section",
      popover: {
        title: "Renderer Info",
        description:
          "This is the renderer info section, it displays information about the renderer.",
        side: "right",
        align: "center",
      },
    },
    {
      id: "engine-settings",
      element: ".engine-settings-section",
      popover: {
        title: "Engine Settings",
        description:
          "This is the engine settings section, it allows you to adjust the engine settings.",
        side: "right",
        align: "center",
      },
    },
    {
      id: "engine-view-final",
      element: ".engine-view",
      overlayColor: "rgba(0, 0, 0, 0)", // Fully transparent for the final view
      popover: {
        title: "Engine View",
        description:
          // Using a placeholder that will be replaced dynamically
          "Now you should see the full system. If you've selected a celestial body, you can see more details about it in the Celestial Info panel.  Feel free to now play around, and try break things! If you do find any bugs please raise an issue on the GitHub repo.",
        side: "bottom",
        align: "center",
      },
    },
    {
      id: "github-reminder",
      element: "#github-button",
      overlayColor: "rgba(0, 0, 0, 0.6)",
      popover: {
        title: "Report Issues & Contribute",
        description:
          "Remember, if you find any bugs or have ideas for improvements, please visit our GitHub repository by clicking this button. Your feedback helps make Teskooano better!",
        side: "bottom",
        align: "center",
      },
    },
  ];