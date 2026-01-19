import { type EventHandlers } from "@react-three/fiber";
import { type Container, type Point } from "pixi.js";
import { createContext, type RefObject, useContext } from "react";
import { type Object3D, type Vector2 } from "three";
import type tunnel from "tunnel-rat";

import {
  mapPixiToUv as mapPixiToUvUtil,
  mapUvToPixi as mapUvToPixiUtil,
} from "./bijections";
import { useViewport } from "./canvas-tree-context";
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
  /**
   * Hit tests a point against the Pixi container tree.
   * @param x - X coordinate in Pixi texture space
   * @param y - Y coordinate in Pixi texture space
   * @returns The Container that was hit, or null if no hit
   */
  hitTest: (x: number, y: number) => Container;
  /**
   * Maps Three.js UV coordinates (0-1) to Pixi texture coordinates.
   * @param uv - Three.js UV Vector2 (0-1 range)
   * @param point - Pixi Point to store the result
   */
  mapUvToPixi: (uv: Vector2, point: Point) => void;
  /**
   * Maps Pixi texture coordinates to Three.js UV coordinates (0-1).
   * @param point - Pixi Point in texture space
   * @param uv - Three.js UV Vector2 to store the result
   */
  mapPixiToUv: (point: Point, uv: Vector2) => void;
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
 * Bijection for Pixi coordinates.
 */
export interface PixiContextBijections {
  /** Width of the Pixi container */
  width: number;
  /** Height of the Pixi container */
  height: number;
  /**
   * Maps Three.js UV coordinates (0-1) to Pixi coordinates.
   * @param uv - Three.js UV Vector2 (0-1 range)
   * @param point - Pixi Point to store the result
   */
  mapUvToPixi: (uv: Vector2, point: Point) => void;
  /**
   * Maps Pixi coordinates to Three.js UV coordinates (0-1).
   * @param point - Pixi Point in local coordinates
   * @param uv - Three.js UV Vector2 to store the result
   */
  mapPixiToUv: (point: Point, uv: Vector2) => void;
}

/**
 * Hook to access Pixi coordinate bijection functions.
 * Works in both PixiTexture (inside ThreeScene) and CanvasView contexts.
 *
 * When inside a PixiTexture, returns bijections for the texture dimensions.
 * When inside a CanvasView (but not PixiTexture), returns bijections for the canvas viewport.
 *
 * @category hook
 * @returns Bijection functions for coordinate mapping
 * @throws Error if called outside of a CanvasView
 */
export function usePixiContext(): PixiContextBijections {
  const textureContext = useContext(PixiTextureContext);
  const viewport = useViewport();

  if (textureContext) {
    return {
      width: textureContext.width,
      height: textureContext.height,
      mapUvToPixi: textureContext.mapUvToPixi,
      mapPixiToUv: textureContext.mapPixiToUv,
    };
  }

  const bounds = { width: viewport.width, height: viewport.height };
  return {
    width: viewport.width,
    height: viewport.height,
    mapUvToPixi: (uv: Vector2, point: Point) =>
      mapUvToPixiUtil(uv, point, bounds),
    mapPixiToUv: (point: Point, uv: Vector2) =>
      mapPixiToUvUtil(point, uv, bounds),
  };
}

/**
 * Hook for binding {@link https://r3f.docs.pmnd.rs/api/events | React Three Fiber Events}
 * to Pixi containers within a {@link PixiTexture}.
 *
 * @category hook
 * @param container - {@link https://pixijs.download/release/docs/scene.Container.html | Container}(s) or bind options
 * @param handlers - Optional event handlers to chain
 * @returns EventHandlers to bind to a react-three-fiber mesh
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
