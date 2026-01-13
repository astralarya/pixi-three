import { type ReactNode } from "react";

interface DomOverlayProps {
  className?: string;
  children?: ReactNode;
  overlay?: ReactNode;
}

/**
 * @param props - Component props
 * @expandType DomOverlayProps
 */
export function DomOverlay({ className, children, overlay }: DomOverlayProps) {
  return (
    <div className={`${className} relative touch-none overflow-clip`}>
      {children}
      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto">{overlay}</div>
      </div>
    </div>
  );
}
