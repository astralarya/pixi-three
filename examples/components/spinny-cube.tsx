import { PixiTexture, usePixiTextureEvents } from "@astralarium/pixi-three";
import { type ThreeElements, useFrame } from "@react-three/fiber";
import { Container } from "pixi.js";
import {
  type ReactNode,
  type Ref,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { type Mesh } from "three";
import { type TextureNode } from "three/webgpu";

export interface SpinnyCubeProps {
  size?: number;
  speed?: number;
  children?: ReactNode;
}

export function SpinnyCube({
  size = 1,
  speed = 1,
  children,
  ref,
  ...props
}: ThreeElements["mesh"] & SpinnyCubeProps) {
  const meshRef = useRef<Mesh>(null!);
  const [hovered, hover] = useState(false);

  useImperativeHandle(ref as Ref<Mesh>, () => meshRef.current!, []);

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * (hovered ? 0.2 : 1) * speed;
      meshRef.current.rotation.y += delta * 0.5 * (hovered ? 0.2 : 1) * speed;
    }
  });

  const pixiTexture = useRef<TextureNode>(null!);
  const containerRef = useRef<Container>(null!);
  const eventHandlers = usePixiTextureEvents(containerRef, {
    onPointerOver: () => hover(true),
    onPointerOut: () => hover(false),
  });

  return (
    <mesh {...props} ref={meshRef} {...eventHandlers}>
      <boxGeometry args={[1 * size, 1 * size, 1 * size]} />
      <meshBasicNodeMaterial>
        <PixiTexture
          ref={pixiTexture}
          containerRef={containerRef}
          width={256}
          height={256}
          attach="colorNode"
          frameloop="always"
        >
          {children}
        </PixiTexture>
      </meshBasicNodeMaterial>
    </mesh>
  );
}
