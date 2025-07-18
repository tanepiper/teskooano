export * from "./game";
export * from "./utils";

// Export the new functional API as the primary interface
export {
  gameState,
  simulationState,
  celestialOperations,
  factoryOperations,
} from "./game";
