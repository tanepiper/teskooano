/// <reference types="vite/client" />

declare module "*.css?inline" {
  const content: string;
  export default content;
}

// Declare the shape of our custom virtual module
declare module "virtual:teskooano-loaders" {
  import type { ComponentRegistryConfig } from "@teskooano/ui-plugin";
  export const componentRegistryConfig: ComponentRegistryConfig;
  export const componentLoaders: Record<string, () => Promise<any>>;
  export const pluginLoaders: Record<string, () => Promise<any>>;
}
