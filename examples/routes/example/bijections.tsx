import { CanvasView, RenderContext, ThreeScene } from "@astralarium/pixi-three";
import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";

import { FadeIn } from "#components/fade-in";
import { SpinnyCubeWithFollowers } from "#components/spinny-cube-with-followers";
import { PIXI_THREE_STAR } from "#components/spinny-star";

import { Frame } from "./-frame";

export const Route = createFileRoute("/example/bijections")({
  component: Bijections,
});

function Bijections() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <Frame
      title="Bijections"
      subtitle="Coordinate system mapping"
      sourceUrl="https://github.com/astralarium/pixi-three/blob/main/examples/routes/example/bijections.tsx"
      canvasRef={canvasRef}
    >
      <RenderContext>
        <CanvasView alpha canvasRef={canvasRef}>
          <FadeIn>
            <ThreeScene>
              <SpinnyCubeWithFollowers
                size={3}
                speed={0.25}
                initialColors={PIXI_THREE_STAR}
              />
            </ThreeScene>
          </FadeIn>
        </CanvasView>
      </RenderContext>
    </Frame>
  );
}
