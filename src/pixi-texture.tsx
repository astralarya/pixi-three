import { extend, useApplication, useTick } from "@pixi/react";
import {
  type AttachType,
  createPortal,
  type DomEvent,
  type RootState,
} from "@react-three/fiber";
import {
  Container,
  EventBoundary,
  type GpuTextureSystem,
  Point,
  Rectangle,
  RenderTexture,
  TextureSource,
} from "pixi.js";
import {
  Fragment,
  type PropsWithChildren,
  type Ref,
  type RefObject,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ExternalTexture,
  type Intersection,
  Mesh,
  Scene,
  Texture,
  Vector2,
  Vector3,
} from "three";
import { texture } from "three/tsl";
import { type Object3D, type TextureNode } from "three/webgpu";

import {
  mapPixiToUv as mapPixiToUvUtil,
  mapUvToPixi as mapUvToPixiUtil,
  traceUvToThree,
  traceUvToThreeLocal,
} from "./bijections";
import { CanvasTreeContext, useCanvasTreeStore } from "./canvas-tree-context";
import { useCanvasView } from "./canvas-view-context";
import { PixiTextureContext } from "./pixi-texture-context";
import { useRenderContext } from "./render-context-hooks";
import { useAttachedObject } from "./three-fiber";
import {
  type ThreeSceneContextValue,
  useThreeSceneContext,
} from "./three-scene-context";
import { useBridge } from "./use-bridge";
import { usePixiEventDispatch } from "./use-pixi-event-dispatch";
import { useRenderSchedule } from "./use-render-schedule";

extend({ Container });

/**
 * @internal
 */
export function PixiTextureRenderer() {
  const { pixiTextureTunnel } = useRenderContext();
  return (
    <pixiContainer renderable={false}>
      <pixiTextureTunnel.Out />
    </pixiContainer>
  );
}

/**
 * See {@link PixiTexture}.
 *
 * @category component
 * @expand
 */
export interface PixiTextureProps extends PropsWithChildren {
  /**
   * {@link https://threejs.org/docs/#TextureNode | TextureNode} Ref
   */
  ref?: Ref<TextureNode>;
  /**
   * Pixi {@link https://pixijs.download/release/docs/scene.Container.html | Container} Ref
   */
  containerRef?: Ref<Container>;
  /**
   * Optional {@link https://threejs.org/docs/#Object3D | Object3D} for event computation, defaults to fiber parent if any
   */
  objectRef?: RefObject<Object3D>;
  /**
   * TextureNode {@link https://r3f.docs.pmnd.rs/api/objects#attach | React Three Fiber attach}
   */
  attach?: AttachType;
  /** Texture width */
  width: number;
  /** Texture height */
  height: number;
  /** Optional frameloop, defaults to "demand" */
  frameloop?: "always" | "demand";
  /** Optional FPS limit */
  fpsLimit?: number;
  /** Enable event handling, defaults to true */
  events?: boolean;
  /** Optional event priority, defaults to 0 */
  eventPriority?: number;
  /** Optional guard to filter events */
  eventGuard?: PixiTextureEventGuard;
}

/**
 * @category component
 * @inline
 */
export type PixiTextureEventGuard = (args: PixiTextureEventData) => boolean;

/** @category component */
export interface PixiTextureEventData {
  intersections: Intersection[];
}

/**
 * A {@link https://threejs.org/docs/#TextureNode | Three TextureNode}
 * that that renders {@link https://react.pixijs.io/components/pixi-components | React Pixi} children.
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
 *           <PixiTexture attach="map" width={512} height={512}>
 *             <SpinnyStar />
 *           </PixiTexture>
 *         </meshBasicMaterial>
 *       </mesh>
 *     </ThreeScene>
 *   </CanvasView>
 * </RenderContext>
 * ```
 */
