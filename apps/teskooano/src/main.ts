import 'dockview-core/dist/styles/dockview.css';
import './styles.css'; // Import our custom styles

import { DockviewController } from './controllers/dockviewController';
import { ToolbarController } from './controllers/toolbarController';
// Import simulation controls component definition
import './components/ui-controls/FocusControl'; // Import the new component
import './components/ui-controls/RendererInfoDisplay'; // Import the new renderer info component
// SimulationInfoDisplay has been migrated to the toolbar
import './components/ui-controls/CelestialInfo'; // Import the new CelestialInfo component
import './components/shared/Button'; // Add this line
import { SettingsPanel } from './components/settings/SettingsPanel';
// Also import ProgressPanel for registration
import { ProgressPanel } from './components/engine/ProgressPanel';

// --- Setup --- //

// Get main elements
const appElement = document.getElementById('app');
const toolbarElement = document.getElementById('toolbar');

if (!appElement || !toolbarElement) {
  throw new Error('Required HTML elements (#app or #toolbar) not found.');
}

// Initialize Controllers
const dockviewController = new DockviewController(appElement);
// TODO Make ToolbarController configurable like the DockviewController
const toolbarController = new ToolbarController(toolbarElement, dockviewController);

// Register dynamically used components
dockviewController.registerComponent('settings_view', SettingsPanel);
dockviewController.registerComponent('progress_view', ProgressPanel);

// --- Set Dockview API for SeedForm & UiPanel --- //
const dockviewApi = dockviewController.api;

// --- Initial Layout --- 

// 1. Add Engine View 
const firstEngineViewId = 'engine_view_0'; // Store the ID
dockviewApi.addPanel({
  id: firstEngineViewId,
  component: 'engine_view',
  title: 'Teskooano 1',
  params: { title: 'Teskooano 1' }
});

// 2. Add Engine UI Panel for the first Engine View (no global panel anymore)
dockviewApi.addPanel({
  id: 'engine_ui_0',
  component: 'ui_view',
  title: 'Engine 0 UI',
  params: {
    engineViewId: firstEngineViewId,
    sections: [
      {
        id: 'focus-section-0',
        title: 'Focus Control',
        componentTag: 'focus-control', 
        startClosed: false,
      },
      {
        id: 'celestial-info-section-0',
        title: 'Selected Object',
        componentTag: 'celestial-info',
        startClosed: false,
      },
      {
        id: 'renderer-info-section-0',
        title: 'Renderer Info',
        componentTag: 'renderer-info-display',
        startClosed: false,
      },
      {
        id: 'engine-settings-section-0',
        title: 'View Settings',
        componentTag: 'engine-ui-settings-panel',
        startClosed: false,
      },
    ]
  },
  position: { referencePanel: firstEngineViewId, direction: 'right' },
  minimumWidth: 250,
  maximumWidth: 400,
});
