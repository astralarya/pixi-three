import { type EventHandlers } from "@react-three/fiber";
import { type Container, type Point } from "pixi.js";
import { createContext, type RefObject, useContext } from "react";
import { type Object3D, type Vector2 } from "three";
import type tunnel from "tunnel-rat";

import { useCanvasView } from "./canvas-view-context";
import { type PixiThreeEventBindOptions } from "./pixi-three-event-system";
import { useRenderContext } from "./render-context-hooks";

/** @internal */
export interface PixiTextureContextValue {
  width: number;
  height: number;
  sceneTunnel: ReturnType<typeof tunnel>;
  containerRef: RefObject<Container>;
  getAttachedObject: () => Object3D | undefined;
  hitTest: (x: number, y: number) => Container;
  mapUvToPoint: (point: Point, uv: Vector2) => void;
}

/** @internal */
export const PixiTextureContext = createContext<PixiTextureContextValue | null>(
  null,
);

/** @internal */
export function usePixiTextureContext() {
  const context = useContext(PixiTextureContext);
  if (context === null) {
    throw Error(
      "usePixiTextureContext() must be called within a <PixiTexture />",
    );
  }
  return context;
}

/** @internal */
export function usePixiTextureContextOptional() {
  return useContext(PixiTextureContext);
}

/**
 * Hook for binding Three.js events to Pixi containers within a PixiTexture.
 *
 * @param container - {@link https://pixijs.download/release/docs/scene.Container.html | Container}(s) or bind options
 * @param handlers - Optional event handlers to chain
 * @returns EventHandlers to bind to a react-three-fiber mesh
 * @see {@link https://r3f.docs.pmnd.rs/api/events | React Three Fiber Events}
 */
export function usePixiTextureEvents(
  container:
    | RefObject<Container>
    | PixiThreeEventBindOptions
    | (RefObject<Container> | PixiThreeEventBindOptions)[],
  handlers?: EventHandlers,
) {
  const { pixiTextureEvents } = useRenderContext();
  const { canvasRef } = useCanvasView();
  return pixiTextureEvents?.bind(canvasRef, container, handlers);
}
