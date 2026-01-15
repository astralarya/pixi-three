import { extend, useTick } from "@pixi/react";
import { Container } from "pixi.js";
import { type ComponentProps, type ReactNode, useRef, useState } from "react";

extend({ Container });

export interface FadeInProps {
  duration?: number;
  children?: ReactNode;
}

export function FadeIn({
  duration = 2000,
  children,
  ...props
}: FadeInProps & Partial<ComponentProps<"pixiContainer">>) {
  const containerRef = useRef<Container>(null!);
  const [isDone, setIsDone] = useState(false);
  const elapsed = useRef(0);

  useTick({
    callback: (ticker) => {
      elapsed.current += ticker.deltaMS;
      const progress = Math.min(elapsed.current / duration, 1);
      containerRef.current.alpha = progress;

      if (progress >= 1) {
        setIsDone(true);
      }
    },
    isEnabled: !isDone,
  });

  return (
    <pixiContainer ref={containerRef} alpha={0} {...props}>
      {children}
    </pixiContainer>
  );
}
