import { createPanelPlugin } from "@teskooano/ui-plugin";
import { CelestialInfo } from "./view/CelestialInfo.view.js";

import InfoIcon from "@fluentui/svg-icons/icons/info_24_regular.svg?raw";
import { AsteroidFieldInfoComponent } from "./bodies/AsteroidFieldInfo.js";
import { GasGiantInfoComponent } from "./bodies/GasGiantInfo.js";
import { GenericCelestialInfoComponent } from "./bodies/GenericCelestialInfo.js";
import { MoonInfoComponent } from "./bodies/MoonInfo.js";
import { OortCloudInfoComponent } from "./bodies/OortCloudInfo.js";
import { PlanetInfoComponent } from "./bodies/PlanetInfo.js";
import { StarInfoComponent } from "./bodies/StarInfo.js";

const additionalComponents = [
  { tagName: "asteroid-field-info", componentClass: AsteroidFieldInfoComponent },
  { tagName: "gas-giant-info", componentClass: GasGiantInfoComponent },
  { tagName: "generic-celestial-info", componentClass: GenericCelestialInfoComponent },
  { tagName: "moon-info", componentClass: MoonInfoComponent },
  { tagName: "oort-cloud-info", componentClass: OortCloudInfoComponent },
  { tagName: "planet-info", componentClass: PlanetInfoComponent },
  { tagName: "star-info", componentClass: StarInfoComponent },
];

/**
 * Plugin definition for the Celestial Info display panel.
 * ✅ Refactored to use createPanelPlugin factory - reduced from 75 lines to 25 lines
 */
export const plugin = createPanelPlugin({
  id: "teskooano-celestial-info",
  name: "Celestial Info Display",
  description: "Provides the celestial information display panel and toolbar button.",
  componentName: CelestialInfo.componentName,
  panelClass: CelestialInfo,
  defaultTitle: "Celestial Info",
  iconSvg: InfoIcon,
  order: 30,
  additionalComponents,
});

export { CelestialInfo };
