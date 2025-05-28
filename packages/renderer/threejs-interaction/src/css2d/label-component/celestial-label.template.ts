export const celestialLabelStyles = `
:host {
  /* Design Tokens (Scientific Theme) */
  --scientific-font-family: Arial, sans-serif;
  --scientific-text-color: #cccccc; /* Light Grey */
  --scientific-background-color: rgba(40, 40, 40, 0.9); /* Dark Grey */
  --scientific-border-color: #666666; /* Medium Grey */
  --scientific-line-color: #c019a7; /* Medium Grey */
  --scientific-accent-color: #ffffff; /* Calm Blue */

  --scientific-font-size-tiny: 0.5em;
  --scientific-font-size-small: 0.6em;
  --scientific-font-size-normal: 0.8em;
  --scientific-font-size-large: 1em;

  --scientific-padding-small: 0.5rem;
  --scientific-padding-medium: 1rem;
  --scientific-border-radius: 1rem;

  /* Styles for the component host itself */
  position: absolute; /* Crucial for CSS2DObject positioning */
  font-family: var(--scientific-font-family);
  color: var(--scientific-text-color);
  pointer-events: none; /* Labels should not intercept mouse events by default */
  display: flex;
  align-items: center; /* Align line and content box */
  opacity: 1;
  white-space: nowrap;
  left: 200px; /* Default position for full mode */
  top: 50px;
}

:host(.minimal-mode) {
  top: -5px;
  left: 95px; /* Adjusted for longer line: 75px line + 8px margin + 2px for visual balance */
}

:host(.minimal-mode) .celestial-label-content {
  padding: var(--scientific-padding-small); /* Smaller padding for minimal mode */
}

:host(.minimal-mode) .celestial-label-type {
  display: none; /* Type is always hidden in minimal mode */
}

/* Distance is now visible in minimal mode, so no specific display:none for it here */
:host(.minimal-mode) .celestial-label-distance {
  font-size: var(--scientific-font-size-small); /* Ensure style consistency if it was hidden */
  margin-bottom: 0; /* No margin if it's the last item */
}

.celestial-label-line {
  width: 50px; /* Default length for full mode (if we decide to show it) */
  height: 1px;
  background-color: var(--scientific-line-color);
  margin-right: var(--scientific-padding-medium); /* Space between line and content */
  display: none; /* Typically hidden in full mode, shown in minimal */
  transform: rotate(-5deg);
  opacity: 0.5;
  box-shadow: 0 0 10px var(--scientific-border-color); 
}

:host(.minimal-mode) .celestial-label-line {
  display: block;
  width: 75px; /* Longer line for minimal mode */
}

.celestial-label-outer-shell {
  position: relative;
  left: -18px;
  border: 1px solid var(--scientific-border-color);
  border-radius: var(--scientific-border-radius);
  box-shadow: 0 0 10px var(--scientific-border-color); 
  background-color: transparent;
  overflow: hidden;
}

.celestial-label-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  background-color: rgba(0, 0, 0, 0.5);
  padding: var(--scientific-padding-medium);
}

:host(.minimal-mode) .celestial-label-content {
  padding-top: 0;
  padding-bottom: 0;
  padding-left: var(--scientific-padding-medium);
  padding-right: var(--scientific-padding-medium);
}

.celestial-label-name {
  font-size: var(--scientific-font-size-small);
  color: var(--scientific-accent-color);
}

.celestial-label-type,
.celestial-label-distance {
  font-size: var(--scientific-font-size-small);
  margin-bottom: var(--scientific-padding-small);
}

:host(.minimal-mode) .celestial-label-type,
:host(.minimal-mode) .celestial-label-distance {
  font-size: var(--scientific-font-size-small);
  margin-bottom: 0;
}

.celestial-label-distance {
  margin-bottom: 0; /* No margin for the last element */
}

.celestial-label-minimal {
  /* background-color: var(--scientific-background-color); */
  display: flex;
  flex-direction: column;
}

:host(.hidden) {
  opacity: 0;
  visibility: hidden;
  transform: scale(0.8); /* Example: shrink when hidden */
}
`;

export const celestialLabelTemplate = document.createElement("template");
celestialLabelTemplate.innerHTML = `
  <style>
    ${celestialLabelStyles}
  </style>
  <div class="celestial-label-line"></div>
  <div class="celestial-label-outer-shell">
    <div class="celestial-label-content">
      <div class="celestial-label-minimal">
        <div class="celestial-label-name"></div>
        <div class="celestial-label-distance"></div>
      </div>
      <div class="celestial-label-full">
        <div class="celestial-label-type"></div>
      </div>
    </div>
  </div>
`;
