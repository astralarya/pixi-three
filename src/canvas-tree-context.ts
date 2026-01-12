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

export function useCanvasTree() {
  const context = useContext(CanvasTreeContext);
  if (context === null) {
    throw Error(
      "useCanvasTree() must be called within a <CanvasViewContent />",
    );
  }
  const { store, ...rest } = context;
  const size = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return { size, ...rest };
}
