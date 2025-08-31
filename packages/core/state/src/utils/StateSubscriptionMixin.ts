import { Observable, Subscription } from "rxjs";

/**
 * Mixin class that provides standardized RxJS subscription management.
 * Eliminates the boilerplate subscription pattern found across packages and apps.
 *
 * Usage:
 * ```typescript
 * export class MyComponent extends StateSubscriptionMixin {
 *   public init(): void {
 *     this.subscribeToState(someObservable$, value => {
 *       // Handle value update
 *     });
 *   }
 * }
 * ```
 *
 * Or as composition:
 * ```typescript
 * export class MyComponent {
 *   private subscriptionManager = new StateSubscriptionMixin();
 *
 *   public init(): void {
 *     this.subscriptionManager.subscribeToState(someObservable$, value => {
 *       // Handle value update
 *     });
 *   }
 *
 *   public dispose(): void {
 *     this.subscriptionManager.dispose();
 *   }
 * }
 * ```
 */
export class StateSubscriptionMixin {
  private subscription = new Subscription();

  /**
   * Subscribes to an observable and tracks the subscription.
   * This method is intended for use in classes that extend `StateSubscriptionMixin`.
   * @param observable$ - The RxJS Observable to subscribe to.
   * @param next - The callback function to execute on new values.
   */
  public subscribeToState<T>(
    observable$: Observable<T>,
    next: (value: T) => void,
  ): void {
    this.subscription.add(observable$.subscribe(next));
  }

  /**
   * Subscribe to multiple observables with a single handler.
   * Useful when the same logic should be applied to multiple streams.
   * @param observables Array of observables to subscribe to
   * @param handler The function to handle emitted values
   */
  protected subscribeToMultipleStates<T>(
    observables: Observable<T>[],
    handler: (value: T) => void,
  ): void {
    observables.forEach((obs) => this.subscribeToState(obs, handler));
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
    handler: (value: R) => void,
  ): void {
    this.subscription.add(
      observable.subscribe((value: T) => handler(mapper(value))),
    );
  }

  /**
   * Public subscription method for composition pattern.
   * When using StateSubscriptionMixin as a composed object rather than inheritance.
   * @param observable The observable to subscribe to
   * @param handler The function to handle emitted values
   * @param errorHandler Optional error handler
   */
  public subscribeToStateComposition<T>(
    observable: Observable<T>,
    handler: (value: T) => void,
    errorHandler?: (error: any) => void,
  ): void {
    this.subscription.add(
      observable.subscribe({
        next: handler,
        error: errorHandler || this.defaultErrorHandler,
      }),
    );
  }

  /**
   * Default error handler for subscriptions.
   * Can be overridden in subclasses for custom error handling.
   */
  protected defaultErrorHandler(error: any): void {
    console.error("[StateSubscriptionMixin] Subscription error:", error);
  }

  /**
   * Clean up all subscriptions. Should be called in component disposal.
   * This method is public to allow external cleanup, but should typically
   * be called from the component's dispose/destroy lifecycle method.
   */
  public dispose(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Check if there are any active subscriptions.
   * Useful for debugging subscription leaks.
   */
  public hasActiveSubscriptions(): boolean {
    return !this.subscription.closed;
  }

  /**
   * Get the number of active subscriptions (for debugging).
   * Note: This uses internal Subscription properties and should only be used for debugging.
   */
  public getSubscriptionCount(): number {
    return this.subscription.closed ? 0 : 1;
  }
}
