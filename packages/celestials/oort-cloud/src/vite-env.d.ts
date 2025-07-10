/// <reference types="vite/client" />

declare module "*.glsl?raw" {
  const content: string;
  export default content;
}

declare module "*.vert?raw" {
  const content: string;
  export default content;
}

declare module "*.frag?raw" {
  const content: string;
  export default content;
}
