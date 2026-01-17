import { CanvasView, RenderContext, ThreeScene } from "@astralarium/pixi-three";
import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";

import { FadeIn } from "#components/fade-in";
import { SpinnyCube } from "#components/spinny-cube";
import { SpinnyStar } from "#components/spinny-star";

import { Frame } from "./-frame";

export const Route = createFileRoute("/example/basic-scene")({
  component: BasicScene,
});

function BasicScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <Frame
      title="Basic Scene"
      subtitle="Pixi inside of Three&mdash;inside of Pixi!"
      sourceUrl="https://github.com/astralarium/pixi-three/blob/main/examples/routes/example/basic-scene.tsx"
      canvasRef={canvasRef}
    >
      <RenderContext>
        <CanvasView alpha canvasRef={canvasRef}>
          <FadeIn>
            <SpinnyStar
              alpha={0.1}
              speed={0.1}
              initialColors={{
                star1: "#049ef4",
                star2: "#e91e63",
              }}
            />
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
          </FadeIn>
        </CanvasView>
      </RenderContext>
    </Frame>
  );
}
