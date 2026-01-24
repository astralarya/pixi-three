import { type Bounds, Point, type Rectangle } from "pixi.js";
import {
  BufferGeometry,
  type Camera,
  Float32BufferAttribute,
  type Mesh,
  Triangle,
  Vector2,
  Vector3,
} from "three";
import { MeshBVH } from "three-mesh-bvh";

/**
 * Bijections and related utilities for coordinate transformations
 *
 * @module bijections
 */

/**
 * Maps UV coordinates (0-1) to Pixi pixel coordinates.
 *
 * @category bijection
 * @param uv - Three.js UV Vector2 (0-1 range)
 * @param bounds - The bounds to map within (width/height and optional x/y offset)
 * @param out - Optional Pixi Point to store the result
 * @returns The Pixi Point
 */
export function mapUvToPixi(
  uv: Vector2,
  bounds:
    | Rectangle
    | Bounds
    | { width: number; height: number; x?: number; y?: number },
  out?: Point,
): Point {
  const result = out ?? new Point();
  const bx = bounds.x ?? 0;
  const by = bounds.y ?? 0;
  result.x = uv.x * bounds.width + bx;
  result.y = uv.y * bounds.height + by;
  return result;
}

/**
 * Maps Pixi pixel coordinates to UV coordinates (0-1).
 *
 * @category bijection
 * @param point - The Pixi Point in local coordinates
 * @param bounds - The bounds to map within
 * @param out - Optional Three.js UV Vector2 to store the result
 * @returns The UV Vector2
 */
export function mapPixiToUv(
  point: Point,
  bounds:
    | Rectangle
    | Bounds
    | { width: number; height: number; x?: number; y?: number },
  out?: Vector2,
): Vector2 {
  const result = out ?? new Vector2();
  const bx = bounds.x ?? 0;
  const by = bounds.y ?? 0;
  result.x = (point.x - bx) / bounds.width;
  result.y = (point.y - by) / bounds.height;
  return result;
}

/**
 * Maps a Pixi Point to Three.js NDC coordinates (-1 to 1).
 *
 * @category bijection
 * @param point - The Pixi Point in local coordinates
 * @param bounds - The bounds to normalize within
 * @param out - Optional Vector2 to store the NDC result
 * @returns The NDC Vector2
 */
export function mapPixiToNdc(
  point: Point,
  bounds:
    | Rectangle
    | Bounds
    | { width: number; height: number; x?: number; y?: number },
  out?: Vector2,
): Vector2 {
  const result = out ?? new Vector2();
  const bx = bounds.x ?? 0;
  const by = bounds.y ?? 0;
  const normalizedX = (point.x - bx) / bounds.width;
  const normalizedY = (point.y - by) / bounds.height;
  result.x = normalizedX * 2 - 1;
  result.y = -(normalizedY * 2 - 1);
  return result;
}

/**
 * Maps Three.js NDC coordinates (-1 to 1) to a Pixi Point.
 *
 * @category bijection
 * @param ndc - Vector2 with NDC coordinates (-1 to 1)
 * @param bounds - The bounds to map within
 * @param out - Optional Pixi Point to store the result
 * @returns The Pixi Point
 */
export function mapNdcToPixi(
  ndc: Vector2,
  bounds:
    | Rectangle
    | Bounds
    | { width: number; height: number; x?: number; y?: number },
  out?: Point,
): Point {
  const result = out ?? new Point();
  const bx = bounds.x ?? 0;
  const by = bounds.y ?? 0;
  const normalizedX = (ndc.x + 1) / 2;
  const normalizedY = (-ndc.y + 1) / 2;
  result.x = normalizedX * bounds.width + bx;
  result.y = normalizedY * bounds.height + by;
  return result;
}

/**
 * Maps UV coordinates (0-1) to Three.js NDC coordinates (-1 to 1).
 *
 * @category bijection
 * @param uv - Vector2 with UV coordinates (0-1)
 * @param out - Optional Vector2 to store the NDC result
 * @returns The NDC Vector2
 */
export function mapUvToNdc(uv: Vector2, out?: Vector2): Vector2 {
  const result = out ?? new Vector2();
  result.x = uv.x * 2 - 1;
  result.y = -(uv.y * 2 - 1);
  return result;
}

/**
 * Maps Three.js NDC coordinates (-1 to 1) to UV coordinates (0-1).
 *
 * @category bijection
 * @param ndc - Vector2 with NDC coordinates (-1 to 1)
 * @param out - Optional Vector2 to store the UV result
 * @returns The UV Vector2
 */
