import { describe, it, expect, beforeEach, afterEach } from "vitest";
// import './SystemControls'; // Import the component to register it

describe("SystemControls", () => {
  let element: HTMLElement;

  beforeEach(async () => {
    // Create and append the element to the DOM for testing
    // This might require jsdom or similar in vitest config if running in Node
    element = document.createElement("teskooano-system-controls");
    document.body.appendChild(element);
    // Wait for component to render if necessary (e.g., if async)
    // await element.updateComplete; // Example for LitElement, adjust as needed
  });

  it("should render the empty state by default", () => {
    const shadowRoot = element.shadowRoot;
    expect(shadowRoot).not.toBeNull();
    const emptyState = shadowRoot?.querySelector(".state--empty");
    const loadedState = shadowRoot?.querySelector(".state--loaded");
    expect(emptyState).not.toBeNull();
    expect(loadedState).toBeNull();
    // Check for specific elements in the empty state
    expect(shadowRoot?.querySelector(".seed-form")).not.toBeNull();
    expect(
      shadowRoot?.querySelector('button[data-action="create-blank"]'),
    ).not.toBeNull();
    expect(
      shadowRoot?.querySelector('button[data-action="random"]'),
    ).not.toBeNull();
    expect(
      shadowRoot?.querySelector('button[data-action="import"]'),
    ).not.toBeNull();
  });

  it("should render the loaded state when system-loaded attribute is set", () => {
    element.setAttribute("system-loaded", ""); // Set the attribute
    element.setAttribute("system-name", "Test System");
    element.setAttribute("celestial-count", "5");

    // Need to trigger attributeChangedCallback or wait for component update cycle
    // For now, just check structure assumes synchronous update (might fail in reality)
    const shadowRoot = element.shadowRoot;
    expect(shadowRoot).not.toBeNull();
    const emptyState = shadowRoot?.querySelector(".state--empty");
    const loadedState = shadowRoot?.querySelector(".state--loaded");

    // Re-query after attribute change simulation
    // Note: Direct attribute setting might not trigger re-render immediately in all frameworks/vanilla setup
    // This test might need refinement based on how updates are handled.
    // For vanilla elements, we manually called render() in attributeChangedCallback, so it should be updated.

    expect(emptyState).toBeNull();
    expect(loadedState).not.toBeNull();

    // Check for specific elements in the loaded state
    expect(shadowRoot?.querySelector(".system-name")?.textContent).toContain(
      "Test System",
    );
    expect(
      shadowRoot?.querySelector(".celestial-count")?.textContent,
    ).toContain("5");
    expect(
      shadowRoot?.querySelector('button[data-action="copy-seed"]'),
    ).not.toBeNull();
    expect(
      shadowRoot?.querySelector('button[data-action="export"]'),
    ).not.toBeNull();
    expect(
      shadowRoot?.querySelector('button[data-action="clear"]'),
    ).not.toBeNull();
  });

  // Add more tests for interactions, event dispatching etc.
  it("should dispatch load-seed event on form submission", () => {
    const shadowRoot = element.shadowRoot;
    const form = shadowRoot?.querySelector(".seed-form");
    const input = shadowRoot?.querySelector<HTMLInputElement>("#seed");
    let eventDetail: any = null;

    element.addEventListener("load-seed", (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    if (input) {
      input.value = "test-seed-123";
    }
    form?.dispatchEvent(new Event("submit")); // Simulate form submission

    expect(eventDetail).toEqual({ seed: "test-seed-123" });
  });

  it("should dispatch system-action event on button click", () => {
    element.setAttribute("system-loaded", ""); // Switch to loaded state to test those buttons
    const shadowRoot = element.shadowRoot;
    const exportButton = shadowRoot?.querySelector<HTMLButtonElement>(
      'button[data-action="export"]',
    );
    let eventDetail: any = null;

    // Mock confirm to automatically accept
    const originalConfirm = window.confirm;
    window.confirm = () => true;

    element.addEventListener("system-action", (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    exportButton?.click();

    expect(eventDetail).toEqual({ action: "export" });

    // Test clear button requires confirmation
    const clearButton = shadowRoot?.querySelector<HTMLButtonElement>(
      'button[data-action="clear"]',
    );
    eventDetail = null; // Reset detail
    clearButton?.click();
    expect(eventDetail).toEqual({ action: "clear" });

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  afterEach(() => {
    // Clean up the element from the DOM
    document.body.removeChild(element);
  });
});
