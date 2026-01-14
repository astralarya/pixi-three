import { extend, useApplication, useTick } from "@pixi/react";
import {
  CanvasSource,
  Container,
  Matrix,
  Rectangle,
  RenderTarget,
} from "pixi.js";
import {
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

import {
  CanvasTreeContext,
  type CanvasViewSize,
  useCanvasTreeStore,
} from "./canvas-tree-context";
import { CanvasViewContext as CanvasViewContentContext } from "./canvas-view-context";
import { useRenderContext } from "./render-context-hooks";
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
  /**
   * Pixi view transform {@link https://pixijs.download/release/docs/maths.Matrix.html | Matrix}.
   * Defaults to identity matrix
   */
  transform?: Matrix;
  /** Optional FPS limit */
  fpsLimit?: number;
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
  transform = new Matrix(),
  fpsLimit,
}: CanvasViewProps) {
  const id = useId();
  const { tunnel, pixiDomEvents } = useRenderContext();
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const containerRef = useRef<Container>(null!);
  const renderTargetRef = useRef<RenderTarget>(null!);

  useEffect(
    () => () => {
      renderTargetRef.current.colorTextures[0].destroy();
      renderTargetRef.current.destroy();
    },
    [],
  );

  return (
    <>
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
        className={className}
        {...pixiDomEvents?.bind(canvasRef, containerRef)}
      >
        {fallback}
      </canvas>
      <tunnel.In>
        <CanvasViewContent
          key={id}
          canvasRef={canvasRef}
          containerRef={containerRef}
          renderTargetRef={renderTargetRef}
          transform={transform}
          frameloop={frameloop}
          fpsLimit={fpsLimit}
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
  /** Pixi view transform */
  transform?: Matrix;
  /** Render mode: "always" or "demand", default "always" */
  frameloop: "always" | "demand";
  /** Optional FPS limit */
  fpsLimit?: number;
}

function CanvasViewContent({
  canvasRef,
  containerRef: containerRefProp,
  renderTargetRef,
  transform,
  frameloop,
  fpsLimit,
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
  const {
    subscribe,
    updateSnapshot: updateSnapshot_,
    notifySubscribers,
  } = store;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateSnapshot = (update: Partial<CanvasViewSize>) => {
    console.log("CanvasView updateSnapshot", update);
    updateSnapshot_(update);
  };

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
    let lastWidth = Math.round(canvas.clientWidth);
    let lastHeight = Math.round(canvas.clientHeight);
    const resizeObserver = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      if (width === lastWidth && height === lastHeight) {
        return;
      }
      lastWidth = width;
      lastHeight = height;
      updateSnapshot({ width, height });
      notifySubscribers();
    });
    resizeObserver.observe(canvas);
    if (lastWidth > 0 && lastHeight > 0) {
      updateSnapshot({
        width: lastWidth,
        height: lastHeight,
      });
      notifySubscribers();
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasRef, renderTargetRef, updateSnapshot, notifySubscribers]);

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
  }, [canvasRef, updateSnapshot, notifySubscribers]);

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
      transform,
      label: "canvas-view",
    });
  }

  useTick({
    callback: () => {
      if (frameloop === "always" || isFrameRequested()) {
        render();
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
