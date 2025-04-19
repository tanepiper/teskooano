import { Observable, Subject, fromEvent, BehaviorSubject } from 'rxjs';
import { map, share, takeUntil, tap, filter, startWith, distinctUntilChanged, finalize } from 'rxjs/operators';

// Define necessary types if not already globally available or need augmentation
declare global {
  interface Window {
    MediaRecorder?: typeof MediaRecorder;
    BlobEvent?: typeof BlobEvent;
  }

  // Interface for the event fired when data is available
  interface BlobEvent extends Event {
    readonly data: Blob;
    readonly timecode: DOMHighResTimeStamp;
  }

  // Extend MediaRecorder options to include standard and common non-standard properties
  interface MediaRecorderOptions {
    mimeType?: string;
    audioBitsPerSecond?: number;
    videoBitsPerSecond?: number;
    bitsPerSecond?: number; // General fallback
    audioBitrateMode?: 'constant' | 'variable'; // Example non-standard
  }

  // Define the MediaRecorder class interface
  interface MediaRecorder extends EventTarget {
    readonly stream: MediaStream;
    readonly mimeType: string;
    readonly state: 'inactive' | 'recording' | 'paused';
    readonly videoBitsPerSecond: number;
    readonly audioBitsPerSecond: number;
    readonly audioBitrateMode: 'constant' | 'variable'; // Example non-standard

    ondataavailable: ((this: MediaRecorder, ev: BlobEvent) => any) | null;
    onerror: ((this: MediaRecorder, ev: ErrorEvent) => any) | null; // Use standard ErrorEvent type
    onpause: ((this: MediaRecorder, ev: Event) => any) | null;
    onresume: ((this: MediaRecorder, ev: Event) => any) | null;
    onstart: ((this: MediaRecorder, ev: Event) => any) | null;
    onstop: ((this: MediaRecorder, ev: Event) => any) | null;

    constructor(stream: MediaStream, options?: MediaRecorderOptions);

    start(timeslice?: number): void;
    stop(): void;
    pause(): void;
    resume(): void;
    requestData(): void;
    isTypeSupported(type: string): boolean;

    // Static method
    // isTypeSupported(type: string): boolean; // Defined below on the class type
  }

   // Define the constructor type separately for static methods
   interface MediaRecorderConstructor {
      new(stream: MediaStream, options?: MediaRecorderOptions): MediaRecorder;
      prototype: MediaRecorder;
      isTypeSupported(type: string): boolean;
   }

   // Make MediaRecorder constructor available on window
   var MediaRecorder: MediaRecorderConstructor | undefined;

}

/**
 * Checks if the MediaStream Recording API (MediaRecorder) is likely supported.
 * @returns `true` if `window.MediaRecorder` exists, `false` otherwise.
 */
export function isMediaRecorderSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined';
}

/**
 * Checks if a specific MIME type is supported by the MediaRecorder.
 * @param mimeType The MIME type string to check (e.g., 'video/webm;codecs=vp9').
 * @returns `true` if the type is supported, `false` otherwise or if API is unsupported.
 */
export function isMimeTypeSupported(mimeType: string): boolean {
  if (!isMediaRecorderSupported()) {
    return false;
  }
  return window.MediaRecorder!.isTypeSupported(mimeType);
}

/**
 * Represents the state of the MediaRecorder managed by `manageMediaRecorder`.
 */
export interface MediaRecorderState {
  status: 'inactive' | 'recording' | 'paused' | 'stopped' | 'error';
  lastError?: Event | Error;
  recordedChunks: Blob[];
  isSupported: boolean;
}

/**
 * Interface for the controls returned by `manageMediaRecorder`.
 */
export interface MediaRecorderControls {
  /** Start recording. Optional timeslice for dataavailable events (in milliseconds). */
  start: (timeslice?: number) => void;
  /** Stop recording. Triggers final dataavailable event. */
  stop: () => void;
  /** Pause recording. */
  pause: () => void;
  /** Resume recording. */
  resume: () => void;
  /** Request the current chunk of data immediately. */
  requestData: () => void;
  /** Observable emitting the current state of the recorder. */
  state$: Observable<MediaRecorderState>;
  /** Observable emitting recorded data Blobs as they become available. */
  data$: Observable<Blob>;
  /** The underlying MediaRecorder instance (can be null if not supported). */
  recorder: MediaRecorder | null;
  /** Forces cleanup and stops observables */
  destroy: () => void;
}

const defaultRecorderState: Omit<MediaRecorderState, 'isSupported'> = {
  status: 'inactive',
  lastError: undefined,
  recordedChunks: [],
};

/**
 * Creates and manages a MediaRecorder instance with RxJS Observables for state and data.
 *
 * @param stream The MediaStream to record.
 * @param options Configuration options for the MediaRecorder.
 * @param options.recorderOptions Options passed directly to the MediaRecorder constructor (mimeType, bitrates, etc.).
 * @param options.stopTracksOnStop If true, stops the tracks of the input stream when recording stops or is destroyed (default: false).
 * @returns MediaRecorderControls object or null if the API is not supported.
 */