export function mapNdcToUv(ndc: Vector2, out?: Vector2): Vector2 {
  const result = out ?? new Vector2();
  result.x = (ndc.x + 1) / 2;
  result.y = (-ndc.y + 1) / 2;
  return result;
}

/**
 * Maps DOM client coordinates directly to Pixi pixel coordinates within a viewport.
 *
 * @category bijection
 * @param client - DOM client coordinates
 * @param rect - The element's bounding rect
 * @param viewport - The viewport dimensions
 * @param out - Optional Pixi Point to store the result
 * @returns The viewport Point
 */
export function mapClientToViewport(
  client: Point | { clientX: number; clientY: number },
  rect: { left: number; top: number; width: number; height: number },
  viewport: { width: number; height: number },
  out?: Point,
): Point {
  const result = out ?? new Point();
  const clientX = "clientX" in client ? client.clientX : client.x;
  const clientY = "clientY" in client ? client.clientY : client.y;
  const normalizedX = (clientX - rect.left) / rect.width;
  const normalizedY = (clientY - rect.top) / rect.height;
  result.x = normalizedX * viewport.width;
  result.y = normalizedY * viewport.height;
  return result;
}

/**
 * Maps Pixi pixel coordinates within a viewport to DOM client coordinates.
 *
 * @category bijection
 * @param viewportPoint - Pixi Point in viewport coordinates
 * @param viewport - The viewport dimensions
 * @param rect - The element's bounding rect
 * @param out - Optional Point to store the client coordinates
 * @returns The client Point
 */
export function mapViewportToClient(
  viewportPoint: Point | { x: number; y: number },
  viewport: { width: number; height: number },
  rect: { left: number; top: number; width: number; height: number },
  out?: Point,
): Point {
  const result = out ?? new Point();
  const normalizedX = viewportPoint.x / viewport.width;
  const normalizedY = viewportPoint.y / viewport.height;
  result.x = normalizedX * rect.width + rect.left;
  result.y = normalizedY * rect.height + rect.top;
  return result;
}

declare module "three" {
  interface BufferGeometry {
    uvBoundsTree?: MeshBVH;
  }
}

/**
 * Gets or creates a Bounding Volume Hierarchy (BVH) for UV-space lookups on the given geometry.
 * The BVH treats UV coordinates as 2D positions (z=0).
 *
 * @category bijection
 * @param geometry - The BufferGeometry for the UV BVH
 * @returns The UV-space MeshBVH
 */
export function getOrCreateUvBvh(geometry: BufferGeometry): MeshBVH {
  if (geometry.uvBoundsTree) {
    return geometry.uvBoundsTree;
  }

  const uvAttr = geometry.getAttribute("uv");
  if (!uvAttr) {
    throw new Error("Geometry must have UV coordinates");
  }

  const index = geometry.index;
  const vertexCount = uvAttr.count;

  const uvGeometry = new BufferGeometry();
  const positions = new Float32Array(vertexCount * 3);

  for (let i = 0; i < vertexCount; i++) {
    positions[i * 3] = uvAttr.getX(i);
    positions[i * 3 + 1] = uvAttr.getY(i);
    positions[i * 3 + 2] = 0;
  }

  uvGeometry.setAttribute("position", new Float32BufferAttribute(positions, 3));

  if (index) {
    uvGeometry.setIndex(index.clone());
  }

  const bvh = new MeshBVH(uvGeometry);
  geometry.uvBoundsTree = bvh;

  return bvh;
}

/**
 * Clears the cached UV BVH from a geometry. Call this if UV coordinates change.
 *
 * @category bijection
 * @param geometry - The BufferGeometry to clear the UV BVH from
 */
export function disposeUvBvh(geometry: BufferGeometry): void {
  if (geometry.uvBoundsTree) {
    geometry.uvBoundsTree.geometry.dispose();
    geometry.uvBoundsTree = undefined;
  }
}

/**
 * UV trace to 3D coordinates.
 * @category bijection
 */
export interface UvTrace {
  position: Vector3;
  normal: Vector3;
  faceIndex: number;
  barycentric: Vector3;
}

const _queryPoint = new Vector3();
const _uvPoint = new Vector3();

/**
 * Maps UV coordinates on a mesh's surface to 3D local positions.
 *
 * @category bijection
 * @param uv - UV coordinates (0-1) on the mesh's surface
 * @param mesh - The Mesh whose surface we're mapping from
 * @param faceIndex - If provided, only check this specific triangle
 * @returns Array of matching results with position, normal, and faceIndex (all in local space)
 */
