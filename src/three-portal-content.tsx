import { type RootState, useFrame, useThree } from "@react-three/fiber";
import {
  type ReactNode,
  type Ref,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import {
  DepthTexture,
  FloatType,
  type PerspectiveCamera,
  RenderTarget,
  type RenderTargetOptions,
  type Texture,
} from "three";
import type WebGPUBackend from "three/src/renderers/webgpu/WebGPUBackend.js";
import { type PostProcessing, type WebGPURenderer } from "three/webgpu";

/** @internal */
export interface PortalContentProps {
  ref?: Ref<RenderTarget>;
  renderPriority: number;
  width: number;
  height: number;
  resolution: number;
  renderTargetOptions?: RenderTargetOptions;
  children: ReactNode;
  onTextureUpdate?: (x: GPUTexture) => unknown;
  postProcessing?: (x: RootState) => PostProcessing;
  /** Frameloop mode: "always" renders every frame, "demand" only renders when frameRequested is true */
  frameloop?: "always" | "demand";
  /** Function to check if a frame render is requested (for frameloop="demand") */
  isFrameRequested?: () => boolean;
  /** Callback to clear the frame request after rendering */
  signalFrame?: () => void;
}

/** @internal */
export function PortalContent({
  ref,
  renderPriority,
  width,
  height,
  resolution,
  renderTargetOptions,
  children,
  onTextureUpdate,
  postProcessing,
  frameloop = "always",
  isFrameRequested,
  signalFrame,
}: PortalContentProps) {
  const state = useThree();
  const backendData = (
    (state.gl as unknown as WebGPURenderer).backend as WebGPUBackend & {
      data: WeakMap<Texture, { texture: GPUTexture }>;
    }
  ).data;
  const { camera, setSize, setDpr } = state;

  const renderTarget = useRef(
    (() => {
      const val = new RenderTarget(
        width * resolution,
        height * resolution,
        renderTargetOptions,
      );
      if (renderTargetOptions?.depthBuffer) {
        val.depthTexture = new DepthTexture(
          width * resolution,
          height * resolution,
          FloatType,
        );
      }
      return val;
    })(),
  );

  useImperativeHandle(ref, () => renderTarget.current, []);

  useEffect(() => {
    const val = renderTarget.current;
    return () => val.dispose();
  }, []);

  useLayoutEffect(() => {
    renderTarget.current.setSize(width * resolution, height * resolution);
    if (renderTarget.current.depthTexture) {
      renderTarget.current.depthTexture.dispose();
      renderTarget.current.depthTexture = new DepthTexture(
        width * resolution,
        height * resolution,
        FloatType,
      );
    }
    if (renderTargetOptions?.samples) {
      renderTarget.current.samples = renderTargetOptions.samples;
    }
  }, [width, height, resolution, renderTargetOptions?.samples]);

  const onResize = useEffectEvent(
    (width: number, height: number, resolution: number) => {
      // eslint-disable-next-line react-hooks/immutability
      (camera as PerspectiveCamera).aspect = width / height;
      camera.updateProjectionMatrix();
      setSize(width, height);
      setDpr(resolution);
    },
  );

  useEffect(() => {
    onResize(width, height, resolution);
  }, [width, height, resolution]);

  const postProcessor = postProcessing ? postProcessing(state) : null;
  useFrame(() => {
    if (frameloop === "always" || isFrameRequested?.()) {
      const gl = state.gl as unknown as WebGPURenderer;
      const oldAutoClear = gl.autoClear;
      const oldXrEnabled = gl.xr.enabled;
      const oldIsPresenting = gl.xr.isPresenting;
      const oldRenderTarget = gl.getRenderTarget();
      // eslint-disable-next-line react-hooks/immutability
      gl.autoClear = true;
      gl.xr.enabled = false;
      gl.xr.isPresenting = false;
      gl.setRenderTarget(renderTarget.current);
      if (postProcessor) {
        postProcessor.render();
      } else {
        gl.render(state.scene, state.camera);
      }
      if (onTextureUpdate) {
        const textureData = backendData.get(renderTarget.current.texture)!;
        onTextureUpdate(textureData.texture);
      }
      gl.setRenderTarget(oldRenderTarget);
      gl.autoClear = oldAutoClear;
      gl.xr.enabled = oldXrEnabled;
      gl.xr.isPresenting = oldIsPresenting;
      signalFrame?.();
    }
  }, renderPriority);
  return <>{children}</>;
}
