import {
  type Container,
  EventBoundary,
  FederatedPointerEvent,
  FederatedWheelEvent,
  Point,
} from "pixi.js";
import { type RefObject, useState } from "react";

import { type PixiRootEvents } from "./pixi-synthetic-event-system";
import { useRenderContext } from "./render-context-hooks";

export interface UsePixiEventDispatchOptions {
  containerRef: RefObject<Container>;
  canvasRef: RefObject<HTMLCanvasElement | HTMLElement>;
}

export type UsePixiEventDispatchResult = (
  event: Event,
  point: Point | null,
) => void;

/**
 * Hook that manages Pixi event dispatch infrastructure.
 * Creates and manages the EventBoundary and root federated events,
 * and provides a dispatchEvent function for forwarding events to Pixi containers.
 *
 * @param options - The container and canvas refs
 * @returns The dispatch function
 */
export function usePixiEventDispatch({
  containerRef,
  canvasRef,
}: UsePixiEventDispatchOptions): UsePixiEventDispatchResult {
  const { pixiEvents } = useRenderContext();

  const [eventBoundary] = useState(() => new EventBoundary());
  const [rootEvents] = useState<PixiRootEvents>(() => ({
    pointerEvent: new FederatedPointerEvent(eventBoundary),
    wheelEvent: new FederatedWheelEvent(eventBoundary),
  }));

  function dispatchEvent(event: Event, point: Point | null) {
    if (!pixiEvents || !containerRef.current || !canvasRef.current) return;
    pixiEvents.dispatch(
      event,
      point,
      containerRef.current,
      eventBoundary,
      rootEvents,
      canvasRef.current as HTMLElement,
    );
  }

  return dispatchEvent;
}
