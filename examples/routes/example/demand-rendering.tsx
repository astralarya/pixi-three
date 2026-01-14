import { CanvasView, RenderContext, ThreeScene } from "@astralarium/pixi-three";
import { createFileRoute } from "@tanstack/react-router";

import { HoverBox } from "../../components/hover-box";
import { HoverCube } from "../../components/hover-cube";
import { Frame } from "./-frame";

export const Route = createFileRoute("/example/demand-rendering")({
  component: DemandRendering,
});

function DemandRendering() {
  return (
    <Frame
      title="Demand Rendering"
      subtitle="Frames are only rendered on interaction."
      sourceUrl="https://github.com/astralarium/pixi-three/blob/main/examples/routes/example/demand-rendering.tsx"
    >
      <RenderContext>
        <CanvasView alpha frameloop="demand">
          <ThreeScene frameloop="demand">
            <HoverCube position={[-2, 0, 0]} />
          </ThreeScene>
          <HoverBox />
        </CanvasView>
      </RenderContext>
    </Frame>
  );
}
