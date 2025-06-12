const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    #uniforms-title {
      margin: 10px;
      font-size: 1.2em;
      font-weight: bold;
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
  <h2 id="uniforms-title"></h2>
  <div class="container">
    <div class="placeholder">Select a celestial object...</div>
  </div>
`;

export { template };
