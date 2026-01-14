import { LinkIcon } from "lucide-react";
import * as React from "react";

import { cn } from "#components/lib/utils";

interface FrameProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  sourceUrl?: string;
  className?: string;
}

export function Frame({
  children,
  title,
  subtitle,
  sourceUrl,
  className,
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
    </div>
  );
}
