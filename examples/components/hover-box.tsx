import { useEffectInvalidate } from "@astralarium/pixi-three";
import { Graphics } from "pixi.js";
import { type ComponentProps, useState } from "react";

function drawRedBox(graphics: Graphics) {
  graphics.clear();
  graphics.rect(0, 0, 100, 100).fill({ color: 0xff0000 });
}

function drawBlueBox(graphics: Graphics) {
  graphics.clear();
  graphics.rect(0, 0, 100, 100).fill({ color: 0x0000ff });
}

export function HoverBox(props: Partial<ComponentProps<"pixiGraphics">>) {
  const [hovered, setHovered] = useState(false);

  useEffectInvalidate();

  return (
    <pixiGraphics
      {...props}
      eventMode="static"
      draw={hovered ? drawBlueBox : drawRedBox}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    />
  );
}
