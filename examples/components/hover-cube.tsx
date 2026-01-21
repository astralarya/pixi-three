import { PixiTexture, useEffectInvalidate } from "@astralarium/pixi-three";
import { type ThreeElements } from "@react-three/fiber";
import { useRef, useState } from "react";
import { type Mesh } from "three";
import { type TextureNode } from "three/webgpu";

import { HoverBox } from "./hover-box";

export function HoverCube(props: ThreeElements["mesh"]) {
  const ref = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const pixiTexture = useRef<TextureNode>(null!);

  useEffectInvalidate();

  return (
    <mesh
      {...props}
      ref={ref}
      scale={hovered ? 2 : 1}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicNodeMaterial>
        <PixiTexture
          ref={pixiTexture}
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
