import { createContext, useContext, useRef, useSyncExternalStore } from "react";

export interface CanvasViewSize {
  width: number;
  height: number;
  resolution: number;
}

export interface CanvasTreeStore {
  subscribe: (callback: (size: CanvasViewSize) => void) => () => void;
  getSnapshot: () => CanvasViewSize;
  updateSnapshot: (update: Partial<CanvasViewSize>) => void;
  notifySubscribers: () => void;
}

export interface CanvasTreeContextValue {
  store: CanvasTreeStore;
  invalidate: () => void;
}

export const CanvasTreeContext = createContext<CanvasTreeContextValue | null>(
  null,
);

/**
 * Return value of {@link useCanvasTree} and {@link useCanvasTreeOptional}.
 */
export interface UseCanvasTreeValue {
  /** The current canvas size and resolution. */
  size: CanvasViewSize;
  /** Triggers a re-render of the canvas. */
  invalidate: () => void;
}

const noopStore: CanvasTreeStore = {
  subscribe: () => () => {},
  getSnapshot: () => ({ width: 0, height: 0, resolution: 1 }),
  updateSnapshot: () => {},
  notifySubscribers: () => {},
};

/**
 * Canvas Tree store
 * @internal
 */
export function useCanvasTreeStore(): CanvasTreeStore {
  const subscribers = useRef(new Set<(size: CanvasViewSize) => void>());
  const sizeSnapshot = useRef<CanvasViewSize>({
    width: 0,
    height: 0,
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
 * @category hook
 * @returns The canvas tree context if available, or `null` if not within a `<CanvasViewContent />`.
 */
export function useCanvasTreeOptional(): UseCanvasTreeValue | null {
  const context = useContext(CanvasTreeContext);
  const store = context?.store ?? noopStore;
  const size = useSyncExternalStore(store.subscribe, store.getSnapshot);
  if (context === null) {
    return null;
  }
  return { size, invalidate: context.invalidate };
}

/**
 * @category hook
 * @returns The canvas tree context.
 * @throws If called outside of a `<CanvasViewContent />`.
 */
export function useCanvasTree(): UseCanvasTreeValue {
  const context = useCanvasTreeOptional();
  if (context === null) {
    throw Error(
      "useCanvasTree() must be called within a <CanvasViewContent />",
    );
  }
  return context;
}
