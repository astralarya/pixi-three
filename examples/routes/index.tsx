import { CanvasView, RenderContext, ThreeScene } from "@astralarium/pixi-three";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { PropsWithChildren } from "react";

import { FadeIn } from "#components/fade-in";
import { SpinnyCubeWithStars } from "#components/spinny-cube-with-stars";
import { PIXI_THREE_STAR } from "#components/spinny-star";
import { Button } from "#components/ui/button";

export const Route = createFileRoute("/")({
  component: LandingPageClient,
  pendingComponent: LandingPage,
  ssr: false,
});

function LandingPage({ children }: PropsWithChildren) {
  return (
    <div className="isolate mt-[max(0rem,30svh-16rem)] flex h-[clamp(0rem,100svh-2.5rem,48rem)] flex-col items-center overflow-clip">
      <div className="mx-2 text-center">
        <h1 className="mt-6 text-[clamp(2.5rem,min(24svh-4rem,14svw),8rem)] font-bold [@media(max-height:400px)]:hidden [@media(max-width:250px)]:hidden">
          <span className="text-pixi-red">Pixi</span>
          <span className="text-three-blue">Three</span>
        </h1>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-lg max-sm:hidden [@media(max-height:800px)]:hidden [@media(max-width:200px)]:hidden">
          Declarative 2D and 3D composition in React.
        </p>
      </div>

      <div className="-z-10 -mt-16 -mb-16 min-h-0 w-full grow">{children}</div>

      <div className="mb-4 flex gap-4 pb-4 [@media(max-width:200px)]:flex-col">
        <Button size="lg" render={<a href="/pixi-three/docs/" />}>
          Docs
        </Button>
        <Button size="lg" variant="outline" render={<Link to="/example" />}>
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
              <SpinnyCubeWithStars
                size={2.5}
                speed={0.25}
                initialColors={PIXI_THREE_STAR}
              />
            </ThreeScene>
          </FadeIn>
        </CanvasView>
      </RenderContext>
    </LandingPage>
  );
}
