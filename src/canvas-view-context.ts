import { type Container } from "pixi.js";
import { createContext, type RefObject, useContext } from "react";

/** @internal */
export interface CanvasViewContextValue {
  canvasRef: RefObject<HTMLCanvasElement>;
  containerRef: RefObject<Container>;
}

/** @internal */
export const CanvasViewContext = createContext<CanvasViewContextValue | null>(
  null,
);

/** @internal */
export function useCanvasView() {
  const context = useContext(CanvasViewContext);
  if (context === null) {
    throw Error("useCanvasView() must be called within a <CanvasView />");
  }
  return context;
}
