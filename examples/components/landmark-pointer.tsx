import { useViewport } from "@astralarium/pixi-three";
import { extend, useTick } from "@pixi/react";
import { type ColorSource, Graphics, Point } from "pixi.js";
import { type ComponentProps, type RefObject, useRef } from "react";

extend({ Graphics });

export interface LandmarkPointerProps {
  /** Ref to target point in viewport coordinates */
  targetRef: RefObject<Point | null>;
  /** Line color */
  color?: ColorSource;
  /** Line width */
  lineWidth?: number;
  /** Callback when mouse position changes */
  onMousePosChange?: (mousePos: Point | null) => void;
}

export function LandmarkPointer({
  targetRef,
  color = 0xffffff,
  lineWidth = 2,
  onMousePosChange,
  ...props
}: LandmarkPointerProps & Omit<ComponentProps<"pixiGraphics">, "draw">) {
  const size = useViewport();
  const mousePosRef = useRef<Point | null>(null);
  const graphicsRef = useRef<Graphics>(null);

  useTick(() => {
    const graphics = graphicsRef.current;
    if (!graphics) return;

    graphics.clear();
    const mousePos = mousePosRef.current;
    const target = targetRef.current;
    if (!mousePos || !target) return;

    const dx = target.x - mousePos.x;
    const dy = target.y - mousePos.y;

    // Diagonal distance is the minimum of |dx| and |dy|
    const diagonalDist = Math.min(Math.abs(dx), Math.abs(dy));

    // Calculate the straight portions on each end, with diagonal in the middle
    // Total path: straight from mouse -> diagonal -> straight to target
    const straightDist =
      (Math.max(Math.abs(dx), Math.abs(dy)) - diagonalDist) / 2;

    // Determine which axis has the longer distance
    const isHorizontalLonger = Math.abs(dx) > Math.abs(dy);

    // First elbow: end of first straight segment
    const elbow1X = isHorizontalLonger
      ? mousePos.x + Math.sign(dx) * straightDist
      : mousePos.x;
    const elbow1Y = isHorizontalLonger
      ? mousePos.y
      : mousePos.y + Math.sign(dy) * straightDist;

    // Second elbow: start of last straight segment
    const elbow2X = isHorizontalLonger
      ? elbow1X + Math.sign(dx) * diagonalDist
      : target.x;
    const elbow2Y = isHorizontalLonger
      ? target.y
      : elbow1Y + Math.sign(dy) * diagonalDist;

    graphics
      .moveTo(mousePos.x, mousePos.y)
      .lineTo(elbow1X, elbow1Y)
      .lineTo(elbow2X, elbow2Y)
      .lineTo(target.x, target.y)
      .stroke({ width: lineWidth, color });
  });

  function handlePointerMove(e: { global: Point }) {
    const newPos = e.global.clone();
    mousePosRef.current = newPos;
    onMousePosChange?.(newPos);
  }

  return (
    <>
      <pixiGraphics
        ref={graphicsRef}
        draw={() => {}}
        width={size.width}
        height={size.height}
        {...props}
      />
      <pixiContainer
        eventMode="static"
        onGlobalPointerMove={handlePointerMove}
      />
    </>
  );
}
