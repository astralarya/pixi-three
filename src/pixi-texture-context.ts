import { type EventHandlers } from "@react-three/fiber";
import { type Container, type Point } from "pixi.js";
import { createContext, type RefObject, useContext } from "react";
import { type Object3D, type Vector2 } from "three";
import type tunnel from "tunnel-rat";

import { useCanvasContext } from "./canvas-context-hooks";
import { useCanvasView } from "./canvas-view-context";
import { type PixiThreeEventBindOptions } from "./pixi-three-event-system";

export interface PixiTextureContextValue {
  width: number;
  height: number;
  sceneTunnel: ReturnType<typeof tunnel>;
  containerRef: RefObject<Container>;
  getAttachedObject: () => Object3D | undefined;
  hitTest: (x: number, y: number) => Container;
  mapUvToPoint: (point: Point, uv: Vector2) => void;
}

export const PixiTextureContext = createContext<PixiTextureContextValue | null>(
  null,
);

export function usePixiTextureContext() {
  const context = useContext(PixiTextureContext);
  if (context === null) {
    throw Error(
      "usePixiTextureContext() must be called within a <PixiTexture />",
    );
  }
  return context;
}

export function usePixiTextureContextOptional() {
  return useContext(PixiTextureContext);
}

export function usePixiTextureEvents(
  container:
    | RefObject<Container>
    | PixiThreeEventBindOptions
    | (RefObject<Container> | PixiThreeEventBindOptions)[],
  handlers?: EventHandlers,
) {
  const { pixiTextureEvents } = useCanvasContext();
  const { canvasRef } = useCanvasView();
  return pixiTextureEvents?.bind(canvasRef, container, handlers);
}
