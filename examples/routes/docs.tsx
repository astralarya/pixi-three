import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
  ssr: false,
  component: () => {
    window.location.replace("/pixi-three/docs/index.html");
  },
});
