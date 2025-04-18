declare module '*.glsl' {
  const content: string;
  export default content;
}

declare module '*.vert' {
  const content: string;
  export default content;
}

declare module '*.frag' {
  const content: string;
  export default content;
}

// Add declaration for Vite raw imports
declare module '*.glsl?raw' {
  const content: string;
  export default content;
} 