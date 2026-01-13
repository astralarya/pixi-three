import { Application } from "@pixi/react";
import type { Application as ApplicationType } from "pixi.js";
import { type ReactNode, useRef, useState } from "react";
import tunnel from "tunnel-rat";

import { PixiDomEventSystem } from "./pixi-dom-event-system";
import { PixiTextureRenderer } from "./pixi-texture";
import { PixiThreeEventSystem } from "./pixi-three-event-system";
import { RenderContextValue } from "./render-context-hooks";
import { ThreeRoot, type ThreeRootBaseProps } from "./three-root";
import { ThreeSceneRenderer } from "./three-scene";

/**
 * @category component
 * @expand
 */
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

  function setPixiApplication(app: ApplicationType | null) {
    if (!app) {
      setPixiDomEvents(null);
      setPixiTextureEvents(null);
    } else {
      setPixiDomEvents(new PixiDomEventSystem(app.renderer));
      setPixiTextureEvents(new PixiThreeEventSystem(app.renderer));
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
        }}
      >
        <Application
          className="hidden"
          width={1}
          height={1}
          preference="webgpu"
          resolution={2}
          onInit={(app) => {
            setPixiApplication(app);
          }}
        >
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
