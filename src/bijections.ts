import { type Bounds, type Point, type Rectangle } from "pixi.js";
import { type Vector2 } from "three";

/**
 * Bijection utilities for coordinate transformations between Pixi and Three.js coordinate spaces.
 *
 * Coordinate spaces:
 * - **Client Space**:
 * - **Pixi space**: Pixel coordinates within a container/texture (0 to width/height)
 * - **UV space**: Three.js texture coordinates (0 to 1, same as normalized)
 * - **NDC (Normalized Device Coordinates)**: Three.js viewport coordinates (-1 to 1)
 *
 * @module bijections
 */

/**
 * Maps UV coordinates (0-1) to Pixi pixel coordinates.
 *
 * @param uv - Three.js UV Vector2 (0-1 range)
 * @param point - The Pixi Point to store the result
 * @param bounds - The bounds to map within (width/height and optional x/y offset)
 */
export function mapUvToPixi(
  uv: Vector2,
  point: Point,
  bounds:
    | Rectangle
    | Bounds
    | { width: number; height: number; x?: number; y?: number },
): void {
  const bx = bounds.x ?? 0;
  const by = bounds.y ?? 0;
  point.x = uv.x * bounds.width + bx;
  point.y = uv.y * bounds.height + by;
}

/**
 * Maps Pixi pixel coordinates to UV coordinates (0-1).
 *
 * @param point - The Pixi Point in local coordinates
 * @param uv - Three.js UV Vector2 to store the result
 * @param bounds - The bounds to map within
 */
export function mapPixiToUv(
  point: Point,
  uv: Vector2,
  bounds:
    | Rectangle
    | Bounds
    | { width: number; height: number; x?: number; y?: number },
): void {
  const bx = bounds.x ?? 0;
  const by = bounds.y ?? 0;
  uv.x = (point.x - bx) / bounds.width;
  uv.y = (point.y - by) / bounds.height;
}

/**
 * Maps a Pixi Point to Three.js NDC coordinates (-1 to 1).
 *
 * @param point - The Pixi Point in local coordinates
 * @param ndc - Vector2 to store the NDC result
 * @param bounds - The bounds to normalize within
 */
export function mapPixiToNdc(
  point: Point,
  ndc: Vector2,
  bounds:
    | Rectangle
    | Bounds
    | { width: number; height: number; x?: number; y?: number },
): void {
  const bx = bounds.x ?? 0;
  const by = bounds.y ?? 0;
  const normalizedX = (point.x - bx) / bounds.width;
  const normalizedY = (point.y - by) / bounds.height;
  ndc.x = normalizedX * 2 - 1;
  ndc.y = -(normalizedY * 2 - 1);
}

/**
 * Maps Three.js NDC coordinates (-1 to 1) to a Pixi Point.
 *
 * @param ndc - Vector2 with NDC coordinates (-1 to 1)
 * @param point - The Pixi Point to store the result
 * @param bounds - The bounds to map within
 */
export function mapNdcToPixi(
  ndc: Vector2,
  point: Point,
  bounds:
    | Rectangle
    | Bounds
    | { width: number; height: number; x?: number; y?: number },
): void {
  const bx = bounds.x ?? 0;
  const by = bounds.y ?? 0;
  const normalizedX = (ndc.x + 1) / 2;
  const normalizedY = (-ndc.y + 1) / 2;
  point.x = normalizedX * bounds.width + bx;
  point.y = normalizedY * bounds.height + by;
}

/**
 * Maps UV coordinates (0-1) to Three.js NDC coordinates (-1 to 1).
 *
 * @param uv - Vector2 with UV coordinates (0-1)
 * @param ndc - Vector2 to store the NDC result
 */
export function mapUvToNdc(uv: Vector2, ndc: Vector2): void {
  ndc.x = uv.x * 2 - 1;
  ndc.y = -(uv.y * 2 - 1);
}

/**
 * Maps DOM client coordinates directly to Pixi pixel coordinates within a viewport.
 *
 * @param clientX - DOM clientX coordinate
 * @param clientY - DOM clientY coordinate
 * @param rect - The element's bounding rect
 * @param viewport - The viewport dimensions
 * @returns Pixi coordinates as { x: number, y: number }
 */
export function mapClientToViewport(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  viewport: { width: number; height: number },
): { x: number; y: number } {
  const normalizedX = (clientX - rect.left) / rect.width;
  const normalizedY = (clientY - rect.top) / rect.height;
  return {
    x: normalizedX * viewport.width,
    y: normalizedY * viewport.height,
  };
}
