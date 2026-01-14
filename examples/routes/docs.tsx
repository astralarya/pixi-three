import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
  beforeLoad: () => {
    throw redirect({ href: "/pixi-three/docs/index.html" });
  },
});
