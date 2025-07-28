import { formatSimulationDate } from "./simulation-controls.utils";

export interface EditableDateInputOptions {
  initialDate: Date;
  onDateChange: (newDate: Date) => void;
  compact?: boolean;
}

export class EditableDateInput {
  private element: HTMLElement;
  private input: HTMLInputElement | null = null;
  private displaySpan: HTMLSpanElement;
  private options: EditableDateInputOptions;
  private currentDate: Date;

  constructor(element: HTMLElement, options: EditableDateInputOptions) {
    this.element = element;
    this.options = options;
    this.currentDate = new Date(options.initialDate);

    this.displaySpan = document.createElement("span");
    this.displaySpan.className = "date-display";
    this.displaySpan.style.cursor = "pointer";
    this.displaySpan.style.userSelect = "none";
    this.displaySpan.title = "Click to edit date";

    this.element.appendChild(this.displaySpan);
    this.updateDisplay();

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.displaySpan.addEventListener("click", () => this.startEditing());
    this.displaySpan.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.startEditing();
      }
    });
  }

  private startEditing(): void {
    if (this.input) return; // Already editing

    // Check if the element is still in the DOM
    if (!this.element.isConnected) {
      console.warn(
        "EditableDateInput: Element no longer in DOM, cannot start editing",
      );
      return;
    }

    // Create input element
    this.input = document.createElement("input");
    this.input.type = "datetime-local";
    this.input.className = "date-input";
    this.input.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: 2px solid var(--color-primary);
      border-radius: 4px;
      padding: 4px 8px;
      font-family: inherit;
      font-size: inherit;
      background: var(--color-background);
      color: var(--color-text);
      z-index: 1000;
    `;

    // Set current value - format for local timezone (include seconds for precision)
    const year = this.currentDate.getFullYear();
    const month = String(this.currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(this.currentDate.getDate()).padStart(2, "0");
    const hours = String(this.currentDate.getHours()).padStart(2, "0");
    const minutes = String(this.currentDate.getMinutes()).padStart(2, "0");
    const seconds = String(this.currentDate.getSeconds()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    this.input.value = dateString;

    // Position the input over the display
    const rect = this.displaySpan.getBoundingClientRect();
    this.input.style.position = "fixed";
    this.input.style.top = `${rect.top}px`;
    this.input.style.left = `${rect.left}px`;
    this.input.style.width = `${rect.width}px`;
    this.input.style.height = `${rect.height}px`;

    // Add to document
    document.body.appendChild(this.input);
    this.input.focus();
    this.input.select();

    // Hide the display
    this.displaySpan.style.visibility = "hidden";

    // Setup input event listeners
    this.input.addEventListener("blur", () => this.finishEditing());
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.finishEditing();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.cancelEditing();
      }
    });
  }

  private finishEditing(): void {
    if (!this.input) return;

    const inputValue = this.input.value;

    // Basic validation - check if the input has a value
    if (!inputValue) {
      console.warn(
        "EditableDateInput: No date value provided, cancelling edit",
      );
      this.cancelEditing();
      return;
    }

    const newDate = new Date(inputValue);

    // Validate the date - check if it's a valid date
    if (isNaN(newDate.getTime())) {
      console.warn("EditableDateInput: Invalid date provided, cancelling edit");
      this.cancelEditing();
      return;
    }

    // Update the date and notify callback
    this.currentDate = newDate;
    this.updateDisplay();

    // Call the callback with the new date
    this.options.onDateChange(newDate);

    // Clean up
    setTimeout(() => this.cleanup(), 0);
  }

  private cancelEditing(): void {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.input && this.input.parentNode) {
      this.input.parentNode.removeChild(this.input);
      this.input = null;
    }
    this.displaySpan.style.visibility = "visible";
  }

  private updateDisplay(): void {
    this.displaySpan.textContent = formatSimulationDate(
      this.currentDate,
      0,
      this.options.compact,
    );
  }

  public setDate(date: Date): void {
    this.currentDate = new Date(date);
    this.updateDisplay();
  }

  public getDate(): Date {
    return new Date(this.currentDate);
  }

  public destroy(): void {
    this.cleanup();
    this.displaySpan.remove();
  }
}
