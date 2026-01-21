import { extend, useApplication, useTick } from "@pixi/react";
import {
  CanvasSource,
  Container,
  Point,
  Rectangle,
  RenderTarget,
} from "pixi.js";
import {
  type PointerEvent as ReactPointerEvent,
  type PropsWithChildren,
  type ReactNode,
  type Ref,
  type RefObject,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { mapClientToViewport } from "./bijections";
import { CanvasTreeContext, useCanvasTreeStore } from "./canvas-tree-context";
import { CanvasViewContext as CanvasViewContentContext } from "./canvas-view-context";
import { useRenderContext } from "./render-context-hooks";
import { usePixiEventDispatch } from "./use-pixi-event-dispatch";
import { useRenderSchedule } from "./use-render-schedule";

extend({ Container });

/**
 * See {@link CanvasView}.
 *
 * @category component
 * @expand
 */
export interface CanvasViewProps extends PropsWithChildren {
  /** Class name for the canvas element, default "h-full w-full" */
  className?: string;
  /** Canvas fallback content */
  fallback?: ReactNode;
  /** Render mode: "always" or "demand", default "always" */
  frameloop?: "always" | "demand";
  /** Enable alpha transparency, default false */
  alpha?: boolean;
  /** Enable antialiasing */
  antialias?: boolean;
  /** Canvas resolution. Defaults to window.devicePixelRatio */
  resolution?: number;
  /** Optional FPS limit */
  fpsLimit?: number;
  /** Callback invoked after each frame renders. Useful for recording integration. */
  onRender?: () => void;
  /** Optional ref to the canvas element. Useful for recording with useCanvasRecorder. */
  canvasRef?: RefObject<HTMLCanvasElement | null>;
}

/**
 * A canvas DOM element that contains React Pixi children.
 *
 * It must be inside a {@link RenderContext} component.
 *
 * @category component
 * @param props - Component props
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
export function CanvasView({
  className = "h-full w-full",
  fallback,
  children,
  frameloop = "always",
  alpha = false,
  antialias = true,
  resolution = window.devicePixelRatio,
  fpsLimit,
  onRender,
  canvasRef: canvasRefProp,
}: CanvasViewProps) {
  const id = useId();
  const { tunnel } = useRenderContext();
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  useImperativeHandle(canvasRefProp, () => canvasRef.current);
  const containerRef = useRef<Container>(null!);
  const renderTargetRef = useRef<RenderTarget>(null!);

  const dispatchEvent = usePixiEventDispatch({
    containerRef,
    canvasRef,
  });

  const computeEventPoint = (event: ReactPointerEvent | React.WheelEvent) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return null;

    const viewRect = container.hitArea as Rectangle;
    if (!viewRect) return null;

    const rect = canvas.isConnected
      ? canvas.getBoundingClientRect()
      : {
          left: 0,
          top: 0,
          width: canvas.width,
          height: canvas.height,
        };

    const viewport = mapClientToViewport(
      event.clientX,
      event.clientY,
      rect,
      viewRect,
    );
    return new Point(viewport.x, viewport.y);
  };

  const handleEvent = (event: ReactPointerEvent | React.WheelEvent) => {
    const point = computeEventPoint(event);
    dispatchEvent(event.nativeEvent, point);
  };

  useEffect(
    () => () => {
      renderTargetRef.current.colorTextures[0].destroy();
      renderTargetRef.current.destroy();
    },
    [],
  );

  return (
    <>
      <div className={className} style={{ position: "relative" }}>
        <canvas
          ref={(ref) => {
            if (!ref) {
              return;
            }
            canvasRef.current = ref;
            renderTargetRef.current = new RenderTarget({
              width: ref.clientWidth,
              height: ref.clientHeight,
              resolution: resolution,
              antialias: antialias,
              colorTextures: [
                {
                  source: new CanvasSource({
                    resource: ref,
                    resolution: resolution,
                    transparent: alpha,
                    autoGarbageCollect: false,
                  }),
                },
              ],
            });
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
          }}
          onPointerDown={handleEvent}
          onPointerUp={handleEvent}
          onPointerMove={handleEvent}
          onPointerOver={handleEvent}
          onPointerOut={handleEvent}
          onPointerLeave={handleEvent}
          onPointerCancel={handleEvent}
          onWheel={handleEvent}
        >
          {fallback}
        </canvas>
      </div>
      <tunnel.In>
        <CanvasViewContent
          key={id}
          canvasRef={canvasRef}
          containerRef={containerRef}
          renderTargetRef={renderTargetRef}
          frameloop={frameloop}
          fpsLimit={fpsLimit}
          onRender={onRender}
        >
          {children}
        </CanvasViewContent>
      </tunnel.In>
    </>
  );
}

interface CanvasViewContentProps extends PropsWithChildren {
  /** Canvas element ref */
  canvasRef: RefObject<HTMLCanvasElement>;
  /** Pixi Container ref */
  containerRef: Ref<Container>;
  /** Pixi RenderTarget Ref */
  renderTargetRef: RefObject<RenderTarget>;
  /** Render mode: "always" or "demand", default "always" */
  frameloop: "always" | "demand";
  /** Optional FPS limit */
  fpsLimit?: number;
  /** Callback invoked after each frame renders */
  onRender?: () => void;
}

