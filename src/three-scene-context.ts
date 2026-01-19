import { type Container, type Point } from "pixi.js";
import { createContext, type RefObject, useContext } from "react";
import { type Vector2 } from "three";
import type tunnel from "tunnel-rat";

/**
 * Context value for ThreeScene, providing coordinate mapping utilities.
 * @category context
 */
export interface ThreeSceneContextValue {
  /** @internal */
  containerRef: RefObject<Container>;
  /** @internal */
  sceneTunnel: ReturnType<typeof tunnel>;
  /**
   * Maps a Pixi Point (in local sprite coordinates) to Three.js NDC coordinates (-1 to 1).
   * @param point - Pixi Point in local coordinates
   * @param ndc - Vector2 to store the NDC result
   */
  mapPixiToNdc: (point: Point, ndc: Vector2) => void;
  /**
   * Maps Three.js NDC coordinates (-1 to 1) to a Pixi Point (in local sprite coordinates).
   * @param ndc - Vector2 with NDC coordinates
   * @param point - Pixi Point to store the result
   */
  mapNdcToPixi: (ndc: Vector2, point: Point) => void;
}

/** @internal */
export const ThreeSceneContext = createContext<ThreeSceneContextValue | null>(
  null,
);

/**
 * Hook to access the Three.js scene context.
 * Provides coordinate mapping utilities between Pixi and Three.js coordinate spaces.
 *
 * @category hook
 * @returns ThreeSceneContextValue with bijection functions for coordinate mapping
 * @throws Error if called outside of a ThreeScene component
 */
export function useThreeSceneContext() {
  const context = useContext(ThreeSceneContext);
  if (context === null) {
    throw Error(
      "useThreeSceneContext() must be called within a <ThreeScene />",
    );
  }
  return context;
}
