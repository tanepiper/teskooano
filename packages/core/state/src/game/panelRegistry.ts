// Remove the direct EnginePanel import

// Simple registry to hold references to panel component instances
const panelInstanceRegistry = new Map<string, any>(); // Use 'any' for now

export const panelRegistry = {
  registerPanel: (id: string, instance: any): void => {
    panelInstanceRegistry.set(id, instance);
  },

  unregisterPanel: (id: string): void => {
    panelInstanceRegistry.delete(id);
  },

  getPanelInstance: <T = any>(id: string): T | undefined => {
    // Consumers will need to cast or perform type checks
    return panelInstanceRegistry.get(id) as T | undefined;
  },
};
