import {
  type AttachType,
  type ComputeFunction,
  createPortal,
  type DomEvent,
  type RootState,
  useThree,
} from "@react-three/fiber";
import { Point } from "pixi.js";
import {
  type ReactNode,
  type Ref,
  type RefObject,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Mesh,
  Object3D,
  type Plane,
  Raycaster,
  type RenderTarget,
  type RenderTargetOptions,
  Scene,
  Texture,
  Vector2,
  Vector3,
} from "three";
import { texture } from "three/tsl";
import type { TextureNode } from "three/webgpu";
import tunnel from "tunnel-rat";

import {
  mapNdcToPixi as mapNdcToPixiUtil,
  mapNdcToUv,
  mapPixiToNdc as mapPixiToNdcUtil,
  mapThreeToNdc,
  mapUvToNdc,
  traceUvToThree,
  traceUvToThreeLocal,
} from "./bijections";
import { useViewport } from "./canvas-tree-context";
import { CanvasTreeContext, useCanvasTreeStore } from "./canvas-tree-context";
import { useAttachedObject } from "./three-fiber";
import { PortalContent } from "./three-portal-content";
import {
  type RaycastResult,
  ThreeSceneContext,
  useThreeSceneContext,
} from "./three-scene-context";
import { useRenderSchedule } from "./use-render-schedule";

/**
 * See {@link ThreeRenderTexture}.
 *
 * @category component
 * @expand
 */
export interface ThreeRenderTextureProps {
  /**
   * Render {@link https://threejs.org/docs/#TextureNode | TextureNode} Ref
   */
  ref?: Ref<TextureNode>;
  /**
   * RenderTarget Texture {@link https://r3f.docs.pmnd.rs/api/objects#attach | React Three Fiber attach}
   */
  attach?: AttachType;
  /**
   * Optional {@link https://threejs.org/docs/#Object3D | Object3D} for event computation, defaults to fiber parent if any
   */
  objectRef?: RefObject<Object3D>;
  /** Optional width of the texture, defaults to canvas parent bounds */
  width?: number;
  /** Optional height of the texture, defaults to canvas parent bounds */
  height?: number;
  /** Optional resolution of the texture, defaults to canvas parent resolution */
  resolution?: number;
  /**
   * Optional {@link https://threejs.org/docs/#RenderTarget | RenderTarget} options
   */
  options?: RenderTargetOptions;
  /** Optional render priority, defaults to 0 */
  renderPriority?: number;
  /** Optional event priority, defaults to 0 */
  eventPriority?: number;
  /** Optional frameloop, defaults to "always" */
  frameloop?: "always" | "demand";
  /**
   * Optional event compute for {@link https://r3f.docs.pmnd.rs/api/events | React Three Fiber events}, defaults to undefined
   */
  compute?: ComputeFunction;
  /** Optional FPS limit */
  fpsLimit?: number;
  /** Children will be rendered into a portal */
  children: ReactNode;
}

/**
 * A {@link https://threejs.org/docs/#RenderTarget | Three.js RenderTarget}
 * containing {@link https://r3f.docs.pmnd.rs | React Three Fiber} children.
 *
 * It must be inside a {@link ThreeScene} component.
 *
 * @category component
 * @param props - Component props
 * @example
 * ```tsx
 * <RenderContext>
 *   <CanvasView>
 *     <ThreeScene>
 *       <mesh>
 *         <boxGeometry />
 *         <meshBasicMaterial>
 *           <ThreeRenderTexture attach="map" width={512} height={512}>
 *             <SpinnyCube />
 *           </ThreeRenderTexture>
 *         </meshBasicMaterial>
 *       </mesh>
 *     </ThreeScene>
 *   </CanvasView>
 * </RenderContext>
 * ```
 */
