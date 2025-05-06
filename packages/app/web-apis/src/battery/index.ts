import { BehaviorSubject } from "rxjs";

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
 * A RxJS BehaviorSubject that provides reactive updates on the device's battery status.
 * It automatically updates when battery properties change (level, charging state, etc.).
 */
export const batteryState$ = new BehaviorSubject<BatteryState>(
  initialBatteryState,
);

let batteryManager: BatteryManager | null = null;
let removeListeners: (() => void) | null = null;

function updateStore(manager: BatteryManager) {
  batteryState$.next({
    charging: manager.charging,
    chargingTime: manager.chargingTime,
    dischargingTime: manager.dischargingTime,
    level: manager.level,
    isSupported: true,
  });
}

/**
 * Initializes the battery status monitoring.
 * Should be called once when the application starts.
 */
function initializeBatteryMonitor() {
  if (batteryManager || removeListeners) {
    return;
  }

  if (typeof navigator !== "undefined" && navigator.getBattery) {
    navigator
      .getBattery()
      .then((manager) => {
        batteryManager = manager;
        updateStore(manager);

        const chargingChangeListener = () => updateStore(manager);
        const chargingTimeChangeListener = () => updateStore(manager);
        const dischargingTimeChangeListener = () => updateStore(manager);
        const levelChangeListener = () => updateStore(manager);

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
        batteryState$.next({ ...initialBatteryState, isSupported: false });
      });
  } else {
    console.warn("Battery Status API is not supported in this environment.");
    batteryState$.next({ ...initialBatteryState, isSupported: false });
  }
}

/**
 * Cleans up the battery status listeners.
 * Should be called when the application or relevant part is unmounted/destroyed.
 */
export function cleanupBatteryMonitor() {
  removeListeners?.();
}

initializeBatteryMonitor();
