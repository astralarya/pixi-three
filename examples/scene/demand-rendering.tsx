import { CanvasView, RenderContext, ThreeScene } from "@astralarium/pixi-three";

import { HoverBox } from "../components/hover-box";
import { HoverCube } from "../components/hover-cube";

export function DemandRendering() {
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