export function traceUvToThreeLocal(
  uv: Vector2,
  mesh: Mesh,
  faceIndex?: number,
): UvTrace[] {
  const results: UvTrace[] = [];

  if (faceIndex !== undefined) {
    const result = traceTriangle(faceIndex, uv, mesh.geometry);
    if (result) {
      results.push(result);
    }
    return results;
  }

  const bvh = getOrCreateUvBvh(mesh.geometry);

  _queryPoint.set(uv.x, uv.y, 0);
  bvh.shapecast({
    intersectsBounds: (box) => box.containsPoint(_queryPoint),
    intersectsTriangle: (_tri, triFaceIndex) => {
      const result = traceTriangle(triFaceIndex, uv, mesh.geometry);
      if (result) {
        results.push(result);
      }
      return false;
    },
  });

  return results;
}

/**
 * Maps UV coordinates on a mesh's surface to 3D world positions.
 *
 * @category bijection
 * @param uv - UV coordinates (0-1) on the mesh's surface
 * @param mesh - The Mesh whose surface we're mapping from
 * @param faceIndex - If provided, only check this specific triangle
 * @returns Array of matching results with position, normal, and faceIndex (all in world space)
 */
export function traceUvToThree(
  uv: Vector2,
  mesh: Mesh,
  faceIndex?: number,
): UvTrace[] {
  const localResults = traceUvToThreeLocal(uv, mesh, faceIndex);

  return localResults.map(({ position, normal, faceIndex, barycentric }) => {
    const worldPosition = position.clone();
    mesh.localToWorld(worldPosition);

    const worldNormal = normal.clone();
    worldNormal.transformDirection(mesh.matrixWorld);

    return {
      position: worldPosition,
      normal: worldNormal,
      faceIndex,
      barycentric,
    };
  });
}

const _uvTri = new Triangle();
const _posTri = new Triangle();
const _bary = new Vector3();
const _position = new Vector3();
const _normal = new Vector3();

function traceTriangle(
  faceIndex: number,
  uv: Vector2,
  geometry: BufferGeometry,
): UvTrace | null {
  const uvAttr = geometry.getAttribute("uv");
  const posAttr = geometry.getAttribute("position");
  const normAttr = geometry.getAttribute("normal");
  const index = geometry.index;

  const i0 = index ? index.getX(faceIndex * 3) : faceIndex * 3;
  const i1 = index ? index.getX(faceIndex * 3 + 1) : faceIndex * 3 + 1;
  const i2 = index ? index.getX(faceIndex * 3 + 2) : faceIndex * 3 + 2;

  // Set up UV triangle (treat as 3D with z=0)
  _uvTri.a.set(uvAttr.getX(i0), uvAttr.getY(i0), 0);
  _uvTri.b.set(uvAttr.getX(i1), uvAttr.getY(i1), 0);
  _uvTri.c.set(uvAttr.getX(i2), uvAttr.getY(i2), 0);

  _uvPoint.set(uv.x, uv.y, 0);
  if (!_uvTri.containsPoint(_uvPoint)) {
    return null;
  }

  _uvTri.getBarycoord(_uvPoint, _bary);

  if (normAttr) {
    _normal.set(normAttr.getX(i0), normAttr.getY(i0), normAttr.getZ(i0));
  } else {
    _posTri.setFromAttributeAndIndices(posAttr, i0, i1, i2);
    _posTri.getNormal(_normal);
  }
  const normal = _normal.clone();

  Triangle.getInterpolatedAttribute(posAttr, i0, i1, i2, _bary, _position);
  const position = _position.clone();
  const barycentric = _bary.clone();

  if (normAttr) {
    Triangle.getInterpolatedAttribute(normAttr, i0, i1, i2, _bary, _normal);
    normal.copy(_normal);
  }

  return {
    position,
    normal,
    faceIndex,
    barycentric,
  };
}

const _ndc = new Vector3();

/**
 * Maps a 3D world position to NDC coordinates in the camera's view.
 *
 * @category bijection
 * @param vec3 - The world position
 * @param camera - The camera to project through
 * @param out - Optional Vector2 to store the NDC result (-1 to 1)
 * @returns The NDC Vector2
 */
export function mapThreeToNdc(
  vec3: Vector3,
  camera: Camera,
  out?: Vector2,
): Vector2 {
  const result = out ?? new Vector2();
  _ndc.copy(vec3);
  _ndc.project(camera);
  result.x = _ndc.x;
  result.y = _ndc.y;
  return result;
}
