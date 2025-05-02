import { Observable, Subject, fromEvent, BehaviorSubject } from "rxjs";
import {
  map,
  share,
  takeUntil,
  tap,
  filter,
  startWith,
  distinctUntilChanged,
  finalize,
} from "rxjs/operators";

declare global {
  interface MediaRecorderOptions {
    bitsPerSecond?: number;
    audioBitrateMode?: "constant" | "variable";
  }

  interface MediaRecorder {
    readonly audioBitrateMode?: "constant" | "variable";
  }
}

/**
 * Checks if the MediaStream Recording API (MediaRecorder) is likely supported.
 * @returns `true` if `window.MediaRecorder` exists, `false` otherwise.
 */
export function isMediaRecorderSupported(): boolean {
  return (
    typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined"
  );
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
  status: "inactive" | "recording" | "paused" | "stopped" | "error";
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

const defaultRecorderState: Omit<MediaRecorderState, "isSupported"> = {
  status: "inactive",
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
  } = {},
): MediaRecorderControls | null {
  if (!isMediaRecorderSupported()) {
    console.warn("MediaRecorder API is not supported.");
    const stateSubject = new BehaviorSubject<MediaRecorderState>({
      ...defaultRecorderState,
      isSupported: false,
    });
    return {
      start: () => console.warn("MediaRecorder not supported."),
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

  const recorderOptions = options.recorderOptions;
  const stopTracksOnStop = options.stopTracksOnStop ?? false;

  let recorder: MediaRecorder | null = null;
  try {
    recorder = new window.MediaRecorder!(stream, recorderOptions);
  } catch (err: any) {
    console.error("Failed to create MediaRecorder:", err);
    const stateSubject = new BehaviorSubject<MediaRecorderState>({
      ...defaultRecorderState,
      status: "error",
      lastError: err,
      isSupported: true,
    });
    return {
      start: () => console.error("MediaRecorder creation failed."),
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

    if (newState.recordedChunks) {
      internalState.recordedChunks = newState.recordedChunks;
    }
    stateSubject.next({ ...internalState });
  };

  fromEvent<BlobEvent>(recorder, "dataavailable")
    .pipe(takeUntil(destroySubject))
    .subscribe((event) => {
      if (event.data.size > 0) {
        internalState.recordedChunks.push(event.data);
        dataSubject.next(event.data);

        updateState({ recordedChunks: internalState.recordedChunks });
      }
    });

  fromEvent(recorder, "error")
    .pipe(takeUntil(destroySubject))
    .subscribe((errorEvent) => {
      console.error("MediaRecorder error:", errorEvent);
      updateState({ status: "error", lastError: errorEvent });
      destroySubject.next();
      destroySubject.complete();
    });

  fromEvent(recorder, "start")
    .pipe(takeUntil(destroySubject))
    .subscribe(() =>
      updateState({
        status: "recording",
        lastError: undefined,
        recordedChunks: [],
      }),
    );
  fromEvent(recorder, "stop")
    .pipe(takeUntil(destroySubject))
    .subscribe(() => {
      updateState({ status: "stopped" });
      if (stopTracksOnStop) {
        stream.getTracks().forEach((track) => track.stop());
      } else {
      }
      destroySubject.next();
      destroySubject.complete();
    });
  fromEvent(recorder, "pause")
    .pipe(takeUntil(destroySubject))
    .subscribe(() => updateState({ status: "paused" }));
  fromEvent(recorder, "resume")
    .pipe(takeUntil(destroySubject))
    .subscribe(() => updateState({ status: "recording" }));

  const start = (timeslice?: number) => {
    if (recorder && recorder.state === "inactive") {
      internalState.recordedChunks = [];
      recorder.start(timeslice);
    } else {
      console.warn(`Cannot start recorder in state: ${recorder?.state}`);
    }
  };
  const stop = () => {
    if (
      recorder &&
      (recorder.state === "recording" || recorder.state === "paused")
    ) {
      recorder.stop();
    }
  };
  const pause = () => {
    if (recorder && recorder.state === "recording") {
      recorder.pause();
    }
  };
  const resume = () => {
    if (recorder && recorder.state === "paused") {
      recorder.resume();
    }
  };
  const requestData = () => {
    if (recorder && recorder.state === "recording") {
      recorder.requestData();
    }
  };

  const destroy = () => {
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    if (stopTracksOnStop && recorder?.state === "inactive") {
      stream.getTracks().forEach((track) => track.stop());
    }
    destroySubject.next();
    destroySubject.complete();
    stateSubject.complete();
    dataSubject.complete();
    recorder = null;
  };

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
      distinctUntilChanged(
        (prev, curr) =>
          prev.status === curr.status &&
          prev.lastError === curr.lastError &&
          prev.recordedChunks.length === curr.recordedChunks.length,
      ),
      finalize(() => console.log("Recorder state observable finalized.")),
    ),
    data$: dataSubject.pipe(
      takeUntil(destroySubject),
      finalize(() => console.log("Recorder data observable finalized.")),
    ),
    recorder,
    destroy,
  };
}
