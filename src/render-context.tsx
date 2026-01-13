import { Application, useApplication } from "@pixi/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import tunnel from "tunnel-rat";

import { PixiDomEventSystem } from "./pixi-dom-event-system";
import { PixiTextureRenderer } from "./pixi-texture";
import { PixiThreeEventSystem } from "./pixi-three-event-system";
import { RenderContextValue, useRenderContext } from "./render-context-hooks";
import { ThreeRoot, type ThreeRootBaseProps } from "./three-root";
import { ThreeSceneRenderer } from "./three-scene";

export interface RenderContextProps extends ThreeRootBaseProps {
  children?: ReactNode;
}

/**
 * @category component
 * @param props - Component props
 * @expandType RenderContextProps
 */
export function RenderContext({
  children,
  eventSource,
  threeRendererParameters,
  onCreated,
  onPointerMissed,
}: RenderContextProps) {
  const eventContainer = useRef<HTMLDivElement>(null!);

  const [pixiDomEvents, setPixiDomEvents] = useState<PixiDomEventSystem | null>(
    null,
  );
  const [pixiTextureEvents, setPixiTextureEvents] =
    useState<PixiThreeEventSystem | null>(null);

  function setPixiApplication(state: ReturnType<typeof useApplication> | null) {
    if (!state?.isInitialised) {
      setPixiDomEvents(null);
      setPixiTextureEvents(null);
    } else {
      setPixiDomEvents(new PixiDomEventSystem(state.app.renderer));
      setPixiTextureEvents(new PixiThreeEventSystem(state.app.renderer));
    }
  }

  const [canvasViewTunnel] = useState(tunnel());
  const [threeSceneTunnel] = useState(tunnel());
  const [pixiTextureTunnel] = useState(tunnel());

  return (
    <div ref={eventContainer} className="contents">
      <RenderContextValue
        value={{
          tunnel: canvasViewTunnel,
          eventContainer,
          pixiDomEvents,
          threeSceneTunnel,
          pixiTextureTunnel,
          pixiTextureEvents,
          setPixiApplication,
        }}
      >
        <Application
          className="hidden"
          width={0}
          height={0}
          preference="webgpu"
          resolution={2}
        >
          <InitContext />
          <pixiContainer renderable={false}>
            <canvasViewTunnel.Out />
          </pixiContainer>
          <ThreeRoot
            eventSource={eventSource ?? eventContainer}
            threeRendererParameters={threeRendererParameters}
            onCreated={onCreated}
            onPointerMissed={onPointerMissed}
          >
            <ThreeSceneRenderer />
          </ThreeRoot>
          <PixiTextureRenderer />
        </Application>
        {children}
      </RenderContextValue>
    </div>
  );
}

function InitContext() {
  const { setPixiApplication } = useRenderContext();
  const pixi = useApplication();
  useEffect(() => {
    setPixiApplication(pixi);
    return () => setPixiApplication(null);
  }, [pixi, pixi.isInitialised, setPixiApplication]);
  return null;
}
