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

// Import card components
import { GravitationalForcesCard } from "./cards/GravitationalForcesCard.js";
import { LightSourcesCard } from "./cards/LightSourcesCard.js";
import { PhysicsCard } from "./cards/PhysicsCard.js";
import { HierarchyCard } from "./cards/HierarchyCard.js";
import { OrbitalMechanicsCard } from "./cards/OrbitalMechanicsCard.js";
import { PhysicalPropertiesCard } from "./cards/PhysicalPropertiesCard.js";
import { StarHierarchyCard } from "./cards/StarHierarchyCard.js";
import { StarPhysicalPropertiesCard } from "./cards/StarPhysicalPropertiesCard.js";
import { GasGiantPhysicalPropertiesCard } from "./cards/GasGiantPhysicalPropertiesCard.js";

const additionalComponents = [
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

  // Card components
  {
    tagName: "gravitational-forces-card",
    componentClass: GravitationalForcesCard,
  },
  {
    tagName: "light-sources-card",
    componentClass: LightSourcesCard,
  },
  {
    tagName: "physics-card",
    componentClass: PhysicsCard,
  },
  {
    tagName: "hierarchy-card",
    componentClass: HierarchyCard,
  },
  {
    tagName: "orbital-mechanics-card",
    componentClass: OrbitalMechanicsCard,
  },
  {
    tagName: "physical-properties-card",
    componentClass: PhysicalPropertiesCard,
  },
  {
    tagName: "star-hierarchy-card",
    componentClass: StarHierarchyCard,
  },
  {
    tagName: "star-physical-properties-card",
    componentClass: StarPhysicalPropertiesCard,
  },
  {
    tagName: "gas-giant-physical-properties-card",
    componentClass: GasGiantPhysicalPropertiesCard,
  },
];

/**
 * Plugin definition for the Celestial Info display panel.
 * ✅ Refactored to use createPanelPlugin factory - reduced from 75 lines to 25 lines
 */
export const plugin = createPanelPlugin({
  id: "teskooano-celestial-info",
  name: "Celestial Info Display",
  description:
    "Provides the celestial information display panel and toolbar button.",
  componentName: CelestialInfo.componentName,
  panelClass: CelestialInfo,
  defaultTitle: "Celestial Info",
  iconSvg: InfoIcon,
  order: 35,
  additionalComponents,
  target: "engine-toolbar",
});

export { CelestialInfo };
