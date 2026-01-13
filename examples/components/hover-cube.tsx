import {
  PixiTexture,
  useEffectInvalidate,
  usePixiTextureEvents,
} from "@astralarium/pixi-three";
import { type ThreeElements } from "@react-three/fiber";
import { Container } from "pixi.js";
import { useRef, useState } from "react";
import { type Mesh } from "three";
import { TextureNode } from "three/webgpu";

import { HoverBox } from "./hover-box";

export function HoverCube(props: ThreeElements["mesh"]) {
  const ref = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const pixiTexture = useRef<TextureNode>(null!);
  const containerRef = useRef<Container>(null!);
  const eventHandlers = usePixiTextureEvents(containerRef, {
    onPointerOver: () => setHovered(true),
    onPointerOut: () => setHovered(false),
  });

  useEffectInvalidate();

  return (
    <mesh {...props} ref={ref} scale={hovered ? 2 : 1} {...eventHandlers}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicNodeMaterial>
        <PixiTexture
          ref={pixiTexture}
          containerRef={containerRef}
          width={200}
          height={200}
          attach="colorNode"
          frameloop="demand"
        >
          <HoverBox x={50} y={50} />
        </PixiTexture>
      </meshBasicNodeMaterial>
    </mesh>
  );
}
