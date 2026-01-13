import {
  extend,
  type PixiReactElementProps,
  useApplication,
} from "@pixi/react";
import {
  type ComputeFunction,
  createPortal,
  type DomEvent,
  type RootState,
} from "@react-three/fiber";
import {
  type Application,
  Container,
  ExternalSource,
  Point,
  type Renderer,
  Sprite,
  Texture,
} from "pixi.js";
import {
  type ReactNode,
  type Ref,
  type RefObject,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { type RenderTargetOptions, Scene } from "three";
import { type PostProcessing } from "three/webgpu";
import tunnel from "tunnel-rat";

import { useCanvasContext } from "./canvas-context-hooks";
import {
  CanvasTreeContext,
  useCanvasTree,
  useCanvasTreeStore,
} from "./canvas-tree-context";
import { useCanvasView } from "./canvas-view-context";
import {
  type PixiTextureContextValue,
  usePixiTextureContextOptional,
} from "./pixi-texture-context";
import { Portal } from "./three-portal";
import { ThreeSceneContext } from "./three-scene-context";
import { useBridge } from "./use-bridge";

extend({ Container, Sprite });

export function ThreeSceneRenderer() {
  const { threeSceneTunnel } = useCanvasContext();
  return <threeSceneTunnel.Out />;
}
export type ThreeSceneProps = PixiReactElementProps & ThreeSceneBaseProps;

export interface ThreeSceneBaseProps {
  /** Optional width of the texture, defaults to canvas parent bounds */
  width?: number;
  /** Optional height of the texture, defaults to canvas parent bounds */
  height?: number;
  /** Optional resolution of the texture, defaults to canvas parent resolution */
  resolution?: number;
  /** Optional RenderTarget options */
  renderTargetOptions?: RenderTargetOptions;
  /** Optional render priority, defaults to 0 */
  renderPriority?: number;
  /** Optional event priority, defaults to 0 */
  eventPriority?: number;
  /** Optional frameloop, defaults to "always" */
  frameloop?: "always" | "demand";
  /** Optional event compute, defaults to undefined */
  eventCompute?: ComputeFunction;
  /** Optional post processing factory, defaults to undefined */
  postProcessing?: (x: RootState) => PostProcessing;
  /** Children will be rendered into a portal */
  children: ReactNode;
}

export interface ThreeSceneSpriteProps extends ThreeSceneBaseProps {
  /** Three View Sprite Ref */
  spriteRef: Ref<Sprite>;
  /** Pixi Container ref*/
  containerRef: RefObject<Container>;
}

export function ThreeScene({
  ref,
  width,
  height,
  resolution,
  renderTargetOptions,
  renderPriority,
  eventPriority,
  frameloop,
  eventCompute,
  postProcessing,
  children,
  ...props
}: ThreeSceneProps) {
  const containerRef = useRef<Container>(null!);

  useImperativeHandle(ref, () => containerRef.current);

  return (
    <pixiContainer {...props} ref={containerRef}>
      <ThreeSceneSprite
        spriteRef={(sprite) => {
          if (!sprite || !containerRef.current) {
            return;
          }
          containerRef.current.addChild(sprite);
        }}
        containerRef={containerRef}
        width={width}
        height={height}
        resolution={resolution}
        renderTargetOptions={renderTargetOptions}
        renderPriority={renderPriority}
        eventPriority={eventPriority}
        frameloop={frameloop}
        eventCompute={eventCompute}
        postProcessing={postProcessing}
      >
        {children}
      </ThreeSceneSprite>
    </pixiContainer>
  );
}

export function ThreeSceneSprite(props: ThreeSceneSpriteProps) {
  const Bridge = useBridge();
  const { app } = useApplication();
  const { threeSceneTunnel } = useCanvasContext();
  const pixiTextureContext = usePixiTextureContextOptional();

  const key = useId();

  const sprite = (
    // eslint-disable-next-line react-hooks/static-components
    <Bridge key={key}>
      <ThreeSceneSpriteInternal
        app={app}
        pixiTextureContext={pixiTextureContext}
        {...props}
      />
    </Bridge>
  );
  return pixiTextureContext ? (
    <pixiTextureContext.sceneTunnel.In>
      {sprite}
    </pixiTextureContext.sceneTunnel.In>
  ) : (
    <threeSceneTunnel.In>{sprite}</threeSceneTunnel.In>
  );
}

export interface ThreeSceneSpriteInternalProps extends ThreeSceneSpriteProps {
  /** Pixi Application */
  app: Application<Renderer>;
  /** Pixi Texture Context */
  pixiTextureContext: PixiTextureContextValue | null;
}

function ThreeSceneSpriteInternal({
  spriteRef,
  containerRef,
  app,
  pixiTextureContext,
  width: widthProp,
  height: heightProp,
  resolution: resolutionProp,
  renderTargetOptions,
  renderPriority = 0,
  eventPriority = 0,
  frameloop = "always",
  eventCompute,
  postProcessing,
  children,
}: ThreeSceneSpriteInternalProps) {
  const { canvasRef, containerRef: canvasContainerRef } = useCanvasView();
  const parentContext = useCanvasTree();
  const [scene] = useState(new Scene());

  const frameRequested = useRef(true);
  function invalidate() {
    frameRequested.current = true;
  }
  function clearFrameRequest() {
    frameRequested.current = false;
    parentContext.invalidate();
  }

  const { size } = parentContext;
  const width = widthProp ?? size.width;
  const height = heightProp ?? size.height;
  const resolution = resolutionProp ?? size.resolution;
  const store = useCanvasTreeStore();
  useEffect(() => {
    store.updateSnapshot({ width, height, resolution });
    store.notifySubscribers();
  }, [store, width, height, resolution]);

  const sprite = useRef(
    (() => {
      const x = new Sprite({
        width,
        height,
        eventMode: "static",
      });
      x.texture = new Texture({
        source: new ExternalSource({
          label: "three-scene",
        }),
      });
      return x;
    })(),
  );
  useEffect(() => {
    sprite.current.width = width;
    sprite.current.height = height;
  }, [height, width]);

  function onTextureUpdate(texture: GPUTexture) {
    sprite.current.texture.source.resource = texture;
  }
  useImperativeHandle(spriteRef, () => sprite.current, []);

  const clientPos = new Point();
  const globalPos = new Point();
  const localPos = new Point();
  function computeFn(event: DomEvent, state: RootState, previous?: RootState) {
    if (pixiTextureContext) {
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
      const parent = pixiTextureContext.getAttachedObject();
      if (!parent) {
        return false;
      }
      const [intersection] = previous?.raycaster.intersectObject(parent) ?? [];
      if (!intersection) {
        return false;
      }
      const uv = intersection.uv;
      if (!uv) {
        return false;
      }
      pixiTextureContext.mapUvToPoint(globalPos, uv);
      if (
        sprite.current !== pixiTextureContext.hitTest(globalPos.x, globalPos.y)
      ) {
        return false;
      }
    } else {
      const rect = canvasRef.current.getBoundingClientRect();
      clientPos.x = event.clientX - rect.left;
      clientPos.y = event.clientY - rect.top;
      // eslint-disable-next-line react-hooks/immutability
      app.renderer.events.rootBoundary.rootTarget = canvasContainerRef.current;
      canvasContainerRef.current.toGlobal(clientPos, globalPos);
      if (
        sprite.current !==
        app.renderer.events.rootBoundary.hitTest(globalPos.x, globalPos.y)
      ) {
        return false;
      }
    }

    sprite.current.toLocal(globalPos, undefined, localPos);
    const bounds = sprite.current.getLocalBounds();
    const x = (localPos.x - bounds.x) / bounds.width;
    const y = (localPos.y - bounds.y) / bounds.height;

    state.raycaster.setFromCamera(
      state.pointer.set(x * 2 - 1, -(y * 2 - 1)),
      state.camera,
    );
  }

  const sceneTunnel = tunnel();

  return (
    <>
      <CanvasTreeContext value={{ store, invalidate }}>
        <ThreeSceneContext value={{ containerRef, sceneTunnel }}>
          {createPortal(
            <Portal
              renderPriority={renderPriority}
              width={width}
              height={height}
              resolution={resolution}
              renderTargetOptions={renderTargetOptions}
              onTextureUpdate={onTextureUpdate}
              postProcessing={postProcessing}
              frameloop={frameloop}
              frameRequested={frameRequested}
              clearFrameRequest={clearFrameRequest}
            >
              {children}
              <sceneTunnel.Out />
              {/* Without an element that receives pointer events state.pointer will always be 0/0 */}
              <group onPointerOver={() => null} />
            </Portal>,
            scene,
            {
              events: {
                compute: eventCompute ?? computeFn,
                priority: eventPriority,
                connected: canvasRef.current,
              },
              size: { top: 0, left: 0, width, height },
            },
          )}
        </ThreeSceneContext>
      </CanvasTreeContext>
    </>
  );
}
