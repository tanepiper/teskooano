export const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      overflow: hidden;
      position: relative;
      background-color: var(--color-background);
    }

    .engine-container {
      flex-grow: 1;
      width: 100%;
      height: 100%;
      position: relative;
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
      padding: var(--space-4);
      box-sizing: border-box;
      background-color: inherit;
      z-index: 10;
    }

    .placeholder-wrapper.hidden {
      display: none;
    }

    .placeholder-icon {
      max-width: 256px; /* Or calc(var(--space-10) * 4) */
      max-height: 256px; /* Or calc(var(--space-10) * 4) */
      margin-bottom: var(--space-4);
      opacity: var(--opacity-placeholder-icon);
    }

    #placeholder-message {
      color: var(--color-text-secondary);
      margin: 0 0 var(--space-4) 0;
    }

    #placeholder-action-area {
      width: 50%;
      min-height: calc(var(--space-4) + var(--space-1)); /* 20px */
    }

    #placeholder-action-area progress {
      width: 100%;
    }

    #placeholder-action-area a {
      display: inline-block;
      padding: var(--space-2) var(--space-4);
      background-color: var(--color-primary);
      color: var(--color-text-on-primary);
      text-decoration: none;
      border-radius: var(--radius-md);
      font-weight: var(--font-weight-medium); /* Match button style */
      transition: background-color var(--transition-duration-fast) var(--transition-timing-base);
    }
    #placeholder-action-area a:hover {
      background-color: var(--color-primary-hover);
    }
  </style>
  <div class="engine-container"></div>
  <div id="engine-placeholder-wrapper" class="placeholder-wrapper">
    <img src="/assets/panel-icon.png" alt="Engine Placeholder Icon" class="placeholder-icon" />
    <p id="placeholder-message"></p>
    <div id="placeholder-action-area"></div>
  </div>
`;
