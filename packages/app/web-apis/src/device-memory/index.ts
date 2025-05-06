import { BehaviorSubject, Observable } from "rxjs";

declare global {
  interface Navigator {
    /** Provides an estimation of the device's RAM in gigabytes. */
    readonly deviceMemory?: number;
  }
}

/**
 * Checks if the Device Memory API is likely supported by the browser.
 * @returns `true` if `navigator.deviceMemory` exists, `false` otherwise.
 */
export function isDeviceMemorySupported(): boolean {
  return typeof navigator !== "undefined" && "deviceMemory" in navigator;
}

/**
 * Gets the approximate device memory in gigabytes.
 * Returns `null` if the API is not supported.
 * @returns The device memory in GB, or null.
 */
export function getDeviceMemory(): number | null {
  if (!isDeviceMemorySupported()) {
    console.warn("Device Memory API is not supported.");
    return null;
  }
  return navigator.deviceMemory ?? null;
}

/**
 * Interface for the state emitted by the deviceMemory$ observable.
 */
export interface DeviceMemoryState {
  /** Approximate device memory in gigabytes, or null if unsupported/unavailable. */
  memoryGB: number | null;
  /** Whether the Device Memory API is supported by the browser. */
  isSupported: boolean;
}

const initialDeviceMemoryState: DeviceMemoryState = {
  memoryGB: getDeviceMemory(),
  isSupported: isDeviceMemorySupported(),
};

const deviceMemorySubject = new BehaviorSubject<DeviceMemoryState>(
  initialDeviceMemoryState,
);

/**
 * An RxJS Observable that emits the approximate device memory.
 * It emits the current value immediately upon subscription.
 */
export const deviceMemory$: Observable<DeviceMemoryState> =
  deviceMemorySubject.asObservable();
