import { CanvasView, RenderContext, ThreeScene } from "@astralarium/pixi-three";
import { createFileRoute } from "@tanstack/react-router";

import { HoverBox } from "../../components/hover-box";
import { HoverCube } from "../../components/hover-cube";

export const Route = createFileRoute("/example/demand-rendering")({
  component: DemandRendering,
});

function DemandRendering() {
  return (
    <RenderContext>
      <CanvasView alpha frameloop="demand">
        <ThreeScene frameloop="demand">
          <HoverCube position={[-2, 0, 0]} />
        </ThreeScene>
        <HoverBox />
      </CanvasView>
    </RenderContext>
  );
}
