import { atom, onMount } from "nanostores";

/**
 * Interface mimicking the BatteryManager API structure.
 */
export interface BatteryState {
  /** A boolean value indicating whether the battery is currently charging. */
  charging: boolean;
  /** A number representing the remaining time in seconds until the battery is fully charged, or 0 if the battery is already full or discharging. */
  chargingTime: number;
  /** A number representing the remaining time in seconds until the battery is completely discharged and the system suspends, or Infinity if the battery is charging or is currently full. */
  dischargingTime: number;
  /** A number representing the battery's charge level as a value between 0.0 and 1.0. */
  level: number;
  /** Indicates if the Battery Status API is supported by the browser. */
  isSupported: boolean;
}

const initialBatteryState: BatteryState = {
  charging: false,
  chargingTime: 0,
  dischargingTime: Infinity,
  level: 1,
  isSupported: false,
};

// Extend navigator type if getBattery is missing
declare global {
  interface Navigator {
    getBattery?: () => Promise<BatteryManager>;
  }
  interface BatteryManager extends EventTarget {
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    level: number;
    onchargingchange: ((this: BatteryManager, ev: Event) => any) | null;
    onchargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
    ondischargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
    onlevelchange: ((this: BatteryManager, ev: Event) => any) | null;
  }
}

/**
 * A Nanostore atom that provides reactive updates on the device's battery status.
 * It automatically updates when battery properties change (level, charging state, etc.).
 */
export const batteryStore = atom<BatteryState>(initialBatteryState);

let batteryManager: BatteryManager | null = null;
let removeListeners: (() => void) | null = null;

function updateStore(manager: BatteryManager) {
  batteryStore.set({
    charging: manager.charging,
    chargingTime: manager.chargingTime,
    dischargingTime: manager.dischargingTime,
    level: manager.level,
    isSupported: true,
  });
}

onMount(batteryStore, () => {
  if (typeof navigator !== "undefined" && navigator.getBattery) {
    navigator
      .getBattery()
      .then((manager) => {
        batteryManager = manager;
        updateStore(manager); // Initial update

        // Define listeners
        const chargingChangeListener = () => updateStore(manager);
        const chargingTimeChangeListener = () => updateStore(manager);
        const dischargingTimeChangeListener = () => updateStore(manager);
        const levelChangeListener = () => updateStore(manager);

        // Add listeners
        manager.addEventListener("chargingchange", chargingChangeListener);
        manager.addEventListener(
          "chargingtimechange",
          chargingTimeChangeListener,
        );
        manager.addEventListener(
          "dischargingtimechange",
          dischargingTimeChangeListener,
        );
        manager.addEventListener("levelchange", levelChangeListener);

        // Store cleanup function
        removeListeners = () => {
          if (!batteryManager) return;
          batteryManager.removeEventListener(
            "chargingchange",
            chargingChangeListener,
          );
          batteryManager.removeEventListener(
            "chargingtimechange",
            chargingTimeChangeListener,
          );
          batteryManager.removeEventListener(
            "dischargingtimechange",
            dischargingTimeChangeListener,
          );
          batteryManager.removeEventListener(
            "levelchange",
            levelChangeListener,
          );
          removeListeners = null;
          batteryManager = null;
        };
      })
      .catch((error) => {
        console.error("Failed to get Battery Manager:", error);
        batteryStore.set({ ...initialBatteryState, isSupported: false });
      });
  } else {
    console.warn("Battery Status API is not supported in this environment.");
    batteryStore.set({ ...initialBatteryState, isSupported: false });
  }

  // Cleanup on unmount
  return () => {
    removeListeners?.();
  };
});
