import type {
  TeskooanoPlugin,
  PanelConfig,
  ToolbarRegistration,
  ComponentConfig,
} from "@teskooano/ui-plugin";
import { CelestialInfo } from "./view/CelestialInfo.view.js";

import InfoIcon from "@fluentui/svg-icons/icons/info_24_regular.svg?raw";
import { AsteroidFieldInfoComponent } from "./bodies/AsteroidFieldInfo.js";
import { GasGiantInfoComponent } from "./bodies/GasGiantInfo.js";
import { GenericCelestialInfoComponent } from "./bodies/GenericCelestialInfo.js";
import { MoonInfoComponent } from "./bodies/MoonInfo.js";
import { OortCloudInfoComponent } from "./bodies/OortCloudInfo.js";
import { PlanetInfoComponent } from "./bodies/PlanetInfo.js";
import { StarInfoComponent } from "./bodies/StarInfo.js";

const panelConfig: PanelConfig = {
  componentName: CelestialInfo.componentName,
  panelClass: CelestialInfo,
  defaultTitle: "Celestial Info",
};

const toolbarRegistration: ToolbarRegistration = {
  target: "engine-toolbar",
  items: [
    {
      id: "celestial-info-button",
      type: "panel",
      title: "Celestial Info",
      iconSvg: InfoIcon,
      componentName: panelConfig.componentName,
      behaviour: "toggle",
      order: 30,
    },
  ],
};

const components: ComponentConfig[] = [
  {
    tagName: CelestialInfo.componentName,
    componentClass: CelestialInfo,
  },
  {
    tagName: "asteroid-field-info",
    componentClass: AsteroidFieldInfoComponent,
  },
  { tagName: "gas-giant-info", componentClass: GasGiantInfoComponent },
  {
    tagName: "generic-celestial-info",
    componentClass: GenericCelestialInfoComponent,
  },
  { tagName: "moon-info", componentClass: MoonInfoComponent },
  { tagName: "oort-cloud-info", componentClass: OortCloudInfoComponent },
  { tagName: "planet-info", componentClass: PlanetInfoComponent },
  { tagName: "star-info", componentClass: StarInfoComponent },
];

/**
 * Plugin definition for the Celestial Info display panel.
 *
 * Registers the CelestialInfo panel and its associated toolbar button
 * for showing detailed information about the currently focused celestial object.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-celestial-info",
  name: "Celestial Info Display",
  description:
    "Provides the celestial information display panel and toolbar button.",
  panels: [panelConfig],
  toolbarRegistrations: [toolbarRegistration],
  functions: [],
  components: components,
  managerClasses: [],
};

export { CelestialInfo };
