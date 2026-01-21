import { createContext, type RefObject, useContext } from "react";
import type tunnel from "tunnel-rat";

import { type PixiSyntheticEventSystem } from "./pixi-synthetic-event-system";

/**
 * @internal
 */
export interface RenderContextValue {
  tunnel: ReturnType<typeof tunnel>;
  eventContainer: RefObject<HTMLDivElement>;
  pixiEvents: PixiSyntheticEventSystem | null;
  threeSceneTunnel: ReturnType<typeof tunnel>;
  pixiTextureTunnel: ReturnType<typeof tunnel>;
}

/**
 * @internal
 */
export const RenderContextValue = createContext<RenderContextValue | null>(
  null,
);

/**
 * @internal
 */
export function useRenderContext() {
  const context = useContext(RenderContextValue);
  if (context === null) {
    throw Error("useRenderContext() must be called within a <RenderContext />");
  }
  return context;
}
