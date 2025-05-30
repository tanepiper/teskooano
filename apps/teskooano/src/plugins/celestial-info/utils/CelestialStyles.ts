export const baseStyles = `
:host {
  display: block;
  padding: var(--space-1) var(--space-3); /* Add some horizontal padding */
  font-family: var(--font-family-base);
  font-size: var(--font-size-1);
  color: var(--color-text-primary); /* Use CSS variable for text color */
  background-color: var(--color-surface-2); /* Use CSS variable */
}
h3 {
    margin-top: 0;
    margin-bottom: var(--space-2); /* 8px */
    color: var(--color-text-primary); /* Standard heading color */
    border-bottom: var(--border-width-thin) solid var(--color-border-subtle);
    padding-bottom: var(--space-1); /* 4px */
}
.info-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--space-1) var(--space-3); /* 4px 12px, Adjust spacing */
    align-items: baseline; /* Align text better */
}
.info-grid dt {
    font-weight: bold;
    grid-column: 1;
    color: var(--color-text-secondary); /* Slightly dimmer label */
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
    color: var(--color-text-secondary);
    font-style: italic;
    padding: var(--space-3); /* Added for consistent spacing */
    text-align: center; /* Added for better visual centering */
}
`;
