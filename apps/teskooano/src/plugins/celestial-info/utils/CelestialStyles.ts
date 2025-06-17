export const baseStyles = `
:host {
  display: block;
  padding: 1rem;
  font-family: var(--font-family-sans, sans-serif);
  font-size: var(--font-size-sm, 13px);
  color: var(--color-text-primary, #ddd);
  background-color: transparent;
}
.title-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border-subtle, #444);
  padding-bottom: 0.75rem;
}
.title-container celestial-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}
.title-container h3 {
  margin: 0;
  padding: 0;
  border: none;
  font-size: var(--font-size-xl, 22px);
  color: var(--color-text-accent, #66d9ef);
  font-weight: 600;
  letter-spacing: 0.5px;
  flex-grow: 1;
}
.info-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 0.5rem 1rem;
  align-items: center;
}
.info-grid dt {
  font-weight: 500;
  grid-column: 1;
  color: var(--color-text-secondary, #aaa);
  text-align: right;
  white-space: nowrap;
}
.info-grid dd {
  grid-column: 2;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;
  color: var(--color-text-primary, #ddd);
  background-color: var(--color-background-muted, #2c2c3a);
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-md, 4px);
  border: 1px solid var(--color-border-subtle, #444);
}
.placeholder {
  color: var(--color-text-secondary, #aaa);
  font-style: normal;
  text-align: center;
  padding: 2rem 1rem;
  border: 1px dashed var(--color-border-subtle, #555);
  border-radius: var(--border-radius-lg, 6px);
  background-color: var(--color-background-subtle, #252532);
}
`;
