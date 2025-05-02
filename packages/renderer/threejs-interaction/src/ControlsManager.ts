import { OSVector3 } from "@teskooano/core-math";
import { CustomEvents } from "@teskooano/data-types";
import gsap from "gsap";
import { getSimulationState, setSimulationState } from "@teskooano/core-state";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Manages camera controls (OrbitControls or FlyControls) and user interaction
 * within a Three.js scene. Handles smooth camera transitions between targets,
 * following moving objects, and synchronizing camera state with the global simulation state.
 *
 * @class ControlsManager
 * @param {THREE.PerspectiveCamera} camera - The camera instance to control.
 * @param {HTMLElement} domElement - The DOM element to attach event listeners to.
 */
export class ControlsManager {
  /** The underlying OrbitControls instance. */
  public controls: OrbitControls;
  /** The camera being controlled. */
  private camera: THREE.PerspectiveCamera;
  /** Flag indicating if the camera is currently undergoing a GSAP animation. */
  private isTransitioning: boolean = false;
  /** Factor controlling how much distance affects transition duration (logarithmic scaling). */
  private transitionDistanceFactor: number = 0.5;
  /** Minimum duration for camera transitions in seconds. */
  private minTransitionDuration: number = 1.0;
  /** Maximum duration for camera transitions in seconds. */
  private maxTransitionDuration: number = 4.0;
  /** Stores the active GSAP timeline during transitions to allow cancellation. */
  private activeTimeline: gsap.core.Timeline | null = null;
  /** Reusable temporary vector for calculations to avoid allocations. */
  private tempVector = new THREE.Vector3();
  /** The THREE.Object3D instance the camera is currently following, or null. */
  private followingTargetObject: THREE.Object3D | null = null;
  /** Reusable vector to store the target object's world position. */
  private tempTargetPosition = new THREE.Vector3();
  /** Stores the world position of the followed object from the previous frame for delta calculations. */
  private previousFollowTargetPos = new THREE.Vector3();
  /** Stores the calculated camera offset relative to the target at the end of a transition. (Currently unused in update loop but kept for reference). */
  private finalFollowOffset: THREE.Vector3 | null = null;
  /** Tracks whether debug/fly controls are active. */
  private isDebugModeActive: boolean = false;
  /** Stores the last OrbitControls target before switching to debug mode. */
  private lastOrbitTarget: THREE.Vector3 = new THREE.Vector3();
  /** Clock for FlyControls delta calculation. */
  private clock = new THREE.Clock();

  /**
   * Creates an instance of ControlsManager.
   * @param {THREE.PerspectiveCamera} camera The camera to control.
   * @param {HTMLElement} domElement The HTML element for event listeners (typically the canvas).
   */
  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;

    this.controls = new OrbitControls(camera, domElement);

    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 0.00001;
    this.controls.maxDistance = 5000;
    this.controls.maxPolarAngle = Math.PI;
    this.controls.enableZoom = true;
    this.controls.zoomSpeed = 0.7;
    this.controls.enableRotate = true;
    this.controls.rotateSpeed = 0.5;
    this.controls.enablePan = true;
    this.controls.panSpeed = 1.0;

