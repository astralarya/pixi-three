import { CanvasView, RenderContext, ThreeScene } from "@astralarium/pixi-three";
import { createFileRoute } from "@tanstack/react-router";
import { Point } from "pixi.js";
import { useRef } from "react";

import { FadeIn } from "#components/fade-in";
import {
  LandmarkPointer,
  PointerTapHandler,
} from "#components/landmark-pointer";
import { SpinnyCubeWithFollowers } from "#components/spinny-cube-with-followers";
import { PIXI_THREE_STAR } from "#components/spinny-star";

import { Frame } from "./-frame";

export const Route = createFileRoute("/example/bijections")({
  component: Bijections,
});

function Bijections() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkRef = useRef<Point | null>(null);
  const mousePosRef = useRef<Point | null>(null);

  return (
    <Frame
      title="Bijections"
      subtitle="Coordinate system mapping"
      sourceUrl="https://github.com/astralarium/pixi-three/blob/main/examples/routes/example/bijections.tsx"
      canvasRef={canvasRef}
    >
      <RenderContext>
        <CanvasView alpha canvasRef={canvasRef}>
          <PointerTapHandler mousePosRef={mousePosRef} canvasRef={canvasRef} />
          <FadeIn>
            <ThreeScene>
              <SpinnyCubeWithFollowers
                size={3}
                speed={0.25}
                initialColors={PIXI_THREE_STAR}
                landmarkRef={landmarkRef}
                mousePosRef={mousePosRef}
              />
            </ThreeScene>
          </FadeIn>
          <LandmarkPointer targetRef={landmarkRef} mousePosRef={mousePosRef} />
        </CanvasView>
      </RenderContext>
    </Frame>
  );
}
