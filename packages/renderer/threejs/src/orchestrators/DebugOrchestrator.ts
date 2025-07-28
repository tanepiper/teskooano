import { DepthBufferDebugger } from "@teskooano/renderer-threejs-core";

/**
 * Orchestrates debug and analysis tools.
 *
 * This orchestrator groups debug-related functionality:
 * - Depth buffer analysis
 * - Performance monitoring
 * - Debug visualizations
 */
export class DebugOrchestrator {
  private depthDebugger: DepthBufferDebugger;

  constructor(sceneManager: any) {
    this.depthDebugger = new DepthBufferDebugger(sceneManager);

    // Make debugger accessible globally during development
    if (typeof window !== "undefined") {
      if ((window as any).teskooano) {
        (window as any).teskooano.debugger = this.depthDebugger;
      } else {
        (window as any).teskooano = {
          debugger: this.depthDebugger,
        };
      }
    }
  }

  /**
   * Gets the depth debugger for direct access when needed.
   */
  getDepthDebugger(): DepthBufferDebugger {
    return this.depthDebugger;
  }

  /**
   * Runs a comprehensive depth buffer analysis.
   */
  runDepthAnalysis(): void {
    this.depthDebugger.runFullAnalysis();
  }

  /**
   * Disposes debug resources.
   */
  dispose(): void {
    // Depth debugger doesn't have a dispose method currently
    // but this provides a consistent interface
  }
}
