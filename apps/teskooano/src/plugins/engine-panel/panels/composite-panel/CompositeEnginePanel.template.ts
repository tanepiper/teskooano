export const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-direction: column; /* Ensure children stack correctly if needed */
      width: 100%;
      height: 100%;
      overflow: hidden;
      position: relative; /* For positioning placeholder */
      background-color: var(--background-color-2, #1e1e1e); /* Default background */
    }

    .engine-container {
      flex-grow: 1;
      width: 100%;
      height: 100%;
      position: relative; /* Children can be absolute to this */
      overflow: hidden;
    }

    .placeholder-wrapper {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      text-align: center;
      padding: 1em;
      box-sizing: border-box;
      background-color: inherit; /* Inherit host background */
      z-index: 10; /* Ensure it's above the engine container if they overlap */
    }

    .placeholder-wrapper.hidden {
      display: none;
    }

    #placeholder-message {
      color: var(--text-color-secondary, #aaa);
      margin: 0 0 1em 0;
    }

    #placeholder-action-area progress {
      width: 100%; /* Make progress bar take full width of its container */
    }

    #placeholder-action-area a {
      display: inline-block;
      padding: 8px 15px;
      background-color: var(--button-primary-background-color, #333);
      color: var(--button-primary-text-color, #fff);
      text-decoration: none;
      border-radius: var(--button-border-radius, 4px);
    }
    #placeholder-action-area a:hover {
      background-color: var(--button-primary-hover-background-color, #555);
    }
  </style>
  <div class="engine-container"></div>
  <div id="engine-placeholder-wrapper" class="placeholder-wrapper">
    <img src="/assets/panel-icon.png" alt="Engine Placeholder Icon" style="max-width: 256px; max-height: 256px; margin-bottom: 1em; opacity: 0.5;" />
    <p id="placeholder-message"></p>
    <div id="placeholder-action-area" style="width: 50%; min-height: 20px;"></div>
  </div>
`;
