import { useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef } from "react";
import {
  DepthTexture,
  FloatType,
  RenderTarget,
  type RenderTargetOptions,
} from "three";

/**
 * @internal
 *
 * Hook for creating and managing a {@link https://threejs.org/docs/#RenderTarget | Three.js RenderTarget}.
 *
 * @param width - Optional target width, defaults to canvas size
 * @param height - Optional target height, defaults to canvas size
 * @param options - Optional {@link https://threejs.org/docs/#RenderTarget | RenderTarget} options
 * @returns Ref to the RenderTarget
 * @category hook
 */
export function useRenderTarget(
  width?: number,
  height?: number,
  options?: RenderTargetOptions,
) {
  const { size, viewport } = useThree(({ size, viewport, camera }) => ({
    size,
    viewport,
    camera,
  }));
  const _width = (width ?? size.width) * viewport.dpr;
  const _height = (height ?? size.height) * viewport.dpr;

  const renderTarget = useRef(
    (() => {
      const val = new RenderTarget(_width, _height, options);
      if (options?.depthBuffer) {
        val.depthTexture = new DepthTexture(_width, _height, FloatType);
      }
      return val;
    })(),
  );

  useLayoutEffect(() => {
    renderTarget.current.setSize(_width, _height);
    if (renderTarget.current.depthTexture) {
      renderTarget.current.depthTexture.dispose();
      renderTarget.current.depthTexture = new DepthTexture(
        _width,
        _height,
        FloatType,
      );
    }
    if (options?.samples) {
      renderTarget.current.samples = options.samples;
    }
  }, [_width, _height, options?.samples, renderTarget]);

  useEffect(() => {
    const val = renderTarget.current;
    return () => val.dispose();
  });

  return renderTarget;
}
