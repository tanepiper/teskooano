export const template = document.createElement("template");
template.innerHTML = `
<style>
  :host {
    display: block;
    padding: 16px;
    font-family: var(--font-family-sans, sans-serif);
    background-color: var(--background-color-default, #282c34);
    color: var(--text-color-default, #abb2bf);
    height: 100%;
    box-sizing: border-box;
    overflow-y: auto;
    fill: var(--color-text-primary);
  }
  .plugin-manager-container {
    max-width: 800px;
    margin: 0 auto;
  }
  h2 {
    color: var(--text-color-headings, #61afef);
    border-bottom: 1px solid var(--border-color-default, #3f444f);
    padding-bottom: 8px;
  }
  ul {
    list-style-type: none;
    padding: 0;
  }
  li {
    background-color: var(--background-color-light, #32363e);
    border: 1px solid var(--border-color-default, #3f444f);
    padding: 10px;
    margin-bottom: 8px;
    border-radius: 4px;
  }
  .plugin-id {
    font-weight: bold;
    color: var(--text-color-accent, #c678dd);
  }
  .plugin-name {
    font-style: italic;
    color: var(--text-color-subtle, #98c379);
  }
  .plugin-version {
    font-size: 0.9em;
    color: var(--text-color-secondary, #56b6c2);
  }
  .plugin-description {
    font-size: 0.9em;
    margin-top: 4px;
  }
  .no-plugins {
    padding: 10px;
    text-align: center;
    color: var(--text-color-warning, #e5c07b);
  }
</style>
<div class="plugin-manager-container">
  <h2>Teskooano Plugins</h2>
  <div class="plugin-manager-description">
    <p>This is a list of all the plugins that are currently loaded in the application.</p>
  </div>
  <div id="plugin-list-container">
    <p class="no-plugins">Loading plugins...</p>
  </div>
</div>
`;