export function PixiTexture({
  ref,
  containerRef,
  objectRef,
  attach,
  children,
  width,
  height,
  frameloop,
  fpsLimit,
  events,
  eventPriority,
  eventGuard,
}: PixiTextureProps) {
  const Bridge = useBridge();
  const { pixiTextureTunnel } = useRenderContext();
  const parentThreeSceneContext = useThreeSceneContext();
  const key = useId();

  const getAttachedObject = useAttachedObject(objectRef);

  const textureRef = useRef(texture(new Texture()));

  useEffect(
    () => () => {
      textureRef.current.dispose();
    },
    [],
  );

  useImperativeHandle(ref, () => {
    return textureRef.current;
  });

  return (
    <>
      <pixiTextureTunnel.In>
        <Bridge key={key}>
          <PixiTextureInternal
            parentThreeSceneContext={parentThreeSceneContext}
            getAttachedObject={getAttachedObject}
            textureRef={textureRef}
            containerRef={containerRef}
            width={width}
            height={height}
            frameloop={frameloop}
            fpsLimit={fpsLimit}
            events={events}
            eventPriority={eventPriority}
            eventGuard={eventGuard}
          >
            {children}
          </PixiTextureInternal>
        </Bridge>
      </pixiTextureTunnel.In>
      {/* eslint-disable-next-line react-hooks/refs */}
      <primitive object={textureRef.current} attach={attach} />
    </>
  );
}

interface PixiTextureInternalProps extends Omit<
  PixiTextureProps,
  "ref" | "objectRef" | "attach"
> {
  /** Parent Three Scene Context */
  parentThreeSceneContext: ThreeSceneContextValue;
  /** Get attached object */
  getAttachedObject: () => Object3D | undefined;
  /** TextureNode Ref */
  textureRef: RefObject<TextureNode>;
}

