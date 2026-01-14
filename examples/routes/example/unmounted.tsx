import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/example/unmounted")({
  component: Unmounted,
});

function Unmounted() {
  return (
    <div className="flex flex-1 items-center justify-center">
      Canvas unmounted
    </div>
  );
}
