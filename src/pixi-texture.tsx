import { extend, useApplication, useTick } from "@pixi/react";
import { type AttachType } from "@react-three/fiber";
import {
  Container,
  EventBoundary,
  type GpuTextureSystem,
  type Point,
  Rectangle,
  RenderTexture,
  TextureSource,
} from "pixi.js";
import {
  type PropsWithChildren,
  type Ref,
  type RefObject,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import {
  ExternalTexture,
  Mesh,
  Texture,
  Vector2 as Vector2Impl,
  Vector3,
} from "three";
import { texture } from "three/tsl";
import { type Object3D, type TextureNode, type Vector2 } from "three/webgpu";

import {
  mapPixiToUv as mapPixiToUvUtil,
  mapUvToPixi as mapUvToPixiUtil,
  mapUvToThree,
  mapUvToThreeLocal,
} from "./bijections";
import { CanvasTreeContext, useCanvasTreeStore } from "./canvas-tree-context";
import { PixiTextureContext } from "./pixi-texture-context";
import { useRenderContext } from "./render-context-hooks";
import { useAttachedObject } from "./three-fiber";
import {
  type ThreeSceneContextValue,
  useThreeSceneContext,
} from "./three-scene-context";
import { useBridge } from "./use-bridge";
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
}: PixiTextureInternalProps) {
  const app = useApplication();

  const containerRef = useRef<Container>(null!);
  const pixiTextureRef = useRef(new RenderTexture());

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
  const _uv = new Vector2Impl();
  const _threeParent = new Vector3();

  function mapUvToPixi(uv: Vector2, point: Point) {
    mapUvToPixiUtil(uv, point, bounds);
  }

  function mapPixiToParentUv(point: Point, uv: Vector2) {
    mapPixiToUvUtil(point, uv, bounds);
  }

  function mapPixiToParentThreeLocal(point: Point) {
    mapPixiToParentUv(point, _uv);

    // Get attached mesh and convert UV to local positions on mesh surface
    const object = getAttachedObject();
    if (!object || !(object instanceof Mesh)) {
      return [];
    }

    return mapUvToThreeLocal(_uv, object);
  }

  function mapPixiToParentThree(point: Point) {
    mapPixiToParentUv(point, _uv);

    // Get attached mesh and convert UV to world positions
    const object = getAttachedObject();
    if (!object || !(object instanceof Mesh)) {
      return [];
    }

    return mapUvToThree(_uv, object);
  }

  function mapPixiToParentPixi(point: Point, out: Point) {
    const results = mapPixiToParentThree(point);
    if (results.length > 0) {
      _threeParent.copy(results[0].position);
      parentThreeSceneContext.mapThreeToParentPixi(_threeParent, out);
    }
  }

  function mapPixiToViewport(localPoint: Point, viewportPoint: Point) {
    const results = mapPixiToParentThree(localPoint);
    if (results.length > 0) {
      _threeParent.copy(results[0].position);
      parentThreeSceneContext.mapThreeToViewport(_threeParent, viewportPoint);
    }
  }

  return (
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
          mapPixiToParentThreeLocal,
          mapPixiToParentThree,
          mapPixiToParentPixi,
          mapPixiToViewport,
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
  );
}
