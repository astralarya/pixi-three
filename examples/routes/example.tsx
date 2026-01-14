import {
  createFileRoute,
  Link,
  type LinkProps,
  Outlet,
} from "@tanstack/react-router";
import type { PropsWithChildren } from "react";

export const Route = createFileRoute("/example")({
  component: ExampleLayout,
  ssr: false,
});

function ExampleLayout() {
  return (
    <div className="flex h-screen flex-col">
      <div className="bg-neutral-300 p-4">
        <h1 className="text-2xl">Pixi + Three</h1>
        <div className="mt-2 flex items-center gap-2">
          <NavLink to="/example/unmounted">Unmount</NavLink>
          <NavLink to="/example/basic-scene">Basic</NavLink>
          <NavLink to="/example/demand-rendering">Demand</NavLink>
        </div>
      </div>
      <Outlet />
    </div>
  );
}

function NavLink({
  to,
  children,
}: PropsWithChildren<{
  to: LinkProps["to"];
}>) {
  return (
    <Link
      to={to}
      className="cursor-pointer rounded-sm bg-amber-500 p-2 hover:bg-amber-400 [&.active]:bg-amber-400"
    >
      {children}
    </Link>
  );
}
