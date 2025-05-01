import { celestialObjectsStore } from "@teskooano/core-state";
import { Config, Driver, PopoverDOM, State } from "driver.js";
import { TourStep } from "../types";
// Base tour steps definition - will be cloned and customized when driving

export function createIntroTour(driverObj: Driver): TourStep[] {
  let hasCelestialObjects = false;

  const BASE_TOUR_STEPS: TourStep[] = [
    {
      id: "app-intro",
      element: "#toolbar-logo",
      overlayColor: "rgba(0, 0, 0, 0.75)", // Standard overlay
      popover: {
        title: "🔭 Welcome to Teskooano",
        description:
          "Teskooano is an 3D N-Body simulation engine that attempts to simulate real physics. It provides a multi-view experience of the simulation in real time. It also features collision detection and a physics engine to simulate realistic interactions between celestial bodies combined with procedural generation to create unique systems and views.",
        side: "bottom",
        align: "center",
      },
    },
    {
      id: "app-intro-2",
      element: "#toolbar-logo",
      overlayColor: "rgba(0, 0, 0, 0.75)", // Standard overlay
      popover: {
        title: "🛫 ...on to the tour!",
        description:
          "This tour will guide you through the main features of using the application and hopefully help you get the most out of it!",
        side: "bottom",
        align: "center",
      },
      onNextClick: () => {
        const totalCelestialObjects = Object.values(
          celestialObjectsStore.get(),
        ).length;
        hasCelestialObjects = totalCelestialObjects > 0;
        driverObj.moveNext();
      },
    },
    {
      id: "engine-view",
      element: ".engine-view",
      overlayColor: "rgba(0, 0, 0, 0.1)", // More transparent for the engine view
      popover: {
        title: "📽️ The Simulation View",
        description: `This is the main engine view, ${hasCelestialObjects ? "which you have currently loaded a system in to " : "which may be currently empty as you need to load a system (don't worry, we're coming to that!)"}. This is the main view of the simulation, in this view you can orbit and zoom around the system, and use the focus controls to focus on specific objects.`,
        side: "over",
        align: "center",
      },
      onPopoverRender: (
        popover: PopoverDOM,
        opts: { config: Config; state: State },
      ) => {
        popover.description.innerHTML = `This is the main engine view, ${hasCelestialObjects ? "which you have currently loaded a system in to " : "which may be currently empty as you need to load a system (don't worry, we're coming to that!)"}. This is the main view of the simulation, in this view you can orbit and zoom around the system, and use the focus controls to focus on specific objects.`;
      },
    },
    {
      id: "add-view",
      element: "#main-toolbar-add-view",
      popover: {
        title: "🖥️ Multi-View Panels",
        description:
          "Teskooano supports multiple engine views, each with its own UI settings and focus controls providing multiple views of the same simulation in real time. Lets skip this for now and focus on the main features.",
        side: "bottom",
        align: "center",
      },
      disableActiveInteraction: true,
    },
    {
      id: "controls-intro",
      element: "#main-toolbar-sim-controls",
      popover: {
        title: "⏯️ Simulation Controls",
        description:
          "This toolbar contains the main controls for the simulation. You can add new bodies, adjust the simulation speed, and access settings.  1x is equivilent to real time, you can go up to x10M but this depends on your CPU and GPU performance.",
        side: "bottom",
        align: "center",
      },
      disableActiveInteraction: true,
    },
    {
      id: "teskooano-system-controls-1",
      element: "teskooano-system-controls",
      popover: {
        title: "🪐 Managing Systems",
        description:
          "You can generate new star systems with different seeds. Each seed creates a unique procedurally generated system. Go ahead and try it out, or click next and I'll do it - feel free to change the default seed to see different systems! ",
        side: "bottom",
        align: "center",
      },
      onNextClick: () => {
        const generator = document.querySelector("teskooano-system-controls");
        if (generator) {
          (generator as any).tourRandomSeed();
        }
        driverObj.moveNext();
      },
    },
    {
      id: "teskooano-system-controls-2",
      element: "teskooano-system-controls",
      popover: {
        title: "🪐 Managing Systems",
        description:
          "You can also import and export systems to JSON files. This allows you to save your systems and load them later, or share them with others.",
        side: "bottom",
        align: "center",
      },
    },
    {
      id: "ui-settings-1",
      element: ".engine-overlay-toolbar-container",
      popover: {
        title: "🌁 View Settings",
        description:
          "This is the Engine Toolbar - it's a pluggable container that panels and functions can register with and display a button in the toolbar.",
        side: "bottom",
        align: "center",
      },
    },
    {
      id: "ui-settings-2",
      element: "#engine-toolbar-toggle-composite_engine_view_1",
      popover: {
        title: "☾ Toggle the Toolbar",
        description:
          "This button toggles the visibility of the UI buttons toolbar. From this toolbar you can access the main controls for the engine view, focus on specific objects, and more!",
        side: "bottom",
        align: "center",
      },
    },

    {
      id: "focus-control",
      element: "#engine-toolbar-button-focus-control-button",
      overlayColor: "rgba(0, 0, 0, 0.3)", // More transparent for interactive controls
      disableActiveInteraction: false, // Allow interaction with the focus control
      popover: {
        title: "🔍 Focusing on Celestials",
        description:
          "This is the focus control, it allows you to focus on specific objects in the simulation. You can use the focus controls to focus on specific objects, or use the orbit controls to orbit around the system.  Why not try it out by clicking on a body in the list?",
        side: "left",
        align: "start",
      },
      onNextClick: (engineViewId?: string) => {
        if (!engineViewId) {
          driverObj.moveNext();
          return;
        }

        // Get the focus control for this engine panel
        const focusControl = document.querySelector(
          `focus-control[engine-view-id="${engineViewId}"]`,
        );

        if (
          focusControl &&
          typeof (focusControl as any).tourFocus === "function"
        ) {
          (focusControl as any).tourFocus();
        }

        driverObj.moveNext();
      },
    },
    {
      id: "celestial-info",
      element: "#engine-toolbar-button-celestial-info-button",
      popover: {
        title: "ℹ️ Celestial Info",
        description:
          "This is the celestial info section, it displays information about the currently focused object.",
        side: "left",
        align: "start",
      },
    },
    {
      id: "renderer-info",
      element: "#engine-toolbar-button-engine-info-button",
      popover: {
        title: "🎨 Renderer & Performance",
        description:
          "This is the renderer info section, it displays information about the renderer.",
        side: "left",
        align: "start",
      },
    },
    {
      id: "engine-settings",
      element: "#engine-toolbar-button-engine_settings",
      popover: {
        title: "⚙️ Engine Settings",
        description:
          "This is the engine settings section, it allows you to adjust the engine settings.",
        side: "left",
        align: "start",
      },
    },
    {
      id: "engine-view-final",
      element: ".engine-view",
      overlayColor: "rgba(0, 0, 0, 0)", // Fully transparent for the final view
      popover: {
        title: "🔭 Viewing Systems",
        description:
          // Using a placeholder that will be replaced dynamically
          "Now you should see the full system. If you've selected a celestial body, you can see more details about it in the Celestial Info panel.  Feel free to now play around, and try break things! If you do find any bugs please raise an issue on the GitHub repo.",
        side: "over",
        align: "center",
      },
    },
  ];

  return BASE_TOUR_STEPS;
}
