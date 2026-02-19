import { CanvasView, RenderContext, ThreeScene } from "@astralarium/pixi-three";
import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Mesh, Plane, Raycaster, Vector2, Vector3 } from "three";

import { FadeIn } from "#components/fade-in";

import { Frame } from "./-frame";

export const Route = createFileRoute("/example/three-pointer-capture")({
  component: ThreePointerCaptureExample,
});

function ThreePointerCaptureExample() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <Frame
      title="Three Pointer Capture"
      subtitle="Drag meshes even when pointer leaves"
      sourceUrl="https://github.com/astralarium/pixi-three/blob/main/examples/routes/example/three-pointer-capture.tsx"
      canvasRef={canvasRef}
    >
      <RenderContext>
        <CanvasView alpha canvasRef={canvasRef}>
          <FadeIn>
            <ThreeScene>
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <DraggableCube position={[-1.5, 0, 0]} color="#f04d5e" />
              <DraggableCube position={[1.5, 0, 0]} color="#0477db" />
              <gridHelper
                args={[10, 10, "#666", "#333"]}
                rotation-x={Math.PI / 2}
                position-z={-2}
              />
            </ThreeScene>
          </FadeIn>
        </CanvasView>
      </RenderContext>
    </Frame>
  );
}

interface DraggableCubeProps {
  position?: [number, number, number];
  color?: string;
}

function DraggableCube({
  position = [0, 0, 0],
  color = "#f04d5e",
}: DraggableCubeProps) {
  const meshRef = useRef<Mesh>(null!);
  const [isDragging, setIsDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Store the offset from center when drag starts
  const dragOffset = useRef(new Vector3());
  // Plane for raycasting during drag
  const dragPlane = useRef(new Plane(new Vector3(0, 0, 1), 0));
  // Temp vectors for calculations
  const intersectPoint = useRef(new Vector3());
  const raycaster = useRef(new Raycaster());
  const pointer = useRef(new Vector2());

  // Gentle rotation when not dragging
  useFrame((_, delta) => {
    if (!isDragging && meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  function onPointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    // Capture the pointer so we keep receiving events even when pointer leaves the mesh
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    setIsDragging(true);

    // Calculate offset from mesh center to click point
    if (event.point) {
      dragOffset.current.copy(meshRef.current.position).sub(event.point);
      // Set the drag plane at the mesh's z position
      dragPlane.current.setFromNormalAndCoplanarPoint(
        new Vector3(0, 0, 1),
        meshRef.current.position,
      );
    }
  }

  function onPointerUp(event: ThreeEvent<PointerEvent>) {
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    setIsDragging(false);
  }

  function onPointerMove(event: ThreeEvent<PointerEvent>) {
    if (!isDragging) return;

    // Use the R3F raycaster to get the intersection with our drag plane
    pointer.current.copy(event.pointer);
    raycaster.current.setFromCamera(pointer.current, event.camera);

    if (
      raycaster.current.ray.intersectPlane(
        dragPlane.current,
        intersectPoint.current,
      )
    ) {
      meshRef.current.position
        .copy(intersectPoint.current)
        .add(dragOffset.current);
    }
  }

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={isDragging ? "#ffcc00" : hovered ? "#ffffff" : color}
      />
    </mesh>
  );
}
