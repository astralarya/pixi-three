import { BoxIcon, Code2Icon, LinkIcon } from "lucide-react";
import * as React from "react";

import {
  createDownloadHandler,
  useCanvasRecorder,
} from "#components/hooks/use-canvas-recorder";
import { cn } from "#components/lib/utils";
import { Button } from "#components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "#components/ui/navigation-menu";

interface FrameProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  sourceUrl?: string;
  className?: string;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export function Frame({
  children,
  title,
  subtitle,
  sourceUrl,
  className,
  canvasRef,
}: FrameProps) {
  return (
    <div className={cn("flex flex-1 flex-col", className)}>
      <header className="flex items-center gap-6 p-4">
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        {sourceUrl && (
          <>
            {/* Desktop: show both links */}
            <div className="ml-auto flex items-center gap-4 max-sm:hidden">
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground flex items-center gap-1 text-sm hover:underline"
              >
                <Code2Icon className="h-4 w-4" />
                Source
              </a>
              <a
                href={`https://codesandbox.io/p/github/astralarium/pixi-three/main?file=${encodeURIComponent("/" + sourceUrl.split("/blob/main/")[1])}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground flex items-center gap-1 text-sm hover:underline"
              >
                <BoxIcon className="h-4 w-4" />
                Sandbox
              </a>
            </div>
            {/* Mobile: dropdown menu */}
            <NavigationMenu className="ml-auto sm:hidden">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent px-2">
                    <LinkIcon className="h-4 w-4" />
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <NavigationMenuLink
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-row items-center gap-2"
                    >
                      <Code2Icon className="h-4 w-4" />
                      Source
                    </NavigationMenuLink>
                    <NavigationMenuLink
                      href={`https://codesandbox.io/p/github/astralarium/pixi-three/main?file=${encodeURIComponent("/" + sourceUrl.split("/blob/main/")[1])}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-row items-center gap-2"
                    >
                      <BoxIcon className="h-4 w-4" />
                      CodeSandbox
                    </NavigationMenuLink>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </>
        )}
      </header>
      {children}
      {canvasRef && <RecordButton canvasRef={canvasRef} title={title} />}
    </div>
  );
}

function RecordButton({
  canvasRef,
  title,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  title: string;
}) {
  const { startRecording, stopRecording, isRecording } = useCanvasRecorder(
    canvasRef,
    {
      onComplete: createDownloadHandler(title),
    },
  );

  return (
    <Button
      size="sm"
      variant={isRecording ? "destructive" : "secondary"}
      onClick={isRecording ? stopRecording : startRecording}
      className="fixed right-4 bottom-4"
    >
      {isRecording ? "Stop Recording" : "Record"}
    </Button>
  );
}
