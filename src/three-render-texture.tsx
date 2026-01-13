import {
  type AttachType,
  type ComputeFunction,
  createPortal,
  type DomEvent,
  type RootState,
} from "@react-three/fiber";
import {
  type ReactNode,
  type Ref,
  type RefObject,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  type Object3D,
  type RenderTarget,
  type RenderTargetOptions,
  Scene,
  type Texture,
} from "three";
import tunnel from "tunnel-rat";

import { useViewport } from "./canvas-tree-context";
import { CanvasTreeContext, useCanvasTreeStore } from "./canvas-tree-context";
import { useAttachedObject } from "./three-fiber";
import { Portal } from "./three-portal";
import { ThreeSceneContext, useThreeSceneContext } from "./three-scene-context";
import { useRenderSchedule } from "./use-render-schedule";

/**
 * See {@link ThreeRenderTexture}.
 *
 * @category component
 * @expand
 */
export interface ThreeRenderTextureProps {
  /**
   * Render {@link https://threejs.org/docs/#Texture | Texture} Ref
   */
  ref?: Ref<Texture>;
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

  const { containerRef } = useThreeSceneContext();
  const [texture, setTexture] = useState<Texture | null>(null);

  const getAttachedObject = useAttachedObject(objectRef);

  useImperativeHandle(ref, () => texture!, [texture]);

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
    state.raycaster.setFromCamera(
      state.pointer.set(uv.x * 2 - 1, -(uv.y * 2 - 1)),
      state.camera,
    );
  }

  const sceneTunnel = tunnel();

  const { isFrameRequested, invalidate, signalFrame } = useRenderSchedule({
    fpsLimit,
  });

  return (
    <>
      <CanvasTreeContext value={{ store, invalidate }}>
        <ThreeSceneContext value={{ containerRef, sceneTunnel }}>
          {createPortal(
            <Portal
              ref={(renderTarget: RenderTarget | null) => {
                if (renderTarget) {
                  setTexture(renderTarget.texture);
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
            </Portal>,
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
      {texture && <primitive object={texture} attach={attach} />}
    </>
  );
}
