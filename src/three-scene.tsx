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
  useThree,
} from "@react-three/fiber";
import {
  type Application,
  Container,
  ExternalSource,
  type IHitArea,
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
import {
  Raycaster,
  type RenderTargetOptions,
  Scene,
  Vector2,
  type Vector3,
} from "three";
import { type PostProcessing } from "three/webgpu";
import tunnel from "tunnel-rat";

import {
  mapNdcToPixi as mapNdcToPixiUtil,
  mapPixiToNdc as mapPixiToNdcUtil,
  mapThreeToNdc,
} from "./bijections";
import { useViewport } from "./canvas-tree-context";
import { CanvasTreeContext, useCanvasTreeStore } from "./canvas-tree-context";
import { useCanvasView } from "./canvas-view-context";
import {
  type PixiTextureContextValue,
  usePixiTextureContextOptional,
} from "./pixi-texture-context";
import { useRenderContext } from "./render-context-hooks";
import { Portal } from "./three-portal";
import {
  ThreeSceneContext,
  useThreeSceneContextOptional,
} from "./three-scene-context";
import { useBridge } from "./use-bridge";
import { useRenderSchedule } from "./use-render-schedule";

extend({ Container, Sprite });

/**
 * @internal
 */
export function ThreeSceneRenderer() {
  const { threeSceneTunnel } = useRenderContext();
  return <threeSceneTunnel.Out />;
}

/**
 * See {@link ThreeScene}.
 *
 * @category component
 * @expand
 */
export type ThreeSceneProps = PixiReactElementProps & ThreeSceneBaseProps;

/**
 * See {@link ThreeScene}.
 *
 * @category component
 * @expand
 */
export interface ThreeSceneBaseProps {
  /** Optional width of the texture, defaults to canvas parent bounds */
  width?: number;
  /** Optional height of the texture, defaults to canvas parent bounds */
  height?: number;
  /** Optional resolution of the texture, defaults to canvas parent resolution */
  resolution?: number;
  /**
   * Optional {@link https://threejs.org/docs/#WebGLRenderTarget | RenderTarget} options
   */
  renderTargetOptions?: RenderTargetOptions;
  /** Optional render priority, defaults to 0 */
  renderPriority?: number;
  /** Optional event priority, defaults to 0 */
  eventPriority?: number;
  /** Optional frameloop, defaults to "always" */
  frameloop?: "always" | "demand";
  /**
   * Optional event compute for {@link https://r3f.docs.pmnd.rs/api/events | React Three Fiber Events}, defaults to undefined
   */
  eventCompute?: ComputeFunction;
  /**
   * Optional {@link https://github.com/mrdoob/three.js/blob/dev/examples/jsm/tsl/display/PostProcessing.js | PostProcessing} factory, defaults to undefined
   */
  postProcessing?: (x: RootState) => PostProcessing;
  /** Optional FPS limit */
  fpsLimit?: number;
  /** Children will be rendered into a portal */
  children: ReactNode;
}

/**
 * A {@link https://pixijs.download/release/docs/scene.Sprite.html | Pixi Sprite} that contains
 * {@link https://r3f.docs.pmnd.rs/getting-started/introduction | React Three Fiber} children.
 *
 * Renders {@link https://threejs.org/docs/#Scene | Three.js} 3D content as a
 * {@link https://react.pixijs.io/components/sprite | Pixi.js sprite}.
 * It must be inside a {@link CanvasView} component.
 *
 * @category component
 * @param props - Also accepts {@link https://github.com/pixijs/pixi-react/blob/main/src/typedefs/PixiReactNode.ts | PixiReactElementProps}
 * @expandType ThreeSceneBaseProps
 * @example
 * ```tsx
 * <RenderContext>
 *   <CanvasView>
 *     <ThreeScene>
 *       <SpinnyCube /> // Three.js Object
 *     </ThreeScene>
 *     <SpinnyStar /> // Pixi.js Graphic
 *   </CanvasView>
 * </RenderContext>
 * ```
 */
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
  fpsLimit,
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
        fpsLimit={fpsLimit}
      >
        {children}
      </ThreeSceneSprite>
    </pixiContainer>
  );
}

interface ThreeSceneSpriteProps extends ThreeSceneBaseProps {
  /** Three View Sprite Ref */
  spriteRef: Ref<Sprite>;
  /** Pixi Container ref*/
  containerRef: RefObject<Container>;
}

function ThreeSceneSprite(props: ThreeSceneSpriteProps) {
  const Bridge = useBridge();
  const { app } = useApplication();
  const { threeSceneTunnel } = useRenderContext();
  const pixiTextureContext = usePixiTextureContextOptional();
  const parentThreeSceneContext = useThreeSceneContextOptional();

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
  return parentThreeSceneContext ? (
    <parentThreeSceneContext.sceneTunnel.In>
      {sprite}
    </parentThreeSceneContext.sceneTunnel.In>
  ) : (
    <threeSceneTunnel.In>{sprite}</threeSceneTunnel.In>
  );
}

