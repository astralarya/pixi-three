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
      <div className="mt-[8svh] text-center">
        <h1 className="text-6xl font-bold">
          <span className="text-pixired">Pixi</span>
          <span className="text-threeblue">Three</span>
        </h1>
        <p className="text-muted-foreground mt-4 max-w-md text-center text-lg">
          Write declarative apps seamlessly blending 2d and 3d components in
          React.
        </p>
      </div>

      <div className="-z-10 -mt-[16svh] -mb-[14svh] grow">{children}</div>

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
            <SpinnyCube
              size={2.5}
              speed={0.25}
              initialColors={{
                star1: "#049ef4",
                star2: "#e91e63",
              }}
            />
          </ThreeScene>
        </CanvasView>
      </RenderContext>
    </LandingPage>
  );
}
