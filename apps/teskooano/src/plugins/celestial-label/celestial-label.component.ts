import { celestialLabelTemplate } from "./celestial-label.template";
import type { ICelestialLabelComponent } from "@teskooano/data-types";
import type { RendererCelestialObject } from "@teskooano/renderer-threejs-core";
import { CelestialType, SCALE } from "@teskooano/data-types";
import * as THREE from "three"; // For Camera type in shouldBeVisible

// The component can still define its own mode logic internally if needed.
export type InternalCelestialLabelMode = "full" | "minimal";
const MINIMAL_MODE_DISTANCE_THRESHOLD_AU = 2.0;

// Visibility thresholds (in AU)
const OTHER_STAR_VISIBILITY_THRESHOLD_AU = 500.0;
const PLANET_VISIBILITY_THRESHOLD_AU = 500.0; // For Planets, Dwarf Planets, Gas Giants
const MOON_CLOSE_VISIBILITY_THRESHOLD_AU = 2.0;
// No specific threshold for main star as it's always visible if 3D obj is visible
const DEFAULT_VISIBILITY_THRESHOLD_AU = 10.0; // Fallback for other types like comets, asteroids if they get labels

export class CelestialLabelComponent
  extends HTMLElement
  implements ICelestialLabelComponent
{
  private nameElement: HTMLElement | null = null;
  private typeElement: HTMLElement | null = null;
  private distanceElement: HTMLElement | null = null; // If you want to show distance
  private currentInternalMode: InternalCelestialLabelMode = "full";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    if (this.shadowRoot) {
      this.shadowRoot.appendChild(
        celestialLabelTemplate.content.cloneNode(true),
      );
      this.nameElement = this.shadowRoot.querySelector(".celestial-label-name");
      this.typeElement = this.shadowRoot.querySelector(".celestial-label-type");
      this.distanceElement = this.shadowRoot.querySelector(
        ".celestial-label-distance",
      );
      // Initialize to hidden, setVisibility will be called by the factory/manager
      this.setVisibility(false);
    }
  }

  // Corrected updateData signature
  public updateData(
    data: Partial<RendererCelestialObject> & {
      objectType?: CelestialType;
      parentName?: string;
      parentType?: CelestialType;
      distanceToCameraAU?: number;
      [key: string]: any;
    },
  ): void {
    if (this.nameElement) {
      this.nameElement.textContent = data.name || "Unknown";
    }

    // Determine mode based on distance AND object type
    if (data.objectType === CelestialType.MOON) {
      this.currentInternalMode = "minimal";
    } else if (
      data.distanceToCameraAU !== undefined &&
      data.distanceToCameraAU !== null
    ) {
      this.currentInternalMode =
        data.distanceToCameraAU > MINIMAL_MODE_DISTANCE_THRESHOLD_AU
          ? "minimal"
          : "full";
    } else {
      this.currentInternalMode = "full"; // Default to full if distance is unknown for non-moons
    }

    if (this.distanceElement) {
      if (
        data.distanceToCameraAU !== undefined &&
        data.distanceToCameraAU !== null
      ) {
        this.distanceElement.textContent = `${data.distanceToCameraAU.toFixed(2)} AU`;
        this.distanceElement.style.display = "";
      } else {
        this.distanceElement.textContent = "Dist: N/A";
        this.distanceElement.style.display = "";
      }
    }

    if (this.currentInternalMode === "full") {
      this.classList.remove("minimal-mode");
      if (this.typeElement) {
        this.typeElement.textContent = `Type: ${data.objectType || "N/A"}`;
        this.typeElement.style.display = "";
      }
      if (this.nameElement) {
        this.nameElement.style.marginBottom = "var(--scientific-padding-small)";
      }
      if (this.distanceElement) {
        // Ensure distance is visible in full mode too
        this.distanceElement.style.display = "";
      }
    } else {
      // Minimal mode
      this.classList.add("minimal-mode");
      if (this.typeElement) {
        this.typeElement.style.display = "none"; // Type is hidden in minimal mode
      }
      if (this.nameElement) {
        // Name is followed by distance, so it needs its bottom margin, or adjust if distance also hides
        this.nameElement.style.marginBottom = "var(--scientific-padding-small)";
      }
      if (this.distanceElement) {
        // Distance is shown in minimal mode per original logic
        this.distanceElement.style.display = "";
      }
    }
  }

  public setVisibility(visible: boolean): void {
    if (visible) {
      this.classList.remove("celestial-label-hidden");
      this.style.opacity = "1";
      this.style.transform = "scale(1)";

      this.style.width = "";
      this.style.height = "";
      this.style.overflow = "";
      this.style.zIndex = "";

      if (this.shadowRoot) {
        const content = this.shadowRoot.querySelector(
          ".celestial-label-content",
        );
        if (content instanceof HTMLElement) {
          content.style.visibility = "visible";
          content.style.opacity = "1";
        }
      }
    } else {
      this.classList.add("celestial-label-hidden");
      this.style.opacity = "0";
      this.style.transform = "scale(0)";

      if (this.shadowRoot) {
        const content = this.shadowRoot.querySelector(
          ".celestial-label-content",
        );
        if (content instanceof HTMLElement) {
          content.style.visibility = "hidden";
          content.style.opacity = "0";
        }
      }
    }
    this.style.pointerEvents = "none";
  }

  public shouldBeVisible(
    objectData: RendererCelestialObject,
    camera: THREE.Camera,
    visualObject: THREE.Object3D,
    parentData?: RendererCelestialObject, // Corrected type
  ): boolean {
    if (!visualObject.visible) {
      // console.log(`[CelestialLabelComponent] ${objectData.name} hidden: visualObject not visible`);
      return false;
    }

    const objectWorldPosition = visualObject.getWorldPosition(
      new THREE.Vector3(),
    );
    const distanceToCameraSceneUnits =
      camera.position.distanceTo(objectWorldPosition);
    const distanceToCameraAU =
      distanceToCameraSceneUnits / SCALE.RENDER_SCALE_AU;

    let isVisible = false;
    const objectType = objectData.type;
    const parentType = parentData?.type; // Get parentType from parentData

    switch (objectType) {
      case CelestialType.STAR:
        if (!objectData.parentId || objectData.id === "star-0") {
          isVisible = true;
        } else {
          isVisible = distanceToCameraAU < OTHER_STAR_VISIBILITY_THRESHOLD_AU;
        }
        break;
      case CelestialType.PLANET:
      case CelestialType.DWARF_PLANET:
      case CelestialType.GAS_GIANT:
        isVisible = distanceToCameraAU < PLANET_VISIBILITY_THRESHOLD_AU;
        break;
      case CelestialType.MOON:
        const isCloseEnough =
          distanceToCameraAU < MOON_CLOSE_VISIBILITY_THRESHOLD_AU;
        const isOrbitingStar = parentType === CelestialType.STAR;
        isVisible = isCloseEnough || isOrbitingStar;
        break;
      default:
        isVisible = distanceToCameraAU < DEFAULT_VISIBILITY_THRESHOLD_AU;
        break;
    }

    return isVisible;
  }
}
