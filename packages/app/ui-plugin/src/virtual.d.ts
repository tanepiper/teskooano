declare module "virtual:teskooano-loaders" {
  /**
   * An object mapping component tag names to asynchronous functions
   * that return the module containing the component class (usually as default export).
   */
  export const componentLoaders: Record<string, () => Promise<any>>;

  /**
   * An object mapping plugin IDs to asynchronous functions that return
   * the module containing the TeskooanoPlugin object (usually exported as 'plugin').
   */
  export const pluginLoaders: Record<string, () => Promise<any>>;

  /**
   * The component registry configuration.
   */
  export const componentRegistryConfig: ComponentRegistryConfig;
}