function CanvasViewContent({
  canvasRef,
  containerRef: containerRefProp,
  renderTargetRef,
  frameloop,
  fpsLimit,
  onRender,
  children,
}: CanvasViewContentProps) {
  const app = useApplication();
  const containerRef = useRef<Container>(null!);
  useImperativeHandle(containerRefProp, () => containerRef.current);

  const [isVisible, setIsVisible] = useState(true);

  const { isFrameRequested, invalidate, signalFrame } = useRenderSchedule({
    fpsLimit,
  });

  const store = useCanvasTreeStore();
  const { subscribe, updateSnapshot, notifySubscribers } = store;

  const pendingSizeRef = useRef<{ width: number; height: number }>({
    width: 1,
    height: 1,
  });
  const appliedSizeRef = useRef<{ width: number; height: number }>({
    width: 1,
    height: 1,
  });

  useEffect(
    () =>
      subscribe((size) => {
        if (!renderTargetRef.current.colorTextures[0]?.source?.resource) {
          return;
        }
        (containerRef.current.hitArea as Rectangle).set(
          0,
          0,
          size.width,
          size.height,
        );
        renderTargetRef.current.resize(
          size.width,
          size.height,
          size.resolution,
        );
      }),
    [subscribe, renderTargetRef],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const width = Math.round(canvas.clientWidth);
    const height = Math.round(canvas.clientHeight);
    pendingSizeRef.current = { width, height };

    const resizeObserver = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      pendingSizeRef.current = { width, height };
      invalidate();
    });
    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasRef, invalidate]);

  useEffect(() => {
    let removeListener: (() => void) | null = null;
    const updatePixelRatio = () => {
      removeListener?.();
      const media = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      media.addEventListener("change", updatePixelRatio);
      removeListener = () => {
        media.removeEventListener("change", updatePixelRatio);
      };
      updateSnapshot({ resolution: window.devicePixelRatio });
      notifySubscribers();
    };
    updatePixelRatio();
    return () => {
      removeListener?.();
    };
  }, [canvasRef, notifySubscribers, updateSnapshot]);

  useEffect(() => {
    const canvas = canvasRef.current;

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0 },
    );

    intersectionObserver.observe(canvas);

    return () => {
      intersectionObserver.disconnect();
    };
  }, [canvasRef]);

  function render() {
    app.app.renderer.render({
      container: containerRef.current,
      target: renderTargetRef.current,
      label: "canvas-view",
    });
  }

  useTick({
    callback: () => {
      if (frameloop === "always" || isFrameRequested()) {
        const pendingSize = pendingSizeRef.current;
        const appliedSize = appliedSizeRef.current;
        if (
          pendingSize.width !== appliedSize.width ||
          pendingSize.height !== appliedSize.height
        ) {
          appliedSizeRef.current = pendingSize;
          updateSnapshot(pendingSize);
          notifySubscribers();
        }

        render();
        onRender?.();
        signalFrame();
      }
    },
    isEnabled: isVisible,
  });

  return (
    <CanvasViewContentContext
      value={{
        canvasRef,
        containerRef,
      }}
    >
      <CanvasTreeContext value={{ store, invalidate }}>
        <pixiContainer
          ref={(ref) => {
            if (!ref) {
              return;
            }
            containerRef.current = ref;
            const width = Math.round(canvasRef.current.clientWidth);
            const height = Math.round(canvasRef.current.clientHeight);
            const resolution = window.devicePixelRatio;
            if (width > 0 && height > 0) {
              updateSnapshot({
                width: width,
                height: height,
                resolution: resolution,
              });
              containerRef.current.hitArea = new Rectangle(0, 0, width, height);
              renderTargetRef.current.resize(width, height, resolution);
            }
          }}
        >
          {children}
        </pixiContainer>
      </CanvasTreeContext>
    </CanvasViewContentContext>
  );
}
