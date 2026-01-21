import { createFileRoute, Link } from "@tanstack/react-router";

import { EXAMPLES } from "./-examples";

export const Route = createFileRoute("/example/")({
  component: ExamplesIndex,
});

function ExamplesIndex() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4">
      <h1 className="mb-8 text-3xl font-bold">
        <span className="text-pixi-red">Pixi</span>
        <span className="text-three-blue">Three</span> Examples
      </h1>
      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXAMPLES.map((example) => (
          <Link
            key={example.to}
            to={example.to}
            className="hover:bg-accent rounded-lg border p-4 transition-colors"
          >
            <h2 className="mb-2 font-semibold">{example.label}</h2>
            <p className="text-muted-foreground text-sm">
              {example.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
