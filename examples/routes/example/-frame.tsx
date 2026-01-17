import { LinkIcon } from "lucide-react";
import * as React from "react";

import {
  createDownloadHandler,
  useCanvasRecorder,
} from "#components/hooks/use-canvas-recorder";
import { cn } from "#components/lib/utils";
import { Button } from "#components/ui/button";

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
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground ml-auto flex items-center gap-1 text-sm hover:underline"
          >
            <LinkIcon className="h-4 w-4" />
            Source
          </a>
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
