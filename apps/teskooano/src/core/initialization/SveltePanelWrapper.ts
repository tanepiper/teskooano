import type { IContentRenderer, PanelInitParameters } from "dockview-core";
import { mount, unmount } from "svelte";
import type { Component } from "svelte";

/**
 * Creates a DockView-compatible IContentRenderer constructor that mounts
 * an arbitrary Svelte 5 component into the panel slot.
 *
 * Usage in PanelFactory:
 *   const Ctor = createSveltePanelConstructor(MySvelteComponent);
 *   dockviewController.registerComponent("my-panel", Ctor);
 *
 * The Svelte component receives the raw DockView `PanelInitParameters` as
 * a `params` prop. Components should declare `let { params } = $props();`
 * to consume it.
 */
export function createSveltePanelConstructor(
  svelteComponent: Component<any>,
): new () => IContentRenderer {
  class SveltePanelWrapper implements IContentRenderer {
    private readonly _element: HTMLDivElement;
    private _instance: Record<string, any> | undefined;

    get element(): HTMLElement {
      return this._element;
    }

    constructor() {
      this._element = document.createElement("div");
      this._element.style.cssText =
        "width:100%;height:100%;overflow:auto;display:flex;flex-direction:column;";
    }

    init(params: PanelInitParameters): void {
      // Set data-panel-id so child components (e.g. teskooano-slider) can
      // find their panel context by traversing the DOM.
      const panelId = (params as any)?.api?.id;
      if (panelId) {
        this._element.setAttribute("data-panel-id", panelId);
      }

      this._instance = mount(svelteComponent, {
        target: this._element,
        props: { params },
      });
    }

    dispose(): void {
      if (this._instance) {
        unmount(this._instance);
        this._instance = undefined;
      }
    }
  }

  return SveltePanelWrapper;
}