function PixiTextureInternal({
  parentThreeSceneContext,
  getAttachedObject,
  containerRef: containerRefProp,
  children,
  textureRef,
  width,
  height,
  frameloop,
  fpsLimit,
  events,
  eventPriority,
  eventGuard,
}: PixiTextureInternalProps) {
  const app = useApplication();
  const { canvasRef } = useCanvasView();

  const containerRef = useRef<Container>(null!);
  const pixiTextureRef = useRef(new RenderTexture());

  const [eventScene] = useState(() => new Scene());
  const dispatchEvent = usePixiEventDispatch({
    containerRef,
    canvasRef,
  });

  // Track whether we were over the mesh on the previous event
  const wasOverRef = useRef(false);
  // Reusable point for UV to Pixi mapping
  const _point = new Point();

  function computeFn(event: DomEvent, _state: RootState, previous?: RootState) {
    if (!previous) return false;

    // Call parent's compute first to set up raycaster
    const status = previous.events.compute?.(
      event,
      previous,
      previous.previousRoot?.getState(),
    ) as void | false;

    // If parent compute returns false (e.g., pointer not over ThreeScene sprite),
    // we still need to dispatch null if we were previously over
    if (status === false) {
      if (wasOverRef.current) {
        dispatchEvent(event, null);
        wasOverRef.current = false;
      }
      return false;
    }

    const object = getAttachedObject();
    if (!object) return false;

    const intersections = previous.raycaster.intersectObject(object);
    const testGuard = eventGuard?.({ intersections }) ?? true;
    const [intersection] = intersections;
    const uv = intersection?.uv;
    if (uv) {
      mapUvToPixi(uv, _point);
    }

    const isOver = !!(uv && testGuard);
    const point: Point | null = isOver ? _point : null;

    // Dispatch to Pixi if we have a point OR if we were previously over
    // (to send null for proper pointer out/leave handling)
    if (isOver || wasOverRef.current) {
      dispatchEvent(event, point);
    }

    wasOverRef.current = isOver;

    return false;
  }

  const { isFrameRequested, invalidate, signalFrame } = useRenderSchedule({
    fpsLimit,
  });

  function render() {
    app.app.renderer.render({
      container: containerRef.current,
      target: pixiTextureRef.current,
      label: "pixi-texture",
    });
  }

  useTick({
    callback: () => {
      if (frameloop === "always" || isFrameRequested()) {
        render();
        signalFrame();
      }
    },
  });

  const store = useCanvasTreeStore();
  useEffect(() => {
    store.updateSnapshot({ width, height, resolution: 1 });
    store.notifySubscribers();
  }, [store, width, height]);

  useImperativeHandle(containerRefProp, () => containerRef.current);

  useEffect(
    () => () => {
      pixiTextureRef.current.source.destroy();
      pixiTextureRef.current.destroy();
    },
    [],
  );

  useLayoutEffect(() => {
    pixiTextureRef.current.destroy();
    pixiTextureRef.current = new RenderTexture({
      source: new TextureSource({ width, height, autoGarbageCollect: false }),
    });
    const gpuTexture = (
      app.app.renderer.texture as GpuTextureSystem
    ).getGpuSource(pixiTextureRef.current._source);
    textureRef.current.value.dispose();
    textureRef.current.value = new ExternalTexture(gpuTexture);
  }, [app.app.renderer.texture, height, textureRef, width]);

  const localEventBoundary = new EventBoundary();
  function hitTest(x: number, y: number) {
    localEventBoundary.rootTarget = containerRef.current;
    return localEventBoundary.hitTest(x, y);
  }

  const bounds = { width, height };

  function mapUvToPixi(uv: Vector2, out?: Point) {
    return mapUvToPixiUtil(uv, bounds, out);
  }

  function mapPixiToParentUv(point: Point, out?: Vector2) {
    return mapPixiToUvUtil(point, bounds, out);
  }

  const _uv = new Vector2();

  function tracePixiToParentThreeLocal(point: Point) {
    mapPixiToParentUv(point, _uv);

    // Get attached mesh and convert UV to local positions on mesh surface
    const object = getAttachedObject();
    if (!object || !(object instanceof Mesh)) {
      return [];
    }

    return traceUvToThreeLocal(_uv, object);
  }

  function tracePixiToParentThree(point: Point) {
    mapPixiToParentUv(point, _uv);

    // Get attached mesh and convert UV to world positions
    const object = getAttachedObject();
    if (!object || !(object instanceof Mesh)) {
      return [];
    }

    return traceUvToThree(_uv, object);
  }

  const _threeParent = new Vector3();

  function mapPixiToParentPixi(point: Point, out?: Point) {
    const results = tracePixiToParentThree(point);
    return results.map((result, i) => {
      const target = i === 0 && out ? out : new Point();
      _threeParent.copy(result.position);
      parentThreeSceneContext.mapThreeToParentPixi(_threeParent, target);
      return target;
    });
  }

  function mapPixiToViewport(localPoint: Point, out?: Point) {
    const results = tracePixiToParentThree(localPoint);
    return results.map((result, i) => {
      const target = i === 0 && out ? out : new Point();
      _threeParent.copy(result.position);
      parentThreeSceneContext.mapThreeToViewport(_threeParent, target);
      return target;
    });
  }

  function mapPixiToClient(localPoint: Point, out?: Point) {
    const results = tracePixiToParentThree(localPoint);
    return results.map((result, i) => {
      const target = i === 0 && out ? out : new Point();
      _threeParent.copy(result.position);
      parentThreeSceneContext.mapThreeToClient(_threeParent, target);
      return target;
    });
  }

  function mapClientToPixi(
    client: Point | { clientX: number; clientY: number },
    out?: Point,
  ) {
    const intersections = parentThreeSceneContext.raycastClient(
      client,
      getAttachedObject(),
    );
    const uv = intersections[0]?.uv;
    if (uv) {
      const result = out ?? new Point();
      mapUvToPixi(uv, result);
      return result;
    }
    return null;
  }

  function mapViewportToPixi(viewport: Point, out?: Point) {
    const intersections = parentThreeSceneContext.raycastViewport(
      viewport,
      getAttachedObject(),
    );
    const uv = intersections[0]?.uv;
    if (uv) {
      const result = out ?? new Point();
      mapUvToPixi(uv, result);
      return result;
    }
    return null;
  }

  const key = useId();

  return (
    <>
      {/* eslint-disable react-hooks/refs -- computeFn does not access during render */}
      {events !== false && (
        <parentThreeSceneContext.sceneTunnel.In>
          <Fragment key={key}>
            {createPortal(<group onPointerOver={() => null} />, eventScene, {
              events: {
                compute: computeFn,
                priority: eventPriority ?? 0,
              },
            })}
          </Fragment>
        </parentThreeSceneContext.sceneTunnel.In>
      )}
      <CanvasTreeContext value={{ store, invalidate }}>
        <PixiTextureContext
          value={{
            width,
            height,
            containerRef,
            getAttachedObject,
            hitTest,
            mapUvToPixi,
            mapPixiToParentUv,
            tracePixiToParentThreeLocal,
            tracePixiToParentThree,
            mapPixiToParentPixi,
            mapPixiToViewport,
            mapPixiToClient,
            mapClientToPixi,
            mapViewportToPixi,
          }}
        >
          <pixiContainer
            ref={containerRef}
            width={width}
            height={height}
            hitArea={new Rectangle(0, 0, width, height)}
          >
            {children}
          </pixiContainer>
        </PixiTextureContext>
      </CanvasTreeContext>
    </>
  );
}
