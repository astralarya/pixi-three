import { PixiTexture, usePixiTextureEvents } from "@astralarium/pixi-three";
import { extend } from "@pixi/react";
import { type ThreeElements, useFrame } from "@react-three/fiber";
import { Container, Graphics } from "pixi.js";
import { useRef, useState } from "react";
import { type Mesh } from "three";
import { TextureNode } from "three/webgpu";

import { SpinnyStar } from "./spinny-star";

extend({ Graphics });

export interface SpinnyCubeProps {
  size?: number;
  speed?: number;
}

export function SpinnyCube({
  size = 1,
  speed = 1,
  ...props
}: ThreeElements["mesh"] & SpinnyCubeProps) {
  const ref = useRef<Mesh>(null);
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);

  useFrame((_state, delta) => {
    ref.current!.rotation.x += delta * (hovered ? 0.2 : 1) * speed;
    ref.current!.rotation.y += delta * 0.5 * (hovered ? 0.2 : 1) * speed;
  });

  const pixiTexture = useRef<TextureNode>(null!);
  const containerRef = useRef<Container>(null!);
  const eventHandlers = usePixiTextureEvents(containerRef, {
    onPointerDown: () => click((x) => !x),
    onPointerOver: () => hover(true),
    onPointerOut: () => hover(false),
  });

  return (
    <mesh {...props} ref={ref} scale={clicked ? 1.5 : 1} {...eventHandlers}>
      <boxGeometry args={[1 * size, 1 * size, 1 * size]} />
      <meshBasicNodeMaterial>
        <PixiTexture
          ref={pixiTexture}
          containerRef={containerRef}
          width={clicked ? 64 : 128}
          height={clicked ? 64 : 128}
          attach="colorNode"
          frameloop="always"
        >
          <SpinnyStar />
        </PixiTexture>
      </meshBasicNodeMaterial>
    </mesh>
  );
}
