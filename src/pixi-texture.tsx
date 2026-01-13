import { extend, useApplication, useTick } from "@pixi/react";
import { type AttachType } from "@react-three/fiber";
import {
  Container,
  EventBoundary,
  type GpuTextureSystem,
  Matrix,
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
import { ExternalTexture, Texture } from "three";
import { texture } from "three/tsl";
import { type Object3D, type TextureNode, type Vector2 } from "three/webgpu";
import type tunnel from "tunnel-rat";

import { CanvasTreeContext, useCanvasTreeStore } from "./canvas-tree-context";
import { PixiTextureContext } from "./pixi-texture-context";
import { useRenderContext } from "./render-context-hooks";
import { useAttachedObject } from "./three-fiber";
import { useThreeSceneContext } from "./three-scene-context";
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
 * @category component
 * @expand
 */
export interface PixiTextureProps extends PropsWithChildren {
  /** TextureNode Ref */
  ref?: Ref<TextureNode>;
  /** Pixi Container Ref */
  containerRef?: Ref<Container>;
  /** Optional Object3D for event computation, defaults to fiber parent if any */
  objectRef?: RefObject<Object3D>;
  /** R3F attach TextureNode */
  attach?: AttachType;
  /** Texture width */
  width: number;
  /** Texture height */
  height: number;
  /** Optional frameloop, defaults to "demand" */
  frameloop?: "always" | "demand";
  /** Pixi view transform. Defaults to identity matrix */
  transform?: Matrix;
  /** Optional FPS limit */
  fpsLimit?: number;
}

/**
 * @category component
 * @param props
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
  transform = new Matrix(),
  fpsLimit,
}: PixiTextureProps) {
  const Bridge = useBridge();
  const { pixiTextureTunnel } = useRenderContext();
  const { sceneTunnel } = useThreeSceneContext();
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
            sceneTunnel={sceneTunnel}
            getAttachedObject={getAttachedObject}
            textureRef={textureRef}
            containerRef={containerRef}
            width={width}
            height={height}
            frameloop={frameloop}
            transform={transform}
            fpsLimit={fpsLimit}
          >
            {children}
          </PixiTextureInternal>
        </Bridge>
      </pixiTextureTunnel.In>
      <primitive object={textureRef.current} attach={attach} />
    </>
  );
}

interface PixiTextureInternalProps extends Omit<
  PixiTextureProps,
  "ref" | "objectRef" | "attach"
> {
  /** Three Scene Tunnel */
  sceneTunnel: ReturnType<typeof tunnel>;
  /** Get attached object */
  getAttachedObject: () => Object3D | undefined;
  /** TextureNode Ref */
  textureRef: RefObject<TextureNode>;
}

function PixiTextureInternal({
  sceneTunnel,
  getAttachedObject,
  containerRef: containerRefProp,
  children,
  textureRef,
  width,
  height,
  frameloop,
  transform,
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
      transform,
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

  function mapUvToPoint(point: Point, uv: Vector2) {
    point.x = uv.x * width;
    point.y = uv.y * height;
  }

  return (
    <CanvasTreeContext value={{ store, invalidate }}>
      <PixiTextureContext
        value={{
          width,
          height,
          sceneTunnel,
          containerRef,
          getAttachedObject,
          hitTest,
          mapUvToPoint,
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
