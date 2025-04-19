import { atom } from 'nanostores';

export type Orientation = 'portrait' | 'landscape';

/**
 * Stores the current layout orientation.
 * Use window.matchMedia('(orientation: portrait)') to update this store.
 */
export const layoutOrientationStore = atom<Orientation>('landscape'); // Default assumption or detect on init 