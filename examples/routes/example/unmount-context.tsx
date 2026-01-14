import { createFileRoute } from "@tanstack/react-router";

import { Frame } from "./-frame";

export const Route = createFileRoute("/example/unmount-context")({
  component: Unmounted,
});

function Unmounted() {
  return (
    <Frame
      title="Unmount Context"
      subtitle="Render Context is not mounted"
      sourceUrl="https://github.com/astralarium/pixi-three/blob/main/examples/routes/example/unmount-context.tsx"
    >
      <div className="flex flex-1 items-center justify-center">
        Unmount Render Context
      </div>
    </Frame>
  );
}