    this.controls.addEventListener("change", () => {
      if (this.controls.enabled && !this.isTransitioning) {
        const position = camera.position;
        const target = this.controls.target;

        setSimulationState({
          ...getSimulationState(),
          camera: {
            ...getSimulationState().camera,
            position: new OSVector3(position.x, position.y, position.z),
            target: new OSVector3(target.x, target.y, target.z),
          },
        });
      }
    });
  }

  /**
   * Returns whether the camera is currently undergoing an animated transition.
   * @readonly
   * @type {boolean}
   */
  get getIsTransitioning(): boolean {
    return this.isTransitioning;
  }

  /**
   * Updates the camera's target (the point it looks at) with a smooth transition.
   * The camera's position remains unchanged.
   *
   * @param {THREE.Vector3} target The new target position.
   * @param {boolean} [withTransition=true] Whether to animate the transition smoothly.
   */
  pointCameraAtTarget(
    target: THREE.Vector3,
    withTransition: boolean = true,
  ): void {
    this.cancelTransition();

    if (!withTransition) {
      this.controls.target.set(target.x, target.y, target.z);
      this.controls.update();

      return;
    }

    this.setEnabled(false);
    this.isTransitioning = true;

    const wasDampingEnabled = this.controls.enableDamping;
    const originalDampingFactor = this.controls.dampingFactor;

    this.controls.enableDamping = false;

    const currentTarget = this.controls.target.clone();
    const currentPosition = this.camera.position.clone();

    const duration = this.calculateTransitionDuration(
      currentPosition,
      currentPosition
        .clone()
        .setFromSphericalCoords(
          currentPosition.length(),
          target.angleTo(new THREE.Vector3(0, 0, 0)),
          target.angleTo(new THREE.Vector3(0, 1, 0)),
        ),
    );

    const onComplete = () => {
      this.isTransitioning = false;
      this.setEnabled(true);
      this.activeTimeline = null;

      this.controls.enableDamping = wasDampingEnabled;
      this.controls.dampingFactor = originalDampingFactor;

      this.controls.target.copy(target);
      this.controls.update();

      const transitionCompleteEvent = new CustomEvent(
        CustomEvents.CAMERA_TRANSITION_COMPLETE,
        {
          detail: {
            position: this.camera.position.clone(),
            target: target.clone(),
            type: "target-only",
          },
          bubbles: true,
          composed: true,
        },
      );
      document.dispatchEvent(transitionCompleteEvent);
    };

    this.activeTimeline = gsap.timeline({ onComplete: onComplete });

    this.activeTimeline.to(this.controls.target, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration: duration,
      ease: "power1.inOut",
      onUpdate: () => {
        this.camera.lookAt(this.controls.target);
      },
    });
  }

  /**
   * PRIVATE: Initiates a smooth, sequenced camera transition for both position and target using GSAP.
   *
   * @param {THREE.Vector3} startPos The starting camera position.
   * @param {THREE.Vector3} startTarget The starting target position.
   * @param {THREE.Vector3} endPos The desired final camera position.
   * @param {THREE.Vector3} endTarget The desired final target position.
   */
  private _transitionPositionAndTarget(
    startPos: THREE.Vector3,
    startTarget: THREE.Vector3,
    endPos: THREE.Vector3,
    endTarget: THREE.Vector3,
  ): void {
    this.cancelTransition();

    this.setEnabled(false);
    this.isTransitioning = true;

    const wasDampingEnabled = this.controls.enableDamping;
    const originalDampingFactor = this.controls.dampingFactor;

    const totalDuration = this.calculateTransitionDuration(startPos, endPos);

    const cameraForward = this.camera
      .getWorldDirection(this.tempVector.clone())
      .negate();
    const targetDirection = endTarget.clone().sub(startPos).normalize();
    const angle =
      targetDirection.lengthSq() > 0.0001
        ? cameraForward.angleTo(targetDirection)
        : 0;
    const rotationPercent = Math.min(0.5, Math.max(0.1, angle / Math.PI));
    const rotationDuration = totalDuration * rotationPercent * 2;
    const positionDuration = totalDuration * (1 - rotationPercent);

    const onTimelineComplete = () => {
      this.isTransitioning = false;
      this.setEnabled(true);
      this.activeTimeline = null;

      this.controls.enableDamping = wasDampingEnabled;
      this.controls.dampingFactor = originalDampingFactor;

      this.camera.position.copy(endPos);
      this.controls.target.copy(endTarget);
      this.controls.update();

      if (this.followingTargetObject) {
        this.previousFollowTargetPos.copy(
          this.followingTargetObject.getWorldPosition(this.tempTargetPosition),
        );

        this.finalFollowOffset = this.camera.position
          .clone()
          .sub(this.previousFollowTargetPos);
      }

      const transitionCompleteEvent = new CustomEvent(
        CustomEvents.CAMERA_TRANSITION_COMPLETE,
        {
          detail: {
            position: endPos.clone(),
            target: endTarget.clone(),
            type: "position-and-target",
          },
          bubbles: true,
          composed: true,
        },
      );
      document.dispatchEvent(transitionCompleteEvent);
    };

    this.activeTimeline = gsap.timeline({ onComplete: onTimelineComplete });

    if (rotationDuration > 0.01) {
      this.activeTimeline.to(this.controls.target, {
        x: endTarget.x,
        y: endTarget.y,
        z: endTarget.z,
        duration: rotationDuration,
        ease: "power1.inOut",
        onUpdate: () => {
          this.controls.update();
        },
      });
    }

    if (positionDuration > 0.01) {
      this.activeTimeline.to(
        this.camera.position,
        {
          x: endPos.x,
          y: endPos.y,
          z: endPos.z,
          duration: positionDuration,
          ease: "expo.out",
          onUpdate: () => {
            this.controls.update();
          },
        },
        rotationDuration > 0.01 ? ">" : 0,
      );
    } else if (rotationDuration <= 0.01) {
      console.warn(
        "[ControlsManager] Transition duration too short, jumping to end state.",
      );
      this.camera.position.copy(endPos);
      this.controls.target.copy(endTarget);
      onTimelineComplete();
    }
  }

  /**
   * Moves the camera to a new position and updates its target, optionally with a smooth transition.
   *
   * @param {THREE.Vector3} position The desired final camera position.
   * @param {THREE.Vector3} target The desired final target position.
   * @param {boolean} [withTransition=true] Whether to animate the transition smoothly.
   */
  moveToPosition(
    position: THREE.Vector3,
    target: THREE.Vector3,
    withTransition: boolean = true,
  ): void {
    if (!withTransition) {
      this.cancelTransition();
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.controls.update();

      setSimulationState({
        ...getSimulationState(),
        camera: {
          ...getSimulationState().camera,
          position: new OSVector3(position.x, position.y, position.z),
          target: new OSVector3(target.x, target.y, target.z),
        },
      });

      if (this.followingTargetObject) {
        this.followingTargetObject.getWorldPosition(
          this.previousFollowTargetPos,
        );
      }
      return;
    }

    const currentPosition = this.camera.position.clone();
    const currentTarget = this.controls.target.clone();

    this._transitionPositionAndTarget(
      currentPosition,
      currentTarget,
      position,
      target,
    );
  }

  /**
   * Calculates the duration for a camera transition based on the distance between
   * the start and end camera positions. Uses a logarithmic scale to prevent
   * excessively long transitions for large distances.
   *
   * @private
   * @param {THREE.Vector3} startPos The starting camera position.
   * @param {THREE.Vector3} endPos The ending camera position.
   * @returns {number} The calculated transition duration in seconds.
   */
  private calculateTransitionDuration(
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
  ): number {
    const distance = startPos.distanceTo(endPos);

    let duration = this.minTransitionDuration;
    if (distance > 0) {
      duration += Math.min(
        this.transitionDistanceFactor * Math.log10(1 + distance),
        this.maxTransitionDuration - this.minTransitionDuration,
      );
    }

    return Math.min(duration, this.maxTransitionDuration);
  }

  /**
   * Updates the controls state. This should be called every frame in the render loop.
   * Handles applying damping, processing user input, and updating camera/target
   * positions when following an object.
   */
  update(delta: number): void {
    if (this.isTransitioning) {
      return;
    }

    this.controls.update();

    if (this.followingTargetObject) {
      this.followingTargetObject.getWorldPosition(this.tempTargetPosition);

      const targetDelta = this.tempTargetPosition
        .clone()
        .sub(this.previousFollowTargetPos);

      this.camera.position.add(targetDelta);
      this.controls.target.add(targetDelta);

      this.previousFollowTargetPos.copy(this.tempTargetPosition);
    }
  }

  /**
   * Enables or disables the currently active camera controls.
   * @param {boolean} enabled - Whether to enable the active controls.
   */
  setEnabled(enabled: boolean): void {
    this.controls.enabled = enabled;
  }

  /**
   * Cleans up resources used by the ControlsManager, including OrbitControls
   * and any active GSAP animations.
   */
  dispose(): void {
    this.cancelTransition();
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.controls.target);

    this.controls.dispose();
  }

  /**
   * Public method to immediately cancel any ongoing camera transition animation.
   * Re-enables user controls.
   */
  public cancelTransition(): void {
    if (this.isTransitioning && this.activeTimeline) {
      this.activeTimeline.kill();
      this.activeTimeline = null;
      this.isTransitioning = false;
      this.setEnabled(true);
    }
  }

  /**
   * Sets a target THREE.Object3D for the camera to follow.
   * Initiates a smooth transition (`moveTo`) to a calculated position
   * relative to the target.
   * Pass null to stop following.
   *
   * @param {THREE.Object3D | null} object The object to follow, or null to stop.
   * @param {THREE.Vector3} [offset=new THREE.Vector3()] An optional offset applied to the object's world position to determine the target point.
   * @param {boolean} [keepCurrentDistance=false] If true, tries to maintain the camera's current distance and orientation relative to the new target. If false, calculates a distance based on object size.
   */
  public setFollowTarget(
    object: THREE.Object3D | null,
    offset: THREE.Vector3 = new THREE.Vector3(),
    keepCurrentDistance: boolean = false,
  ): void {
    this.cancelTransition();

    if (!object) {
      this.followingTargetObject = null;
      this.finalFollowOffset = null;
      this.previousFollowTargetPos.set(0, 0, 0);

      return;
    }

    this.followingTargetObject = object;

    const finalTargetPosition = new THREE.Vector3();
    object.getWorldPosition(finalTargetPosition).add(offset);

    let finalCameraPosition: THREE.Vector3;
    const currentCameraPosition = this.camera.position.clone();
    const currentTargetPosition = this.controls.target.clone();
    const directionToTarget = currentCameraPosition
      .clone()
      .sub(currentTargetPosition);

    if (keepCurrentDistance) {
      finalCameraPosition = finalTargetPosition.clone().add(directionToTarget);
    } else {
      const currentDistance = directionToTarget.length();
      let objectRadius = 1;
      if (
        object instanceof THREE.Mesh &&
        object.geometry &&
        object.geometry.boundingSphere
      ) {
        objectRadius =
          object.geometry.boundingSphere.radius *
          Math.max(object.scale.x, object.scale.y, object.scale.z);
      }
      const minSafeDistance = objectRadius * 3;
      const desiredDistance = Math.max(currentDistance, minSafeDistance);

      if (directionToTarget.lengthSq() > 0.0001) {
        directionToTarget.normalize();
      } else {
        directionToTarget.set(0, 1, 0);
      }

      finalCameraPosition = finalTargetPosition
        .clone()
        .add(directionToTarget.multiplyScalar(desiredDistance));
    }

    this.previousFollowTargetPos.set(0, 0, 0);
    this.finalFollowOffset = null;

    this.moveToPosition(finalCameraPosition, finalTargetPosition, true);
  }

  /**
   * Sets the debug mode, switching between OrbitControls and FlyControls.
   * @param {boolean} enabled - True to enable debug/fly controls, false for orbit controls.
   */
  public setDebugMode(enabled: boolean): void {
    if (this.isDebugModeActive === enabled) return;

    this.isDebugModeActive = enabled;
  }
}
