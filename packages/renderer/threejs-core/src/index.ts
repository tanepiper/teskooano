import { SceneManager } from "./SceneManager";
import { AnimationLoop } from "./AnimationLoop";
import { StateManager } from "./StateManager";

export { SceneManager } from "./SceneManager";
export { AnimationLoop } from "./AnimationLoop";
export type { RendererStats } from "./AnimationLoop";
export { StateManager } from "./StateManager";
export type { RendererCelestialObject } from "./StateManager";
export * from "./events";

export class CoreRenderer {
  sceneManager: SceneManager;
  animationLoop: AnimationLoop;
  stateManager: StateManager;

  constructor(container: HTMLElement, options: any) {
    this.sceneManager = new SceneManager(container, options);
    this.animationLoop = new AnimationLoop();
    this.stateManager = new StateManager();

    this.animationLoop.setRenderer(this.sceneManager.renderer);

    this.animationLoop.setCamera(this.sceneManager.camera);
  }

  get scene() {
    return this.sceneManager.scene;
  }

  get camera() {
    return this.sceneManager.camera;
  }

  get renderer() {
    return this.sceneManager.renderer;
  }

  start(): void {
    this.animationLoop.start();
  }

  stop(): void {
    this.animationLoop.stop();
  }

  render(): void {
    this.sceneManager.render();
  }

  dispose(): void {
    this.sceneManager.dispose();
    this.animationLoop.dispose();
  }
}