export function manageMediaRecorder(
  stream: MediaStream,
  options: {
    recorderOptions?: MediaRecorderOptions;
    stopTracksOnStop?: boolean;
  } = {}
): MediaRecorderControls | null {
  if (!isMediaRecorderSupported()) {
    console.warn('MediaRecorder API is not supported.');
    const stateSubject = new BehaviorSubject<MediaRecorderState>({
        ...defaultRecorderState,
        isSupported: false,
    });
    return {
        start: () => console.warn('MediaRecorder not supported.'),
        stop: () => {},
        pause: () => {},
        resume: () => {},
        requestData: () => {},
        state$: stateSubject.asObservable(),
        data$: new Observable<Blob>(), // Empty observable
        recorder: null,
        destroy: () => stateSubject.complete(),
    };
  }

  const recorderOptions = options.recorderOptions;
  const stopTracksOnStop = options.stopTracksOnStop ?? false;

  let recorder: MediaRecorder | null = null;
  try {
    recorder = new window.MediaRecorder!(stream, recorderOptions);
  } catch (err: any) {
    console.error('Failed to create MediaRecorder:', err);
     const stateSubject = new BehaviorSubject<MediaRecorderState>({
        ...defaultRecorderState,
        status: 'error',
        lastError: err,
        isSupported: true, // API exists, but creation failed
    });
     return {
        start: () => console.error('MediaRecorder creation failed.'),
        stop: () => {},
        pause: () => {},
        resume: () => {},
        requestData: () => {},
        state$: stateSubject.asObservable(),
        data$: new Observable<Blob>(),
        recorder: null,
         destroy: () => stateSubject.complete(),
    };
  }

  const internalState = { ...defaultRecorderState, isSupported: true };
  const stateSubject = new BehaviorSubject<MediaRecorderState>(internalState);
  const dataSubject = new Subject<Blob>();
  const destroySubject = new Subject<void>();

  const updateState = (newState: Partial<MediaRecorderState>) => {
    Object.assign(internalState, newState);
    // Ensure chunks array is updated correctly
    if (newState.recordedChunks) {
        internalState.recordedChunks = newState.recordedChunks;
    }
    stateSubject.next({ ...internalState }); // Emit a new object instance
  };

  // Event listeners -> State updates
  fromEvent<BlobEvent>(recorder, 'dataavailable').pipe(takeUntil(destroySubject)).subscribe(event => {
    if (event.data.size > 0) {
      internalState.recordedChunks.push(event.data);
      dataSubject.next(event.data); // Emit individual chunks
      // Update state with the new chunks array reference
      updateState({ recordedChunks: internalState.recordedChunks });
    }
  });

  fromEvent(recorder, 'error').pipe(takeUntil(destroySubject)).subscribe(errorEvent => {
    console.error('MediaRecorder error:', errorEvent);
    updateState({ status: 'error', lastError: errorEvent });
    destroySubject.next(); // Ensure cleanup on error
    destroySubject.complete();
  });

  fromEvent(recorder, 'start').pipe(takeUntil(destroySubject)).subscribe(() => updateState({ status: 'recording', lastError: undefined, recordedChunks: [] }));
  fromEvent(recorder, 'stop').pipe(takeUntil(destroySubject)).subscribe(() => {
     updateState({ status: 'stopped' });
     if (stopTracksOnStop) {
         stream.getTracks().forEach(track => track.stop());
         console.log('MediaRecorder stopped and tracks stopped.');
     } else {
         console.log('MediaRecorder stopped.');
     }
     destroySubject.next(); // Signal completion on stop
     destroySubject.complete();
  });
  fromEvent(recorder, 'pause').pipe(takeUntil(destroySubject)).subscribe(() => updateState({ status: 'paused' }));
  fromEvent(recorder, 'resume').pipe(takeUntil(destroySubject)).subscribe(() => updateState({ status: 'recording' }));

  // Control functions
  const start = (timeslice?: number) => {
    if (recorder && recorder.state === 'inactive') {
       internalState.recordedChunks = []; // Clear chunks on new start
       recorder.start(timeslice);
    } else {
        console.warn(`Cannot start recorder in state: ${recorder?.state}`);
    }
  };
  const stop = () => {
    if (recorder && (recorder.state === 'recording' || recorder.state === 'paused')) {
      recorder.stop();
    }
  };
  const pause = () => {
    if (recorder && recorder.state === 'recording') {
      recorder.pause();
    }
  };
  const resume = () => {
    if (recorder && recorder.state === 'paused') {
      recorder.resume();
    }
  };
  const requestData = () => {
    if (recorder && recorder.state === 'recording') {
        recorder.requestData();
    }
  };

  const destroy = () => {
      if (recorder && recorder.state !== 'inactive') {
          recorder.stop(); // Ensure stop is called if active
      }
      if (stopTracksOnStop && recorder?.state === 'inactive') {
           // If already inactive but tracks shouldn't persist
           stream.getTracks().forEach(track => track.stop());
      }
      destroySubject.next();
      destroySubject.complete();
      stateSubject.complete();
      dataSubject.complete();
      recorder = null; // Release reference
      console.log('MediaRecorder controls destroyed.');
  };

  // Complete subjects when destroy signal is received
  destroySubject.subscribe(() => {
      stateSubject.complete();
      dataSubject.complete();
  });


  return {
    start,
    stop,
    pause,
    resume,
    requestData,
    state$: stateSubject.pipe(
        distinctUntilChanged((prev, curr) =>
            prev.status === curr.status &&
            prev.lastError === curr.lastError &&
            // Shallow compare chunks array length as a proxy for change
            prev.recordedChunks.length === curr.recordedChunks.length
        ),
        finalize(() => console.log("Recorder state observable finalized."))
    ),
    data$: dataSubject.pipe(
        takeUntil(destroySubject), // Ensure data stops when destroyed
        finalize(() => console.log("Recorder data observable finalized."))
    ),
    recorder,
    destroy,
  };
} 