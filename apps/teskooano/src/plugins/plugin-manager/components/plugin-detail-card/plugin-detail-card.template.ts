export const template = document.createElement("template");
template.innerHTML = `
<style>
  :host {
    display: block;
    margin-bottom: 12px;
  }
  .plugin-id {
    font-weight: bold;
    color: var(--text-color-accent, #c678dd);
  }
  .plugin-description {
    font-size: 0.9em;
    margin-top: 4px;
    margin-bottom: 12px;
  }
  .plugin-details {
    margin-top: 8px;
    padding-left: 12px;
    border-left: 2px solid var(--border-color-default, #3f444f);
  }
  .plugin-details strong {
    color: var(--text-color-subtle, #98c379);
  }
  .plugin-details ul {
    font-size: 0.9em;
    padding-left: 16px;
    list-style-type: disc;
    margin: 4px 0 0;
  }
  .plugin-details ul li {
    background: none;
    border: none;
    padding: 2px 0;
    margin: 0;
  }
</style>
<teskooano-card variant="fluid">
  <span slot="title"></span>
  <div class="plugin-id" slot="header-actions">
    <!-- ID will be populated here -->
  </div>
  <div class="plugin-description">
    <!-- Description will be populated here -->
  </div>
  <div class="plugin-content-wrapper">
    <!-- Details (functions, panels, etc.) will be populated here -->
  </div>
</teskooano-card>
`;
