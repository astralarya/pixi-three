import { useRef } from "react";

import { useCanvasTreeOptional } from "./canvas-tree-context";

export function useRenderSchedule() {
  const parentContext = useCanvasTreeOptional();
  const frameRequested = useRef(true);

  function invalidate() {
    frameRequested.current = true;
  }

  function clearFrameRequest() {
    frameRequested.current = false;
    parentContext?.invalidate();
  }

  return {
    frameRequested,
    invalidate,
    clearFrameRequest,
  };
}
