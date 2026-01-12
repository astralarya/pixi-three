import { CanvasContext, CanvasView, ThreeScene } from "#index.ts";
import { SpinnyCube } from "../examples/spinny-cube";
import { SpinnyStar } from "../examples/spinny-star";

export function BasicScene() {
  return (
    <CanvasContext>
      <CanvasView className="h-full w-full" alpha>
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
    </CanvasContext>
  );
}
