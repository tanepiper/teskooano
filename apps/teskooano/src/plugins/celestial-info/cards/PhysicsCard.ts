import { BaseCelestialCard } from "./BaseCelestialCard.js";
import { StateSubscriptionMixin, StateAccessor } from "@teskooano/core-state";
import type { CelestialObject, PhysicsStateReal } from "@teskooano/data-types";
import { FormatUtils } from "../utils/formatters.js";

export class PhysicsCard extends BaseCelestialCard {
  static componentName = "physics-card";
  private stateSubscriber = new StateSubscriptionMixin();

  constructor() {
    super("Real-time Physics");
    this.container.classList.add("physics-card");
    this.addTableStyles();
  }

  protected shouldAutoUpdate(): boolean {
    return true; // This card updates in real-time via state subscription
  }

  public updateData(celestial: any): void {
    super.updateData(celestial);

    // Subscribe to real-time celestial object updates to get the raw physics state
    if (this.currentCelestial) {
      this.stateSubscriber.subscribeToState(
        StateAccessor.celestialObjects$(),
        (celestialObjects: Record<string, CelestialObject>) => {
          if (this.currentCelestial) {
            const celestialObject = celestialObjects[this.currentCelestial.id];
            if (celestialObject?.physicsStateReal) {
              // Use the raw physics state directly
              this.renderPhysicsData(celestialObject.physicsStateReal);
            }
          }
        },
      );
    }
  }

  private renderPhysicsData(physicsState: any): void {
    const contentDiv = this.shadowRoot?.querySelector(
      ".card-content",
    ) as HTMLElement;
    if (!contentDiv) return;

    const content = this.renderPhysics(this.currentCelestial!.id, physicsState);

    contentDiv.innerHTML = content;
  }

  protected renderContent(): void {
    const contentDiv = this.shadowRoot?.querySelector(
      ".card-content",
    ) as HTMLElement;
    if (!contentDiv) return;

    if (!this.currentCelestial?.physicsStateReal) {
      contentDiv.innerHTML = "<p>Physics state not available</p>";
      return;
    }

    const content = this.renderPhysics(
      this.currentCelestial.id,
      this.currentCelestial.physicsStateReal,
    );

    contentDiv.innerHTML = content;
  }

  /**
   * Renders physics data in table format.
   */
  private renderPhysics(
    celestialId: string,
    physics: PhysicsStateReal | undefined | null,
  ): string {
    if (!physics) return "";

    const speed = Math.sqrt(
      physics.velocity_mps.x ** 2 +
        physics.velocity_mps.y ** 2 +
        physics.velocity_mps.z ** 2,
    );

    // Build table header
    let tableHTML = `
      <table class="physics-data-table" id="physics-data-${celestialId}">
        <thead>
          <tr>
            <th>Position X</th>
            <th>Position Y</th>
            <th>Position Z</th>
            <th>Speed</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="position-x">${FormatUtils.formatDistanceAU(physics.position_m.x)}</td>
            <td class="position-y">${FormatUtils.formatDistanceAU(physics.position_m.y)}</td>
            <td class="position-z">${FormatUtils.formatDistanceAU(physics.position_m.z)}</td>
            <td class="speed">${FormatUtils.formatSpeed(speed)}</td>
          </tr>
        </tbody>
      </table>
    `;

    return tableHTML;
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    // Clean up state subscription
    this.stateSubscriber.dispose();
  }

  private addTableStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      .physics-data-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 0.5rem;
        font-size: 0.9rem;
      }
      
      .physics-data-table th,
      .physics-data-table td {
        padding: 0.5rem;
        text-align: center;
        border-bottom: 1px solid var(--color-border, #333);
      }
      
      .physics-data-table th {
        background-color: var(--color-card-header, #2a2a2a);
        font-weight: 600;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--color-text-secondary, #aaa);
      }
      
      .physics-data-table td {
        font-family: 'Courier New', monospace;
        font-weight: 500;
      }
      
      .physics-data-table .position-x {
        color: var(--color-accent, #4fc3f7);
      }
      
      .physics-data-table .position-y {
        color: var(--color-warning, #ffc107);
      }
      
      .physics-data-table .position-z {
        color: var(--color-info, #17a2b8);
      }
      
      .physics-data-table .speed {
        color: var(--color-success, #4caf50);
        font-weight: 600;
      }
      
      .physics-data-table tr:hover {
        background-color: var(--color-hover, rgba(255, 255, 255, 0.05));
      }
    `;

    this.shadowRoot?.appendChild(style);
  }
}
