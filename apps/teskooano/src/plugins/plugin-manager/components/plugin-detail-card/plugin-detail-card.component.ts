import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { template } from "./plugin-detail-card.template";
import "../../../../core/components/card";

export class PluginDetailCard extends HTMLElement {
  private cardElement: HTMLElement | null = null;
  private titleElement: HTMLElement | null = null;
  private idElement: HTMLElement | null = null;
  private descriptionElement: HTMLElement | null = null;
  private contentWrapper: HTMLElement | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    this.cardElement = this.shadowRoot!.querySelector("teskooano-card");
    this.titleElement = this.shadowRoot!.querySelector('[slot="title"]');
    this.idElement = this.shadowRoot!.querySelector(".plugin-id");
    this.descriptionElement = this.shadowRoot!.querySelector(
      ".plugin-description",
    );
    this.contentWrapper = this.shadowRoot!.querySelector(
      ".plugin-content-wrapper",
    );
  }

  set plugin(plugin: TeskooanoPlugin) {
    if (
      !this.cardElement ||
      !this.titleElement ||
      !this.idElement ||
      !this.descriptionElement ||
      !this.contentWrapper
    )
      return;

    this.titleElement.textContent = plugin.name || "Unnamed Plugin";
    this.idElement.textContent = `ID: ${plugin.id}`;
    this.descriptionElement.textContent =
      plugin.description || "No description provided.";

    this.contentWrapper.innerHTML = "";

    const functionsHtml = this.createDetailSection(
      "Functions",
      plugin.functions?.map((f) => f.id),
    );
    const panelsHtml = this.createDetailSection(
      "Panels",
      plugin.panels?.map((p) => p.componentName),
    );
    const componentsHtml = this.createDetailSection(
      "Components",
      plugin.components?.map((c) => `&lt;${c.tagName}&gt;`),
    );

    this.contentWrapper.innerHTML = `${functionsHtml}${panelsHtml}${componentsHtml}`;
  }

  private createDetailSection(
    title: string,
    items: string[] | undefined,
  ): string {
    if (!items || items.length === 0) return "";
    return `
      <div class="plugin-details">
        <strong>${title}:</strong>
        <ul>
          ${items.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </div>
    `;
  }
}
