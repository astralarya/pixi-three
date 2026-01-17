import { CanvasView, RenderContext, ThreeScene } from "@astralarium/pixi-three";
import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";

import { FadeIn } from "#components/fade-in";
import { HoverBox } from "#components/hover-box";
import { HoverCube } from "#components/hover-cube";

import { Frame } from "./-frame";

export const Route = createFileRoute("/example/demand-rendering")({
  component: DemandRendering,
});

function DemandRendering() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <Frame
      title="Demand Rendering"
      subtitle="Frames are rendered on demand."
      sourceUrl="https://github.com/astralarium/pixi-three/blob/main/examples/routes/example/demand-rendering.tsx"
      canvasRef={canvasRef}
    >
      <RenderContext>
        <CanvasView alpha frameloop="demand" canvasRef={canvasRef}>
          <FadeIn>
            <ThreeScene frameloop="demand">
              <HoverCube position={[-2, 0, 0]} />
            </ThreeScene>
            <HoverBox />
          </FadeIn>
        </CanvasView>
      </RenderContext>
    </Frame>
  );
}