export function ThreeRenderTexture({
  ref,
  attach,
  objectRef,
  width: widthProp,
  height: heightProp,
  resolution: resolutionProp,
  options,
  renderPriority = 0,
  eventPriority = 0,
  frameloop = "always",
  compute,
  fpsLimit,
  children,
}: ThreeRenderTextureProps) {
  const size = useViewport();
  const [scene] = useState(new Scene());

  const width = widthProp ?? size.width;
  const height = heightProp ?? size.height;
  const resolution = resolutionProp ?? size.resolution;
  const store = useCanvasTreeStore();
  useEffect(() => {
    store.updateSnapshot({ width, height, resolution });
    store.notifySubscribers();
  }, [store, width, height, resolution]);

  const parentThreeSceneContext = useThreeSceneContext();
  const { containerRef } = parentThreeSceneContext;
  const textureRef = useRef(texture(new Texture()));
  const { camera } = useThree();

  const getAttachedObject = useAttachedObject(objectRef);

  useImperativeHandle(ref, () => textureRef.current);

  const bounds = { width, height };

  function mapPixiToNdc(point: Point, out?: Vector2) {
    return mapPixiToNdcUtil(point, bounds, out);
  }

  function mapNdcToPixi(ndc: Vector2, out?: Point) {
    return mapNdcToPixiUtil(ndc, bounds, out);
  }

  const _ndc = new Vector2();
  const _uv = new Vector2();
  const _threeParent = new Vector3();
  const raycaster = new Raycaster();

  function mapThreeToParentUv(vec3: Vector3, out?: Vector2) {
    // Project world vec3 through camera to NDC
    mapThreeToNdc(vec3, camera, _ndc);

    // Map NDC to UV
    return mapNdcToUv(_ndc, out);
  }

  function mapThreeToParentThreeLocal(vec3: Vector3, out?: Vector3) {
    const result = out ?? new Vector3();
    mapThreeToParentUv(vec3, _uv);

    // Get attached mesh and convert UV to local position on mesh surface
    const object = getAttachedObject();
    if (!object || !(object instanceof Mesh)) {
      // Fallback: can't map without mesh
      result.copy(vec3);
      return result;
    }

    const results = traceUvToThreeLocal(_uv, object);
    if (results.length === 0) {
      // UV not on mesh surface, fallback
      result.copy(vec3);
      return result;
    }

    result.copy(results[0].position);
    return result;
  }

  function mapThreeToParentThree(vec3: Vector3, out?: Vector3) {
    const result = out ?? new Vector3();
    mapThreeToParentUv(vec3, _uv);

    // Get attached mesh and convert UV to world position
    const object = getAttachedObject();
    if (!object || !(object instanceof Mesh)) {
      // Fallback: can't map without mesh
      result.copy(vec3);
      return result;
    }

    const results = traceUvToThree(_uv, object);
    if (results.length === 0) {
      // UV not on mesh surface, fallback
      result.copy(vec3);
      return result;
    }

    result.copy(results[0].position);
    return result;
  }

  function mapThreeToParentPixiLocal(vec3: Vector3, out?: Point) {
    mapThreeToParentThree(vec3, _threeParent);
    return parentThreeSceneContext.mapThreeToParentPixiLocal(_threeParent, out);
  }

  function mapThreeToParentPixi(vec3: Vector3, out?: Point) {
    mapThreeToParentThree(vec3, _threeParent);
    return parentThreeSceneContext.mapThreeToParentPixi(_threeParent, out);
  }

  function mapThreeToViewport(vec3: Vector3, out?: Point) {
    mapThreeToParentThree(vec3, _threeParent);
    return parentThreeSceneContext.mapThreeToViewport(_threeParent, out);
  }

  function mapThreeToClient(vec3: Vector3, out?: Point) {
    mapThreeToParentThree(vec3, _threeParent);
    return parentThreeSceneContext.mapThreeToClient(_threeParent, out);
  }

  function mapClientToNdc(
    client: Point | { clientX: number; clientY: number },
    out?: Vector2,
  ) {
    const intersections = parentThreeSceneContext.raycastClient(
      client,
      getAttachedObject(),
    );
    const uv = intersections[0]?.uv;
    if (uv) {
      return mapUvToNdc(uv, out);
    }
    return null;
  }

  function mapViewportToNdc(viewport: Point, out?: Vector2) {
    const intersections = parentThreeSceneContext.raycastViewport(
      viewport,
      getAttachedObject(),
    );
    const uv = intersections[0]?.uv;
    if (uv) {
      return mapUvToNdc(uv, out);
    }
    return null;
  }

  function raycastNdc<T extends Object3D | Plane | Object3D[] = Object3D>(
    ndc: Vector2,
    target?: T,
    recursive?: boolean,
  ): RaycastResult<T>[] {
    raycaster.setFromCamera(ndc, camera);
    if (target) {
      if (Array.isArray(target)) {
        return raycaster.intersectObjects(
          target,
          recursive,
        ) as RaycastResult<T>[];
      } else if ("isPlane" in target) {
        const point = new Vector3();
        const hit = raycaster.ray.intersectPlane(target as Plane, point);
        if (hit) {
          return [
            {
              distance: raycaster.ray.origin.distanceTo(point),
              point,
              object: target,
            } as RaycastResult<T>,
          ];
        }
        return [];
      } else {
        return raycaster.intersectObject(
          target,
          recursive,
        ) as RaycastResult<T>[];
      }
    }
    return raycaster.intersectObjects(
      scene.children,
      recursive,
    ) as RaycastResult<T>[];
  }

  function raycastClient<T extends Object3D | Plane | Object3D[] = Object3D>(
    client: Point | { clientX: number; clientY: number },
    target?: T,
    recursive?: boolean,
  ): RaycastResult<T>[] {
    mapClientToNdc(client, _ndc);
    return raycastNdc(_ndc, target, recursive);
  }

  function raycastViewport<T extends Object3D | Plane | Object3D[] = Object3D>(
    viewport: Point,
    target?: T,
    recursive?: boolean,
  ): RaycastResult<T>[] {
    mapViewportToNdc(viewport, _ndc);
    return raycastNdc(_ndc, target, recursive);
  }

  function computeFn(event: DomEvent, state: RootState, previous?: RootState) {
    if (!previous) {
      return false;
    }
    const status = previous.events.compute?.(
      event,
      previous,
      previous.previousRoot?.getState(),
    ) as void | false;
    if (status === false) {
      return false;
    }
    const parent = getAttachedObject();
    if (!parent) {
      return false;
    }
    const [intersection] = previous.raycaster.intersectObject(parent) ?? [];
    if (!intersection) {
      return false;
    }
    const uv = intersection.uv;
    if (!uv) {
      return false;
    }
    mapUvToNdc(uv, state.pointer);
    state.raycaster.setFromCamera(state.pointer, state.camera);
  }

  const sceneTunnel = tunnel();

  const { isFrameRequested, invalidate, signalFrame } = useRenderSchedule({
    fpsLimit,
  });

  return (
    <>
      <CanvasTreeContext value={{ store, invalidate }}>
        <ThreeSceneContext
          value={{
            containerRef,
            sceneTunnel,
            mapPixiToNdc,
            mapNdcToPixi,
            mapThreeToParentPixiLocal,
            mapThreeToParentPixi,
            mapThreeToViewport,
            mapThreeToClient,
            mapClientToNdc,
            mapViewportToNdc,
            raycastNdc,
            raycastClient,
            raycastViewport,
            parentThree: {
              mapThreeToParentUv,
              mapThreeToParentThreeLocal,
              mapThreeToParentThree,
            },
          }}
        >
          {createPortal(
            <PortalContent
              ref={(renderTarget: RenderTarget | null) => {
                if (renderTarget) {
                  textureRef.current.value = renderTarget.texture;
                }
              }}
              renderPriority={renderPriority}
              width={width}
              height={height}
              resolution={resolution}
              renderTargetOptions={options}
              frameloop={frameloop}
              isFrameRequested={isFrameRequested}
              signalFrame={signalFrame}
            >
              {children}
              <sceneTunnel.Out />
              {/* Without an element that receives pointer events state.pointer will always be 0/0 */}
              <group onPointerOver={() => null} />
            </PortalContent>,
            scene,

            {
              events: {
                compute: compute ?? computeFn,
                priority: eventPriority,
              },
              size: { top: 0, left: 0, width, height },
            },
          )}
        </ThreeSceneContext>
      </CanvasTreeContext>
      {/* eslint-disable-next-line react-hooks/refs */}
      <primitive object={textureRef.current} attach={attach} />
    </>
  );
}
