import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import {
  CelestialType,
  SCALE,
  StarProperties,
  StellarType,
} from "@teskooano/data-types";
import { CSS2DLayerType } from "./CSS2DLayerType";
import { CelestialLabelComponent, CelestialLabelMode } from "./label-component";

const MAX_LABEL_DISTANCE_AU = 50;
const CLOSE_ZOOM_DISTANCE_THRESHOLD_AU = 0.1;
const VERY_LARGE_BODY_CLOSE_ZOOM_DISTANCE_THRESHOLD_AU = 2;
const MOON_FOCUSED_FULL_DETAIL_THRESHOLD_AU = 0.0002;
const MINIMAL_LABEL_DISTANCE_THRESHOLD_AU = 1.5;
const GENERAL_MAX_LABEL_DISTANCE_AU = 500;

export interface CelestialLabelFactoryContext {
  objectData: RenderableCelestialObject;
  visualObject: THREE.Object3D;
  parentData?: RenderableCelestialObject;
}

export class CSS2DCelestialLabelFactory {
  private camera: THREE.Camera;

  constructor(camera: THREE.Camera) {
    this.camera = camera;
  }

  private calculateDistanceToCameraAU(objectPosition: THREE.Vector3): number {
    const distance = this.camera.position.distanceTo(objectPosition);
    return distance / SCALE.RENDER_SCALE_AU;
  }

  private determineLabelState(
    context: CelestialLabelFactoryContext,
    distanceAU: number,
  ): {
    visible: boolean;
    mode: CelestialLabelMode;
    name: string;
    type: string | null;
    distanceDisplay: number | null;
  } {
    const { objectData, parentData } = context;
    let visible = true;
    let mode: CelestialLabelMode = "full";
    const name = objectData.name;
    let typeName: string | null = objectData.type || "Unknown";
    let distanceDisplay: number | null = distanceAU;

    const veryLargeBody =
      objectData.type === CelestialType.STAR &&
      [
        StellarType.SUPERGIANT,
        StellarType.RED_GIANT,
        StellarType.HYPERGIANT,
        StellarType.SUBGIANT,
        StellarType.BLACK_HOLE,
      ].includes((objectData.properties as StarProperties).stellarType);

    const isMajorBody =
      objectData.type === CelestialType.STAR ||
      objectData.type === CelestialType.PLANET ||
      objectData.type === CelestialType.GAS_GIANT ||
      objectData.type === CelestialType.DWARF_PLANET;

    if (isMajorBody) {
      visible = true;
      const isObjectFocused = objectData.isFocused === true;
      if (isObjectFocused) {
        mode =
          distanceAU <=
          (veryLargeBody
            ? VERY_LARGE_BODY_CLOSE_ZOOM_DISTANCE_THRESHOLD_AU
            : CLOSE_ZOOM_DISTANCE_THRESHOLD_AU)
            ? "full"
            : "minimal";
      } else {
        mode =
          distanceAU <=
          (veryLargeBody
            ? VERY_LARGE_BODY_CLOSE_ZOOM_DISTANCE_THRESHOLD_AU
            : CLOSE_ZOOM_DISTANCE_THRESHOLD_AU)
            ? "full"
            : "minimal";
      }
    } else if (objectData.type === CelestialType.MOON) {
      const isMoonFocused = objectData.isFocused === true;
      const isParentFocused = parentData?.isFocused === true;

      if (isMoonFocused) {
        visible = true;
        mode =
          distanceAU <= MOON_FOCUSED_FULL_DETAIL_THRESHOLD_AU
            ? "full"
            : "minimal";
      } else {
        if (isParentFocused) {
          if (
            distanceAU <=
            (veryLargeBody
              ? VERY_LARGE_BODY_CLOSE_ZOOM_DISTANCE_THRESHOLD_AU
              : CLOSE_ZOOM_DISTANCE_THRESHOLD_AU)
          ) {
            visible = true;
            mode = "full";
          } else if (distanceAU <= MINIMAL_LABEL_DISTANCE_THRESHOLD_AU) {
            visible = true;
            mode = "minimal";
          } else {
            visible = false;
          }
        } else {
          if (distanceAU <= MINIMAL_LABEL_DISTANCE_THRESHOLD_AU) {
            visible = true;
            mode = "minimal";
          } else {
            visible = false;
          }
        }
      }

      if (visible && distanceAU > MAX_LABEL_DISTANCE_AU) {
        visible = false;
      }
    } else {
      if (distanceAU > MAX_LABEL_DISTANCE_AU) {
        visible = false;
      }

      if (visible) {
        const isObjectFocused = objectData.isFocused === true;
        if (isObjectFocused) {
          mode =
            distanceAU <=
            (veryLargeBody
              ? VERY_LARGE_BODY_CLOSE_ZOOM_DISTANCE_THRESHOLD_AU
              : CLOSE_ZOOM_DISTANCE_THRESHOLD_AU)
              ? "full"
              : "minimal";
        } else {
          if (
            distanceAU <=
            (veryLargeBody
              ? VERY_LARGE_BODY_CLOSE_ZOOM_DISTANCE_THRESHOLD_AU
              : CLOSE_ZOOM_DISTANCE_THRESHOLD_AU)
          ) {
            mode = "full";
          } else if (distanceAU <= MINIMAL_LABEL_DISTANCE_THRESHOLD_AU) {
            mode = "minimal";
          } else {
            visible = false;
          }
        }
      }
    }

    const isMainStar =
      objectData.type === CelestialType.STAR && !objectData.parentId;
    if (visible && !isMainStar && distanceAU > GENERAL_MAX_LABEL_DISTANCE_AU) {
      visible = false;
    }

    if (mode === "minimal") {
      typeName = null;
    }

    return { visible, mode, name, type: typeName, distanceDisplay };
  }

