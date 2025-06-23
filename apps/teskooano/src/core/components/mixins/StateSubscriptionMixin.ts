import { Observable, Subscription } from 'rxjs';

/**
 * Mixin class that provides standardized RxJS subscription management.
 * Eliminates the boilerplate subscription pattern found across plugins.
 * 
 * Usage:
 * ```typescript
 * export class MyComponent extends StateSubscriptionMixin {
 *   public init(): void {
 *     this.subscribeToState(celestialObjects$, objects => {
 *       // Handle objects update
 *     });
 *   }
 * }
 * ```
 */
export class StateSubscriptionMixin {
  protected subscriptions = new Subscription();

  /**
   * Subscribe to an observable with automatic cleanup management.
   * @param observable The observable to subscribe to
   * @param handler The function to handle emitted values
   * @param errorHandler Optional error handler
   */
  protected subscribeToState<T>(
    observable: Observable<T>, 
    handler: (value: T) => void,
    errorHandler?: (error: any) => void
  ): void {
    this.subscriptions.add(
      observable.subscribe({
        next: handler,
        error: errorHandler || this.defaultErrorHandler
      })
    );
  }

  /**
   * Subscribe to multiple observables with a single handler.
   * Useful when the same logic should be applied to multiple streams.
   * @param observables Array of observables to subscribe to
   * @param handler The function to handle emitted values
   */
  protected subscribeToMultipleStates<T>(
    observables: Observable<T>[],
    handler: (value: T) => void
  ): void {
    observables.forEach(obs => this.subscribeToState(obs, handler));
  }

  /**
   * Subscribe to an observable and map the result before handling.
   * @param observable The observable to subscribe to
   * @param mapper Function to transform the emitted value
   * @param handler The function to handle the transformed value
   */
  protected subscribeToStateWithMapping<T, R>(
    observable: Observable<T>,
    mapper: (value: T) => R,
    handler: (value: R) => void
  ): void {
    this.subscriptions.add(
      observable.subscribe({
        next: (value: T) => handler(mapper(value)),
        error: this.defaultErrorHandler
      })
    );
  }

  /**
   * Default error handler for subscriptions.
   * Can be overridden in subclasses for custom error handling.
   */
  protected defaultErrorHandler(error: any): void {
    console.error('[StateSubscriptionMixin] Subscription error:', error);
  }

  /**
   * Clean up all subscriptions. Should be called in component disposal.
   * This method is public to allow external cleanup, but should typically
   * be called from the component's dispose/destroy lifecycle method.
   */
  public dispose(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Check if there are any active subscriptions.
   * Useful for debugging subscription leaks.
   */
  public hasActiveSubscriptions(): boolean {
    return !this.subscriptions.closed;
  }

  /**
   * Get the number of active subscriptions (for debugging).
   * Note: This uses internal Subscription properties and should only be used for debugging.
   */
  public getSubscriptionCount(): number {
    // @ts-ignore - accessing internal property for debugging
    const subscriptions = this.subscriptions._subscriptions;
    return Array.isArray(subscriptions) ? subscriptions.length : 0;
  }
}