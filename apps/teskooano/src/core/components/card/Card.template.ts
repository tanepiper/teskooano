const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      background-color: var(--color-surface, #2a2a3e);
      border: 1px solid var(--color-border, #50506a);
      border-radius: var(--border-radius-md, 5px);
      padding: var(--space-md, 12px);
      margin-bottom: var(--space-md, 12px); /* Add some margin between cards */
      box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)); /* Optional subtle shadow */
    }
    /* Optional: Styles for a header slot if needed later */
    /* ::slotted([slot="header"]) { ... } */

    /* Optional: Styles for a footer slot if needed later */
    /* ::slotted([slot="footer"]) { ... } */

  </style>
  <slot></slot> <!-- Default slot for card content -->
`;

export { template };
