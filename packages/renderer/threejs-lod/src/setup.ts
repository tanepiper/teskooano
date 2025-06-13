export {};

declare global {
  interface Window {
    __testReady?: boolean;
    __renderer?: any;
    __resizeCalled?: boolean;
  }
}
