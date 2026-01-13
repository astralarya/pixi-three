import { useRef } from "react";

import { useCanvasTreeOptional } from "./canvas-tree-context";

export interface UseRenderScheduleProps {
  fpsLimit?: number;
}

/**
 * @internal
 */
export function useRenderSchedule({ fpsLimit }: UseRenderScheduleProps = {}) {
  const minFrameTime = fpsLimit ? 1000 / fpsLimit : 0;
  const parentContext = useCanvasTreeOptional();
  const frameRequested = useRef(true);
  const lastFrameTime = useRef<number | undefined>(undefined);

  function isFrameRequested() {
    if (!frameRequested.current) {
      return false;
    }
    if (fpsLimit !== undefined && lastFrameTime.current !== undefined) {
      const elapsed = performance.now() - lastFrameTime.current;
      if (elapsed < minFrameTime) {
        return false;
      }
    }
    return true;
  }

  function invalidate() {
    frameRequested.current = true;
  }

  function signalFrame() {
    frameRequested.current = false;
    if (fpsLimit !== undefined) {
      lastFrameTime.current = performance.now();
    }
    parentContext?.invalidate();
  }

  return {
    isFrameRequested,
    invalidate,
    signalFrame,
  };
}
