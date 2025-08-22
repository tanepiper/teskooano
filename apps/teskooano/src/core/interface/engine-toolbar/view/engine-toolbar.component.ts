import { template } from "./engine-toolbar.template";

export class EngineToolbarComponent extends HTMLElement {
  static readonly componentName = "teskooano-engine-toolbar";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }
}

customElements.define(
  EngineToolbarComponent.componentName,
  EngineToolbarComponent,
);
