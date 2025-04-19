import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as PopoverAPI from "./popover";

// Mock HTMLElement methods
const mockElement = {
  popover: "auto",
  showPopover: vi.fn(),
  hidePopover: vi.fn(),
  togglePopover: vi.fn(),
} as unknown as HTMLElement;

const mockNonPopoverElement = {
  popover: null,
} as unknown as HTMLElement;

describe("Popover API Utilities", () => {
  let getElementByIdSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    // Mock document.getElementById
    getElementByIdSpy = vi.spyOn(
      document,
      "getElementById",
    ) as unknown as ReturnType<typeof vi.spyOn>;
    // Mock console messages to avoid cluttering test output
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore mocks after each test
    vi.restoreAllMocks();
  });

  // --- isPopoverSupported --- Does not need DOM mocking
  it("isPopoverSupported should return true if API exists", () => {
    // Assuming the test environment (or polyfill) supports it
    expect(PopoverAPI.isPopoverSupported()).toBe(true);
    // TODO: Could add a test case where the prototype is manipulated to test false
  });

  // --- showPopoverById ---
  it("showPopoverById should call showPopover on the element", () => {
    getElementByIdSpy.mockReturnValue(mockElement);
    const result = PopoverAPI.showPopoverById("test-popover");
    expect(getElementByIdSpy).toHaveBeenCalledWith("test-popover");
    expect(mockElement.showPopover).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it("showPopoverById should return false if element not found", () => {
    getElementByIdSpy.mockReturnValue(null);
    const result = PopoverAPI.showPopoverById("not-found");
    expect(mockElement.showPopover).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it("showPopoverById should return false and warn if element is not a popover", () => {
    getElementByIdSpy.mockReturnValue(mockNonPopoverElement);
    const result = PopoverAPI.showPopoverById("non-popover");
    expect(mockElement.showPopover).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      'Element with ID "non-popover" is not a popover element.',
    );
    expect(result).toBe(false);
  });

  it("showPopoverById should return false and log error on exception", () => {
    const error = new Error("Show error");
    mockElement.showPopover = vi.fn().mockImplementation(() => {
      throw error;
    });
    getElementByIdSpy.mockReturnValue(mockElement);
    const result = PopoverAPI.showPopoverById("error-popover");
    expect(mockElement.showPopover).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      'Error showing popover "error-popover":',
      error,
    );
    expect(result).toBe(false);
  });

  // --- hidePopoverById ---
  it("hidePopoverById should call hidePopover on the element", () => {
    getElementByIdSpy.mockReturnValue(mockElement);
    const result = PopoverAPI.hidePopoverById("test-popover");
    expect(getElementByIdSpy).toHaveBeenCalledWith("test-popover");
    expect(mockElement.hidePopover).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it("hidePopoverById should return false if element not found", () => {
    getElementByIdSpy.mockReturnValue(null);
    const result = PopoverAPI.hidePopoverById("not-found");
    expect(mockElement.hidePopover).not.toHaveBeenCalled();
    expect(result).toBe(false);
    expect(console.warn).not.toHaveBeenCalled(); // No warning if not found
  });

  it("hidePopoverById should return false and warn if element is not a popover", () => {
    getElementByIdSpy.mockReturnValue(mockNonPopoverElement);
    const result = PopoverAPI.hidePopoverById("non-popover");
    expect(mockElement.hidePopover).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      'Element with ID "non-popover" is not a popover element.',
    );
    expect(result).toBe(false);
  });

  it("hidePopoverById should return false and log error on exception", () => {
    const error = new Error("Hide error");
    mockElement.hidePopover = vi.fn().mockImplementation(() => {
      throw error;
    });
    getElementByIdSpy.mockReturnValue(mockElement);
    const result = PopoverAPI.hidePopoverById("error-popover");
    expect(mockElement.hidePopover).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      'Error hiding popover "error-popover":',
      error,
    );
    expect(result).toBe(false);
  });

  // --- togglePopoverById ---
  it("togglePopoverById should call togglePopover on the element", () => {
    getElementByIdSpy.mockReturnValue(mockElement);
    const result = PopoverAPI.togglePopoverById("test-popover");
    expect(getElementByIdSpy).toHaveBeenCalledWith("test-popover");
    expect(mockElement.togglePopover).toHaveBeenCalledWith(undefined); // No force param
    expect(mockElement.togglePopover).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it("togglePopoverById should call togglePopover with force parameter", () => {
    getElementByIdSpy.mockReturnValue(mockElement);
    PopoverAPI.togglePopoverById("test-popover", true);
    expect(mockElement.togglePopover).toHaveBeenCalledWith(true);
    PopoverAPI.togglePopoverById("test-popover", false);
    expect(mockElement.togglePopover).toHaveBeenCalledWith(false);
    expect(mockElement.togglePopover).toHaveBeenCalledTimes(2);
  });

  it("togglePopoverById should return false if element not found", () => {
    getElementByIdSpy.mockReturnValue(null);
    const result = PopoverAPI.togglePopoverById("not-found");
    expect(mockElement.togglePopover).not.toHaveBeenCalled();
    expect(result).toBe(false);
    expect(console.warn).not.toHaveBeenCalled(); // No warning if not found
  });

  it("togglePopoverById should return false and warn if element is not a popover", () => {
    getElementByIdSpy.mockReturnValue(mockNonPopoverElement);
    const result = PopoverAPI.togglePopoverById("non-popover");
    expect(mockElement.togglePopover).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      'Element with ID "non-popover" is not a popover element.',
    );
    expect(result).toBe(false);
  });

  it("togglePopoverById should return false and log error on exception", () => {
    const error = new Error("Toggle error");
    mockElement.togglePopover = vi.fn().mockImplementation(() => {
      throw error;
    });
    getElementByIdSpy.mockReturnValue(mockElement);
    const result = PopoverAPI.togglePopoverById("error-popover");
    expect(mockElement.togglePopover).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      'Error toggling popover "error-popover":',
      error,
    );
    expect(result).toBe(false);
  });
});
