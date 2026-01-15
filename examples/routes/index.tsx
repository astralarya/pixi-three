import { CanvasView, RenderContext, ThreeScene } from "@astralarium/pixi-three";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { PropsWithChildren } from "react";

import { FadeIn } from "#components/fade-in";
import { SpinnyCube } from "#components/spinny-cube";
import { Button } from "#components/ui/button";

export const Route = createFileRoute("/")({
  component: LandingPageClient,
  pendingComponent: LandingPage,
  ssr: false,
});

function LandingPage({ children }: PropsWithChildren) {
  return (
    <div className="isolate flex h-[calc(100svh-3rem)] flex-col items-center">
      <div className="mx-2 mt-[calc(18svh-5rem)] text-center">
        <h1 className="text-6xl font-bold">
          <span className="text-pixi-red">Pixi</span>
          <span className="text-three-blue">Three</span>
        </h1>
        <p className="text-muted-foreground mt-4 max-w-md text-center text-lg">
          <span className="max-sm:hidden">
            Create declarative apps with unified composition of 2D and 3D in
            React.
          </span>
          <span className="sm:hidden">
            Unified 2D and 3D composition in React.
          </span>
        </p>
      </div>

      <div className="-z-10 -mt-[14svh] -mb-[14svh] min-h-0 grow">
        {children}
      </div>

      <div className="mb-[calc(20svh-4rem)] flex gap-4">
        <Button size="lg" render={<a href="/pixi-three/docs/" />}>
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
          <FadeIn>
            <ThreeScene>
              <SpinnyCube
                size={2.5}
                speed={0.25}
                initialColors={{
                  star1: "#049ef4",
                  star1Hover: "#77ceff",
                  star2: "#e91e63",
                  star2Hover: "#fe68a6",
                }}
              />
            </ThreeScene>
          </FadeIn>
        </CanvasView>
      </RenderContext>
    </LandingPage>
  );
}
