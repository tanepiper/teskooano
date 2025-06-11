import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SystemControls } from "./view/system-controls.component";
import type { PluginExecutionContext } from "@teskooano/ui-plugin";

// Mock the core state so we can control it for our tests
vi.mock("@teskooano/core-state", async () => {
  const { BehaviorSubject } = await import("rxjs");
  return {
    celestialObjects$: new BehaviorSubject({}),
    currentSeed$: new BehaviorSubject(""),
    getCelestialObjects: vi.fn().mockReturnValue({}),
    getCurrentSeed: vi.fn().mockReturnValue(""),
    updateSeed: vi.fn(),
  };
});

describe("SystemControls Component", () => {
  let element: SystemControls;
  let mockContext: PluginExecutionContext;

  beforeEach(() => {
    // Create a mock context for the controller
    mockContext = {
      pluginManager: {
        execute: vi.fn(),
      },
    } as unknown as PluginExecutionContext;

    // Create and attach the element
    element = document.createElement(
      "teskooano-system-controls",
    ) as SystemControls;
    document.body.appendChild(element);

    // Manually set the context to initialize the controller
    element.setContext(mockContext);
  });

  afterEach(() => {
    document.body.removeChild(element);
    vi.clearAllMocks();
  });

  it("should create the component and initialize in the empty state", () => {
    expect(element).toBeInstanceOf(SystemControls);
    const emptyState = element.shadowRoot?.querySelector(".state--empty");
    const loadedState = element.shadowRoot?.querySelector(".state--loaded");
    expect(emptyState).not.toBeNull();
    expect(loadedState).not.toBeNull();
    expect((emptyState as HTMLElement).style.display).not.toBe("none");
    expect((loadedState as HTMLElement).style.display).toBe("none");
  });

  it("should have a form for generating a system from a seed", () => {
    const form = element.shadowRoot?.querySelector(".seed-form");
    expect(form).not.toBeNull();
    const input = element.shadowRoot?.querySelector("#seed");
    expect(input).not.toBeNull();
    const submitButton = form?.querySelector('teskooano-button[type="submit"]');
    expect(submitButton).not.toBeNull();
  });

  it("should have buttons for generating random, blank, or imported systems", () => {
    const randomButton = element.shadowRoot?.querySelector(
      'teskooano-button[data-action="random"]',
    );
    const blankButton = element.shadowRoot?.querySelector(
      'teskooano-button[data-action="create-blank"]',
    );
    const importButton = element.shadowRoot?.querySelector(
      'teskooano-button[data-action="import"]',
    );
    expect(randomButton).not.toBeNull();
    expect(blankButton).not.toBeNull();
    expect(importButton).not.toBeNull();
  });

  describe("when a system is loaded", () => {
    beforeEach(async () => {
      const { celestialObjects$, currentSeed$ } = await import(
        "@teskooano/core-state"
      );
      // Simulate loading a system by updating the mock state
      (celestialObjects$ as any).next({
        star1: { id: "star1", name: "Sol" },
        planet1: { id: "planet1", name: "Earth" },
      });
      (currentSeed$ as any).next("test-seed-123");

      // Wait for a tick to allow RxJS streams to update the DOM
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    it("should switch to the loaded state display", () => {
      const emptyState = element.shadowRoot?.querySelector(".state--empty");
      const loadedState = element.shadowRoot?.querySelector(".state--loaded");
      expect((emptyState as HTMLElement).style.display).toBe("none");
      expect((loadedState as HTMLElement).style.display).not.toBe("none");
    });

    it("should display the correct seed and celestial count", () => {
      const seedDisplay = element.shadowRoot?.querySelector(".system-seed");
      const countDisplay =
        element.shadowRoot?.querySelector(".celestial-count");
      expect(seedDisplay?.textContent).toContain("test-seed-123");
      expect(countDisplay?.textContent).toContain("2 Celestials");
    });

    it("should display controls for copy, export, and clear", () => {
      const copyButton = element.shadowRoot?.querySelector(
        'teskooano-button[data-action="copy-seed"]',
      );
      const exportButton = element.shadowRoot?.querySelector(
        'teskooano-button[data-action="export"]',
      );
      const clearButton = element.shadowRoot?.querySelector(
        'teskooano-button[data-action="clear"]',
      );
      expect(copyButton).not.toBeNull();
      expect(exportButton).not.toBeNull();
      expect(clearButton).not.toBeNull();
    });
  });
});
