const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .placeholder {
      padding: 10px;
      color: var(--ui-text-color-dim, #888);
      font-style: italic;
    }

    .container {
      width: 100%;
      height: 100%;
      overflow: auto;
    }
  </style>
  <div class="container">
    <div class="placeholder">Select a celestial object...</div>
  </div>
`;

export { template };
