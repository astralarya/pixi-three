import { useApplication } from "@pixi/react";
import {
  type ConstructorRepresentation,
  createRoot,
  events,
  extend,
  type ReconcilerRoot,
  type RootState,
  type ThreeToJSXElements,
  unmountComponentAtNode,
} from "@react-three/fiber";
import { type WebGPURenderer as PixiWebGPURenderer } from "pixi.js";
import {
  type PropsWithChildren,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { type WebGPURendererParameters } from "three/src/renderers/webgpu/WebGPURenderer.js";
import { WebGPURenderer } from "three/webgpu";
import * as THREE from "three/webgpu";

import { useBridge } from "./use-bridge";

extend(THREE as unknown as ConstructorRepresentation);

declare module "@react-three/fiber" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

export interface ThreeRootBaseProps {
  eventSource?: RefObject<HTMLElement | null>;
  /** WebGPURenderer parameters */
  threeRendererParameters?: Partial<WebGPURendererParameters>;
  /** Callback after the canvas has rendered (but not yet committed) */
  onCreated?: (state: RootState) => void;
  /** Response for pointer clicks that have missed any target */
  onPointerMissed?: (event: MouseEvent) => void;
}

export type ThreeRootProps = ThreeRootBaseProps & PropsWithChildren;

/**
 * @internal
 */
export function ThreeRoot({
  children,
  eventSource,
  threeRendererParameters,
  onCreated,
  onPointerMissed,
}: ThreeRootProps) {
  const Bridge = useBridge();
  const pixi = useApplication();
  const threeRootRef = useRef<ReconcilerRoot<HTMLCanvasElement>>(null);
  const [cleanupFn, setCleanupFn] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!pixi.isInitialised) {
      return;
    }

    async function initThree() {
      const canvas = pixi.app.canvas;

      const pixiRenderer = pixi.app.renderer as PixiWebGPURenderer;

      const renderer = new WebGPURenderer({
        canvas: canvas,
        device: pixiRenderer.device.gpu.device,
        ...threeRendererParameters,
      });

      renderer.setClearColor(0, 0);

      await renderer.init();

      pixi.app.renderer.resetState();

      const threeRoot = createRoot(canvas);

      threeRootRef.current = threeRoot;

      const threeState: RootState = await new Promise((resolve) => {
        void threeRoot.configure({
          frameloop: "never",
          gl: renderer,
          onCreated: (state) => {
            resolve(state);
            onCreated?.(state);
          },
          onPointerMissed,
          events,
        });
        threeRoot.render(<Bridge>{children}</Bridge>);
      });
      if (eventSource?.current) {
        threeState.events.connect?.(eventSource.current);
      }

      pixi.app.renderer.on("resize", (width, height) => {
        renderer.setSize(width, height);
        (threeState.camera as THREE.PerspectiveCamera).aspect = width / height;
        threeState.camera.updateProjectionMatrix();
      });

      function render() {
        threeState.advance(pixi.app.ticker.lastTime * 0.001);
        pixi.app.renderer.resetState();
      }

      const { prerender } = pixi.app.renderer.runners;

      const runner = { prerender: render };

      prerender.add(runner);

      setCleanupFn(() => () => {
        unmountComponentAtNode(canvas);
        try {
          prerender.remove(runner);
        } catch {
          /* ... */
        }
      });
    }

    void initThree();
  }, [
    Bridge,
    children,
    eventSource,
    threeRendererParameters,
    onCreated,
    onPointerMissed,
    pixi,
    pixi.isInitialised,
  ]);

  useEffect(() => {
    if (!cleanupFn) {
      return;
    }
    return cleanupFn;
  }, [cleanupFn]);

  useEffect(() => {
    threeRootRef.current?.render(<Bridge>{children}</Bridge>);
  }, [Bridge, children]);

  return null;
}
