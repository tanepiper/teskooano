const template = document.createElement("template");
template.innerHTML = `
  <style>
    /* Styles copied from SettingsPanel.ts */
    .settings-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-lg, 15px);
    }

    .settings-title {
      margin-top: 0;
      margin-bottom: 0;
      color: var(--color-text-secondary, #aaa);
      border-bottom: 1px solid var(--color-border-subtle, #30304a);
      padding-bottom: var(--space-sm, 8px);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs, 4px);
    }

    .form-group label {
      font-weight: bold;
      color: var(--color-text-primary);
    }

    .form-group small {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }

    /* Styles for the standard select */
    select.teskooano-select {
      padding: var(--space-sm, 8px) var(--space-md, 12px);
      background-color: var(--color-background-input, #1e1e30);
      color: var(--color-text-input, #e0e0ff);
      border: 1px solid var(--color-border-input, #30304a);
      border-radius: var(--border-radius-md, 6px);
      font-family: inherit;
      font-size: inherit;
      cursor: pointer;
      appearance: none; /* Remove default arrow */
      background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23e0e0ff%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E'); /* Custom arrow */
      background-repeat: no-repeat;
      background-position: right var(--space-md, 12px) center;
      background-size: 1em;
      padding-right: calc(var(--space-md, 12px) * 2 + 1em); /* Ensure space for arrow */
    }
    select.teskooano-select:focus {
      outline: 2px solid var(--color-focus-ring, #60a5fa);
      outline-offset: 2px;
      border-color: var(--color-focus-ring, #60a5fa);
    }
  </style>

  <form id="settings-form" class="settings-form">
    <h3 class="settings-title">Application Settings</h3>

    <div class="form-group">
      <label for="setting-trail-length">Orbit Trail Length Multiplier</label>
      <teskooano-slider id="setting-trail-length" min="0" max="500" step="1"></teskooano-slider>
      <small>Controls the length of the orbit trail. Higher values mean longer trails.</small>
    </div>

    <div class="form-group">
      <label for="setting-physics-engine">Physics Engine</label>
      <select id="setting-physics-engine" class="teskooano-select">
        <!-- Options populated dynamically -->
      </select>
      <small>Select the physics engine to use for the simulation.</small>
    </div>

    <div class="form-group">
      <label for="setting-performance-profile">Performance Profile</label>
      <select id="setting-performance-profile" class="teskooano-select">
        <!-- Options populated dynamically -->
      </select>
      <small>Adjusts visual quality and performance. Higher settings increase GPU load.</small>
    </div>
  </form>
`;

export { template };
