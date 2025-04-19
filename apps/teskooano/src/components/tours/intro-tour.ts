import { Config, Driver, PopoverDOM, State } from "driver.js";
import { TourStep } from "./types";
import { ToolbarSeedForm } from "../toolbar/SeedForm";
import { celestialObjectsStore } from "@teskooano/core-state";
import { SCALE, CelestialStatus } from "@teskooano/data-types";
// Base tour steps definition - will be cloned and customized when driving

export function createIntroTour(driverObj: Driver): TourStep[] {
  let hasCelestialObjects = false;

  const BASE_TOUR_STEPS: TourStep[] = [
    {
      id: "app-intro",
      element: "#app-logo",
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
      element: "#app-logo",
      overlayColor: "rgba(0, 0, 0, 0.75)", // Standard overlay
      popover: {
        title: "...on to the tour!",
        description:
          "This tour will guide you through the main features of using the application and hopefully help you get the most out of it!",
        side: "bottom",
        align: "center",
      },
      onNextClick: () => {
        const totalCelestialObjects = Object.values(
          celestialObjectsStore.get(),
        ).length;
        console.log("Total celestial objects:", totalCelestialObjects);
        hasCelestialObjects = totalCelestialObjects > 0;
        driverObj.moveNext();
      },
    },
    {
      id: "engine-view",
      element: ".engine-view",
      overlayColor: "rgba(0, 0, 0, 0.1)", // More transparent for the engine view
      popover: {
        title: "The main simulation view",
        description: `This is the main engine view, ${hasCelestialObjects ? "which you have currently loaded a system in to " : "which may be currently empty as you need to load a system (don't worry, we're coming to that!)"}. This is the main view of the simulation, in this view you can orbit and zoom around the system, and use the focus controls to focus on specific objects.`,
        side: "over",
        align: "center",
      },
      onPopoverRender: (
        popover: PopoverDOM,
        opts: { config: Config; state: State },
      ) => {
        console.log("Popover rendered:", popover);
        console.log("Popover opts:", opts);
        popover.description.innerHTML = `This is the main engine view, ${hasCelestialObjects ? "which you have currently loaded a system in to " : "which may be currently empty as you need to load a system (don't worry, we're coming to that!)"}. This is the main view of the simulation, in this view you can orbit and zoom around the system, and use the focus controls to focus on specific objects.`;
      },
    },
    {
      id: "add-view",
      element: "#add-view-button",
      popover: {
        title: "Adding new multi-view panels",
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
        title: "Simulation Controls",
        description:
          "This toolbar contains the main controls for the simulation. You can add new bodies, adjust the simulation speed, and access settings.  x16 is equivilent to real time, you can go up to x10M but this depends on your CPU and GPU performance.",
        side: "bottom",
        align: "center",
      },
      disableActiveInteraction: true,
    },
    {
      id: "seed-form",
      element: "toolbar-seed-form",
      popover: {
        title: "🌱 Creating a new system with a seed",
        description:
          "Generate new star systems with different seeds. Each seed creates a unique procedurally generated system. Go ahead and try it out, or click next and I'll do it - feel free to change the default seed to see different systems! ",
        side: "bottom",
        align: "center",
      },
      onNextClick: () => {
        console.log("Generating system...");
        const generator = document.querySelector("toolbar-seed-form");
        if (generator) {
          (generator as ToolbarSeedForm).tourGenerate();
        }
        driverObj.moveNext();
      },
    },
    {
      id: "ui-settings",
      element: ".ui-panel",
      popover: {
        title: "The simulation view settings",
        description:
          "This panel controls the engine view panels - each engine is independently rendered from the same simulation data, allowing you to have multiple views of the same system in real time. I'll explain each panel in more detail...",
        side: "left",
        align: "start",
      },
    },
    {
      id: "focus-control",
      element: ".focus-section",
      overlayColor: "rgba(0, 0, 0, 0.3)", // More transparent for interactive controls
      disableActiveInteraction: false, // Allow interaction with the focus control
      popover: {
        title: "Focusing on Celestial Objects",
        description:
          "This is the focus control, it allows you to focus on specific objects in the simulation. You can use the focus controls to focus on specific objects, or use the orbit controls to orbit around the system.  Why not try it out by clicking on a body in the list?",
        side: "left",
        align: "start",
      },
      onNextClick: (engineViewId?: string) => {
        console.log("Engine view ID:", engineViewId);
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
          typeof (focusControl as any).getRandomActiveObjectId === "function"
        ) {
          // Use our improved method to get a valid object
          const [objectId, _] = (focusControl as any).getRandomActiveObjectId();

          if (objectId) {
            console.log(`[Tour] Focusing on object: ${objectId}`);
            (focusControl as any).focusOnObject(objectId);
          } else {
            console.warn("[Tour] No active objects found for focus");
          }
        } else {
          // Fallback to old approach if focus control not found or method unavailable
          const objects = celestialObjectsStore.get();
          // Filter out destroyed objects
          const activeObjects = Object.entries(objects).filter(
            ([_, obj]) =>
              obj.status !== CelestialStatus.DESTROYED &&
              obj.status !== CelestialStatus.ANNIHILATED,
          );

          if (activeObjects.length === 0) {
            console.warn("[Tour] No active objects available for focus");
            driverObj.moveNext();
            return;
          }

          const [randomId, randomObject] =
            activeObjects[Math.floor(Math.random() * activeObjects.length)];

          console.log("[Tour] Random object:", randomObject);

          const focusEvent = new CustomEvent("engine-focus-request", {
            detail: {
              targetPanelId: engineViewId,
              objectId: randomId,
              distance: randomObject.realRadius_m
                ? randomObject.realRadius_m * SCALE.RENDER_SCALE_AU * 1.1
                : undefined,
            },
            bubbles: true,
            composed: true,
          });

          console.log("[Tour] Dispatching focus event...");
          document.dispatchEvent(focusEvent);
        }

        driverObj.moveNext();
      },
    },
    {
      id: "celestial-info",
      element: ".celestial-info-section",
      popover: {
        title: "Viewing Celestial Object Details",
        description:
          "This is the celestial info section, it displays information about the currently focused object.",
        side: "left",
        align: "start",
      },
    },
    {
      id: "renderer-info",
      element: ".renderer-info-section",
      popover: {
        title: "Viewing Renderer & Performance Information",
        description:
          "This is the renderer info section, it displays information about the renderer.",
        side: "left",
        align: "start",
      },
    },
    {
      id: "engine-settings",
      element: ".engine-settings-section",
      popover: {
        title: "Current simulation view settings",
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
        title: "The full simulation view",
        description:
          // Using a placeholder that will be replaced dynamically
          "Now you should see the full system. If you've selected a celestial body, you can see more details about it in the Celestial Info panel.  Feel free to now play around, and try break things! If you do find any bugs please raise an issue on the GitHub repo.",
        side: "over",
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

  return BASE_TOUR_STEPS;
}
