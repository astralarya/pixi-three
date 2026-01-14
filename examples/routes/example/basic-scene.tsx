import { CanvasView, RenderContext, ThreeScene } from "@astralarium/pixi-three";
import { createFileRoute } from "@tanstack/react-router";

import { SpinnyCube } from "../../components/spinny-cube";
import { SpinnyStar } from "../../components/spinny-star";

export const Route = createFileRoute("/example/basic-scene")({
  component: BasicScene,
});

function BasicScene() {
  return (
    <RenderContext>
      <CanvasView alpha>
        <ThreeScene>
          <SpinnyCube position={[-2, -2, 0]} />
          <SpinnyCube position={[0, -2, 0]} />
          <SpinnyCube position={[2, -2, 0]} />
          <SpinnyCube position={[-2, 0, 0]} />
          <SpinnyCube position={[0, 0, 0]} />
          <SpinnyCube position={[2, 0, 0]} />
          <SpinnyCube position={[-2, 2, 0]} />
          <SpinnyCube position={[0, 2, 0]} />
          <SpinnyCube position={[2, 2, 0]} />
        </ThreeScene>
        <SpinnyStar />
      </CanvasView>
    </RenderContext>
  );
}
