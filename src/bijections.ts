import { type Bounds, type Point, type Rectangle } from "pixi.js";
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
 * @category bijection
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
 * @category bijection
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
 * @category bijection
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
 * @category bijection
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
 * @category bijection
 * @param uv - Vector2 with UV coordinates (0-1)
 * @param ndc - Vector2 to store the NDC result
 */
export function mapUvToNdc(uv: Vector2, ndc: Vector2): void {
  ndc.x = uv.x * 2 - 1;
  ndc.y = -(uv.y * 2 - 1);
}

/**
 * Maps Three.js NDC coordinates (-1 to 1) to UV coordinates (0-1).
 *
 * @category bijection
 * @param ndc - Vector2 with NDC coordinates (-1 to 1)
 * @param uv - Vector2 to store the UV result
 */
export function mapNdcToUv(ndc: Vector2, uv: Vector2): void {
  uv.x = (ndc.x + 1) / 2;
  uv.y = (-ndc.y + 1) / 2;
}

/**
 * Maps DOM client coordinates directly to Pixi pixel coordinates within a viewport.
 *
 * @category bijection
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
 * Result of UV to Three.js coordinate mapping.
 * @category bijection
 */
export interface UvToThreeResult {
  position: Vector3;
  normal: Vector3;
  faceIndex: number;
  /** Barycentric coordinates within the triangle */
  barycentric: Vector3;
  /** Whether the UV point is contained within the triangle */
  isContained: boolean;
}

const _queryPoint = new Vector3();
const _uvPoint = new Vector3();

/**
 * Filter function for UV to Three mapping results.
 * Return true to include the result, false to exclude it from the list.
 *
 * @category bijection
 */
export type UvToThreeFilter = (args: {
  tri: Triangle;
  faceIndex: number;
  uv: Vector2;
  mesh: Mesh;
  result: UvToThreeResult;
}) => boolean;

/**
 * Default filter that only includes results where the UV point is contained within the triangle.
 *
 * @category bijection
 */
export const defaultUvToThreeFilter: UvToThreeFilter = ({ result }) =>
  result.isContained;

/**
 * Maps UV coordinates on a mesh's surface to 3D local positions.
 *
 * @category bijection
 * @param uv - UV coordinates (0-1) on the mesh's surface
 * @param mesh - The Mesh whose surface we're mapping from
 * @param options - Optional options
 * @param options.faceIndex - If provided, only check this specific triangle
 * @param options.filter - Custom filter function to mark results as filtered. Defaults to isContained.
 * @returns Array of matching results with position, normal, and faceIndex (all in local space)
 */
export function mapUvToThreeLocal(
  uv: Vector2,
  mesh: Mesh,
  options?: { faceIndex?: number; filter?: UvToThreeFilter },
): UvToThreeResult[] {
  const { faceIndex, filter = defaultUvToThreeFilter } = options ?? {};
  const results: UvToThreeResult[] = [];

  if (faceIndex !== undefined) {
    const result = checkTriangle(faceIndex, uv, mesh.geometry);
    if (filter({ tri: _uvTri, faceIndex, uv, mesh, result })) {
      results.push(result);
    }
    return results;
  }

  const bvh = getOrCreateUvBvh(mesh.geometry);

  _queryPoint.set(uv.x, uv.y, 0);
  bvh.shapecast({
    intersectsBounds: (box) => box.containsPoint(_queryPoint),
    intersectsTriangle: (tri, triFaceIndex) => {
      const result = checkTriangle(triFaceIndex, uv, mesh.geometry);
      if (filter({ tri, faceIndex: triFaceIndex, uv, mesh, result })) {
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
 * @param options - Optional options
 * @param options.faceIndex - If provided, only check this specific triangle
 * @param options.filter - Custom filter function to mark results as filtered
 * @returns Array of matching results with position, normal, and faceIndex (all in world space)
 */
export function mapUvToThree(
  uv: Vector2,
  mesh: Mesh,
  options?: { faceIndex?: number; filter?: UvToThreeFilter },
): UvToThreeResult[] {
  const localResults = mapUvToThreeLocal(uv, mesh, options);

  return localResults.map(
    ({ position, normal, faceIndex, barycentric, isContained }) => {
      const worldPosition = position.clone();
      mesh.localToWorld(worldPosition);

      const worldNormal = normal.clone();
      worldNormal.transformDirection(mesh.matrixWorld);

      return {
        position: worldPosition,
        normal: worldNormal,
        faceIndex,
        barycentric,
        isContained,
      };
    },
  );
}

const _uvTri = new Triangle();
const _posTri = new Triangle();
const _bary = new Vector3();
const _position = new Vector3();
const _normal = new Vector3();

function checkTriangle(
  faceIndex: number,
  uv: Vector2,
  geometry: BufferGeometry,
): UvToThreeResult {
  const uvAttr = geometry.getAttribute("uv");
  const posAttr = geometry.getAttribute("position");
  const normAttr = geometry.getAttribute("normal");
  const index = geometry.index;

  const i0 = index ? index.getX(faceIndex * 3) : faceIndex * 3;
  const i1 = index ? index.getX(faceIndex * 3 + 1) : faceIndex * 3 + 1;
  const i2 = index ? index.getX(faceIndex * 3 + 2) : faceIndex * 3 + 2;

  if (normAttr) {
    _normal.set(normAttr.getX(i0), normAttr.getY(i0), normAttr.getZ(i0));
  } else {
    _posTri.setFromAttributeAndIndices(posAttr, i0, i1, i2);
    _posTri.getNormal(_normal);
  }
  const normal = _normal.clone();

  // Set up UV triangle (treat as 3D with z=0)
  _uvTri.a.set(uvAttr.getX(i0), uvAttr.getY(i0), 0);
  _uvTri.b.set(uvAttr.getX(i1), uvAttr.getY(i1), 0);
  _uvTri.c.set(uvAttr.getX(i2), uvAttr.getY(i2), 0);

  _uvPoint.set(uv.x, uv.y, 0);
  const isContained = _uvTri.containsPoint(_uvPoint);
  _uvTri.getBarycoord(_uvPoint, _bary);

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
    isContained,
  };
}

const _ndc = new Vector3();

/**
 * Maps a 3D world position to NDC coordinates in the camera's view.
 *
 * @category bijection
 * @param vec3 - The world position
 * @param ndc - Vector2 to store the NDC result (-1 to 1)
 * @param camera - The camera to project through
 */
export function mapThreeToNdc(
  vec3: Vector3,
  ndc: Vector2,
  camera: Camera,
): void {
  _ndc.copy(vec3);
  _ndc.project(camera);
  ndc.x = _ndc.x;
  ndc.y = _ndc.y;
}
