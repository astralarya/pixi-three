import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";

/**
 * @category hook
 * @expand
 */
export interface CanvasViewSize {
  width: number;
  height: number;
  resolution: number;
}

interface CanvasTreeStore {
  subscribe: (callback: (size: CanvasViewSize) => void) => () => void;
  getSnapshot: () => CanvasViewSize;
  updateSnapshot: (update: Partial<CanvasViewSize>) => void;
  notifySubscribers: () => void;
}

/** @internal */
export interface CanvasTreeContextValue {
  store: CanvasTreeStore;
  invalidate: () => void;
}

/** @internal */
export const CanvasTreeContext = createContext<CanvasTreeContextValue | null>(
  null,
);

/** @internal */
export function useCanvasTreeStore(): CanvasTreeStore {
  const subscribers = useRef(new Set<(size: CanvasViewSize) => void>());
  const sizeSnapshot = useRef<CanvasViewSize>({
    width: 1,
    height: 1,
    resolution: window.devicePixelRatio,
  });

  const storeRef = {
    subscribe(callback: (size: CanvasViewSize) => void) {
      subscribers.current.add(callback);
      return () => {
        subscribers.current.delete(callback);
      };
    },
    getSnapshot() {
      return sizeSnapshot.current;
    },
    updateSnapshot(update: Partial<CanvasViewSize>) {
      sizeSnapshot.current = { ...sizeSnapshot.current, ...update };
    },
    notifySubscribers() {
      subscribers.current.forEach((callback) => {
        callback(sizeSnapshot.current);
      });
    },
  };

  return storeRef;
}

/**
 * Hook for accessing the current viewport size from the nearest
 * {@link CanvasView}, {@link ThreeScene}, {@link ThreeRenderTexture}, {@link PixiTexture}.
 *
 * @category hook
 * @returns The current viewport size
 * @throws If called outside of a {@link CanvasView}
 */
export function useViewport(): CanvasViewSize {
  const context = useContext(CanvasTreeContext);
  if (context === null) {
    throw Error("useViewport() must be called within a <CanvasView />");
  }
  const size = useSyncExternalStore(
    context.store.subscribe,
    context.store.getSnapshot,
  );
  return size;
}

/**
 * The invalidate function for nearest canvas tree context.
 * This triggers a re-render when called.
 *
 * @category hook
 * @returns The invalidate function or noop with no context
 */
export function useInvalidate(): () => void {
  const context = useContext(CanvasTreeContext);
  return context?.invalidate ?? (() => {});
}

/**
 * Hook that invalidates every time the component renders.
 *
 * @category hook
 */
export function useEffectInvalidate() {
  const invalidate = useInvalidate();
  useEffect(invalidate);
}