interface ThreeSceneSpriteInternalProps extends ThreeSceneSpriteProps {
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
  fpsLimit,
  children,
}: ThreeSceneSpriteInternalProps) {
  const { canvasRef, containerRef: canvasContainerRef } = useCanvasView();
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

  const sprite = useRef(
    (() => {
      const x = new Sprite({
        width,
        height,
        eventMode: "static",
      });
      x.texture = new Texture({
        dynamic: true,
        source: new ExternalSource({
          label: "three-scene",
        }),
      });
      return x;
    })(),
  );

  useImperativeHandle(spriteRef, () => sprite.current, []);

  const changedSize = useRef(false);

  useEffect(() => {
    changedSize.current = true;
  }, [height, width]);

  function onTextureUpdate(texture: GPUTexture) {
    sprite.current.texture.source.resource = texture;
    sprite.current.texture.source.update();
    if (changedSize.current) {
      sprite.current.setSize(width, height);
      changedSize.current = false;
    }
  }

  function mapPixiToNdc(point: Point, ndc: Vector2) {
    mapPixiToNdcUtil(point, ndc, sprite.current.getLocalBounds());
  }

  function mapNdcToPixi(ndc: Vector2, point: Point) {
    mapNdcToPixiUtil(ndc, point, sprite.current.getLocalBounds());
  }

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
      pixiTextureContext.mapUvToPixi(uv, globalPos);
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
    mapPixiToNdc(localPos, state.pointer);
    state.raycaster.setFromCamera(state.pointer, state.camera);
  }

  const sceneTunnel = tunnel();

  function setHitArea(
    hitArea: { contains(x: number, y: number): boolean } | null,
  ) {
    const currentSprite = sprite.current;
    currentSprite.hitArea = hitArea && {
      contains(x: number, y: number): boolean {
        return hitArea.contains(
          x / width / size.resolution,
          y / height / size.resolution,
        );
      },
    };
  }

  const { isFrameRequested, invalidate, signalFrame } = useRenderSchedule({
    fpsLimit,
  });

  return (
    <>
      <CanvasTreeContext value={{ store, invalidate }}>
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
            isFrameRequested={isFrameRequested}
            signalFrame={signalFrame}
          >
            <ThreeSceneContextProvider
              containerRef={containerRef}
              sceneTunnel={sceneTunnel}
              mapPixiToNdc={mapPixiToNdc}
              mapNdcToPixi={mapNdcToPixi}
              sprite={sprite}
              pixiTextureContext={pixiTextureContext}
            >
              <HitAreaSetup setHitArea={setHitArea} />
              {children}
              <sceneTunnel.Out />
            </ThreeSceneContextProvider>
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
      </CanvasTreeContext>
    </>
  );
}

interface ThreeSceneContextProviderProps {
  containerRef: RefObject<Container>;
  sceneTunnel: ReturnType<typeof tunnel>;
  mapPixiToNdc: (point: Point, ndc: Vector2) => void;
  mapNdcToPixi: (ndc: Vector2, point: Point) => void;
  sprite: RefObject<Sprite>;
  pixiTextureContext: PixiTextureContextValue | null;
  children: ReactNode;
}

function ThreeSceneContextProvider({
  containerRef,
  sceneTunnel,
  mapPixiToNdc,
  mapNdcToPixi,
  sprite,
  pixiTextureContext,
  children,
}: ThreeSceneContextProviderProps) {
  const { camera } = useThree();

  const _ndc = new Vector2();
  const _localPos = new Point();

  function mapThreeToParentPixiLocal(vec3: Vector3, point: Point) {
    // Project world vec3 through camera to NDC
    mapThreeToNdc(vec3, _ndc, camera);

    // Map NDC to local sprite coords
    mapNdcToPixi(_ndc, point);
  }

  function mapThreeToParentPixi(vec3: Vector3, point: Point) {
    mapThreeToParentPixiLocal(vec3, _localPos);

    // Transform to global Pixi coords
    sprite.current.toGlobal(_localPos, point);
  }

  function mapThreeToViewport(vec3: Vector3, point: Point) {
    mapThreeToParentPixi(vec3, point);

    // If inside PixiTexture, delegate to parent's mapPixiToViewport
    if (pixiTextureContext) {
      pixiTextureContext.mapPixiToViewport(point, point);
    }
    // Otherwise we're at CanvasView level - point is already in viewport coords
  }

  return (
    <ThreeSceneContext
      value={{
        containerRef,
        sceneTunnel,
        mapPixiToNdc,
        mapNdcToPixi,
        mapThreeToParentPixiLocal,
        mapThreeToParentPixi,
        mapThreeToViewport,
      }}
    >
      {children}
    </ThreeSceneContext>
  );
}

interface HitAreaSetupProps {
  setHitArea: (hitArea: IHitArea | null) => void;
}

function HitAreaSetup({ setHitArea }: HitAreaSetupProps) {
  const { camera, scene } = useThree();
  const [raycaster] = useState(new Raycaster());
  const [pointer] = useState(new Vector2());

  useEffect(() => {
    setHitArea({
      contains(x: number, y: number): boolean {
        pointer.set(x * 2 - 1, -(y * 2 - 1));
        raycaster.setFromCamera(pointer, camera);

        const intersects = raycaster.intersectObjects(scene.children, true);
        return intersects.length > 0;
      },
    });

    return () => {
      setHitArea(null);
    };
  }, [setHitArea, raycaster, pointer, camera, scene]);

  return null;
}
