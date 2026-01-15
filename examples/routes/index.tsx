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
      <div className="mx-2 mt-[clamp(0rem,10svh-2rem,8rem)] text-center">
        <h1 className="text-[clamp(2.5rem,min(12svh,14svw),4rem)] font-bold [@media(max-height:400px)]:hidden [@media(max-width:200px)]:hidden">
          <span className="text-pixi-red">Pixi</span>
          <span className="text-three-blue">Three</span>
        </h1>
        <p className="text-muted-foreground mt-[clamp(0rem,2svh,1rem)] max-w-md text-center text-[clamp(0.875rem,2.5svh,1.125rem)] [@media(max-height:600px)]:hidden [@media(max-width:200px)]:hidden">
          <span className="max-sm:hidden">
            Declarative composition of 2D and 3D in React.
          </span>
          <span className="sm:hidden">Declarative 2D and 3D in React.</span>
        </p>
      </div>

      <div className="-z-10 -mt-[clamp(0rem,10svh+1rem,8rem)] -mb-[clamp(0rem,8svh+0.5rem,8rem)] min-h-0 w-full grow">
        {children}
      </div>

      <div className="mb-[clamp(0.1rem,12svh-2rem,8rem)] flex gap-4 [@media(max-width:200px)]:flex-col">
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