  public createCelestialLabel(
    context: CelestialLabelFactoryContext,
  ): CSS2DObject | null {
    const { objectData, visualObject } = context;
    const objectWorldPosition = new THREE.Vector3();
    visualObject.getWorldPosition(objectWorldPosition);
    const distanceAU = this.calculateDistanceToCameraAU(objectWorldPosition);

    const state = this.determineLabelState(context, distanceAU);

    const labelComponent = new CelestialLabelComponent();
    labelComponent.updateData(
      state.name,
      state.type,
      state.distanceDisplay,
      state.mode,
    );
    labelComponent.setVisibility(state.visible);

    const label = new CSS2DObject(labelComponent);
    const visualRadius = objectData.radius || 1;
    const offsetPosition = new THREE.Vector3(0, visualRadius * 1.5, 0);
    label.position.copy(offsetPosition);

    label.visible = state.visible;

    label.userData = {
      layerType: CSS2DLayerType.CELESTIAL_LABELS,
      isCelestialLabel: true,
      celestialObjectId: objectData.celestialObjectId,
      factoryContext: context,
    };

    if (objectData.celestialObjectId) {
      labelComponent.id = `celestial-label-${objectData.celestialObjectId}`;
    }
    return label;
  }

  public updateCelestialLabel(labelObject: CSS2DObject) {
    if (
      !(labelObject.element instanceof CelestialLabelComponent) ||
      !labelObject.userData.factoryContext
    ) {
      return;
    }

    const component = labelObject.element as CelestialLabelComponent;
    const context = labelObject.userData
      .factoryContext as CelestialLabelFactoryContext;
    const { visualObject } = context;

    const objectWorldPosition = new THREE.Vector3();
    visualObject.getWorldPosition(objectWorldPosition);
    const distanceAU = this.calculateDistanceToCameraAU(objectWorldPosition);

    const state = this.determineLabelState(context, distanceAU);

    component.updateData(
      state.name,
      state.type,
      state.distanceDisplay,
      state.mode,
    );
    component.setVisibility(state.visible);
    labelObject.visible = state.visible;
  }
}
