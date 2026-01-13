import { useEffectInvalidate } from "@astralarium/pixi-three";
import { type ThreeElements } from "@react-three/fiber";
import { useRef, useState } from "react";
import { type Mesh } from "three";

export function HoverCube(props: ThreeElements["mesh"]) {
  const ref = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

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
      <meshBasicMaterial color="red" />
    </mesh>
  );
}
