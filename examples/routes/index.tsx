import { CanvasView, RenderContext, ThreeScene } from "@astralarium/pixi-three";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { PropsWithChildren } from "react";

import { Button } from "#components/ui/button";

import { SpinnyCube } from "../components/spinny-cube";

export const Route = createFileRoute("/")({
  component: LandingPageClient,
  pendingComponent: LandingPage,
  ssr: false,
});

function LandingPage({ children }: PropsWithChildren) {
  return (
    <div className="flex h-[calc(100svh-3rem)] flex-col items-center">
      <h1 className="relative z-10 mt-[8svh] text-6xl font-bold">
        <span className="text-pixired">Pixi</span>
        {" + "}
        <span className="text-threeblue">Three</span>
      </h1>

      <div className="-mt-[8svh] -mb-[8svh] grow">{children}</div>

      <div className="mb-[16svh] flex gap-4">
        <Button size="lg" render={<Link to="/docs" />}>
          Docs
        </Button>
        <Button
          size="lg"
          variant="outline"
          render={<Link to="/example/basic-scene" />}
        >
          Examples
        </Button>
      </div>
    </div>
  );
}

function LandingPageClient() {
  return (
    <LandingPage>
      <RenderContext>
        <CanvasView alpha>
          <ThreeScene>
            <SpinnyCube size={2.5} speed={0.25} />
          </ThreeScene>
        </CanvasView>
      </RenderContext>
    </LandingPage>
  );
}
