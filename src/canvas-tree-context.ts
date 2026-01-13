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
 * @returns The current canvas size.
 * @throws If called outside of a `<CanvasViewContent />`.
 */
export function useCanvasTree(): CanvasViewSize {
  const context = useContext(CanvasTreeContext);
  if (context === null) {
    throw Error(
      "useCanvasTree() must be called within a <CanvasViewContent />",
    );
  }
  const size = useSyncExternalStore(
    context.store.subscribe,
    context.store.getSnapshot,
  );
  return size;
}

/**
 * Hook that returns the invalidate function from the canvas tree context.
 * This triggers a re-render of the canvas when called.
 *
 * Unlike {@link useCanvasTree}, this hook does not subscribe to canvas
 * size changes, preventing unnecessary re-renders.
 *
 * @category hook
 * @returns The invalidate function, or a no-op if not within a canvas tree context
 */
export function useInvalidate(): () => void {
  const context = useContext(CanvasTreeContext);
  return context?.invalidate ?? (() => {});
}
