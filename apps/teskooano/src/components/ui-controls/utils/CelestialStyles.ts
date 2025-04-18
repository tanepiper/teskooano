// Base styles shared across all celestial info components
export const baseStyles = `
:host {
  display: block;
  padding: 5px 10px; /* Add some horizontal padding */
  font-family: sans-serif;
  font-size: 12px;
  color: var(--ui-text-color, #ccc); /* Use CSS variable for text color */
  background-color: var(--ui-panel-background, #2a2a2a); /* Use CSS variable */
}
h3 {
    margin-top: 0;
    margin-bottom: 8px;
    color: var(--ui-text-color-strong, #eee);
    border-bottom: 1px solid var(--ui-border-color, #444);
    padding-bottom: 4px;
}
.info-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 10px; /* Adjust spacing */
    align-items: baseline; /* Align text better */
}
.info-grid dt {
    font-weight: bold;
    grid-column: 1;
    color: var(--ui-text-color-medium, #aaa); /* Slightly dimmer label */
    text-align: right;
}
.info-grid dd {
    grid-column: 2;
    margin: 0; /* Reset default dl margins */
    white-space: nowrap; /* Prevent wrapping */
    overflow: hidden;
    text-overflow: ellipsis; /* Add ellipsis if text overflows */
}
.placeholder {
    color: var(--ui-text-color-dim, #888);
    font-style: italic;
}
`; 