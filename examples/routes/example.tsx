import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/example")({
  component: ExampleLayout,
  ssr: false,
});

function ExampleLayout() {
  return (
    <div className="flex h-[calc(100svh-3rem)] flex-col">
      <Outlet />
    </div>
  );
}
