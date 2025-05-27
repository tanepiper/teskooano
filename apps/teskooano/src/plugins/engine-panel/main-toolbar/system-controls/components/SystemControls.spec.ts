import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("SystemControls", () => {
  let element: HTMLElement;

  beforeEach(async () => {
    element = document.createElement("teskooano-system-controls");
    document.body.appendChild(element);
  });

  it("should render the empty state by default", () => {
    const shadowRoot = element.shadowRoot;
    expect(shadowRoot).not.toBeNull();
    const emptyState = shadowRoot?.querySelector(".state--empty");
    const loadedState = shadowRoot?.querySelector(".state--loaded");
    expect(emptyState).not.toBeNull();
    expect(loadedState).toBeNull();

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
    element.setAttribute("system-loaded", "");
    element.setAttribute("system-name", "Test System");
    element.setAttribute("celestial-count", "5");

    const shadowRoot = element.shadowRoot;
    expect(shadowRoot).not.toBeNull();
    const emptyState = shadowRoot?.querySelector(".state--empty");
    const loadedState = shadowRoot?.querySelector(".state--loaded");

    expect(emptyState).toBeNull();
    expect(loadedState).not.toBeNull();

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
    form?.dispatchEvent(new Event("submit"));

    expect(eventDetail).toEqual({ seed: "test-seed-123" });
  });

  it("should dispatch system-action event on button click", () => {
    element.setAttribute("system-loaded", "");
    const shadowRoot = element.shadowRoot;
    const exportButton = shadowRoot?.querySelector<HTMLButtonElement>(
      'button[data-action="export"]',
    );
    let eventDetail: any = null;

    const originalConfirm = window.confirm;
    window.confirm = () => true;

    element.addEventListener("system-action", (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    exportButton?.click();

    expect(eventDetail).toEqual({ action: "export" });

    const clearButton = shadowRoot?.querySelector<HTMLButtonElement>(
      'button[data-action="clear"]',
    );
    eventDetail = null;
    clearButton?.click();
    expect(eventDetail).toEqual({ action: "clear" });

    window.confirm = originalConfirm;
  });

  afterEach(() => {
    document.body.removeChild(element);
  });
});
