import { template } from "./Card.template";

export class TeskooanoCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    // Initialization logic if needed
  }

  disconnectedCallback() {
    // Cleanup logic if needed
  }
}
