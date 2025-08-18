import type { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import type { CameraManager } from "@teskooano/renderer-threejs-controls";
import type { OrbitsManager } from "@teskooano/renderer-threejs-orbits";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import { panelService } from "../dockview/panel.service";

interface EngineInstanceEntry {
  renderer?: ModularSpaceRenderer;
  cameraManager?: CameraManager;
  orbitsManager?: OrbitsManager;
  lightingManager?: LightingManager;
}

/**
 * Service: EngineRegistryService
 * Manages shared engine-level instances per panel (renderer, camera, orbits, lighting).
 * Reduces ad-hoc dependency passing by providing importable getters/registrations.
 */
class EngineRegistryService {
  private static instance: EngineRegistryService;
  private readonly instances = new Map<string, EngineInstanceEntry>();

  private constructor() {}

  public static getInstance(): EngineRegistryService {
    if (!EngineRegistryService.instance) {
      EngineRegistryService.instance = new EngineRegistryService();
    }
    return EngineRegistryService.instance;
  }

  public registerRenderer(panelId: string, renderer: ModularSpaceRenderer): void {
    const entry = this.ensure(panelId);
    entry.renderer = renderer;
  }

  public getRenderer(panelId: string): ModularSpaceRenderer | undefined {
    return this.instances.get(panelId)?.renderer;
  }

  public getActiveRenderer(): ModularSpaceRenderer | undefined {
    const active = panelService.getActivePanelApi();
    return active ? this.getRenderer(active.id) : undefined;
  }

  public registerCameraManager(panelId: string, manager: CameraManager): void {
    const entry = this.ensure(panelId);
    entry.cameraManager = manager;
  }

  public getCameraManager(panelId: string): CameraManager | undefined {
    return this.instances.get(panelId)?.cameraManager;
  }

  public getActiveCameraManager(): CameraManager | undefined {
    const active = panelService.getActivePanelApi();
    return active ? this.getCameraManager(active.id) : undefined;
  }

  public registerOrbitsManager(panelId: string, manager: OrbitsManager): void {
    const entry = this.ensure(panelId);
    entry.orbitsManager = manager;
  }

  public getOrbitsManager(panelId: string): OrbitsManager | undefined {
    return this.instances.get(panelId)?.orbitsManager;
  }

  public registerLightingManager(
    panelId: string,
    manager: LightingManager,
  ): void {
    const entry = this.ensure(panelId);
    entry.lightingManager = manager;
  }

  public getLightingManager(panelId: string): LightingManager | undefined {
    return this.instances.get(panelId)?.lightingManager;
  }

  public unregisterPanel(panelId: string): void {
    this.instances.delete(panelId);
  }

  public hasPanel(panelId: string): boolean {
    return this.instances.has(panelId);
  }

  private ensure(panelId: string): EngineInstanceEntry {
    let entry = this.instances.get(panelId);
    if (!entry) {
      entry = {};
      this.instances.set(panelId, entry);
    }
    return entry;
  }
}

export const engineRegistry = EngineRegistryService.getInstance();
export type { EngineInstanceEntry };

