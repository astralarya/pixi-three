import { type Container, Point } from "pixi.js";
import { createContext, type RefObject, useContext } from "react";
import { type Object3D, type Vector2 } from "three";

import {
  mapPixiToUv as mapPixiToUvUtil,
  mapUvToPixi as mapUvToPixiUtil,
  type UvTrace,
} from "./bijections";
import { useViewport } from "./canvas-tree-context";
import { useCanvasView } from "./canvas-view-context";

/** @internal */
export interface PixiTextureContextValue {
  width: number;
  height: number;
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
   * @param out - Optional Pixi Point to store the result
   * @returns The Pixi Point
   */
  mapUvToPixi: (uv: Vector2, out?: Point) => Point;
  /**
   * Maps Pixi texture coordinates to Three.js UV coordinates (0-1).
   * @param point - Pixi Point in texture space
   * @param out - Optional Three.js UV Vector2 to store the result
   * @returns The UV Vector2
   */
  mapPixiToParentUv: (point: Point, out?: Vector2) => Vector2;
  /**
   * Maps Pixi texture coordinates to local coordinates on the parent Three mesh surface.
   * @param point - Pixi Point in texture space
   * @returns Array of results with position/normal in local mesh coords
   */
  tracePixiToParentThreeLocal: (point: Point) => UvTrace[];
  /**
   * Maps Pixi texture coordinates to world coordinates in the parent Three scene.
   * @param point - Pixi Point in texture space
   * @returns Array of results with position/normal in parent world coords
   */
  tracePixiToParentThree: (point: Point) => UvTrace[];
  /**
   * Maps Pixi texture coordinates to global Pixi parent coordinates.
   * Returns array of Points since UV can map to multiple mesh positions.
   * @param point - Pixi Point in texture space
   * @param out - Optional Point to store the first result
   * @returns Array of Points in global Pixi parent coords
   */
  mapPixiToParentPixi: (point: Point, out?: Point) => Point[];
  /**
   * Maps local Pixi coordinates to CanvasView viewport coordinates.
   * Returns array of Points since UV can map to multiple mesh positions.
   * @param localPoint - Pixi Point in local texture coordinates
   * @param out - Optional Point to store the first result
   * @returns Array of Points in viewport coords
   */
  mapPixiToViewport: (localPoint: Point, out?: Point) => Point[];
  /**
   * Maps local Pixi coordinates to DOM client coordinates.
   * Returns array of Points since UV can map to multiple mesh positions.
   * @param localPoint - Pixi Point in local texture coordinates
   * @param out - Optional Point to store the first result
   * @returns Array of Points in client coords
   */
  mapPixiToClient: (localPoint: Point, out?: Point) => Point[];
  /**
   * Maps DOM client coordinates to local Pixi texture coordinates.
   * @param client - DOM client coordinates
   * @param out - Optional Point to store the result
   * @returns The point if hit, null otherwise
   */
  mapClientToPixi: (
    client: Point | { clientX: number; clientY: number },
    out?: Point,
  ) => Point | null;
  /**
   * Maps viewport coordinates to local Pixi texture coordinates.
   * @param viewport - Viewport Point coordinates
   * @param out - Optional Point to store the result
   * @returns The point if hit, null otherwise
   */
  mapViewportToPixi: (viewport: Point, out?: Point) => Point | null;
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
 * Parent Three context for coordinate mapping from PixiTexture to parent Three scene.
 * Only available inside a PixiTexture context.
 *
 * @category hook
 * @expand
 */
export interface PixiViewParentThreeContextValue {
  /**
   * Maps Pixi texture coordinates to local coordinates on the parent Three mesh surface.
   * @param point - Pixi Point in texture space
   * @returns Array of results with position/normal in local mesh coords
   */
  tracePixiToParentThreeLocal: (point: Point) => UvTrace[];
  /**
   * Maps Pixi texture coordinates to world coordinates in the parent Three scene.
   * @param point - Pixi Point in texture space
   * @returns Array of results with position/normal in parent world coords
   */
  tracePixiToParentThree: (point: Point) => UvTrace[];
  /**
   * Maps Pixi texture coordinates to global Pixi parent coordinates.
   * Returns array of Points since UV can map to multiple mesh positions.
   * @param point - Pixi Point in texture space
   * @param out - Optional Point to store the first result
   * @returns Array of Points in global Pixi parent coords
   */
  mapPixiToParentPixi: (point: Point, out?: Point) => Point[];
}

/**
 * Context value for Pixi view coordinate mapping.
 * Works in PixiTexture (inside ThreeScene) and CanvasView.
 *
 * @category hook
 * @expand
 */
export interface PixiViewContextValue {
  /** Width of the Pixi container */
  width: number;
  /** Height of the Pixi container */
  height: number;
  /**
   * Maps Three.js UV coordinates (0-1) to Pixi coordinates.
   * @param uv - Three.js UV Vector2 (0-1 range)
   * @param out - Optional Pixi Point to store the result
   * @returns The Pixi Point
   */
  mapUvToPixi: (uv: Vector2, out?: Point) => Point;
  /**
   * Maps Pixi coordinates to Three.js UV coordinates (0-1).
   * @param point - Pixi Point in local coordinates
   * @param out - Optional Three.js UV Vector2 to store the result
   * @returns The UV Vector2
   */
  mapPixiToUv: (point: Point, out?: Vector2) => Vector2;
  /**
   * Maps local Pixi coordinates to CanvasView viewport coordinates.
   * When inside PixiTexture, returns array of Points (UV can map to multiple positions).
   * When inside CanvasView directly, returns single-element array (direct mapping).
   * @param localPoint - Pixi Point in local coordinates
   * @param out - Optional Point to store the first result
   * @returns Array of Points in viewport coords
   */
  mapPixiToViewport: (localPoint: Point, out?: Point) => Point[];
  /**
   * Maps local Pixi coordinates to DOM client coordinates.
   * When inside PixiTexture, returns array of Points (UV can map to multiple positions).
   * When inside CanvasView directly, returns single-element array (direct mapping).
   * @param localPoint - Pixi Point in local coordinates
   * @param out - Optional Point to store the first result
   * @returns Array of Points in client coords
   */
  mapPixiToClient: (localPoint: Point, out?: Point) => Point[];
  /**
   * Maps DOM client coordinates to local Pixi coordinates.
   * @param client - DOM client coordinates
   * @param out - Optional Point to store the result
   * @returns The point if hit, null otherwise
   */
  mapClientToPixi: (
    client: Point | { clientX: number; clientY: number },
    out?: Point,
  ) => Point | null;
  /**
   * Maps viewport coordinates to local Pixi coordinates.
   * @param viewport - Viewport Point coordinates
   * @param out - Optional Point to store the result
   * @returns The point if hit, null otherwise
   */
  mapViewportToPixi: (viewport: Point, out?: Point) => Point | null;
  /**
   * Parent Three coordinate mapping functions.
   * Only available inside a PixiTexture context.
   */
  parentThree?: PixiViewParentThreeContextValue;
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
export function usePixiViewContext(): PixiViewContextValue {
  const textureContext = useContext(PixiTextureContext);
  const viewport = useViewport();
  const { containerRef, mapViewportToClient, mapClientToViewport } =
    useCanvasView();

  if (textureContext) {
    return {
      width: textureContext.width,
      height: textureContext.height,
      mapUvToPixi: textureContext.mapUvToPixi,
      mapPixiToUv: textureContext.mapPixiToParentUv,
      mapPixiToViewport: textureContext.mapPixiToViewport,
      mapPixiToClient: textureContext.mapPixiToClient,
      mapClientToPixi: textureContext.mapClientToPixi,
      mapViewportToPixi: textureContext.mapViewportToPixi,
      parentThree: {
        tracePixiToParentThreeLocal: textureContext.tracePixiToParentThreeLocal,
        tracePixiToParentThree: textureContext.tracePixiToParentThree,
        mapPixiToParentPixi: textureContext.mapPixiToParentPixi,
      },
    };
  }

  const _viewportPoint = new Point();
  const bounds = { width: viewport.width, height: viewport.height };
  return {
    width: viewport.width,
    height: viewport.height,
    mapUvToPixi: (uv: Vector2, out?: Point) => mapUvToPixiUtil(uv, bounds, out),
    mapPixiToUv: (point: Point, out?: Vector2) =>
      mapPixiToUvUtil(point, bounds, out),
    mapPixiToViewport: (localPoint: Point, out?: Point) => {
      const result = out ?? new Point();
      containerRef.current.toGlobal(localPoint, result);
      return [result];
    },
    mapPixiToClient: (localPoint: Point, out?: Point) => {
      containerRef.current.toGlobal(localPoint, _viewportPoint);
      return [mapViewportToClient(_viewportPoint, out)];
    },
    mapClientToPixi: (
      client: Point | { clientX: number; clientY: number },
      out?: Point,
    ) => {
      mapClientToViewport(client, _viewportPoint);
      const result = out ?? new Point();
      containerRef.current.toLocal(_viewportPoint, undefined, result);
      return result;
    },
    mapViewportToPixi: (viewportPoint: Point, out?: Point) => {
      const result = out ?? new Point();
      containerRef.current.toLocal(viewportPoint, undefined, result);
      return result;
    },
  };
}
