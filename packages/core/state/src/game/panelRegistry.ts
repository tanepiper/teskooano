const panelInstanceRegistry = new Map<string, any>();

export const panelRegistry = {
  registerPanel: (id: string, instance: any): void => {
    panelInstanceRegistry.set(id, instance);
  },

  unregisterPanel: (id: string): void => {
    panelInstanceRegistry.delete(id);
  },

  getPanelInstance: <T = any>(id: string): T | undefined => {
    return panelInstanceRegistry.get(id) as T | undefined;
  },
};
