import { Application, useApplication } from "@pixi/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import tunnel from "tunnel-rat";

import { CanvasContextValue, useCanvasContext } from "./canvas-context-hooks";
import { PixiDomEventSystem } from "./pixi-dom-event-system";
import { PixiTextureRenderer } from "./pixi-texture";
import { PixiThreeEventSystem } from "./pixi-three-event-system";
import { ThreeRoot, type ThreeRootBaseProps } from "./three-root";
import { ThreeSceneRenderer } from "./three-scene";

export interface CanvasContextProps extends ThreeRootBaseProps {
  children?: ReactNode;
}

export function CanvasContext({
  children,
  eventSource,
  threeRendererParameters,
  onCreated,
  onPointerMissed,
}: CanvasContextProps) {
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
      <CanvasContextValue
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
          <PixiThreeContextInit />
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
      </CanvasContextValue>
    </div>
  );
}

function PixiThreeContextInit() {
  const { setPixiApplication } = useCanvasContext();
  const pixi = useApplication();
  useEffect(() => {
    setPixiApplication(pixi);
    return () => setPixiApplication(null);
  }, [pixi, pixi.isInitialised, setPixiApplication]);
  return null;
}
