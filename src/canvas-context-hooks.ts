import { type useApplication } from "@pixi/react";
import { createContext, type RefObject, useContext } from "react";
import type tunnel from "tunnel-rat";

import { type PixiDomEventSystem } from "./pixi-dom-event-system";
import { type PixiThreeEventSystem } from "./pixi-three-event-system";

/**
 * @internal
 */
export interface CanvasContextValue {
  tunnel: ReturnType<typeof tunnel>;
  eventContainer: RefObject<HTMLDivElement>;
  pixiDomEvents: PixiDomEventSystem | null;
  threeSceneTunnel: ReturnType<typeof tunnel>;
  pixiTextureTunnel: ReturnType<typeof tunnel>;
  pixiTextureEvents: PixiThreeEventSystem | null;
  setPixiApplication: (x: ReturnType<typeof useApplication> | null) => void;
}

/**
 * @internal
 */
export const CanvasContextValue = createContext<CanvasContextValue | null>(
  null,
);

/**
 * @internal
 */
export function useCanvasContext() {
  const context = useContext(CanvasContextValue);
  if (context === null) {
    throw Error(
      "useCanvasViewContext() must be called within a <CanvasViewContext />",
    );
  }
  return context;
}
